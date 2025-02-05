"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/firebase";

export default function PhoneLoginPage() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    const handlePhoneSubmit = async () => {
        setLoading(true);
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
            size: "invisible",
        });
        try {
            const confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
            window.confirmationResult = confirmationResult;
            router.push(`/auth/phone/verify?phone=${encodeURIComponent(phone)}`);
        } catch (error) {
            console.error("Error sending SMS:", error);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-5 bg-white">
            <button className="absolute top-6 left-6 text-[#FFC700] font-bold" onClick={() => router.back()}>
                ← Back
            </button>
            <h1 className="text-2xl font-bold mb-6 text-black">What is your phone number?</h1>
            <input 
                type="tel" 
                placeholder="Phone Number" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="w-64 px-4 py-2 border border-yellow-500 rounded mb-4"
            />
            <button 
                className="w-64 bg-yellow-500 text-white px-4 py-2 rounded"
                onClick={handlePhoneSubmit}
                disabled={loading}
            >
                Continue
            </button>
            <div id="recaptcha-container"></div>
        </div>
    );
}