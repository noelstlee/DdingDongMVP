"use client";

import { useState, useEffect, useContext } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import { CartContext } from "@/context/CartContext"; // ✅ Import Cart Context

export default function CustomerMenu() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("restaurantId");
  const { cart, addToCart, removeFromCart } = useContext(CartContext);
  const [menuItems, setMenuItems] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!restaurantId) return;

    console.log(`🔍 Fetching menu for restaurantId: ${restaurantId}`);

    const menuRef = collection(db, "menu", restaurantId, "items");

    const unsubscribe = onSnapshot(menuRef, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        quantity: cart[doc.id]?.quantity || 0,
      }));
      setMenuItems(items);
    });

    return () => unsubscribe();
  }, [restaurantId, cart]);

  // ✅ Calculate total cart quantity
  const totalItems = Object.values(cart).reduce((acc, item) => acc + item.quantity, 0);
  
  console.log("🛒 Cart State:", cart); // ✅ Debugging log
  console.log("🛒 Total Items:", totalItems); // ✅ Debugging log

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
              <div className="w-20 h-20 flex-shrink-0 bg-gray-700 rounded-lg overflow-hidden relative">
                <Image 
                  src={item.image} 
                  alt={item.name} 
                  layout="fill" 
                  objectFit="cover"
                  className="rounded-lg"
                />
              </div>

              {/* Item Details */}
              <div className="ml-4 flex-grow">
                <h2 className="text-lg font-semibold">{item.name} - ${item.price}</h2>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center space-x-2">
                <button className="bg-gray-600 px-3 py-1 rounded-lg text-white" onClick={() => removeFromCart(item.id)}>-</button>
                <span>{cart[item.id]?.quantity || 0}</span>
                <button className="bg-yellow-500 px-3 py-1 rounded-lg text-white" onClick={() => addToCart(item)}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Floating Cart Button (Make sure it's actually rendering) */}
      {totalItems > 0 && (
        <button
          onClick={() => router.push("/cart")}
          className="fixed bottom-8 right-8 bg-yellow-500 text-black px-5 py-3 rounded-full shadow-lg flex items-center space-x-2"
        >
          <span className="text-lg font-bold">🛒 Cart ({totalItems})</span>
        </button>
      )}
    </div>
  );
}