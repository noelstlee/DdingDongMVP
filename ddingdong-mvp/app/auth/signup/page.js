"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ManagerSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSignupWithEmail = () => {
    if (!email) {
      setError("Please enter a valid email.");
      return;
    }
    try {
      localStorage.setItem("emailForSignIn", email);
      router.push("/auth/signupInfo");
    } catch (err) {
      console.error("Error during signup:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white relative ${poppins.className}`}>
      
      {/* Back Button */}
      <button
        className="absolute left-4 top-4 text-yellow-400 text-lg hover:text-yellow-500 transition"
        onClick={() => router.push("/auth/manager")}
      >
        ← Back
      </button>

      {/* Header */}
      <h1 className="text-4xl font-bold mb-8 text-center">Manager Signup</h1>

      {/* Input Fields Container */}
      <div className="w-80 flex flex-col space-y-4">
        
        {/* Email Input */}
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg shadow-lg 
                     focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
        />
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 font-semibold mt-3">{error}</p>}

      {/* Sign Up Button */}
      <button
        className="w-80 px-6 py-3 mt-6 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-xl font-bold rounded-lg 
                   shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner"
        onClick={handleSignupWithEmail}
      >
        SIGN UP
      </button>
    </div>
  );
}