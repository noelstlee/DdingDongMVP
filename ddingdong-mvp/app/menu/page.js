"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Image from "next/image";

function MenuContent() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("restaurantId");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // menuItems state maintains the restaurant's menu data from Firestore
  // This data is kept in sync for future features and debugging purposes,
  // even though we currently display static menu images
  const [error, setError] = useState(null);

  const menuImages = [
    '/assets/Fried_Chicken.jpg',
    '/assets/Soy_Garlic&Grilled.jpg',
    '/assets/Korean_Specials.jpg',
    '/assets/Salad&Fried_Appetizers.jpg',
    '/assets/Whatever_Combo.jpg',
    '/assets/Information.jpg'
  ];

  const menuCategories = [
    'Fried Chicken',
    'Soy Garlic & Grill',
    'Korean Specials',
    'Salad & Appetizers',
    'Combo Menu',
    'Information'
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

  return (
    <div className="p-5 bg-gray-900 text-white min-h-screen">
      {/* Category Navigation */}
      <div className="flex justify-center gap-2 mb-6 overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex flex-wrap justify-center gap-2">
          {menuCategories.map((category, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap text-sm sm:text-base ${
                currentImageIndex === index
                  ? 'bg-yellow-500 text-navy font-semibold'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Image */}
      <div className="relative w-full aspect-[3/4] max-w-3xl mx-auto bg-gray-800 rounded-lg overflow-hidden">
        <Image
          src={menuImages[currentImageIndex]}
          alt={`${menuCategories[currentImageIndex]} Menu`}
          fill
          style={{ objectFit: 'contain' }}
          quality={100}
          priority
        />
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