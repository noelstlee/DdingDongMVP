"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";

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

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err) {
      console.error(err);

      // Display relevant error messages
      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with this email.");
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-950 text-yellow-400 p-5">
      <h1 className="text-2xl font-bold mb-6">Forgot Password</h1>

      {/* Email Input */}
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-64 px-4 py-3 border border-yellow bg-white text-black rounded mb-4 focus:outline-none"
      />

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Success Message */}
      {successMessage && <p className="text-green-500 mb-4">{successMessage}</p>}

      {/* Send Reset Email Button */}
      <button
        className="w-64 px-6 py-3 bg-yellow text-black font-bold rounded hover:bg-yellow-600 transition"
        onClick={handleSendResetEmail}
      >
        Send Reset Email
      </button>
    </div>
  );
}