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
    if (tableCount <= 10) return 'w-[4rem] h-[4rem]';
    if (tableCount <= 20) return 'w-[3.5rem] h-[3.5rem]';
    if (tableCount <= 30) return 'w-[3rem] h-[3rem]';
    return 'w-[2.5rem] h-[2.5rem]';
  }
  // For larger screens (> 900px)
  if (tableCount <= 10) return 'w-[6rem] h-[6rem]';
  if (tableCount <= 20) return 'w-[5rem] h-[5rem]';
  if (tableCount <= 30) return 'w-[4rem] h-[4rem]';
  return 'w-[3.5rem] h-[3.5rem]';
}; 

const calculateCanvasBoundary = (tables) => {
  if (!tables || tables.length === 0) return { width: '100%', height: '100%', gridSize: 3 };
  
  // Calculate grid size based on number of tables
  const tableCount = tables.length;
  const gridSize = tableCount <= 10 ? 3 : tableCount <= 20 ? 2.5 : tableCount <= 30 ? 2 : 1.5;
  
  return {
    width: '100%',
    height: '100%',
    gridSize
  };
}; 

const calculateBoundingBox = (tables, screenWidth) => {
  if (!tables || tables.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  tables.forEach(table => {
    let posX = table.positionX;
    let posY = table.positionY;

    if (screenWidth < 600) {
      const index = parseInt(table.tableNumber) - 1;
      const numCols = 3;
      const spacing = screenWidth / 4;
      const col = index % numCols;
      const row = Math.floor(index / numCols);
      posX = (spacing * 1.5) + (col * spacing);
      posY = (spacing * 1.5) + (row * spacing);
    } else {
      const scale = screenWidth < 900 ? 0.7 : 0.9;
      posX = table.positionX * scale;
      posY = table.positionY * scale;
    }

    minX = Math.min(minX, posX);
    maxX = Math.max(maxX, posX);
    minY = Math.min(minY, posY);
    maxY = Math.max(maxY, posY);
  });

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return { minX, maxX, minY, maxY, width, height, centerX, centerY };
};

export default function ManagerMainPage() {
  const router = useRouter();
  const [managerData, setManagerData] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [tableRequests, setTableRequests] = useState({});
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [serverCallRequests, setServerCallRequests] = useState(new Map());
  const [billRequests, setBillRequests] = useState(new Set());

  const [selectedTable, setSelectedTable] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  // Screen width is used for responsive table sizing and positioning
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // Sound for notifications
  const [sound, setSound] = useState(null);
  const [soundInterval, setSoundInterval] = useState(null);

  // Function to play the notification sound
  const playDdingDong = () => {
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(err => console.error("Error playing sound:", err));
    }
  };

  // Function to check if there are any unresolved requests
  const hasUnresolvedRequests = () => {
    return (
      serverCallRequests.size > 0 ||
      billRequests.size > 0 ||
      Object.values(tableRequests).some(requests => 
        requests.some(req => !req.resolved)
      )
    );
  };

  // Effect to manage continuous sound playing
  useEffect(() => {
    let interval = null;

    const startSoundInterval = () => {
      if (hasUnresolvedRequests() && sound) {
        playDdingDong(); // Play immediately
        interval = setInterval(playDdingDong, 3000);
        setSoundInterval(interval);
      }
    };

    const stopSoundInterval = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
        setSoundInterval(null);
      }
    };

    if (hasUnresolvedRequests() && sound) {
      stopSoundInterval(); // Clear any existing interval
      startSoundInterval(); // Start a new interval
    } else {
      stopSoundInterval();
    }

    return () => {
      stopSoundInterval();
    };
  }, [serverCallRequests.size, billRequests.size, Object.keys(tableRequests).length, sound]);

  // Initialize sound
  useEffect(() => {
    if (typeof window === "undefined") return;
    setSound(new Audio('/sounds/ddingdong.mp3'));
  }, []);

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
        ...doc.data(),
        label: doc.data().label || String(doc.data().tableNumber)
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
        const updatedBillRequests = new Set();
        snapshot.forEach((doc) => {
          updatedBillRequests.add(String(doc.data().table));
        });
        setBillRequests(updatedBillRequests);
      }
    );
  
    return () => {
      unsubscribeTables();
      unsubscribeRequests();
      unsubscribeServerCalls();
      unsubscribeBillRequests();
      // Clear sound interval on cleanup
      if (soundInterval) {
        clearInterval(soundInterval);
        setSoundInterval(null);
      }
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
      <div className="w-full flex flex-col items-center">
        {/* Active Requests Section */}
        <div className="w-full max-w-4xl px-4">
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
          <div className="flex flex-wrap gap-4 mb-8">
            {Array.from(serverCallRequests.keys()).map((tableNum) => {
              const table = tables.find(t => String(t.tableNumber) === tableNum);
              const displayName = table?.label || `Table ${tableNum}`;
              return (
                <button
                  key={`server-${tableNum}`}
                  onClick={() => openTablePopup(tableNum)}
                  className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400 transition"
                >
                  {displayName}: 🛎️ Server Call
                </button>
              );
            })}
            {Array.from(billRequests).map((tableNum) => {
              const table = tables.find(t => String(t.tableNumber) === tableNum);
              const displayName = table?.label || `Table ${tableNum}`;
              return (
                <button
                  key={`bill-${tableNum}`}
                  onClick={() => openTablePopup(tableNum)}
                  className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400 transition"
                >
                  {displayName}: 💳 Bill
                </button>
              );
            })}
            {Object.entries(tableRequests).map(([tableNum, requests]) => {
              const unresolvedCount = requests.filter(req => !req.resolved).length;
              if (unresolvedCount === 0) return null;
              const table = tables.find(t => String(t.tableNumber) === tableNum);
              const displayName = table?.label || `Table ${tableNum}`;
              return (
                <button
                  key={`request-${tableNum}`}
                  onClick={() => openTablePopup(tableNum)}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-300 transition"
                >
                  {displayName}: {unresolvedCount} items
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Formation */}
        <div className="w-full flex justify-center items-center" style={{ 
          height: '65vh',
          position: 'relative'
        }}>
          <div 
            className="relative w-full h-full flex items-center justify-center"
            style={{ 
              padding: '1rem',
              transform: 'scale(0.95)',
              transformOrigin: 'center center'
            }}
          >
            {(() => {
              const boundingBox = calculateBoundingBox(tables, screenWidth);
              const containerWidth = screenWidth;
              const containerHeight = window.innerHeight * 0.65; // 65vh
              
              // Calculate the offset to center the bounding box
              const offsetX = (containerWidth - boundingBox.width) / 2 - boundingBox.minX;
              const offsetY = (containerHeight - boundingBox.height) / 2 - boundingBox.minY;

              return tables.map((table) => {
                const tableNumber = String(table.tableNumber);
                const isServerCallActive = serverCallRequests.has(tableNumber);
                const isBillRequestActive = billRequests.has(tableNumber);
                const unresolvedRequests = tableRequests[tableNumber]?.filter((req) => !req.resolved) || [];
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

                // Calculate position based on screen size and table count
                let positionX = table.positionX;
                let positionY = table.positionY;
                
                if (screenWidth < 600) {
                  // For mobile: 3-column grid layout
                  const index = parseInt(tableNumber) - 1;
                  const numCols = 3;
                  const spacing = screenWidth / 4;
                  
                  const col = index % numCols;
                  const row = Math.floor(index / numCols);
                  
                  positionX = (spacing * 1.5) + (col * spacing);
                  positionY = (spacing * 1.5) + (row * spacing);
                } else {
                  // For tablets and larger: Scale positions based on viewport
                  const scale = screenWidth < 900 ? 0.7 : 0.9;
                  positionX = table.positionX * scale;
                  positionY = table.positionY * scale;
                }

                // Apply the centering offset
                positionX += offsetX;
                positionY += offsetY;

                return (
                  <button
                    key={tableNumber}
                    className={`absolute ${getTableSize(tables.length, screenWidth)} flex items-center justify-center text-xl font-bold rounded-lg transition-all ${tableColorClass} text-black shadow-lg hover:scale-105`}
                    onClick={() => openTablePopup(tableNumber)}
                    style={{
                      left: `${positionX}px`,
                      top: `${positionY}px`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: screenWidth < 600 ? '0.875rem' : screenWidth < 900 ? '1rem' : '1.25rem'
                    }}
                  >
                    <span className="absolute">{table.label || tableNumber}</span>

                    {isServerCallActive && (
                      <span className="absolute -top-1 -left-1 text-base sm:text-lg">🛎️</span>
                    )}

                    {isBillRequestActive && (
                      <span className="absolute -bottom-1 -right-1 text-base sm:text-lg">💳</span>
                    )}

                    {unresolvedRequests.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1 py-0.5 rounded-full min-w-[1.2rem] text-center">
                        {unresolvedRequests.length}
                      </span>
                    )}
                  </button>
                );
              });
            })()}
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
                    for (const tableNum of billRequests) {
                      const q = query(
                        collection(db, "billRequest"),
                        where("restaurantId", "==", restaurantId),
                        where("table", "==", tableNum),
                        where("resolved", "==", false)
                      );
                      const querySnapshot = await getDocs(q);
                      await Promise.all(
                        querySnapshot.docs.map(doc => updateDoc(doc.ref, { resolved: true }))
                      );
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

            <h2 className="text-2xl text-center font-semibold mb-4">
              {tables.find(t => String(t.tableNumber) === selectedTable)?.label || `Table ${selectedTable}`}
            </h2>

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

              {billRequests.has(selectedTable) && (
                <li className="flex justify-between items-center bg-gray-200 p-3 mb-2 rounded-lg">
                  <p className="text-lg font-medium text-gray-700">💳 Bill Requested</p>
                  <button
                    className="px-4 py-2 text-lg bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    onClick={async () => {
                      // Query for the bill request document
                      const q = query(
                        collection(db, "billRequest"),
                        where("restaurantId", "==", restaurantId),
                        where("table", "==", selectedTable),
                        where("resolved", "==", false)
                      );
                      const querySnapshot = await getDocs(q);
                      querySnapshot.forEach(async (doc) => {
                        await updateDoc(doc.ref, { resolved: true });
                      });
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