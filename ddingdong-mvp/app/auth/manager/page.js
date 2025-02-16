"use client";

import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ManagerAuthPage() {
  const router = useRouter();

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-5 bg-gray-900 ${poppins.className}`}>
      <h1 className="text-4xl font-bold mb-6 text-white">Manager Portal</h1>

      {/* Manager Login Button */}
      <button
        className="w-64 px-6 py-3 rounded-lg bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-white 
                   text-xl shadow-[0_4px_0_#b38600] transition-all transform active:translate-y-1 
                   active:shadow-inner"
        onClick={() => router.push("/auth/login")}
      >
        Manager Login
      </button>

      {/* Manager Signup Button */}
      <button
        className="w-64 px-6 py-3 rounded-lg bg-gray-400 text-black text-xl shadow-md transition-all transform active:translate-y-1 
                   active:shadow-inner mt-4"
        onClick={() => router.push("/auth/signup")}
      >
        Manager Signup
      </button>
    </div>
  );
}