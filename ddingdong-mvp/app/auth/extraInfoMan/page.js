"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { auth, db } from "@/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ExtraInfoManPage() {
  const router = useRouter();
  const [restaurantCode, setRestaurantCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/auth/signup");
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleContinue = async () => {
    if (!firstName.trim() || !lastName.trim() || !birthday.trim() || !restaurantCode.trim()) {
      setError("All fields are required.");
      return;
    }

    try {
      if (!user) {
        setError("User not authenticated. Please log in again.");
        return;
      }

      setError("");

      const restaurantRef = doc(db, "restaurants", restaurantCode);
      const restaurantSnap = await getDoc(restaurantRef);

      if (!restaurantSnap.exists()) {
        setError("Invalid restaurant code. Please enter a valid code.");
        return;
      }

      await setDoc(
        doc(db, "managers", user.uid),
        {
          email: user.email,
          firstName,
          lastName,
          restaurantId: restaurantCode,
        },
        { merge: true }
      );

      localStorage.setItem("managerEmail", user.email);
      localStorage.setItem("role", "manager");

      router.push("/managerMain");
    } catch (err) {
      console.error("Error saving manager details:", err);
      setError("Failed to save details. Please try again.");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-yellow-400 text-xl">Loading...</div>;
  }

  return (
    <div className={`flex justify-center items-center h-screen bg-gray-900 text-white relative ${poppins.className}`}>
      
      {/* Back Button */}
      <button
        className="absolute left-4 top-4 text-yellow-400 text-lg hover:text-yellow-500 transition"
        onClick={() => router.push("/auth/signupInfo")}
      >
        ← Back
      </button>

      <div className="w-96 bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">Manager Extra Information</h1>

        {/* Input Fields Container */}
        <div className="flex flex-col space-y-4">
          
          {/* Restaurant Code Input */}
          <input
            type="text"
            placeholder="Restaurant Code"
            value={restaurantCode}
            onChange={(e) => setRestaurantCode(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none 
                       focus:ring-2 focus:ring-yellow-500 transition-all"
          />

          {/* First Name Input */}
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none 
                       focus:ring-2 focus:ring-yellow-500 transition-all"
          />

          {/* Last Name Input */}
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none 
                       focus:ring-2 focus:ring-yellow-500 transition-all"
          />
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 font-semibold mt-3">{error}</p>}

        {/* Continue Button */}
        <button
          className="w-full px-6 py-3 mt-6 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-xl font-bold rounded-lg 
                     shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner"
          onClick={handleContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}