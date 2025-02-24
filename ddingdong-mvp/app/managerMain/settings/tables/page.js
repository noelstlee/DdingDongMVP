"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { collection, doc, setDoc, deleteDoc, getDocs, getDoc } from "firebase/firestore";
import { db, auth } from "@/firebase"; 
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import Font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

// Add this function at the top of the file, after the imports
const getTableSize = (tableCount) => {
  if (tableCount <= 10) return 'w-32 h-32';
  if (tableCount <= 15) return 'w-28 h-28';
  if (tableCount <= 20) return 'w-24 h-24';
  return 'w-20 h-20'; // For more than 20 tables
};

// Draggable Table Component
const DraggableTable = ({ id, position, totalTables }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'table',
    item: { id, position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const tableSize = getTableSize(totalTables);
  const zIndex = totalTables - parseInt(id) + 1; // This will make table 1 have highest z-index

  return (
    <div
      ref={drag}
      className={`absolute ${tableSize} bg-yellow-500 rounded-lg flex items-center justify-center cursor-move
                 ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{
        left: position.x,
        top: position.y,
        zIndex,
      }}
    >
      {id}
    </div>
  );
};

// Drop Target Grid
const LayoutGrid = ({ children, onDrop }) => {
  const [, drop] = useDrop(() => ({
    accept: 'table',
    drop: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      const x = Math.round(item.position.x + delta.x);
      const y = Math.round(item.position.y + delta.y);
      onDrop(item.id, x, y);
    },
  }));

  return (
    <div
      ref={drop}
      className="relative w-full h-[600px] bg-gray-800 rounded-lg border-2 border-gray-700"
    >
      {children}
    </div>
  );
};

export default function CustomizeTablesPage() {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState("");
  const [tableCount, setTableCount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tables, setTables] = useState({});
  const [isLayoutMode, setIsLayoutMode] = useState(false);

  useEffect(() => {
    const fetchManagerData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setError("❌ Error: No authenticated manager found.");
        setLoading(false);
        return;
      }

      try {
        const managerRef = doc(db, "managers", user.uid);
        const managerSnap = await getDoc(managerRef);

        if (managerSnap.exists()) {
          const managerData = managerSnap.data();
          setRestaurantId(managerData.restaurantId);
          
          // Fetch existing tables and their positions
          const tableCollectionRef = collection(db, `tables/${managerData.restaurantId}/table_items`);
          const tableSnapshot = await getDocs(tableCollectionRef);
          const tableData = {};
          tableSnapshot.docs.forEach(doc => {
            const data = doc.data();
            tableData[data.tableNumber] = {
              x: data.positionX || 0,
              y: data.positionY || 0
            };
          });
          setTables(tableData);
          setTableCount(Object.keys(tableData).length || "");
        } else {
          setError("❌ Error: Manager data not found.");
        }
      } catch (err) {
        console.error("❌ Error fetching manager data:", err);
        setError("❌ Error retrieving restaurant ID.");
      } finally {
        setLoading(false);
      }
    };

    fetchManagerData();
  }, []);

  const handleCreateTables = () => {
    const newTables = {};
    const spacing = 0; // Reduced padding for vertical stack
    
    for (let i = 1; i <= tableCount; i++) {
      newTables[i] = {
        x: 20, // Fixed x position for the stack
        y: (i - 1) * spacing + 20 // Stack vertically with some padding from top
      };
    }
    setTables(newTables);
    setIsLayoutMode(true);
  };

  const handleTableMove = (id, x, y) => {
    setTables(prev => ({
      ...prev,
      [id]: { x, y }
    }));
  };

  const handleSave = async () => {
    if (!restaurantId) {
      alert("❌ Error: Cannot update tables without a valid restaurant ID.");
      return;
    }

    const tableCollectionRef = collection(db, `tables/${restaurantId}/table_items`);

    try {
      // Clear existing tables
      const querySnapshot = await getDocs(tableCollectionRef);
      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Add new tables with positions
      const addPromises = Object.entries(tables).map(([tableNumber, position]) => 
        setDoc(doc(tableCollectionRef, `Table ${tableNumber}`), {
          tableNumber: parseInt(tableNumber),
          positionX: position.x,
          positionY: position.y
        })
      );
      await Promise.all(addPromises);

      alert(`✅ Successfully updated ${tableCount} tables with layout!`);
      router.push("/managerMain");
    } catch (error) {
      console.error("❌ Error updating tables:", error);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`flex flex-col items-center min-h-screen p-6 bg-gray-900 text-white font-semibold ${poppins.className}`}>
        <button
          className="absolute left-4 top-4 text-yellow-400 text-lg hover:text-yellow-500 transition font-medium"
          onClick={() => router.push("/managerMain/settings")}
        >
          ← Back
        </button>

        {error && <p className="text-red-500 text-lg mb-4">{error}</p>}
        {loading && <p className="text-yellow-400 text-lg">Loading restaurant data...</p>}

        {!loading && !error && !isLayoutMode && (
          <div className="w-full max-w-lg space-y-6 text-center mt-20">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4">Number of Tables</h2>
              <input
                type="number"
                className="w-full p-3 bg-gray-700 text-white rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Enter number of tables"
                value={tableCount}
                onChange={(e) => setTableCount(e.target.value === "" ? "" : Number(e.target.value))}
                min={0}
              />
            </div>

            <button
              className="w-full px-6 py-4 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-lg font-semibold rounded-lg 
                        shadow-[0_4px_0_#b38600] transition active:translate-y-1 active:shadow-inner"
              onClick={handleCreateTables}
            >
              Continue to Layout
            </button>
          </div>
        )}

        {!loading && !error && isLayoutMode && (
          <div className="w-full max-w-4xl space-y-6 mt-20">
            <h2 className="text-2xl font-semibold text-center mb-4">Arrange Your Tables</h2>
            <p className="text-center text-gray-400 mb-4">Drag and drop tables to match your own layout</p>
            
            <LayoutGrid onDrop={handleTableMove}>
              {Object.entries(tables).map(([id, position]) => (
                <DraggableTable
                  key={id}
                  id={id}
                  position={position}
                  totalTables={Object.keys(tables).length}
                />
              ))}
            </LayoutGrid>

            <button
              className="w-full px-6 py-4 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-lg font-semibold rounded-lg 
                        shadow-[0_4px_0_#b38600] transition active:translate-y-1 active:shadow-inner"
              onClick={handleSave}
            >
              Save Layout
            </button>
          </div>
        )}
      </div>
    </DndProvider>
  );
}