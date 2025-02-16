"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { getDocs } from "firebase/firestore";


// const db = getFirestore(firebaseApp);
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function CustomizeTablesPage() {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState("ABC123"); // Replace with dynamic restaurant ID.
  const [tableCount, setTableCount] = useState(0);

  const handleSave = async () => {
    const tableCollectionRef = collection(db, `tables/${restaurantId}/table_items`);
    try {
      // Clear existing tables
      const querySnapshot = await getDocs(tableCollectionRef); // Use getDocs to fetch the documents
      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref)); // Delete all documents
      await Promise.all(deletePromises);
  
      // Add new tables
      const addPromises = [];
      for (let i = 1; i <= tableCount; i++) {
        addPromises.push(setDoc(doc(tableCollectionRef, `Table ${i}`), { tableNumber: i }));
      }
      await Promise.all(addPromises);
  
      alert(`Successfully updated ${tableCount} tables!`);
    } catch (error) {
      console.error("Error updating tables:", error);
    }
  };

  return (
    <div className={`p-5 bg-gray-900 text-white ${poppins.className}`}>
      <h1 className="text-4xl font-bold mb-6">Customize Tables</h1>
      <div className="mb-4">
        <label className="block mb-2 text-lg font-semibold">Restaurant ID</label>
        <input
          type="text"
          className="w-full p-3 rounded-lg bg-gray-700 text-white"
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-lg font-semibold">Number of Tables</label>
        <input
          type="number"
          className="w-full p-3 rounded-lg bg-gray-700 text-white"
          value={tableCount}
          onChange={(e) => setTableCount(Number(e.target.value))}
          min={0}
        />
      </div>
      <button
        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-lg"
        onClick={handleSave}
      >
        Save Tables
      </button>
      <button
        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg mt-4"
        onClick={() => router.push("/managerMain/settings")}
      >
        Back to Settings
      </button>
    </div>
  );
}