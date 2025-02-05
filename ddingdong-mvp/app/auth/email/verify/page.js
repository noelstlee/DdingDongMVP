"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/firebase";
import { Rum_Raisin } from "next/font/google";

const rumRaisin = Rum_Raisin({ subsets: ["latin"], weight: "400" });

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

    useEffect(() => {
        if (isSignInWithEmailLink(auth, window.location.href)) {
            const storedEmail = window.localStorage.getItem("emailForSignIn");
            if (storedEmail) {
                signInWithEmailLink(auth, storedEmail, window.location.href)
                    .then(() => {
                        window.localStorage.removeItem("emailForSignIn");
                        router.push("/home");
                    })
                    .catch((error) => console.error("Email verification error:", error));
            }
        }
    }, [router]);

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen p-5 bg-gray-900 ${rumRaisin.className}`}>
            {/* Back Button */}
            <button 
                className="absolute top-6 left-6 text-[#FFC700] font-bold transition-transform active:scale-95"
                onClick={() => router.back()}
            >
                ← Back
            </button>

            <h1 className="text-2xl font-bold mb-4 text-white">Confirm your email address</h1>
            <p className="text-gray-300 text-center mb-6">
                Check your inbox and tap the link in the email we just sent to <br />
                <span className="text-[#FFD700] font-bold">{email}</span>
            </p>

            {/* Open Email App Button */}
            <button 
                className="w-64 px-6 py-3 rounded-lg bg-gradient-to-b from-gray-400 to-gray-300 text-black 
                           shadow-[0_4px_0_#8c8c8c] transition-all transform active:bg-gradient-to-b 
                           active:from-[#FFD700] active:to-[#FFC700] active:text-white active:translate-y-1 
                           active:shadow-inner"
                onClick={() => window.location.href = "mailto:" + email}
            >
                Open email app
            </button>
        </div>
    );
}