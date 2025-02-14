"use client";

import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";

// Import Font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ManagerSettingsPage() {
  const router = useRouter();

  return (
    <div className={`p-5 bg-gray-900 text-white ${poppins.className}`}>
      <h1 className="text-4xl font-bold mb-6">Manager Settings</h1>

      {/* Menu Customization */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Customize Your Menu</h2>
        <button 
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg mb-4"
          onClick={() => router.push("/managerMain/settings/menu")}
        >
          Manage Menu Items 🍽️
        </button>
      </div>

      {/* Request Menu Customization */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Customize Special Requests</h2>
        <button 
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg"
          onClick={() => router.push("/managerMain/settings/requests")}
        >
          Manage Request Menu 📜
        </button>
      </div>
    </div>
  );
}