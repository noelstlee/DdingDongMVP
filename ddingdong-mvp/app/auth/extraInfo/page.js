"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase"; // Firebase Authentication instance
import { db } from "@/firebase"; // Firestore database instance
import { doc, setDoc } from "firebase/firestore";

export default function ExtraInfoPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!firstName || !lastName || !birthday) {
      setError("All fields are required.");
      return;
    }

    try {
      const user = auth.currentUser; // Get the currently logged-in user
      if (!user) {
        setError("User not authenticated. Please log in again.");
        return;
      }

      // Save user details to Firestore
      const userDoc = doc(db, "users", user.uid);
      await setDoc(userDoc, {
        firstName,
        lastName,
        birthday,
        email: user.email, // Save user's email for reference
      });
      console.log("User details saved successfully");

      // Redirect to the Map page
      router.push("/Map");
    } catch (err) {
      console.error("Error saving user details:", err);
      setError("Failed to save details. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-950 text-yellow-400 p-5">
      <button
        className="absolute top-6 left-6 text-yellow-400 font-bold"
        onClick={() => router.back()}
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Your Details</h1>

      <input
        type="text"
        placeholder="First name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="w-64 px-4 py-3 border border-yellow bg-white text-black rounded mb-4 focus:outline-none"
      />
      <input
        type="text"
        placeholder="Last name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="w-64 px-4 py-3 border border-yellow bg-white text-black rounded mb-4 focus:outline-none"
      />
      <input
        type="date"
        placeholder="Birthday (mm/dd/yyyy)"
        value={birthday}
        onChange={(e) => setBirthday(e.target.value)}
        className="w-64 px-4 py-3 border border-yellow bg-white text-black rounded mb-4 focus:outline-none"
      />
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        className="w-64 px-6 py-3 bg-yellow text-black font-bold rounded hover:bg-yellow-600 transition"
        onClick={handleContinue}
      >
        Continue
      </button>
    </div>
  );
}