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
    <div className={`flex flex-col items-center min-h-screen p-5 bg-gray-900 text-white ${poppins.className}`}>
      <h1 className="text-4xl font-bold mb-6">Set Your Password</h1>

      {/* Password Input */}
      <input type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)}
        className="w-72 px-4 py-3 border border-gray-500 bg-white text-black rounded-lg mb-4 shadow-lg focus:ring-2 focus:ring-yellow-500 transition-all"
      />

      {/* Confirm Password Input */}
      <input type="password" placeholder="Confirm Password" value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-72 px-4 py-3 border border-gray-500 bg-white text-black rounded-lg mb-4 shadow-lg focus:ring-2 focus:ring-yellow-500 transition-all"
      />

      {/* Error Message */}
      {error && <p className="text-red-500 font-semibold mb-4">{error}</p>}

      {/* Signup Button */}
      <button className="w-72 px-6 py-3 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-xl font-bold rounded-lg shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner"
        onClick={handleSignup}
      >
        Create Account
      </button>
    </div>
  );
}