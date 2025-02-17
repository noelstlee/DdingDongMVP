"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function SignupInfoPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (password.length < 6 || password !== confirmPassword) {
      setError("Passwords must match and be at least 6 characters long.");
      return;
    }

    try {
      const email = localStorage.getItem("emailForSignIn");
      if (!email) {
        setError("No email found. Please sign up again.");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "managers", user.uid), {
        email: user.email,
        role: "manager",
        uid: user.uid,
      });

      router.push("/auth/extraInfoMan");
    } catch (err) {
      console.error("Error creating user:", err);
      setError("Failed to create account. Please try again.");
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white relative ${poppins.className}`}>
      
      {/* Back Button */}
      <button
        className="absolute left-4 top-4 text-yellow-400 text-lg hover:text-yellow-500 transition"
        onClick={() => router.push("/auth/signup")}
      >
        ← Back
      </button>

      {/* Header */}
      <h1 className="text-4xl font-bold mb-8 text-center">Create Your Account</h1>

      {/* Input Fields Container */}
      <div className="w-80 flex flex-col space-y-4">
        
        {/* Password Input */}
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg shadow-lg 
                     focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
        />

        {/* Confirm Password Input */}
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg shadow-lg 
                     focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
        />
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 font-semibold mt-3">{error}</p>}

      {/* Signup Button */}
      <button
        className="w-80 px-6 py-3 mt-6 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-xl font-bold rounded-lg 
                   shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner"
        onClick={handleSignup}
      >
        Create Account
      </button>
    </div>
  );
}