"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ManagerSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error] = useState("");

  const handleSignupWithEmail = () => {
    if (!email) return;
    try {
      localStorage.setItem("emailForSignIn", email);
      router.push("/auth/signupInfo");
    } catch (err) {
      console.error("Error during signup:", err);
    }
  };

  return (
    <div className={`flex flex-col items-center min-h-screen p-5 bg-gray-900 text-white ${poppins.className}`}>
      <h1 className="text-4xl font-bold mb-6">Manager Signup</h1>

      {/* Email Input */}
      <input
        type="email"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-64 px-4 py-3 border border-gray-400 bg-white text-black rounded mb-4 focus:outline-none"
      />

      {/* Sign Up with Email Button */}
      <button
        className="w-64 px-6 py-3 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-white text-xl font-bold rounded mb-4 
                   shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner"
        onClick={handleSignupWithEmail}
      >
        SIGN UP
      </button>

      {/* Error Message */}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}