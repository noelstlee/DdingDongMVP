"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase"; 
import { Rum_Raisin } from "next/font/google";

const rumRaisin = Rum_Raisin({ subsets: ["latin"], weight: "400" });

export default function PasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || window.localStorage.getItem("emailForSignIn") || "";

    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSignIn = async () => {
        if (!email || !password) return;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/home"); // Redirect after successful login
        } catch (error) {
            console.error("Error signing in:", error);
            setError("Invalid email or password");
        }
    };

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen p-5 bg-gray-900 ${rumRaisin.className}`}>
            {/* Back Button */}
            <button 
                className="absolute top-6 left-6 text-[#FFC700] font-bold transition-transform active:scale-95"
                onClick={() => router.back()}
            >
                ← Back
            </button>

            <h1 className="text-2xl font-bold mb-6 text-white">Enter Your Password</h1>

            {/* Email Display */}
            <p className="text-gray-400 mb-2">{email}</p>

            {/* Password Input Field */}
            <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-64 px-4 py-3 border border-[#FFC700] bg-gray-800 text-white rounded 
                           focus:outline-none focus:ring-2 focus:ring-[#FFD700] mb-4"
            />

            {/* Error Message */}
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            {/* Sign In Button */}
            <button 
                className="w-64 px-6 py-3 rounded-lg bg-gradient-to-b from-gray-400 to-gray-300 text-black 
                           shadow-[0_4px_0_#8c8c8c] transition-all transform active:bg-gradient-to-b 
                           active:from-[#FFD700] active:to-[#FFC700] active:text-white active:translate-y-1 
                           active:shadow-inner"
                onClick={handleSignIn}
            >
                Sign In
            </button>
        </div>
    );
}