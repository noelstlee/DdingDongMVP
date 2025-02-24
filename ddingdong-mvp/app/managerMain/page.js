"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Poppins } from "next/font/google";

// Import Font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

const getTableSize = (tableCount) => {
  if (tableCount <= 10) return 'w-32 h-32';
  if (tableCount <= 15) return 'w-28 h-28';
  if (tableCount <= 20) return 'w-24 h-24';
  return 'w-20 h-20'; // For more than 20 tables
};

export default function ManagerMainPage() {
  const router = useRouter();
  const [managerData, setManagerData] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [tableRequests, setTableRequests] = useState({});
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [serverCallRequests, setServerCallRequests] = useState(new Set());
  const [billRequests, setBillRequests] = useState(new Set());

  const [selectedTable, setSelectedTable] = useState(null);
  const [showPopup, setShowPopup] = useState(false);


  useEffect(() => {
    if (typeof window === "undefined") return;
    const fetchManagerData = async () => {
      try {
        const managerEmail = localStorage.getItem("managerEmail")?.trim().toLowerCase();

        if (!managerEmail) {
          console.error("❌ No manager email found in localStorage.");
          router.push("/auth/manager"); // Redirect to login if no email is found
          return;
        }

        console.log(`🔍 Searching for manager with email: "${managerEmail}"`);

        const managersRef = collection(db, "managers");
        const managerQuery = query(managersRef, where("email", "==", managerEmail));
        const managerSnapshot = await getDocs(managerQuery);

        if (managerSnapshot.empty) {
          console.error("❌ Manager email not found in Firestore.");
          router.push("/auth/manager");
          return;
        }

        const managerDoc = managerSnapshot.docs[0];
        const managerInfo = managerDoc.data();

        console.log("✅ Manager found:", managerInfo);

        setManagerData(managerInfo);
        setRestaurantId(managerInfo.restaurantId); // Extract restaurantId
        setLoading(false);
      } catch (err) {
        console.error("❌ Error fetching manager data:", err);
        setError("Failed to fetch manager data. Please try again.");
        setLoading(false);
      }
    };

    fetchManagerData();
  }, [router]);

  useEffect(() => {
    if (!restaurantId) return;
    console.log(`📡 Fetching tables for restaurant: ${restaurantId}`);
  
    const tableCollectionRef = collection(db, "tables", restaurantId, "table_items");
    const unsubscribeTables = onSnapshot(tableCollectionRef, (snapshot) => {
      const tableList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log("✅ Tables fetched:", tableList);
      tableList.sort((a, b) => parseInt(a.tableNumber) - parseInt(b.tableNumber));
      setTables(tableList);
    });
  
    console.log(`📡 Listening for requests for restaurant: ${restaurantId}`);
    const unsubscribeRequests = onSnapshot(
      query(collection(db, "requests"), where("restaurantId", "==", restaurantId), where("resolved", "==", false)),
      (snapshot) => {
        const updatedRequests = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          const tableNumber = String(data.table);
          if (!updatedRequests[tableNumber]) updatedRequests[tableNumber] = [];
          updatedRequests[tableNumber].push({ id: doc.id, ...data });
        });
        console.log("✅ Requests fetched:", updatedRequests);
        setTableRequests(updatedRequests);
      }
    );
  
    const unsubscribeServerCalls = onSnapshot(
      query(collection(db, "serverCallRequest"), where("restaurantId", "==", restaurantId), where("resolved", "==", false)),
      (snapshot) => {
        const updatedServerCalls = new Map();
    
        snapshot.forEach((doc) => {
          const tableNumber = String(doc.data().table);
          if (!updatedServerCalls.has(tableNumber)) {
            updatedServerCalls.set(tableNumber, [doc.id]); // ✅ Store array of doc IDs
          } else {
            updatedServerCalls.set(tableNumber, [...updatedServerCalls.get(tableNumber), doc.id]); // ✅ Append new doc ID
          }
        });
  
        console.log("✅ Server Calls Updated:", updatedServerCalls); // ✅ Debugging
        setServerCallRequests(updatedServerCalls);
      }
    );
  
    const unsubscribeBillRequests = onSnapshot(
      query(collection(db, "billRequest"), where("restaurantId", "==", restaurantId), where("resolved", "==", false)),
      (snapshot) => {
        const updatedBillRequests = new Map();
        snapshot.forEach((doc) => {
          updatedBillRequests.set(String(doc.data().table), doc.id);
        });
        setBillRequests(updatedBillRequests);
      }
    );
  
    return () => {
      unsubscribeTables();
      unsubscribeRequests();
      unsubscribeServerCalls();
      unsubscribeBillRequests();
    };
  }, [restaurantId]);

const handleMarkDone = async (tableNumber, requestId) => {
  try {
    const requestRef = doc(db, "requests", requestId);
    await updateDoc(requestRef, { resolved: true });
    await updateDoc(requestRef, { customerNotification: "Your request is on its way!" });

    setTableRequests((prev) => {
      const updated = { ...prev };

      // Ensure the array exists before filtering
      if (updated[tableNumber]) {
        updated[tableNumber] = updated[tableNumber].filter((req) => req.id !== requestId);
      }

      return updated;
    });
  } catch (err) {
    console.error("❌ Error marking request as done:", err);
  }
};

  const openTablePopup = (tableNumber) => {
    setSelectedTable(String(tableNumber)); // ✅ Ensure it matches Firestore keys
    setShowPopup(true);
  };
  
  const closeTablePopup = () => {
    setShowPopup(false);
  };

  const handleMarkAllDone = async () => {
    try {
      const allRequests = Object.values(tableRequests).flat();
  
      // Filter out special requests
      const nonSpecialRequests = allRequests.filter((req) => req.requestType !== "special");
  
      const updatePromises = nonSpecialRequests.map((req) =>
        updateDoc(doc(db, "requests", req.id), { resolved: true })
      );
  
      await Promise.all(updatePromises);
      
      // Update UI to remove non-special requests
      setTableRequests((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((tableNumber) => {
          updated[tableNumber] = updated[tableNumber].filter((req) => req.requestType === "special");
        });
        return updated;
      });
    } catch (err) {
      console.error("❌ Error marking all non-special requests as done:", err);
    }
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-yellow-400">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center h-screen justify-center bg-gray-900 text-white">
        <h1 className="text-3xl text-red-500 font-bold mb-4">Error</h1>
        <p className="text-lg">{error}</p>
        <button
          onClick={() => router.push("/auth/manager")}
          className="mt-6 px-6 py-3 bg-yellow-500 text-black text-lg font-bold rounded-lg shadow-lg"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center min-h-screen p-5 bg-gray-900 text-white ${poppins.className}`}>
      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 sm:px-6 py-4 relative">
        
      {/* Manager Dashboard (Left on Phones, Center on Larger Screens) */}
      <h1 className="absolute top-4 left-4 sm:left-1/2 sm:top-auto sm:transform sm:-translate-x-1/2 text-left sm:text-center text-xl sm:text-2xl md:text-3xl font-bold">
        Manager Dashboard
      </h1>

        {/* Right-aligned Buttons */}
        <div className="ml-auto flex space-x-2 sm:space-x-4">
          <button
            className="px-3 sm:px-4 md:px-6 py-2 text-sm sm:text-base md:text-lg bg-gray-700 text-white rounded-lg 
                      hover:bg-gray-600 transition"
            onClick={() => router.push("/managerMain/settings")}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Manager Info */}
      {managerData && (
        <div className="mb-6 text-center">
          <h2 className="text-lg font-bold mb-2">Manager: {managerData.firstName} {managerData.lastName}</h2>
          <p className="text-lg text-gray-400">Restaurant ID: {managerData.restaurantId}</p>
        </div>
      )}


      {/* Tables */}
      <div className="relative w-full max-w-4xl h-[600px] bg-gray-800 rounded-lg mb-8">
        {tables.map((table) => {
          const tableNumber = String(table.tableNumber);
          const isServerCallActive = serverCallRequests.has(tableNumber);
          const isBillRequestActive = billRequests.has(tableNumber);
          const unresolvedRequests = tableRequests[tableNumber]?.filter((req) => !req.resolved) || [];
          const icons = [];
          if (isServerCallActive) icons.push("🛎️");
          if (isBillRequestActive) icons.push("💳");
          const unresolvedServerCallsCount = serverCallRequests.has(tableNumber)
            ? serverCallRequests.get(tableNumber).length
            : 0;

          let tableColorClass = "bg-gray-700";
          if (unresolvedServerCallsCount >= 2) {
            tableColorClass = "bg-red-600";
          } else if (unresolvedServerCallsCount === 1 || isBillRequestActive) {
            tableColorClass = "bg-yellow-500";
          } else if (unresolvedRequests.length > 0) {
            tableColorClass = "bg-yellow-400";
          }

          return (
            <button
              key={tableNumber}
              className={`absolute ${getTableSize(tables.length)} flex items-center justify-center text-xl font-bold rounded-lg transition-all ${tableColorClass} text-black shadow-lg`}
              onClick={() => openTablePopup(tableNumber)}
              style={{
                left: `${table.positionX}px`,
                top: `${table.positionY}px`,
              }}
            >
              {tableNumber}
              <div className="absolute top-2 left-2 flex space-x-2">
                {icons.map((icon, index) => (
                  <span key={index} className="text-2xl">{icon}</span>
                ))}
              </div>
              {unresolvedRequests.length > 0 && (
                <span className="absolute top-2 right-2 bg-red-600 text-white text-sm font-bold px-2 py-1 rounded-full">
                  {unresolvedRequests.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

            {/* Active Requests */}
            <div className="w-full max-w-4xl bg-gray-800 p-5 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Active Requests</h2>
          {/* Mark All Done Button */}
          <button
            className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition"
            onClick={handleMarkAllDone}
          >
            Mark All Done
          </button>
        </div>

        {Object.keys(tableRequests).length === 0 ? (
          <p className="text-gray-400 text-center">No active requests.</p>
        ) : (
          Object.entries(tableRequests).map(([tableNumber, requests]) =>
            requests.map((req) =>
              !req.resolved && req.requestType !== "special" && (
                <div key={req.id} className="flex justify-between items-center bg-gray-700 p-3 mb-3 rounded-lg">
                  <div>
                    <p className="text-xl font-semibold">Table {tableNumber}</p>
                    {req.items && req.items.map((item, index) => (
                      <p key={index} className="text-gray-300 text-lg">
                        {item.quantity} x {item.item}
                      </p>
                    ))}
                  </div>
                  <button
                    className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition"
                    onClick={() => handleMarkDone(tableNumber, req.id)}
                  >
                    Mark Done
                  </button>
                </div>
              )
            )
          )
        )}
      </div>
      
  
      {/* Table Requests Popup */}
      {showPopup && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white text-black p-6 rounded-lg shadow-lg w-96 max-h-96 overflow-y-auto relative">
            
            {/* Close Button (Top-Right) */}
            <button
              className="absolute top-3 right-3 text-2xl font-bold text-gray-600 hover:text-gray-900 transition"
              onClick={closeTablePopup}
            >
              ✖
            </button>

            {/* Table Title */}
            <h2 className="text-2xl text-center font-semibold mb-4">Table {selectedTable}</h2>

            <ul>
              {/* Show Regular Requests */}
              {tableRequests[selectedTable]?.map((req) => (
                <li key={req.id} className="flex justify-between items-center bg-gray-200 p-3 mb-2 rounded-lg">
                  <div>
                    {req.items?.map((item, index) => (
                      <p key={index} className="text-lg text-gray-700 font-medium">
                        {item.quantity} x {item.item}
                      </p>
                    ))}
                  </div>
                  <button
                    className="px-4 py-2 text-lg bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    onClick={() => handleMarkDone(selectedTable, req.id)}
                  >
                    Mark Done
                  </button>
                </li>
              ))}

              {/* Show Server Call Request */}
              {serverCallRequests.has(selectedTable) && serverCallRequests.get(selectedTable).length > 0 && (
              <li className="flex justify-between items-center bg-gray-200 p-3 mb-2 rounded-lg">
                <p className="text-lg font-medium text-gray-700">🛎️ Server Call ({serverCallRequests.get(selectedTable).length})</p>
                <button
                  className="px-4 py-2 text-lg bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  onClick={async () => {
                    try {
                      const docIds = serverCallRequests.get(selectedTable);
                      if (docIds && docIds.length > 0) {
                        // Mark all server calls as resolved
                        await Promise.all(
                          docIds.map(docId => updateDoc(doc(db, "serverCallRequest", docId), { resolved: true }))
                        );

                        // Remove from local state
                        setServerCallRequests(prev => {
                          const updated = new Map(prev);
                          updated.delete(selectedTable);
                          return updated;
                        });

                        console.log(`✅ Resolved all server call requests for Table ${selectedTable}`);
                      }
                    } catch (err) {
                      console.error(`❌ Error resolving server call requests for Table ${selectedTable}:`, err);
                    }
                  }}
                >
                  Mark All Done
                </button>
              </li>
            )}

              {/* Show Bill Request */}
              {billRequests.has(selectedTable) && billRequests.get(selectedTable) && (
                <li className="flex justify-between items-center bg-gray-200 p-3 mb-2 rounded-lg">
                  <p className="text-lg font-medium text-gray-700">💳 Bill Requested</p>
                  <button
                    className="px-4 py-2 text-lg bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    onClick={async () => {
                      const docId = billRequests.get(selectedTable);
                      if (docId) {
                        await updateDoc(doc(db, "billRequest", docId), { resolved: true });
                        setBillRequests((prev) => {
                          const updated = new Map(prev);
                          updated.delete(selectedTable);
                          return updated;
                        });
                      }
                    }}
                  >
                    Mark Done
                  </button>
                </li>
              )}
            </ul>

          {/* Clear All Requests (Bottom) */}
          <button
            className="mt-4 px-5 py-3 text-lg bg-red-500 text-white rounded-lg hover:bg-red-600 transition w-full"
            onClick={async () => {
              try {
                if (!restaurantId || !selectedTable) return;

                const collections = ["requests", "serverCallRequest", "billRequest"];

                for (const collectionName of collections) {
                  const q = query(
                    collection(db, collectionName),
                    where("restaurantId", "==", restaurantId),
                    where("table", "==", selectedTable)
                  );

                  const querySnapshot = await getDocs(q);
                  if (!querySnapshot.empty) {
                    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
                    await Promise.all(deletePromises);
                  }
                }

                // ✅ Clear UI state
                setTableRequests((prev) => {
                  const updated = { ...prev };
                  delete updated[selectedTable];
                  return updated;
                });

                setServerCallRequests((prev) => {
                  const updated = new Map(prev);
                  updated.delete(selectedTable);
                  return updated;
                });

                setBillRequests((prev) => {
                  const updated = new Map(prev);
                  updated.delete(selectedTable);
                  return updated;
                });

                // ✅ Close the popup
                setShowPopup(false);

                alert(`✅ All requests for Table ${selectedTable} have been cleared.`);
              } catch (err) {
                console.error("❌ Error clearing requests:", err);
                alert("Failed to clear requests. Please try again.");
              }
            }}
          >
            🗑️ Clear All Requests
          </button>

          </div>
        </div>
      )}
    </div>
  );
}