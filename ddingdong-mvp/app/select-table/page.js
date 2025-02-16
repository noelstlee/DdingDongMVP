"use client";

<<<<<<< Updated upstream
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Poppins } from "next/font/google";
import { auth, db } from "@/firebase"; // Import Firebase auth and Firestore
import { doc, setDoc } from "firebase/firestore";
=======
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Poppins } from "next/font/google";
import { db } from "@/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
>>>>>>> Stashed changes

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function SelectTablePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("restaurantId");

  const [selectedTable, setSelectedTable] = useState(null);
<<<<<<< Updated upstream

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
=======
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) {
      alert("Error: No restaurant ID found. Please scan the QR code again.");
      router.push("/");
      return;
    }

    console.log("🔍 Fetching tables for restaurant:", restaurantId);

    const fetchTables = async () => {
      try {
        // ✅ Check if tables are stored in subcollection
        const tableCollectionRef = collection(db, `tables/${restaurantId}/table_items`);
        const querySnapshot = await getDocs(tableCollectionRef);

        if (!querySnapshot.empty) {
          const tableList = querySnapshot.docs.map((doc) => doc.id);
          console.log("✅ Tables found in subcollection:", tableList);
          setTables(tableList);
          return;
        }

        // ✅ If subcollection fails, check if tables are stored in a document field
        const restaurantDoc = await getDoc(doc(db, "tables", restaurantId));

        if (restaurantDoc.exists()) {
          const data = restaurantDoc.data();
          if (data.table_items && Array.isArray(data.table_items)) {
            console.log("✅ Tables found in document field:", data.table_items);
            setTables(data.table_items);
            return;
          }
        }

        console.warn("❌ No tables found for restaurant:", restaurantId);
        setTables([]);
      } catch (error) {
        console.error("🔥 Error fetching tables:", error);
        alert("Error fetching tables. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, [restaurantId, router]);

  const handleConfirm = () => {
    if (!selectedTable) {
      alert("Please select a table.");
      return;
    }

    // ✅ Redirect to Bell Page with selected table
    router.push(`/bell?restaurantId=${restaurantId}&tableId=${selectedTable}`);
>>>>>>> Stashed changes
  };
  
  

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-yellow-400 text-xl">
        Loading...
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center min-h-screen p-5 bg-gray-900 text-white ${poppins.className}`}>
      <h1 className="text-3xl font-bold my-4 text-yellow-500">Select Your Table</h1>

      {/* Table List */}
      <div className="w-72 bg-white text-black rounded-lg shadow-lg overflow-y-scroll max-h-60 border border-gray-400">
        {tables.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No tables available.</p>
        ) : (
          tables.map((table) => (
            <button
              key={table}
              className={`w-full px-6 py-3 text-lg font-semibold text-left ${
                selectedTable === table ? "bg-yellow-400 text-black" : "hover:bg-gray-200"
              }`}
              onClick={() => setSelectedTable(table)}
            >
              {table}
            </button>
          ))
        )}
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