"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/Map"); // Redirect to Map page
    } catch (err) {
      // Parse Firebase error codes for a better error message
      switch (err.code) {
        case "auth/user-not-found":
          setError("No user found with this email.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password.");
          break;
        case "auth/invalid-email":
          setError("Invalid email format.");
          break;
        default:
          setError("Failed to login. Please try again.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-950 text-yellow-400 p-5">
      <h1 className="text-2xl font-bold mb-6">Login</h1>

      {/* Email Input */}
      <input
        type="email"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email Address"
        className="w-64 px-4 py-3 border border-yellow bg-white text-black rounded mb-4 focus:outline-none"
      />

      {/* Password Input */}
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-label="Password"
        className="w-64 px-4 py-3 border border-yellow bg-white text-black rounded mb-4 focus:outline-none"
      />

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Login Button */}
      <button
        className="w-64 px-6 py-3 bg-yellow text-navy font-bold rounded mb-4 hover:bg-yellow-600 transition"
        onClick={handleLogin}
        aria-label="Login Button"
      >
        Login
      </button>

      {/* Forgot Password Link */}
      <p>
        Forgot your password?{" "}
        <span
          className="text-yellow cursor-pointer"
          onClick={() => router.push("/auth/forgotPassword")}
          aria-label="Forgot Password Link"
        >
          Reset here
        </span>
      </p>

      {/* Sign Up Link */}
      <p>
        New user?{" "}
        <span
          className="text-yellow cursor-pointer"
          onClick={() => router.push("/auth/signup")}
          aria-label="Sign Up Link"
        >
          Sign up here
        </span>
      </p>
    </div>
  );
}