"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // ✅ Get dynamic restaurantId
import { db } from "@/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export default function CustomerMenu() {
  const { restaurantId } = useParams(); // ✅ Get restaurantId from dynamic route
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    if (!restaurantId) return;

    console.log(`🔍 Fetching menu for restaurantId: ${restaurantId}`);

    const q = query(collection(db, "menu"), where("restaurantId", "==", restaurantId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("📥 Menu items received:", items);
      setMenuItems(items);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [restaurantId]); // ✅ Depend on restaurantId

  return (
    <div className="p-5 bg-gray-900 text-white min-h-screen">
      <h1 className="text-4xl font-bold text-yellow-500 mb-6">Menu for {restaurantId}</h1>

      {menuItems.length === 0 ? (
        <p className="text-gray-400">No menu items available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <div key={item.id} className="flex items-center bg-gray-800 p-4 rounded-lg shadow-lg">
              {/* Image */}
              <div className="w-20 h-20 flex-shrink-0 bg-gray-700 rounded-lg overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">No Image</div>
                )}
              </div>

              {/* Item Details */}
              <div className="ml-4">
                <h2 className="text-lg font-semibold">{item.name} - ${item.price}</h2>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}