"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/firebase";


export default function VerifyPhonePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const phone = searchParams.get("phone");
    const [code, setCode] = useState("");

    const handleVerifyCode = async () => {
        try {
            await window.confirmationResult.confirm(code);
            router.push("/home");
        } catch (error) {
            console.error("Error verifying code:", error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-5 bg-white">
            <button className="absolute top-6 left-6 text-[#FFC700] font-bold" onClick={() => router.back()}>
                ← Back
            </button>
            <h1 className="text-2xl font-bold mb-4 text-black">Enter Code</h1>
            <input 
                type="text" 
                placeholder="Code" 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                className="w-64 px-4 py-2 border border-yellow-500 rounded mb-4 text-center"
            />
            <button 
                className="w-64 bg-yellow-500 text-white px-4 py-2 rounded"
                onClick={handleVerifyCode}
            >
                Continue
            </button>
        </div>
    );
}