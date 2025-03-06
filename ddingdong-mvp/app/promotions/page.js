"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/firebase";
import { collection, query, where, doc, getDoc, onSnapshot } from "firebase/firestore";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

function PromotionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("restaurantId");
  const tableId = searchParams.get("tableId");

  const [promotions, setPromotions] = useState([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!restaurantId) {
      setError("Restaurant ID is missing");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch restaurant name
        const restaurantDocRef = doc(db, "restaurants", restaurantId);
        const restaurantDocSnap = await getDoc(restaurantDocRef);
        
        if (restaurantDocSnap.exists()) {
          setRestaurantName(restaurantDocSnap.data().name || "");
        }

        // Set up real-time listener for promotions
        const today = new Date();
        const promotionsRef = collection(db, "promotions");
        const promotionsQuery = query(
          promotionsRef,
          where("restaurantId", "==", restaurantId)
        );

        const unsubscribe = onSnapshot(promotionsQuery, (snapshot) => {
          const activePromotions = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(promo => {
              const endDate = new Date(promo.endDate);
              return endDate >= today && promo.active === true;
            })
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

          setPromotions(activePromotions);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching promotions:", error);
          setError("Failed to load promotions");
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load promotions");
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-white text-black">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen bg-white text-red-500">{error}</div>;
  }

  return (
    <div className={`min-h-screen bg-white text-black p-6 ${poppins.className}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">{restaurantName} - Promotions</h1>
          <button
            onClick={() => router.push(`/bell?restaurantId=${restaurantId}&tableId=${tableId}`)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Back to Menu
          </button>
        </div>

        {promotions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">No active promotions at the moment</p>
          </div>
        ) : (
          <div className="space-y-6">
            {promotions.map((promotion) => (
              <div key={promotion.id} className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <h2 className="text-xl font-semibold text-yellow-800 mb-2">{promotion.title}</h2>
                <p className="text-gray-700 mb-4">{promotion.details}</p>
                <div className="text-sm text-gray-500">
                  <p>Valid from: {new Date(promotion.startDate).toLocaleDateString()}</p>
                  <p>Valid until: {new Date(promotion.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PromotionsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen bg-white text-black">Loading...</div>}>
      <PromotionsContent />
    </Suspense>
  );
} 