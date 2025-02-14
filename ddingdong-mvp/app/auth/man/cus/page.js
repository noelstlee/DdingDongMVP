"use client";

import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";

// Import Poppins font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function SelectRolePage() {
  const router = useRouter();

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-5 bg-gray-900 ${poppins.className}`}>
      <h1 className="text-4xl font-bold mb-6 text-white">Who are you?</h1>

      {/* Customer Button */}
      <button
        className="w-64 px-6 py-3 rounded-lg bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-white 
                   text-xl shadow-[0_4px_0_#b38600] transition-all transform active:translate-y-1 
                   active:shadow-inner mb-4"
        onClick={() => router.push("/auth/login?role=customer")}
      >
        Customer
      </button>

      {/* Restaurant Personnel Button */}
      <button
        className="w-64 px-6 py-3 rounded-lg bg-gradient-to-b from-gray-400 to-gray-300 text-black 
                   text-xl shadow-[0_4px_0_#8c8c8c] transition-all transform active:translate-y-1 
                   active:shadow-inner"
        onClick={() => router.push("/auth/login?role=manager")}
      >
        Manager
      </button>
    </div>
  );
}