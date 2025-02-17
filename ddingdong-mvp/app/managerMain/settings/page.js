"use client";

import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";

// Import Font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ManagerSettingsPage() {
  const router = useRouter();

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-6 bg-gray-900 text-white font-medium ${poppins.className}`}>
      
      {/* Back Button (Fixed at Top-Left, Medium Font) */}

      <button
        className="absolute left-4 top-4 text-yellow-400 text-lg hover:text-yellow-500 transition"
        onClick={() => router.push("/managerMain")}
      >
        ← Back
      </button>

      {/* Header (Centered, SemiBold) */}
      <h1 className="text-3xl font-semibold text-center mb-6">Manager Settings</h1>

      {/* Settings Container */}
      <div className="w-full max-w-lg space-y-6 text-center">
        
        {/* Request Menu Customization */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-medium mb-4">Customize Special Requests</h2>
          <button 
            className="w-full px-6 py-4 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-lg font-semibold rounded-lg 
                      shadow-[0_4px_0_#b38600] transition active:translate-y-1 active:shadow-inner"
            onClick={() => router.push("/managerMain/settings/requests")}
          >
            ☝️ Manage Request Options
          </button>
        </div>

        {/* Table Customization */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-medium mb-4">Customize Tables</h2>
          <button 
            className="w-full px-6 py-4 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-lg font-semibold rounded-lg 
                      shadow-[0_4px_0_#b38600] transition active:translate-y-1 active:shadow-inner"
            onClick={() => router.push("/managerMain/settings/tables")}
          >
            🪑 Manage Tables
          </button>
        </div>

        {/* Menu URL Customization */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-medium mb-4">Customize Menu URL</h2>
          <button
            className="w-full px-6 py-4 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-lg font-semibold rounded-lg 
                      shadow-[0_4px_0_#b38600] transition active:translate-y-1 active:shadow-inner"
            onClick={() => router.push("/managerMain/settings/menuURL")}
          >
            🌐 Input URL for Menu
          </button>
        </div>
      </div>
    </div>
  );
}
