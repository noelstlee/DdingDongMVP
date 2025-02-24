"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { collection, doc, setDoc, deleteDoc, getDocs, getDoc } from "firebase/firestore";
import { db, auth } from "@/firebase"; 
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import Font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

// Update the getTableSize function to be consistent across both pages
const getTableSize = (tableCount) => {
  if (tableCount <= 10) return 'w-24 h-24';
  if (tableCount <= 20) return 'w-20 h-20';
  if (tableCount <= 30) return 'w-16 h-16';
  if (tableCount <= 40) return 'w-14 h-14';
  return 'w-12 h-12'; // For more than 40 tables
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

  return (
    <div
      ref={drag}
      className={`absolute ${tableSize} bg-yellow-500 rounded-lg flex items-center justify-center cursor-move
                 ${isDragging ? 'opacity-50' : 'opacity-100'} border-2 border-yellow-600 transition-all duration-150`}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        touchAction: 'none', // Prevent touch scrolling while dragging
      }}
    >
      {id}
    </div>
  );
};

// Drop Target Grid
const LayoutGrid = ({ children, onDrop, tableCount, width, height }) => {
  const gridSize = tableCount <= 10 ? 48 : tableCount <= 20 ? 40 : tableCount <= 30 ? 32 : 24;
  const dropRef = useRef(null);

  // Move the grid lines creation outside of the render
  const gridLines = useMemo(() => {
    const lines = [];
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      lines.push(
        <div
          key={`v${x}`}
          className="absolute border-l border-gray-700"
          style={{ left: x, top: 0, height: '100%' }}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      lines.push(
        <div
          key={`h${y}`}
          className="absolute border-t border-gray-700"
          style={{ left: 0, top: y, width: '100%' }}
        />
      );
    }
    
    return lines;
  }, [width, height, gridSize]);

  const [, drop] = useDrop(() => ({
    accept: 'table',
    drop: (item, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const containerRect = dropRef.current.getBoundingClientRect();
      
      const scrollContainer = document.querySelector('.scroll-container');
      const x = clientOffset.x - containerRect.left + scrollContainer.scrollLeft;
      const y = clientOffset.y - containerRect.top + scrollContainer.scrollTop;
      
      // Keep tables within bounds and on grid intersections
      const minX = gridSize;
      const minY = gridSize;
      const maxX = width - gridSize;
      const maxY = height - gridSize;
      
      // Snap to grid and enforce boundaries
      const snappedX = Math.round(x / gridSize) * gridSize;
      const snappedY = Math.round(y / gridSize) * gridSize;
      
      const boundedX = Math.max(minX, Math.min(maxX, snappedX));
      const boundedY = Math.max(minY, Math.min(maxY, snappedY));

      onDrop(item.id, boundedX, boundedY);
      return undefined;
    },
  }), [gridSize, width, height, onDrop]);

  // Combine refs
  const combinedRef = useMemo(() => {
    return (element) => {
      dropRef.current = element;
      drop(element);
    };
  }, [drop]);

  return (
    <div className="scroll-container overflow-auto p-4 bg-gray-900 rounded-lg" style={{ maxHeight: '80vh' }}>
      <div
        ref={combinedRef}
        className="grid-container relative bg-gray-800 rounded-lg border-2 border-gray-700"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {gridLines}
        {children}
      </div>
    </div>
  );
};

// Keep calculateCanvasBoundary outside as it's a pure function
const calculateCanvasBoundary = (tables) => {
  if (Object.keys(tables).length === 0) return { width: 1600, height: 1000 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Find the boundaries of all tables
  Object.values(tables).forEach(({ x, y }) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });

  // Calculate grid size based on table count
  const tableCount = Object.keys(tables).length;
  const gridSize = tableCount <= 10 ? 48 : tableCount <= 20 ? 40 : tableCount <= 30 ? 32 : 24;

  // Extend to nearest grid line and add 2 grid cells of padding
  const paddingGrids = 2;
  const startX = Math.floor(minX / gridSize) * gridSize - (gridSize * paddingGrids);
  const startY = Math.floor(minY / gridSize) * gridSize - (gridSize * paddingGrids);
  const endX = Math.ceil(maxX / gridSize) * gridSize + (gridSize * paddingGrids);
  const endY = Math.ceil(maxY / gridSize) * gridSize + (gridSize * paddingGrids);

  const width = Math.max(endX - startX, 800); // Minimum width
  const height = Math.max(endY - startY, 600); // Minimum height

  return { 
    width, 
    height, 
    startX, 
    startY,
    gridSize
  };
};

export default function CustomizeTablesPage() {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState("");
  const [tableCount, setTableCount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tables, setTables] = useState({});
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1600, height: 1000 });
  const [isOptimizing, setIsOptimizing] = useState(false);

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
    const gridSize = tableCount <= 10 ? 48 : tableCount <= 20 ? 40 : tableCount <= 30 ? 32 : 24;
    
    // Start with some padding from the edges
    const startX = gridSize;
    const startY = gridSize;
    const maxTablesPerRow = 5;
    
    for (let i = 1; i <= tableCount; i++) {
      const col = ((i-1) % maxTablesPerRow);
      const row = Math.floor((i-1) / maxTablesPerRow);
      
      newTables[i] = {
        x: startX + (col * gridSize),
        y: startY + (row * gridSize)
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

    const { startX, startY } = calculateCanvasBoundary(tables);
    
    // Adjust table positions relative to the optimized boundary
    const optimizedTables = {};
    Object.entries(tables).forEach(([id, position]) => {
      optimizedTables[id] = {
        x: position.x - startX,
        y: position.y - startY
      };
    });

    const tableCollectionRef = collection(db, `tables/${restaurantId}/table_items`);

    try {
      // Clear existing tables
      const querySnapshot = await getDocs(tableCollectionRef);
      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Add new tables with optimized positions
      const addPromises = Object.entries(optimizedTables).map(([tableNumber, position]) => 
        setDoc(doc(tableCollectionRef, `Table ${tableNumber}`), {
          tableNumber: parseInt(tableNumber),
          positionX: position.x,
          positionY: position.y
        })
      );
      await Promise.all(addPromises);

      alert(`✅ Successfully updated ${tableCount} tables with optimized layout!`);
      router.push("/managerMain");
    } catch (error) {
      console.error("❌ Error updating tables:", error);
    }
  };

  // Move optimizeLayout inside the component
  const optimizeLayout = () => {
    const { width, height, startX, startY } = calculateCanvasBoundary(tables);
    
    // Adjust table positions relative to the new boundary
    const adjustedTables = {};
    Object.entries(tables).forEach(([id, position]) => {
      adjustedTables[id] = {
        x: position.x - startX,
        y: position.y - startY
      };
    });

    setTables(adjustedTables);
    setCanvasSize({ width, height });
    setIsOptimizing(true);
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
          <div className="w-full max-w-6xl space-y-6 mt-20 mx-auto px-4">
            <h2 className="text-2xl font-semibold text-center mb-4">Arrange Your Tables</h2>
            <p className="text-center text-gray-400 mb-4">
              {isOptimizing ? "Layout optimized! Make final adjustments if needed." : "Drag tables to grid intersections to match your layout"}
            </p>
            
            <LayoutGrid 
              onDrop={handleTableMove} 
              tableCount={parseInt(tableCount)}
              width={canvasSize.width}
              height={canvasSize.height}
            >
              {Object.entries(tables).map(([id, position]) => (
                <DraggableTable
                  key={id}
                  id={id}
                  position={position}
                  totalTables={parseInt(tableCount)}
                />
              ))}
            </LayoutGrid>
            
            <div className="flex gap-4">
              {!isOptimizing && (
                <button
                  className="w-full px-6 py-4 bg-gray-700 text-white text-lg font-semibold rounded-lg 
                            shadow-[0_4px_0_#374151] transition active:translate-y-1 active:shadow-inner"
                  onClick={optimizeLayout}
                >
                  Optimize Layout
                </button>
              )}
              <button
                className="w-full px-6 py-4 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-lg font-semibold rounded-lg 
                          shadow-[0_4px_0_#b38600] transition active:translate-y-1 active:shadow-inner"
                onClick={handleSave}
              >
                Save Layout
              </button>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}