"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import { doc, setDoc, getDoc, query, where, collection, getDocs } from "firebase/firestore";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function MenuURLPage() {
  const router = useRouter();
  const [menuURL, setMenuURL] = useState("");
  const [restaurantId, setRestaurantId] = useState("");

  useEffect(() => {
    const fetchRestaurantId = async () => {
      try {
        const managerEmail = localStorage.getItem("managerEmail")?.trim().toLowerCase();
        console.log("Manager Email from localStorage:", managerEmail);

        if (!managerEmail) {
          console.error("No manager email found in localStorage.");
          router.push("/login");
          return;
        }

        // Query Firestore to get the manager document
        const managersRef = collection(db, "managers");
        const managerQuery = query(managersRef, where("email", "==", managerEmail));
        const querySnapshot = await getDocs(managerQuery);

        if (querySnapshot.empty) {
          console.error(`No manager data found for email: ${managerEmail}`);
          router.push("/login");
          return;
        }

        // Extract the manager data
        const managerDoc = querySnapshot.docs[0];
        const managerData = managerDoc.data();
        console.log("Manager Data:", managerData);

        setRestaurantId(managerData.restaurantId);

        // Fetch the existing menu URL, if any
        const restaurantDoc = await getDoc(doc(db, "restaurants", managerData.restaurantId));
        if (restaurantDoc.exists()) {
          setMenuURL(restaurantDoc.data().menuURL || "");
        } else {
          console.warn("No restaurant data found for this manager.");
        }
      } catch (error) {
        console.error("Error fetching manager or restaurant data:", error);
        router.push("/login");
      }
    };

    fetchRestaurantId();
  }, [router]);

  const handleSave = async () => {
    if (!menuURL.trim()) {
      alert("Please provide a valid URL.");
      return;
    }

    try {
      await setDoc(
        doc(db, "restaurants", restaurantId),
        { menuURL },
        { merge: true } // Merge to avoid overwriting other fields
      );
      alert("✅ Menu URL saved successfully!");
      router.push("/managerMain/settings");
    } catch (error) {
      console.error("❌ Error saving menu URL:", error);
      alert("Failed to save menu URL. Please try again.");
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

      {/* Header (Centered) */}
      <h1 className="text-3xl font-semibold text-center mb-6">Enter Menu URL</h1>

      {/* Settings Container */}
      <div className="w-full max-w-lg space-y-6 text-center">
        
        {/* Menu URL Input */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <input
            type="url"
            className="w-full text-medium p-3 bg-gray-700 text-white rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="https://example.com/menu"
            value={menuURL}
            onChange={(e) => setMenuURL(e.target.value)}
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
    </div>
  );
}