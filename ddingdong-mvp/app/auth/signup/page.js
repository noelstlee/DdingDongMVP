"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSignupWithEmail = async () => {
    if (!email) return;

    try {
      // Store the email locally to use later in the signupInfo page
      window.localStorage.setItem("emailForSignIn", email);
      router.push("/auth/signupInfo"); // Redirect to signupInfo page
    } catch (err) {
      console.error("Error during email signup process:", err);
    }
  };

  const handleGoogleSignup = async () => {
    // Add logic for signing up with Google here if required
    console.log("Sign up with Google clicked");
  };

  const handleAppleSignup = async () => {
    // Add logic for signing up with Apple here if required
    console.log("Sign up with Apple clicked");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-950 text-yellow-400 p-5">
      <h1 className="text-2xl font-bold mb-6">Sign Up</h1>

      {/* Email Input */}
      <input
        type="email"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-64 px-4 py-3 border border-yellow bg-white text-black rounded mb-4 focus:outline-none"
      />
      <button
        className="w-64 px-6 py-3 bg-yellow text-navy font-bold rounded mb-4 hover:bg-yellow-600 transition"
        onClick={handleSignupWithEmail}
      >
        Sign up with Email
      </button>

      {/* Google Signup */}
      <button
        className="w-64 px-6 py-3 bg-gray-200 text-black rounded mb-4 hover:bg-gray-300 transition"
        onClick={handleGoogleSignup}
      >
        Sign up with Google
      </button>

      {/* Apple Signup */}
      <button
        className="w-64 px-6 py-3 bg-gray-200 text-black rounded hover:bg-gray-300 transition"
        onClick={handleAppleSignup}
      >
        Sign up with Apple
      </button>
    </div>
  );
}