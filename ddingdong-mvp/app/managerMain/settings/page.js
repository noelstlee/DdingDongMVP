"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { Poppins } from "next/font/google";

// Import Font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ManagerSettingsPage() {
  const router = useRouter();
  const [showSignOutPopup, setShowSignOutPopup] = useState(false); // ✅ Sign Out Popup State

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("managerEmail"); // ✅ Clear manager email from localStorage
      router.push("/auth/manager"); // ✅ Redirect to login page
    } catch (err) {
      console.error("❌ Error signing out:", err);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-6 bg-gray-900 text-white font-medium ${poppins.className}`}>
      
      {/* Back Button (Fixed at Top-Left) */}
      <button
        className="absolute left-4 top-4 text-yellow-400 text-lg hover:text-yellow-500 transition"
        onClick={() => router.push("/managerMain")}
      >
        ← Back
      </button>

      {/* Sign Out Button (Fixed at Top-Right) */}
      <button
        className="absolute right-4 top-4 px-4 py-2 text-md sm:text-lg bg-red-500 text-white rounded-lg 
                   hover:bg-red-600 transition"
        onClick={() => setShowSignOutPopup(true)} // ✅ Open confirmation popup
      >
        Sign Out
      </button>

      {/* Header (Centered) */}
      <h1 className="text-3xl font-semibold text-center mb-6">Manager Settings</h1>

      {/* Settings Container */}
      <div className="w-full max-w-lg space-y-6 text-center">
        
        {/* Promotions Management */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-medium mb-4">Manage Promotions</h2>
          <button 
            className="w-full px-6 py-4 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-lg font-semibold rounded-lg 
                      shadow-[0_4px_0_#b38600] transition active:translate-y-1 active:shadow-inner"
            onClick={() => router.push("/managerMain/promotions")}
          >
            🎉 Update Promotions
          </button>
        </div>

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

      {/* Sign Out Confirmation Popup */}
      {showSignOutPopup && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg w-96 text-center">
            <h2 className="text-lg font-medium mb-4">Are you sure you want to sign out?</h2>
            <div className="flex justify-center space-x-4">
              <button
                className="px-6 py-3 bg-red-500 text-white text-lg font-medium rounded-lg shadow-[0_4px_0_#b30000] 
                          transition active:translate-y-1 active:shadow-inner"
                onClick={handleSignOut}
              >
                Yes, Sign Out
              </button>
              <button
                className="px-6 py-3 bg-gray-500 text-white text-lg font-medium rounded-lg shadow-md transition 
                          active:translate-y-1 active:shadow-inner"
                onClick={() => setShowSignOutPopup(false)} // Close popup
              >
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}