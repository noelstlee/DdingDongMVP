"use client";

import { useRouter } from "next/navigation";
import { Rum_Raisin } from 'next/font/google';

// Import Rum Raisin font
const rumRaisin = Rum_Raisin({ subsets: ['latin'], weight: "400" });

export default function LoginPage() {
    const router = useRouter();

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen p-5 bg-gray-900 ${rumRaisin.className}`}>
            <h1 className="text-2xl font-bold mb-6 text-white">Who are you?</h1>
            
            {/* Customer Button */}
            <button 
                className="w-64 bg-[#FFC700] text-white px-6 py-3 rounded-lg shadow-lg transition-transform transform active:translate-y-1 active:shadow-md mb-4"
                onClick={() => router.push("/customer")}
            >
                Customer
            </button>
            
            {/* Restaurant Personnel Button */}
            <button 
                className="w-64 bg-gray-300 text-black px-6 py-3 rounded-lg shadow-lg transition-transform transform active:translate-y-1 active:shadow-md"
                onClick={() => router.push("/server")}
            >
                Restaurant Personnel
            </button>
        </div>
    );
}