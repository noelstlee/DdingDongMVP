"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import React from 'react';
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { collection, doc, setDoc, deleteDoc, getDocs, getDoc } from "firebase/firestore";
import { db, auth } from "@/firebase"; 

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

// Draggable Table Component
const DraggableTable = ({ id, position, totalTables, onMove, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ x: position.x, y: position.y });
  const tableRef = useRef(null);
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tableSize = getTableSize(totalTables, screenWidth);

  const handleTouchStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const scrollContainer = document.querySelector('.scroll-container');
    const containerRect = scrollContainer.getBoundingClientRect();
    
    // Calculate position relative to the container
    const x = touch.clientX - containerRect.left;
    const y = touch.clientY - containerRect.top;
    
    setCurrentPosition({ x, y });
    onMove(id, x, y, false);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    onMove(id, currentPosition.x, currentPosition.y, true);
    setIsDragging(false);
  };

  return (
    <div
      ref={tableRef}
      className={`absolute ${tableSize} bg-yellow-500 rounded-lg flex items-center justify-center cursor-move
                 ${isDragging ? 'opacity-50 scale-110' : 'opacity-100 transition-all duration-150'} border-2 border-yellow-600
                 ${!isDragging && 'hover:scale-105 active:scale-105'}`}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        touchAction: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
    >
      {id}
    </div>
  );
};

// Drop Target Grid
const LayoutGrid = ({ children, onDrop, tableCount }) => {
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // Make grid size responsive
  const getResponsiveGridSize = (count, screenW) => {
    if (screenW < 600) {
      return count <= 10 ? 32 : count <= 20 ? 28 : count <= 30 ? 24 : 20;
    }
    if (screenW < 900) {
      return count <= 10 ? 40 : count <= 20 ? 32 : count <= 30 ? 28 : 24;
    }
    return count <= 10 ? 48 : count <= 20 ? 40 : count <= 30 ? 32 : 24;
  };

  const gridSize = getResponsiveGridSize(tableCount, screenWidth);
  const gridRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate container size based on screen size
  const containerSize = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        width: 800,
        height: 600
      };
    }

    const padding = gridSize * 2;
    const safeScreenWidth = Math.max(window.innerWidth, 320);
    const safeScreenHeight = Math.max(window.innerHeight, 480);
    
    if (screenWidth < 600) { // Phone: Size for 3-column layout
      const numCols = 3;
      const numRows = Math.ceil(tableCount / numCols);
      
      // Calculate spacing based on available width
      const availableWidth = safeScreenWidth - (padding * 2);
      const columnSpacing = Math.floor(availableWidth / numCols);
      
      // Ensure minimum spacing between tables
      const minSpacing = gridSize * 2;
      const actualSpacing = Math.max(columnSpacing, minSpacing);
      
      const requiredWidth = (numCols * actualSpacing) + (padding * 2);
      const requiredHeight = (numRows * actualSpacing) + (padding * 2);
      
      return {
        width: Math.floor(requiredWidth / gridSize) * gridSize,
        height: Math.floor(requiredHeight / gridSize) * gridSize
      };
    }
    
    // For tablets and larger screens: Fill available space with maximum limits
    const maxWidth = Math.min(safeScreenWidth * 0.95, 1600);
    const maxHeight = Math.min(safeScreenHeight * 0.8, 1000);
    
    return {
      width: Math.floor((maxWidth - padding) / gridSize) * gridSize,
      height: Math.floor((maxHeight - padding) / gridSize) * gridSize
    };
  }, [gridSize, screenWidth, tableCount]);

  const handleTableMove = (id, x, y, isFinal) => {
    if (screenWidth < 600) {
      // For phones: Snap to 3-column grid
      const index = parseInt(id) - 1;
      const col = index % 3;
      const row = Math.floor(index / 3);
      const newX = (gridSize * 2) + (col * gridSize * 3);
      const newY = (gridSize * 2) + (row * gridSize * 3);
      onDrop(id, newX, newY);
      return;
    }

    if (!isFinal) {
      onDrop(id, x, y);
      return;
    }

    const minX = gridSize;
    const minY = gridSize;
    const maxX = containerSize.width - gridSize;
    const maxY = containerSize.height - gridSize;

    // Calculate closest grid intersection
    const closestX = Math.round(x / gridSize) * gridSize;
    const closestY = Math.round(y / gridSize) * gridSize;

    // Ensure position is within bounds
    const boundedX = Math.max(minX, Math.min(maxX, closestX));
    const boundedY = Math.max(minY, Math.min(maxY, closestY));

    onDrop(id, boundedX, boundedY);
  };

  // Create grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    
    // Vertical lines
    for (let x = gridSize; x <= containerSize.width - gridSize; x += gridSize) {
      lines.push(
        <div
          key={`v${x}`}
          className="absolute border-l border-gray-700"
          style={{ left: x, top: 0, height: '100%' }}
        />
      );
    }

    // Horizontal lines
    for (let y = gridSize; y <= containerSize.height - gridSize; y += gridSize) {
      lines.push(
        <div
          key={`h${y}`}
          className="absolute border-t border-gray-700"
          style={{ left: 0, top: y, width: '100%' }}
        />
      );
    }

    // Intersection points
    for (let x = gridSize; x <= containerSize.width - gridSize; x += gridSize) {
      for (let y = gridSize; y <= containerSize.height - gridSize; y += gridSize) {
        lines.push(
          <div
            key={`p${x}-${y}`}
            className="absolute w-1.5 h-1.5 bg-gray-600 rounded-full transform -translate-x-[3px] -translate-y-[3px]"
            style={{ left: x, top: y }}
          />
        );
      }
    }
    
    return lines;
  }, [containerSize.width, containerSize.height, gridSize]);

  return (
    <div className="scroll-container bg-gray-900 rounded-lg p-4" 
         style={{ 
           width: '100%',
           maxWidth: `${containerSize.width + 32}px`,
           margin: '0 auto',
           height: screenWidth < 600 ? '60vh' : `${containerSize.height + 32}px`,
           overflow: 'auto',
           WebkitOverflowScrolling: 'touch'
         }}>
      <div
        ref={gridRef}
        className="grid-container relative bg-gray-800 rounded-lg border-2 border-gray-700"
        style={{ 
          width: `${containerSize.width}px`,
          height: `${containerSize.height}px`,
          margin: '0 auto',
          minWidth: screenWidth < 600 ? '300px' : '600px'
        }}
      >
        {gridLines}
        {React.Children.map(children, child =>
          React.cloneElement(child, {
            onMove: handleTableMove
          })
        )}
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
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        // Wait for auth to initialize
        const waitForAuth = new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
          });
        });

        const user = await waitForAuth;
        
        if (!user) {
          console.error("❌ No authenticated user found");
          router.push("/auth/manager");
          return;
        }

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
          router.push("/auth/manager");
        }
      } catch (err) {
        console.error("❌ Error fetching manager data:", err);
        setError("❌ Error retrieving restaurant ID.");
      } finally {
        setLoading(false);
      }
    };

    fetchManagerData();
  }, [router]);

  const handleCreateTables = () => {
    if (typeof window === 'undefined') return;

    const newTables = {};
    const gridSize = tableCount <= 10 ? 48 : tableCount <= 20 ? 40 : tableCount <= 30 ? 32 : 24;
    
    // Start with some padding from the edges
    const startX = gridSize * 2;
    const startY = gridSize * 2;
    
    if (window.innerWidth < 600) {
      // For phones: Calculate positions with adjusted spacing
      const numCols = 3;
      const availableWidth = window.innerWidth - (gridSize * 4);
      const columnSpacing = Math.floor(availableWidth / numCols);
      const actualSpacing = Math.max(columnSpacing, gridSize * 2);
      
      for (let i = 1; i <= tableCount; i++) {
        const index = i - 1;
        const col = index % numCols;
        const row = Math.floor(index / numCols);
        
        newTables[i] = {
          x: startX + (col * actualSpacing),
          y: startY + (row * actualSpacing)
        };
      }
    } else {
      // For tablets and larger screens: Use aspect ratio-based layout
      const aspectRatio = window.innerWidth / window.innerHeight;
      const numRows = Math.ceil(Math.sqrt(tableCount / aspectRatio));
      const numCols = Math.ceil(tableCount / numRows);
      
      for (let i = 1; i <= tableCount; i++) {
        const col = ((i-1) % numCols);
        const row = Math.floor((i-1) / numCols);
        newTables[i] = {
          x: startX + (col * gridSize * 2),
          y: startY + (row * gridSize * 2)
        };
      }
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

  return (
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
        <div className="w-full space-y-6 mt-20 mx-auto px-4">
          <h2 className="text-2xl font-semibold text-center mb-4">Arrange Your Tables</h2>
          <p className="text-center text-gray-400 mb-4">
            {screenWidth < 600 ? 
              "Tables are arranged in a fixed 3-column layout" : 
              "Drag and hold tables to move them around"}
          </p>
          
          <div className="overflow-auto" style={{ 
            maxHeight: screenWidth < 600 ? undefined : 'calc(100vh - 300px)',
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <LayoutGrid 
              onDrop={handleTableMove} 
              tableCount={parseInt(tableCount)}
            >
              {Object.entries(tables).map(([id, position]) => (
                <DraggableTable
                  key={id}
                  id={id}
                  position={position}
                  totalTables={parseInt(tableCount)}
                  disabled={screenWidth < 600}
                />
              ))}
            </LayoutGrid>
          </div>
          
          <div className="flex justify-center mt-6">
            <button
              className="w-full max-w-md px-6 py-4 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-lg font-semibold rounded-lg 
                        shadow-[0_4px_0_#b38600] transition active:translate-y-1 active:shadow-inner"
              onClick={handleSave}
            >
              Save Layout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}