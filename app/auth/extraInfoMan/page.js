"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { auth, db } from "@/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth"; // ✅ Import auth state listener
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ExtraInfoManPage() {
  const router = useRouter();
  const [restaurantCode, setRestaurantCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // ✅ Added loading state

  useEffect(() => {
    // ✅ Properly listen for authentication state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/auth/signup"); // Redirect if not logged in
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup
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

      setError(""); // Clear previous errors

      const restaurantRef = doc(db, "restaurants", restaurantCode);
      const restaurantSnap = await getDoc(restaurantRef);

      if (!restaurantSnap.exists()) {
        setError("Invalid restaurant code. Please enter a valid code.");
        return;
      }

      // ✅ Save manager details properly with merge option
      await setDoc(
        doc(db, "managers", user.uid),
        {
          email: user.email,
          firstName,
          lastName,
          birthday,
          restaurantId: restaurantCode,
        },
        { merge: true } // ✅ Prevents overwriting existing data
      );

      // ✅ Store manager data in local storage
      localStorage.setItem("managerEmail", user.email);
      localStorage.setItem("role", "manager");

      router.push("/managerMain"); // ✅ Directly go to manager dashboard
    } catch (err) {
      console.error("Error saving manager details:", err);
      setError("Failed to save details. Please try again.");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-yellow-400 text-xl">Loading...</div>;
  }

  return (
    <div className={`flex flex-col items-center min-h-screen p-5 bg-gray-900 text-white ${poppins.className}`}>
      <h1 className="text-3xl font-bold mb-6">Manager Extra Information</h1>

      {/* Restaurant Code Input */}
      <input
        type="text"
        placeholder="Restaurant Code"
        value={restaurantCode}
        onChange={(e) => setRestaurantCode(e.target.value)}
        className="w-64 px-4 py-3 border border-gray-400 bg-white text-black rounded mb-4 focus:outline-none"
      />

      {/* First Name Input */}
      <input
        type="text"
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="w-64 px-4 py-3 border border-gray-400 bg-white text-black rounded mb-4 focus:outline-none"
      />

      {/* Last Name Input */}
      <input
        type="text"
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="w-64 px-4 py-3 border border-gray-400 bg-white text-black rounded mb-4 focus:outline-none"
      />

      {/* Birthday Input */}
      <input
        type="date"
        value={birthday}
        onChange={(e) => setBirthday(e.target.value)}
        className="w-64 px-4 py-3 border border-gray-400 bg-white text-black rounded mb-4 focus:outline-none"
      />

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Continue Button */}
      <button
        className="w-64 px-6 py-3 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-xl font-bold rounded 
                   shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner"
        onClick={handleContinue}
      >
        Continue
      </button>
    </div>
  );
}