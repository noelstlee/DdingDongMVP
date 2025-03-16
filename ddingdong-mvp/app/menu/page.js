"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("restaurantId");
  const [selectedMenu, setSelectedMenu] = useState('main');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [error, setError] = useState(null);

  const mainMenuPages = [
    '/assets/Dine_Menu_1.pdf',
    '/assets/Dine_Menu_2.pdf',
    '/assets/Dine_Menu_3.pdf',
    '/assets/Dine_Menu_4.pdf',
    '/assets/Dine_Menu_5.pdf',
    '/assets/Dine_Menu_6.pdf',
  ];

  const drinkMenuPages = [
    '/assets/Drink_Menu_1.pdf',
    '/assets/Drink_Menu_2.pdf',
    '/assets/Drink_Menu_3.pdf',
    '/assets/Drink_Menu_4.pdf',
    '/assets/Drink_Menu_5.pdf',
  ];

  useEffect(() => {
    if (!restaurantId) {
      console.error("❌ restaurantId is missing");
      return;
    }

    console.log(`🔍 Fetching menu for restaurantId: ${restaurantId}`);

    const q = query(collection(db, "menu"), where("restaurantId", "==", restaurantId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log("📥 Menu items received:", items);
      },
      (error) => {
        console.error("❌ Error fetching menu items:", error);
        setError("Failed to fetch menu items. Please try again later.");
      }
    );

    return () => unsubscribe();
  }, [restaurantId]);

  useEffect(() => {
    // Reset page index when menu type changes
    setCurrentPageIndex(0);
  }, [selectedMenu]);

  const handleSwipe = (direction) => {
    const currentPages = selectedMenu === 'main' ? mainMenuPages : drinkMenuPages;
    if (direction === 'next' && currentPageIndex < currentPages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  if (!restaurantId) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-red-500 text-xl font-semibold">
        Error: No restaurant ID found. Please scan the QR code again.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-red-500 text-xl font-semibold">
        {error}
      </div>
    );
  }

  const currentPages = selectedMenu === 'main' ? mainMenuPages : drinkMenuPages;
  const currentPage = currentPages[currentPageIndex];

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute left-4 top-4 text-yellow-400 text-lg hover:text-yellow-500 transition font-medium"
      >
        ← Back
      </button>

      {/* Menu Type Selection */}
      <div className="flex justify-center gap-4 py-2 mt-12">
        <button
          onClick={() => setSelectedMenu('main')}
          className={`px-6 py-2 rounded-lg transition-all text-lg font-semibold ${
            selectedMenu === 'main'
              ? 'bg-yellow-500 text-navy'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          Main Menu
        </button>
        <button
          onClick={() => setSelectedMenu('drink')}
          className={`px-6 py-2 rounded-lg transition-all text-lg font-semibold ${
            selectedMenu === 'drink'
              ? 'bg-yellow-500 text-navy'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          Drink Menu
        </button>
      </div>

      {/* PDF Viewer Container */}
      <div className="relative flex-1 w-full h-[calc(100vh-120px)]">
        {/* Navigation Buttons */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          <button
            onClick={() => handleSwipe('prev')}
            className={`pointer-events-auto p-3 rounded-full bg-gray-800/80 text-white hover:bg-gray-700/80 transition-all ${
              currentPageIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
            }`}
            disabled={currentPageIndex === 0}
          >
            ←
          </button>
          <button
            onClick={() => handleSwipe('next')}
            className={`pointer-events-auto p-3 rounded-full bg-gray-800/80 text-white hover:bg-gray-700/80 transition-all ${
              currentPageIndex === currentPages.length - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
            }`}
            disabled={currentPageIndex === currentPages.length - 1}
          >
            →
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="absolute inset-0 mx-12 flex items-center justify-center">
          <iframe
            src={`${currentPage}#toolbar=0&view=FitH&scrollbar=0`}
            className="w-full h-full rounded-lg shadow-lg bg-white"
            style={{
              border: 'none',
              display: 'block'
            }}
          />
        </div>

        {/* Page Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/80 px-4 py-2 rounded-full text-lg z-10">
          {currentPageIndex + 1} / {currentPages.length}
        </div>
      </div>
    </div>
  );
}

export default function CustomerMenu() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gray-900 text-white text-xl">Loading...</div>}>
      <MenuContent />
    </Suspense>
  );
} 