"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/firebase";
import { Rum_Raisin } from "next/font/google";

const rumRaisin = Rum_Raisin({ subsets: ["latin"], weight: "400" });

export default function VerifyPhonePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const phone = searchParams.get("phone");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleVerifyCode = async () => {
        if (!code) return;
        setLoading(true);
        
        try {
            await window.confirmationResult.confirm(code);
            router.push("/home"); // Redirect after successful verification
        } catch (error) {
            console.error("Error verifying code:", error);
        }

        setLoading(false);
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

            <h1 className="text-2xl font-bold mb-4 text-white">Enter Verification Code</h1>

            {/* Code Input Field */}
            <input 
                type="text" 
                placeholder="Enter Code" 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                className="w-64 px-4 py-3 border border-[#FFC700] bg-gray-800 text-white rounded 
                           focus:outline-none focus:ring-2 focus:ring-[#FFD700] text-center mb-4"
            />

            {/* Continue Button */}
            <button 
                className="w-64 px-6 py-3 rounded-lg bg-gradient-to-b from-gray-400 to-gray-300 text-black 
                           shadow-[0_4px_0_#8c8c8c] transition-all transform active:bg-gradient-to-b 
                           active:from-[#FFD700] active:to-[#FFC700] active:text-white active:translate-y-1 
                           active:shadow-inner"
                onClick={handleVerifyCode}
                disabled={loading}
            >
                {loading ? "Verifying..." : "Continue"}
            </button>
        </div>
    );
}