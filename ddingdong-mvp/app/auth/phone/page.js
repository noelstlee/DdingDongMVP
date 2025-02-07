"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/firebase";
import { db } from "@/firebase"; // Import Firestore database
import { doc, getDoc } from "firebase/firestore";
import { Rum_Raisin } from "next/font/google";

const rumRaisin = Rum_Raisin({ subsets: ["latin"], weight: "400" });

export default function PhoneLoginPage() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    const checkUserExists = async (phoneNumber) => {
        const userDoc = await getDoc(doc(db, "users", phoneNumber)); // Check if phone exists in Firestore
        return userDoc.exists();
    };

    const handlePhoneSubmit = async () => {
        if (!phone) return;
        setLoading(true);

        try {
            const userExists = await checkUserExists(phone);
            if (userExists) {
                router.push("/home"); // Redirect to main page if user exists
                return;
            }

            window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
                size: "invisible",
            });

            const confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
            window.confirmationResult = confirmationResult;
            router.push(`/auth/phone/verify?phone=${encodeURIComponent(phone)}`);
        } catch (error) {
            console.error("Error sending SMS:", error);
        }

        setLoading(false);
    };

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen p-5 bg-gray-900 ${rumRaisin.className}`}>
            <button 
                className="absolute top-6 left-6 text-[#FFC700] font-bold transition-transform active:scale-95"
                onClick={() => router.back()}
            >
                ← Back
            </button>

            <h1 className="text-2xl font-bold mb-6 text-white">Get going with phone</h1>

            <input 
                type="tel" 
                placeholder="Phone Number" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="w-64 px-4 py-3 border border-[#FFC700] bg-gray-800 text-white rounded 
                           focus:outline-none focus:ring-2 focus:ring-[#FFD700] mb-4"
            />

            <button 
                className="w-64 px-6 py-3 rounded-lg bg-gradient-to-b from-gray-400 to-gray-300 text-black 
                           shadow-[0_4px_0_#8c8c8c] transition-all transform active:bg-gradient-to-b 
                           active:from-[#FFD700] active:to-[#FFC700] active:text-white active:translate-y-1 
                           active:shadow-inner"
                onClick={handlePhoneSubmit}
                disabled={loading}
            >
                {loading ? "Processing..." : "Continue"}
            </button>

            <div id="recaptcha-container"></div>
        </div>
    );
}