"use client";

import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ManagerAuthPage() {
  const router = useRouter();

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white ${poppins.className}`}>
      
      {/* Centered Header */}
      <h1 className="text-4xl font-bold mb-8">Manager Portal</h1>

      {/* Button Container */}
      <div className="flex flex-col space-y-4 w-72">
        {/* Manager Login Button */}
        <button
          className="w-full px-6 py-3 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-xl font-semibold rounded-lg 
                      shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner"
          onClick={() => router.push("/auth/login")}
        >
          Manager Login
        </button>

        {/* Manager Signup Button */}
        <button
          className="w-full px-6 py-3 bg-gray-600 text-white text-xl font-semibold rounded-lg shadow-lg 
                      hover:bg-gray-500 transition active:translate-y-1 active:shadow-inner"
          onClick={() => router.push("/auth/signup")}
        >
          Manager Signup
        </button>
      </div>
    </div>
  );
}