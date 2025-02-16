"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { Poppins } from "next/font/google";

// Import Font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ManageMenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", image: "" });

  useEffect(() => {
    const fetchManagerData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const managerRef = doc(db, "managers", user.uid);
        const managerSnap = await getDoc(managerRef);

        if (managerSnap.exists()) {
          const managerData = managerSnap.data();
          setRestaurantId(managerData.restaurantId);
        } else {
          console.error("❌ Manager data not found!");
        }
      } catch (error) {
        console.error("❌ Error fetching manager data:", error);
      }
    };

    fetchManagerData();
  }, []);

  useEffect(() => {
    if (!restaurantId) return;

    console.log(`Fetching menu for restaurant: ${restaurantId}`);

    const menuRef = collection(db, "menu", restaurantId, "items"); // ✅ Fetch from structured DB

    const unsubscribe = onSnapshot(menuRef, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Menu items received:", items);
      setMenuItems(items);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [restaurantId]);

  const handleAddItem = async () => {
    if (!newItem.name.trim() || !newItem.price.trim()) {
      alert("⚠️ Please enter both Name and Price.");
      return;
    }
    if (isNaN(Number(newItem.price)) || Number(newItem.price) <= 0) {
      alert("⚠️ Price must be a valid number greater than 0.");
      return;
    }
    if (!restaurantId) {
      alert("⚠️ Error: Restaurant ID not found. Please try again.");
      return;
    }

    try {
      await addDoc(collection(db, "menu", restaurantId, "items"), { 
        name: newItem.name.trim(), 
        description: newItem.description.trim(), 
        price: Number(newItem.price).toFixed(2), 
        image: newItem.image.trim() 
      });
      setNewItem({ name: "", description: "", price: "", image: "" });
      alert("✅ Menu item added successfully!");
    } catch (error) {
      console.error("❌ Error adding menu item:", error);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, "menu", restaurantId, "items", id));
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("❌ Error deleting menu item:", error);
    }
  };

  return (
    <div className={`p-5 bg-gray-900 text-white ${poppins.className}`}>
      <h1 className="text-4xl font-bold mb-6">Manage Menu</h1>

      {/* Add New Menu Item */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Add New Menu Item</h2>
        <input 
          type="text" placeholder="Name" 
          className="w-full p-2 mb-2 bg-gray-700 text-white" 
          value={newItem.name} 
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} 
        />
        <input 
          type="text" placeholder="Description (optional)" 
          className="w-full p-2 mb-2 bg-gray-700 text-white" 
          value={newItem.description} 
          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} 
        />
        <input 
          type="number" placeholder="Price" 
          className="w-full p-2 mb-2 bg-gray-700 text-white" 
          value={newItem.price} 
          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} 
        />
        <input 
          type="text" placeholder="Image URL (optional)" 
          className="w-full p-2 mb-2 bg-gray-700 text-white" 
          value={newItem.image} 
          onChange={(e) => setNewItem({ ...newItem, image: e.target.value })} 
        />
        <button 
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg"
          onClick={handleAddItem}
        >
          Add Item ➕
        </button>
      </div>

      {/* Menu List */}
      <h2 className="text-2xl font-bold mb-4">Existing Menu</h2>
      {menuItems.length === 0 ? (
        <p className="text-gray-400">No menu items available.</p>
      ) : (
        menuItems.map(item => (
          <div key={item.id} className="flex justify-between items-center bg-gray-800 p-4 mb-2 rounded-lg">
            <div>
              <p className="text-lg font-semibold">{item.name} - ${item.price}</p>
              <p className="text-sm text-gray-400">{item.description}</p>
            </div>
            <button 
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg"
              onClick={() => handleDeleteItem(item.id)}
            >
              ❌
            </button>
          </div>
        ))
      )}
    </div>
  );
}