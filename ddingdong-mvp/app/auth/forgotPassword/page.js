"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSendResetEmail = async () => {
    if (!email) {
      setError("Please enter your email.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Reset email sent successfully! Redirecting to login...");
      setError("");

      // ✅ Redirect to login after a short delay
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err) {
      console.error(err);

      // Display relevant error messages
      switch (err.code) {
        case "auth/user-not-found":
          setError("No manager account found with this email.");
          break;
        case "auth/invalid-email":
          setError("Invalid email format. Please try again.");
          break;
        default:
          setError("Failed to send reset email. Please try again.");
      }

      setSuccessMessage("");
    }
  };

  return (
    <div className={`flex justify-center items-center h-screen bg-gray-900 text-white relative ${poppins.className}`}>
      
      {/* Back Button */}
      <button
        className="absolute left-4 top-4 text-yellow-400 text-lg hover:text-yellow-500 transition"
        onClick={() => router.push("/auth/login")}
      >
        ← Back
      </button>

      <div className="w-96 bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        
        {/* Header */}
        <h1 className="text-3xl font-bold mb-4">Reset Your Password</h1>

        <p className="mb-6 text-gray-300 text-lg">
          Enter your email to receive a password reset link.
        </p>

        {/* Email Input */}
        <input
          type="email"
          placeholder="Enter your manager email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none 
                     focus:ring-2 focus:ring-yellow-500 transition-all"
        />

        {/* Error Message */}
        {error && <p className="text-red-500 font-semibold mt-3">{error}</p>}

        {/* Success Message */}
        {successMessage && <p className="text-green-500 font-semibold mt-3">{successMessage}</p>}

        {/* Send Reset Email Button */}
        <button
          className="w-full px-6 py-3 mt-6 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-xl font-bold rounded-lg 
                     shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner"
          onClick={handleSendResetEmail}
        >
          Send Reset Email
        </button>

        {/* Back to Login */}
        <p className="mt-4 text-gray-300">
          <span
            className="text-yellow-400 cursor-pointer hover:underline"
            onClick={() => router.push("/auth/login")}
          >
            Back to Login
          </span>
        </p>
      </div>
    </div>
  );
}