"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Poppins } from "next/font/google";
import { auth, db } from "@/firebase"; // Import Firebase auth and Firestore
import { doc, setDoc } from "firebase/firestore";

// Import Poppins font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function SelectTablePage() {
  const router = useRouter();
  const [selectedTable, setSelectedTable] = useState(null);

  const tables = Array.from({ length: 10 }, (_, i) => `Table ${i + 1}`); // Generate Table 1-10

  const handleConfirm = async () => {
    if (!selectedTable) return;
  
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to continue.");
      return;
    }
  
    const restaurantId = localStorage.getItem("selectedRestaurantId");
  
    if (!restaurantId) {
      alert("Error: No restaurant selected.");
      return;
    }
  
    try {
      // Save customer details in Firestore (ensure no overwrites)
      await setDoc(
        doc(db, "customers", user.uid),
        {
          email: user.email,
          restaurantId,
          tableNumber: selectedTable,
          role: "customer",
        },
        { merge: true } // Use merge to avoid overwriting other fields
      );
  
      router.push("/bell");
    } catch (error) {
      console.error("Error saving customer details:", error);
      alert("Failed to save table selection. Please try again.");
    }
  };
  
  

  return (
    <div className={`flex flex-col items-center min-h-screen p-5 bg-gray-900 text-white ${poppins.className}`}>
      {/* Back Button */}
      <button className="absolute top-6 left-6 text-yellow-400 font-bold" onClick={() => router.back()}>
        ← Back
      </button>

      {/* Title */}
      <h1 className="text-3xl font-bold my-4 text-yellow-500">Select Your Table</h1>

      {/* Scrollable Table Number List */}
      <div className="w-72 bg-white text-black rounded-lg shadow-lg overflow-y-scroll max-h-60 border border-gray-400">
        {tables.map((table) => (
          <button
            key={table}
            className={`w-full px-6 py-3 text-lg font-semibold text-left 
                        ${selectedTable === table ? "bg-yellow-400 text-black" : "hover:bg-gray-200"}`}
            onClick={() => setSelectedTable(table)}
          >
            {table}
          </button>
        ))}
      </div>

      {/* Confirm Button */}
      <button
        className={`w-72 px-6 py-3 mt-6 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-xl font-bold rounded-lg 
                   shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner ${
                     !selectedTable ? "opacity-50 cursor-not-allowed" : ""
                   }`}
        onClick={handleConfirm}
        disabled={!selectedTable}
      >
        Confirm
      </button>
    </div>
  );
}