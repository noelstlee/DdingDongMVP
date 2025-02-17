"use client";

import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";

// Import Font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ManagerSettingsPage() {
  const router = useRouter();

  return (
    <div className={`p-5 bg-white text-black min-h-screen ${poppins.className}`}>
      {/* Back Button */}
      <button
        className="text-black bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-bold mb-4"
        onClick={() => router.push("/managerMain")}
      >
        ← Back to Main
      </button>

      <h1 className="text-4xl font-bold mb-6">Manager Settings</h1>


      {/* Request Menu Customization */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Customize Special Requests</h2>
        <button 
          className="w-full bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black font-bold py-3 rounded-lg"
          onClick={() => router.push("/managerMain/settings/requests")}
        >
          Manage Request Menu 📜
        </button>
      </div>

      {/* Table Customization */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Customize Tables</h2>
        <button 
          className="w-full bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black font-bold py-3 rounded-lg"
          onClick={() => router.push("/managerMain/settings/tables")}
        >
          Manage Tables 🪑
        </button>
      </div>

      {/* Menu URL Customization */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Customize Menu URL</h2>
        <button
          className="w-full bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black font-bold py-3 rounded-lg"
          onClick={() => router.push("/managerMain/settings/menuURL")}
        >
          Input URL for Menu 🌐
        </button>
      </div>
    </div>
  );
}