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
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white relative ${poppins.className}`}>
      
      {/* Back Button */}
      <button
        className="absolute left-4 top-4 text-yellow-400 text-lg hover:text-yellow-500 transition"
        onClick={() => router.push("/auth/manager")}
      >
        ← Back
      </button>

      {/* Header */}
      <h1 className="text-4xl font-bold mb-8">Manager Login</h1>

      {/* Input Fields Container */}
      <div className="w-80 flex flex-col space-y-6">
        
        {/* Email Input with Floating Label */}
        <div className="relative">
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 pt-6 pb-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 peer"
            required
          />
          <label
            htmlFor="email"
            className={`absolute left-4 top-3 text-gray-400 text-sm transition-all 
                       ${email ? "top-1 text-xs text-yellow-400" : "top-4 text-base"}`}
          >
            Email Address
          </label>
        </div>

        {/* Password Input with Floating Label */}
        <div className="relative">
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 pt-6 pb-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 peer"
            required
          />
          <label
            htmlFor="password"
            className={`absolute left-4 top-3 text-gray-400 text-sm transition-all 
                       ${password ? "top-1 text-xs text-yellow-400" : "top-4 text-base"}`}
          >
            Password
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 mt-3">{error}</p>}

      {/* Login Button */}
      <button
        className="w-80 px-6 py-3 mt-6 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-xl font-bold rounded-lg 
                   shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner"
        onClick={handleLogin}
      >
        LOGIN
      </button>

      {/* Links Section */}
      <div className="mt-4 text-lg">
        <p className="text-gray-300">
          Forgot your password?{" "}
          <span className="text-yellow-400 cursor-pointer hover:underline" onClick={() => router.push("/auth/forgotPassword")}>
            Reset here
          </span>
        </p>
        <p className="text-gray-300">
          New manager?{" "}
          <span className="text-yellow-400 cursor-pointer hover:underline" onClick={() => router.push("/auth/signup")}>
            Sign up here
          </span>
        </p>
      </div>
    </div>
  );
}