"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { collection, doc, setDoc, deleteDoc, getDocs, getDoc } from "firebase/firestore";
import { db, auth } from "@/firebase"; 

// Import Font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function CustomizeTablesPage() {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState("");
  const [tableCount, setTableCount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      // Add new tables
      const addPromises = [];
      for (let i = 1; i <= tableCount; i++) {
        addPromises.push(setDoc(doc(tableCollectionRef, `Table ${i}`), { tableNumber: i }));
      }
      await Promise.all(addPromises);

      alert(`✅ Successfully updated ${tableCount} tables for Restaurant ID: ${restaurantId}!`);
    } catch (error) {
      console.error("❌ Error updating tables:", error);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-6 bg-gray-900 text-white font-semibold ${poppins.className}`}>
      
      {/* Back Button (Fixed at Top-Left) */}
      <button
        className="absolute left-4 top-4 text-yellow-400 text-lg hover:text-yellow-500 transition font-medium"
        onClick={() => router.push("/managerMain/settings")}
      >
        ← Back
      </button>

      {/* Error Message */}
      {error && <p className="text-red-500 text-lg mb-4">{error}</p>}

      {/* Loading Spinner */}
      {loading && <p className="text-yellow-400 text-lg">Loading restaurant data...</p>}

      {!loading && !error && (
        <div className="w-full max-w-lg space-y-6 text-center">

          {/* Table Count Input */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Number of Tables</h2>
            <input
              type="number"
              className="w-full p-3 bg-gray-700 text-white rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter number of tables"
              value={tableCount}
              onChange={(e) => {
                const value = e.target.value;
                setTableCount(value === "" ? "" : Number(value)); // Allow empty input
              }}
              min={0}
            />
          </div>

          {/* Save Button */}
          <button
            className="w-full px-6 py-4 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-lg font-semibold rounded-lg 
                      shadow-[0_4px_0_#b38600] transition active:translate-y-1 active:shadow-inner"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}