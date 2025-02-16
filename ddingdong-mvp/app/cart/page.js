"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/firebase"; // ✅ Import auth
import { CartContext } from "@/context/CartContext";
import { collection, addDoc } from "firebase/firestore";
import Image from "next/image";

export default function CartPage() {
  const { cart, addToCart, removeFromCart } = useContext(CartContext);
  const [ setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // ✅ Listen for authentication state
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        console.log("✅ User logged in:", currentUser.uid);
        setUser(currentUser);
      } else {
        console.error("❌ No user logged in");
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Function to confirm order
  const handleConfirmOrder = async () => {
    const currentUser = auth.currentUser; // ✅ Fetch current authenticated user

    if (!currentUser) {
      alert("❌ Error: Missing user data. Please log in again.");
      router.push("/auth/login"); // ✅ Redirect to login page if no user
      return;
    }

    if (Object.keys(cart).length === 0) {
      alert("❌ Your cart is empty.");
      return;
    }

    try {
      const timestamp = new Date();
      const orderData = {
        userId: currentUser.uid, // ✅ Attach the authenticated user's UID
        restaurantId: "ABC123", // ✅ Replace with dynamic restaurant ID
        tableId: "Table 1", // ✅ Replace with dynamic table number
        timestamp,
        items: Object.values(cart),
        active: true, // ✅ Track whether the order is still active
      };

      await addDoc(collection(db, "foodOrders"), orderData);
      alert("✅ Order placed successfully!");
      router.push("/bell"); // ✅ Redirect user to Bell page after order
    } catch (error) {
      console.error("❌ Error placing order:", error);
      alert("❌ Failed to place order. Please try again.");
    }
  };

  return (
    <div className="p-5 bg-gray-900 text-white min-h-screen">
      <h1 className="text-4xl font-bold text-yellow-500 mb-6">Your Cart</h1>

      {Object.keys(cart).length === 0 ? (
        <p className="text-gray-400">Your cart is empty.</p>
      ) : (
        <div>
          {Object.values(cart).map((item) => (
            <div key={item.id} className="flex items-center bg-gray-800 p-4 rounded-lg shadow-lg mb-4">
              <div className="w-20 h-20 flex-shrink-0 bg-gray-700 rounded-lg overflow-hidden relative">
                <Image src={item.image} alt={item.name} layout="fill" objectFit="cover" className="rounded-lg"/>
              </div>

              <div className="ml-4 flex-grow">
                <h2 className="text-lg font-semibold">{item.name} - ${item.price}</h2>
              </div>

              <div className="flex items-center space-x-2">
                <button className="bg-gray-600 px-3 py-1 rounded-lg text-white" onClick={() => removeFromCart(item.id)}>-</button>
                <span>{cart[item.id]?.quantity || 0}</span>
                <button className="bg-yellow-500 px-3 py-1 rounded-lg text-white" onClick={() => addToCart(item)}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Ddingdong Confirmation Button */}
      <button
        className="bg-yellow-500 px-6 py-3 rounded-lg text-white mt-6 flex items-center"
        onClick={handleConfirmOrder}
      >
        <Image src="/assets/logo.png" alt="Ddingdong Logo" width={24} height={24} className="mr-2" />
        Confirm Order
      </button>
    </div>
  );
}