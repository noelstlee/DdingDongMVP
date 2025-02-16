"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ManagerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user details locally
      localStorage.setItem("managerEmail", user.email);
      localStorage.setItem("role", "manager");

      // Redirect managers to their dashboard
      router.push("/managerMain");
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
          setError("No manager found with this email.");
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
    <div className={`flex flex-col items-center min-h-screen p-5 bg-gray-900 text-white ${poppins.className}`}>
      <h1 className="text-3xl font-bold mb-6">Manager Login</h1>

      {/* Email Input */}
      <input
        type="email"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-64 px-4 py-3 border border-gray-400 bg-white text-black rounded mb-4 focus:outline-none"
      />

      {/* Password Input */}
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-64 px-4 py-3 border border-gray-400 bg-white text-black rounded mb-4 focus:outline-none"
      />

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Login Button */}
      <button
        className="w-64 px-6 py-3 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-white text-xl font-bold rounded mb-4 
                   shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner"
        onClick={handleLogin}
      >
        LOGIN
      </button>

      {/* Forgot Password Link */}
      <p>
        Forgot your password?{" "}
        <span className="text-yellow-400 cursor-pointer" onClick={() => router.push("/auth/forgotPassword")}>
          Reset here
        </span>
      </p>

      {/* Sign Up Link */}
      <p>
        New manager?{" "}
        <span className="text-yellow-400 cursor-pointer" onClick={() => router.push("/auth/signup")}>
          Sign up here
        </span>
      </p>
    </div>
  );
}