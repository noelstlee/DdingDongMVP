"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { auth } from "@/firebase"; 
import { Rum_Raisin } from "next/font/google";

const rumRaisin = Rum_Raisin({ subsets: ["latin"], weight: "400" });

export default function EmailLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");

    const handleEmailSubmit = async () => {
        if (!email) return;

        try {
            window.localStorage.setItem("emailForSignIn", email);
            router.push(`/auth/email/password?email=${encodeURIComponent(email)}`); // Redirect to password page
        } catch (error) {
            console.error("Error proceeding to password page:", error);
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

            <h1 className="text-2xl font-bold mb-6 text-white">Get going with email</h1>

            {/* Email Input Field */}
            <input 
                type="email" 
                placeholder="Email Address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-64 px-4 py-3 border border-[#FFC700] bg-gray-800 text-white rounded 
                           focus:outline-none focus:ring-2 focus:ring-[#FFD700] mb-4"
            />

            {/* Continue Button */}
            <button 
                className="w-64 px-6 py-3 rounded-lg bg-gradient-to-b from-gray-400 to-gray-300 text-black 
                           shadow-[0_4px_0_#8c8c8c] transition-all transform active:bg-gradient-to-b 
                           active:from-[#FFD700] active:to-[#FFC700] active:text-white active:translate-y-1 
                           active:shadow-inner"
                onClick={handleEmailSubmit}
            >
                Continue
            </button>
        </div>
    );
}