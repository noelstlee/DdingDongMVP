"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Poppins } from "next/font/google";

// Import Font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

const getTableSize = (tableCount, screenWidth) => {
  // For phones (smaller than 600px)
  if (screenWidth < 600) {
    if (tableCount <= 10) return 'w-20 h-20';
    if (tableCount <= 20) return 'w-16 h-16';
    if (tableCount <= 30) return 'w-14 h-14';
    return 'w-12 h-12';
  }
  // For tablets (600px - 900px, including Lenovo)
  if (screenWidth < 900) {
    if (tableCount <= 10) return 'w-24 h-24';
    if (tableCount <= 20) return 'w-20 h-20';
    if (tableCount <= 30) return 'w-16 h-16';
    return 'w-14 h-14';
  }
  // For larger screens (> 900px)
  if (tableCount <= 10) return 'w-28 h-28';
  if (tableCount <= 20) return 'w-24 h-24';
  if (tableCount <= 30) return 'w-20 h-20';
  return 'w-16 h-16';
};

const calculateCanvasBoundary = (tables) => {
  if (!tables || tables.length === 0) return { width: 1600, height: 1000, gridSize: 48 };

  // Safely get window dimensions with fallback values
  const safeGetWindowDimension = () => {
    if (typeof window === 'undefined') return { width: 1024, height: 768 };
    return {
      width: Math.max(320, window.innerWidth || 320),
      height: Math.max(480, window.innerHeight || 480)
    };
  };

  const { width: screenWidth } = safeGetWindowDimension();
  
  // Calculate grid size based on number of tables
  const tableCount = tables.length;
  const gridSize = tableCount <= 10 ? 48 : tableCount <= 20 ? 40 : tableCount <= 30 ? 32 : 24;
  const padding = gridSize * 3; // Increased padding for better centering

  // For phones: Always use 3-column layout with adjusted spacing
  if (screenWidth < 600) {
    const numCols = 3;
    const numRows = Math.ceil(tableCount / numCols);
    
    // Calculate spacing based on available width, ensuring minimum width
    const availableWidth = Math.max(320, screenWidth - (padding * 2));
    const columnSpacing = Math.max(gridSize * 2, Math.floor(availableWidth / numCols));
    
    // Calculate required dimensions with extra padding for icons and badges
    const requiredWidth = (numCols * columnSpacing) + (padding * 4);
    const requiredHeight = (numRows * columnSpacing) + (padding * 4);
    
    return {
      width: Math.max(320, Math.floor(requiredWidth / gridSize) * gridSize),
      height: Math.max(480, Math.floor(requiredHeight / gridSize) * gridSize),
      gridSize
    };
  }

  // For tablets and larger screens: Maintain original table layout
  const maxWidth = Math.min(screenWidth * 0.95, 1600);
  const maxTableSize = tableCount <= 10 ? 112 : tableCount <= 20 ? 96 : tableCount <= 30 ? 80 : 64;
  
  // Calculate number of columns that can fit in the width
  const numCols = Math.floor((maxWidth - padding * 4) / (maxTableSize + gridSize));
  const numRows = Math.ceil(tableCount / numCols);
  
  // Calculate required dimensions with extra padding
  const requiredWidth = (numCols * (maxTableSize + gridSize)) + (padding * 4);
  const requiredHeight = (numRows * (maxTableSize + gridSize)) + (padding * 4);
  
  return {
    width: Math.max(600, Math.floor(requiredWidth / gridSize) * gridSize),
    height: Math.max(480, Math.floor(requiredHeight / gridSize) * gridSize),
    gridSize
  };
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
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  const [canvasSize, setCanvasSize] = useState({ width: 1600, height: 1000 });
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Effect for manager data
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fetchManagerData = async () => {
      try {
        const managerEmail = localStorage.getItem("managerEmail")?.trim().toLowerCase();

        if (!managerEmail) {
          console.error("❌ No manager email found in localStorage.");
          router.push("/auth/manager");
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
        setRestaurantId(managerInfo.restaurantId);
        setLoading(false);
      } catch (err) {
        console.error("❌ Error fetching manager data:", err);
        setError("Failed to fetch manager data. Please try again.");
        setLoading(false);
      }
    };

    fetchManagerData();
  }, [router]);

  // Effect for tables and requests
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

      // Calculate and set canvas size
      const { width, height } = calculateCanvasBoundary(tableList);
      setCanvasSize({ width, height });
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
            updatedServerCalls.set(tableNumber, [doc.id]);
          } else {
            updatedServerCalls.set(tableNumber, [...updatedServerCalls.get(tableNumber), doc.id]);
          }
        });
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

  // Effect for window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      const { width, height } = calculateCanvasBoundary(tables);
      setCanvasSize({ width, height });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tables]);

  const handleMarkDone = async (tableNumber, requestId) => {
    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, { resolved: true });
      await updateDoc(requestRef, { customerNotification: "Your request is on its way!" });
    } catch (err) {
      console.error("❌ Error marking request as done:", err);
    }
  };

  const openTablePopup = (tableNumber) => {
    setSelectedTable(String(tableNumber));
    setShowPopup(true);
  };
  
  const closeTablePopup = () => {
    setShowPopup(false);
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
    <div className={`flex flex-col min-h-screen bg-gray-900 text-white p-4 ${poppins.className}`}>
      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 sm:px-6 py-4 relative">
        <h1 className="absolute top-4 left-4 sm:left-1/2 sm:top-auto sm:transform sm:-translate-x-1/2 text-left sm:text-center text-xl sm:text-2xl md:text-3xl font-bold">
          Manager Dashboard
        </h1>
        <div className="ml-auto flex space-x-2 sm:space-x-4">
          <button
            className="px-3 sm:px-4 md:px-6 py-2 text-sm sm:text-base md:text-lg bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            onClick={() => router.push("/managerMain/settings")}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Manager Info */}
      {managerData && (
        <div className="mb-6 text-center">
          <p className="text-lg text-gray-400">Restaurant ID: {managerData.restaurantId}</p>
        </div>
      )}

      {/* Tables */}
      <div className="w-full flex flex-col items-center my-8">
        {/* Active Requests Section */}
        <div className="w-full max-w-4xl mb-6 px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Active Requests</h2>
            {(serverCallRequests.size > 0 || billRequests.size > 0 || Object.keys(tableRequests).length > 0) && (
              <button
                onClick={() => setShowConfirmPopup(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition"
              >
                Mark All Done
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            {Array.from(serverCallRequests.keys()).map((tableNum) => (
              <button
                key={`server-${tableNum}`}
                onClick={() => openTablePopup(tableNum)}
                className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400 transition"
              >
                Table {tableNum}: 🛎️ Server Call
              </button>
            ))}
            {Array.from(billRequests.keys()).map((tableNum) => (
              <button
                key={`bill-${tableNum}`}
                onClick={() => openTablePopup(tableNum)}
                className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400 transition"
              >
                Table {tableNum}: 💳 Bill
              </button>
            ))}
            {Object.entries(tableRequests).map(([tableNum, requests]) => {
              const unresolvedCount = requests.filter(req => !req.resolved).length;
              if (unresolvedCount === 0) return null;
              return (
                <button
                  key={`request-${tableNum}`}
                  onClick={() => openTablePopup(tableNum)}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-300 transition"
                >
                  Table {tableNum}: {unresolvedCount} items
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-auto" style={{ 
          maxWidth: '100vw',
          maxHeight: screenWidth < 600 ? '60vh' : '80vh',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          WebkitOverflowScrolling: 'touch',
          minHeight: '300px'
        }}>
          <div 
            className="relative bg-gray-800 rounded-lg"
            style={{ 
              width: `${canvasSize.width}px`, 
              height: `${canvasSize.height}px`,
              margin: '0 auto',
              minWidth: '300px',
              minHeight: '300px'
            }}
          >
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

              // Calculate position based on screen size
              let positionX = table.positionX;
              let positionY = table.positionY;
              
              // Calculate grid size based on total number of tables
              const gridSize = tables.length <= 10 ? 48 : tables.length <= 20 ? 40 : tables.length <= 30 ? 32 : 24;
              
              if (screenWidth < 600) {
                // For mobile: Calculate positions with adjusted spacing
                const index = parseInt(tableNumber) - 1;
                const numCols = 3;
                const availableWidth = Math.max(320, window.innerWidth) - (gridSize * 4); // Increased spacing
                const columnSpacing = Math.floor(availableWidth / numCols);
                const actualSpacing = Math.max(columnSpacing, gridSize * 2);
                
                const col = index % numCols;
                const row = Math.floor(index / numCols);
                
                positionX = (gridSize * 3) + (col * actualSpacing); // Increased left padding
                positionY = (gridSize * 3) + (row * actualSpacing);
              } else {
                // For tablets and larger: Maintain original positions but scale them
                const scale = screenWidth < 900 ? 0.8 : 1;
                positionX = table.positionX * scale;
                positionY = table.positionY * scale;
              }

              return (
                <button
                  key={tableNumber}
                  className={`absolute ${getTableSize(tables.length, screenWidth)} flex items-center justify-center text-xl font-bold rounded-lg transition-all ${tableColorClass} text-black shadow-lg`}
                  onClick={() => openTablePopup(tableNumber)}
                  style={{
                    left: `${positionX}px`,
                    top: `${positionY}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {/* Table number in center */}
                  <span className="absolute">{tableNumber}</span>

                  {/* Server call icon (bell) in top-left */}
                  {isServerCallActive && (
                    <span className="absolute -top-0.5 -left-0.5 text-md">🛎️</span>
                  )}

                  {/* Bill request icon (card) in bottom-right */}
                  {isBillRequestActive && (
                    <span className="absolute -bottom-0.5 -right-0.5 text-md">💳</span>
                  )}

                  {/* Request count badge */}
                  {unresolvedRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1 py-0.5 rounded-full min-w-[1.2rem] text-center">
                      {unresolvedRequests.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirmPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white text-black p-6 rounded-lg shadow-lg w-96 relative">
            <h2 className="text-2xl text-center font-semibold mb-4">Confirm Action</h2>
            <p className="text-lg text-gray-700 mb-6 text-center">
              Are you sure you want to mark all requests as done?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                onClick={() => setShowConfirmPopup(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                onClick={async () => {
                  try {
                    // Mark all server calls as resolved
                    for (const [, docIds] of serverCallRequests) {
                      await Promise.all(
                        docIds.map(docId => updateDoc(doc(db, "serverCallRequest", docId), { resolved: true }))
                      );
                    }

                    // Mark all bill requests as resolved
                    for (const [, docId] of billRequests) {
                      await updateDoc(doc(db, "billRequest", docId), { resolved: true });
                    }

                    // Mark all table requests as resolved
                    for (const [, requests] of Object.entries(tableRequests)) {
                      await Promise.all(
                        requests.map(req => 
                          updateDoc(doc(db, "requests", req.id), { 
                            resolved: true,
                            customerNotification: "Your request is on its way!" 
                          })
                        )
                      );
                    }

                    setShowConfirmPopup(false);
                    alert("✅ All requests have been marked as done!");
                  } catch (err) {
                    console.error("❌ Error marking all requests as done:", err);
                    alert("Failed to mark all requests as done. Please try again.");
                  }
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Popup */}
      {showPopup && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white text-black p-6 rounded-lg shadow-lg w-96 max-h-96 overflow-y-auto relative">
            <button
              className="absolute top-3 right-3 text-2xl font-bold text-gray-600 hover:text-gray-900 transition"
              onClick={closeTablePopup}
            >
              ✖
            </button>

            <h2 className="text-2xl text-center font-semibold mb-4">Table {selectedTable}</h2>

            <ul>
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

              {serverCallRequests.has(selectedTable) && serverCallRequests.get(selectedTable).length > 0 && (
                <li className="flex justify-between items-center bg-gray-200 p-3 mb-2 rounded-lg">
                  <p className="text-lg font-medium text-gray-700">
                    🛎️ Server Call ({serverCallRequests.get(selectedTable).length})
                  </p>
                  <button
                    className="px-4 py-2 text-lg bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    onClick={async () => {
                      try {
                        const docIds = serverCallRequests.get(selectedTable);
                        if (docIds && docIds.length > 0) {
                          await Promise.all(
                            docIds.map(docId => updateDoc(doc(db, "serverCallRequest", docId), { resolved: true }))
                          );
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

              {billRequests.has(selectedTable) && billRequests.get(selectedTable) && (
                <li className="flex justify-between items-center bg-gray-200 p-3 mb-2 rounded-lg">
                  <p className="text-lg font-medium text-gray-700">💳 Bill Requested</p>
                  <button
                    className="px-4 py-2 text-lg bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    onClick={async () => {
                      const docId = billRequests.get(selectedTable);
                      if (docId) {
                        await updateDoc(doc(db, "billRequest", docId), { resolved: true });
                      }
                    }}
                  >
                    Mark Done
                  </button>
                </li>
              )}
            </ul>

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