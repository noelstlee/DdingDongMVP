"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Poppins } from "next/font/google";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"; // Removed OAuthProvider
import { auth } from "@/firebase";


// Import Poppins font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role"); // Determine role

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSignupWithEmail = async () => {
    if (!email) return;

    try {
      window.localStorage.setItem("emailForSignIn", email);
      window.localStorage.setItem("signupRole", role);
      router.push(`/auth/signupInfo?role=${role}`);
    } catch (err) {
      console.error("Error during email signup process:", err);
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // ✅ Ensure the correct role is stored
      window.localStorage.setItem("signupRole", role);
      window.localStorage.setItem("userEmail", user.email);
      window.localStorage.setItem("userUID", user.uid);

      router.push(role === "manager" ? "/auth/extraInfoMan" : "/auth/extraInfo");
    } catch (err) {
      console.error("Google Signup Error:", err);
      setError("Failed to sign up with Google. Please try again.");
    }
  };

  return (
    <div className={`flex flex-col items-center min-h-screen p-5 bg-gray-900 text-white ${poppins.className}`}>
      <h1 className="text-4xl font-bold mb-6">{role === "manager" ? "Manager Signup" : "Customer Signup"}</h1>

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
        className="w-64 px-6 py-3 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-white text-xl font-medium rounded mb-4 
                   shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner"
        onClick={handleSignupWithEmail}
      >
        SIGN UP WITH EMAIL
      </button>

      {/* Google Signup */}
      <button
        className="w-64 px-6 py-3 bg-gray-700 text-white text-lg font-medium rounded mb-4 hover:bg-gray-600 transition"
        onClick={handleGoogleSignup}
      >
        SIGN UP WITH GOOGLE
      </button>

      {/* Error Message */}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}