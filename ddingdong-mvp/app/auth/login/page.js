"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/firebase"; // Ensure firebase.js is configured
import { Rum_Raisin } from "next/font/google";

const rumRaisin = Rum_Raisin({ subsets: ["latin"], weight: "400" });

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Google Login
    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            router.push("/home"); // Redirect after login
        } catch (error) {
            console.error("Google Login Error:", error);
        }
        setLoading(false);
    };

    // Placeholder for Email & Phone Login (Firebase authentication setup required)
    const handleEmailLogin = () => router.push("/auth/email");

    const handlePhoneLogin = () => router.push("/auth/phone");

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen p-5 bg-gray-900 ${rumRaisin.className}`}>
            {/* Back Button */}
            <button className="absolute top-6 left-6 text-[#FFC700] font-bold" onClick={() => router.back()}>
                ← Back
            </button>

            <h1 className="text-2xl font-bold mb-2 text-white">Login or sign up</h1>
            <p className="text-gray-300 text-sm mb-6 text-center">Please select your preferred method to continue setting up your account</p>

            {/* Email Login Button */}
            <button 
                className="w-64 px-6 py-3 rounded-lg bg-gradient-to-b from-gray-400 to-gray-300 text-black 
                           shadow-[0_4px_0_#8c8c8c] transition-all transform active:bg-gradient-to-b 
                           active:from-[#FFD700] active:to-[#FFC700] active:text-white active:translate-y-1 
                           active:shadow-inner mb-4"
                onClick={handleEmailLogin}
            >
                Continue with Email
            </button>

            {/* Phone Login Button */}
            <button 
                className="w-64 px-6 py-3 rounded-lg bg-gradient-to-b from-gray-400 to-gray-300 text-black 
                           shadow-[0_4px_0_#8c8c8c] transition-all transform active:bg-gradient-to-b 
                           active:from-[#FFD700] active:to-[#FFC700] active:text-white active:translate-y-1 
                           active:shadow-inner mb-4"
                onClick={handlePhoneLogin}
            >
                Continue with Phone
            </button>

            {/* Google Login */}
            <button 
                className="w-64 px-6 py-3 rounded-lg flex items-center justify-center bg-gradient-to-b from-gray-400 to-gray-300 text-black 
                           shadow-[0_4px_0_#8c8c8c] transition-all transform active:bg-gradient-to-b 
                           active:from-[#FFD700] active:to-[#FFC700] active:text-white active:translate-y-1 
                           active:shadow-inner mb-4"
                onClick={handleGoogleLogin}
                disabled={loading}
            >
                <img src="/google-icon.svg" alt="Google" className="w-5 h-5 mr-2" />
                
                Sign up with Google
            </button>

            {/* Apple Login (Placeholder for Apple OAuth) */}
            <button 
                className="w-64 px-6 py-3 rounded-lg flex items-center justify-center bg-gradient-to-b from-gray-400 to-gray-300 text-black 
                           shadow-[0_4px_0_#8c8c8c] transition-all transform active:bg-gradient-to-b 
                           active:from-[#FFD700] active:to-[#FFC700] active:text-white active:translate-y-1 
                           active:shadow-inner mb-4"
                onClick={() => console.log("Apple Login Clicked")} // Replace with Apple login function
            >
                <img src="/apple-icon.svg" alt="Apple" className="w-5 h-5 mr-2" />
                Sign up with Apple
            </button>

            <p className="text-xs text-gray-500 mt-6 text-center">
                If you are creating a new account, <br />
                <span className="underline">Terms & Conditions</span> and <span className="underline">Privacy Policy</span> will apply.
            </p>
        </div>
    );
}