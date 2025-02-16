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
      alert("Menu URL saved successfully!");
      router.push("/managerMain/settings");
    } catch (error) {
      console.error("Error saving menu URL:", error);
      alert("Failed to save menu URL. Please try again.");
    }
  };

  return (
    <div className={`p-5 bg-gray-900 text-white ${poppins.className}`}>
      <h1 className="text-4xl font-bold mb-6">Input URL for Menu</h1>

      <div className="mb-4">
        <label className="block mb-2 text-lg font-semibold">Menu URL</label>
        <input
          type="url"
          className="w-full p-3 rounded-lg bg-gray-700 text-white"
          placeholder="https://example.com/menu"
          value={menuURL}
          onChange={(e) => setMenuURL(e.target.value)}
        />
      </div>

      <button
        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-lg"
        onClick={handleSave}
      >
        Save Menu URL
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