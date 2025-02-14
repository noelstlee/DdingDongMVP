"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { auth, db } from "@/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Poppins } from "next/font/google";

// Import Poppins font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ExtraInfoManPage() {
  const router = useRouter();
  const [restaurantCode, setRestaurantCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push("/auth/signup"); // Redirect if not authenticated
    } else {
      setUser(currentUser);
    }
  }, [router]);

  const handleContinue = async () => {
    if (!firstName || !lastName || !birthday || !restaurantCode) {
      setError("All fields are required.");
      return;
    }

    try {
      if (!user) {
        setError("User not authenticated. Please log in again.");
        return;
      }

      // Check if restaurant code exists in Firestore
      const restaurantRef = doc(db, "restaurants", restaurantCode);
      const restaurantSnap = await getDoc(restaurantRef);

      if (!restaurantSnap.exists()) {
        setError("Invalid restaurant code. Please enter a valid code.");
        return;
      }

      // Save manager details to Firestore
      const managerRef = doc(db, "managers", user.uid);
      await setDoc(managerRef, {
        email: user.email,
        firstName,
        lastName,
        birthday,
        restaurantId: restaurantCode, // Ensure it's stored as restaurantId
      });

      // Save manager role in local storage
      localStorage.setItem("managerEmail", user.email);
      localStorage.setItem("role", "manager");

      // Redirect to Manager Dashboard
      router.push("/managerMain");
    } catch (err) {
      console.error("Error saving manager details:", err);
      setError("Failed to save details. Please try again.");
    }
  };

  return (
    <div className={`flex flex-col items-center min-h-screen p-5 bg-gray-900 text-white ${poppins.className}`}>
      <h1 className="text-3xl font-bold mb-6">Enter Your Details</h1>

      {/* First Name Input */}
      <input
        type="text"
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="w-72 px-4 py-3 border border-gray-500 bg-white text-black rounded-lg mb-4 shadow-lg focus:ring-2 focus:ring-yellow-500 transition-all"
      />

      {/* Last Name Input */}
      <input
        type="text"
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="w-72 px-4 py-3 border border-gray-500 bg-white text-black rounded-lg mb-4 shadow-lg focus:ring-2 focus:ring-yellow-500 transition-all"
      />

      {/* Birthday Input */}
      <input
        type="date"
        value={birthday}
        onChange={(e) => setBirthday(e.target.value)}
        className="w-72 px-4 py-3 border border-gray-500 bg-white text-black rounded-lg mb-4 shadow-lg focus:ring-2 focus:ring-yellow-500 transition-all"
      />

      {/* Restaurant Code Input */}
      <input
        type="text"
        placeholder="Restaurant Code"
        value={restaurantCode}
        onChange={(e) => setRestaurantCode(e.target.value)}
        className="w-72 px-4 py-3 border border-gray-500 bg-white text-black rounded-lg mb-4 shadow-lg focus:ring-2 focus:ring-yellow-500 transition-all"
      />

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Continue Button */}
      <button
        className="w-72 px-6 py-3 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-xl font-bold rounded-lg 
                   shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner"
        onClick={handleContinue}
      >
        Continue
      </button>
    </div>
  );
}
