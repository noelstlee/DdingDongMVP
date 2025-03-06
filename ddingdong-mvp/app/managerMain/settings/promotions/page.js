"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function PromotionsPage() {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [newPromotion, setNewPromotion] = useState({
    title: "",
    details: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const managerEmail = localStorage.getItem("managerEmail")?.trim().toLowerCase();
        if (!managerEmail) {
          router.push("/auth/manager");
          return;
        }

        const managersRef = collection(db, "managers");
        const managerQuery = query(managersRef, where("email", "==", managerEmail));
        const managerSnapshot = await getDocs(managerQuery);

        if (managerSnapshot.empty) {
          router.push("/auth/manager");
          return;
        }

        const managerInfo = managerSnapshot.docs[0].data();
        setRestaurantId(managerInfo.restaurantId);
        await fetchPromotions(managerInfo.restaurantId);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching manager data:", err);
        setError("Failed to fetch manager data");
        setLoading(false);
      }
    };

    fetchManagerData();
  }, [router]);

  const fetchPromotions = async (restId) => {
    try {
      const promotionsRef = collection(db, "promotions");
      const promotionsQuery = query(promotionsRef, where("restaurantId", "==", restId));
      const promotionsSnapshot = await getDocs(promotionsQuery);
      
      const promotionsList = promotionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPromotions(promotionsList);
    } catch (err) {
      console.error("Error fetching promotions:", err);
      setError("Failed to fetch promotions");
    }
  };

  const handleAddPromotion = async (e) => {
    e.preventDefault();
    
    if (!restaurantId) return;

    try {
      const promotionData = {
        ...newPromotion,
        restaurantId,
        createdAt: new Date(),
        active: true
      };

      await addDoc(collection(db, "promotions"), promotionData);
      await fetchPromotions(restaurantId);
      
      setNewPromotion({
        title: "",
        details: "",
        startDate: "",
        endDate: "",
      });
    } catch (err) {
      console.error("Error adding promotion:", err);
      alert("Failed to add promotion");
    }
  };

  const handleDeletePromotion = async (promotionId) => {
    try {
      await deleteDoc(doc(db, "promotions", promotionId));
      await fetchPromotions(restaurantId);
    } catch (err) {
      console.error("Error deleting promotion:", err);
      alert("Failed to delete promotion");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-yellow-400">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-red-500">{error}</div>;
  }

  return (
    <div className={`min-h-screen bg-gray-900 text-white p-6 ${poppins.className}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Promotions</h1>
          <button
            onClick={() => router.push("/managerMain/settings")}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            Back to Settings
          </button>
        </div>

        {/* Add New Promotion Form */}
        <form onSubmit={handleAddPromotion} className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Promotion</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={newPromotion.title}
                onChange={(e) => setNewPromotion({...newPromotion, title: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Details</label>
              <textarea
                value={newPromotion.details}
                onChange={(e) => setNewPromotion({...newPromotion, details: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white h-32"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={newPromotion.startDate}
                  onChange={(e) => setNewPromotion({...newPromotion, startDate: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={newPromotion.endDate}
                  onChange={(e) => setNewPromotion({...newPromotion, endDate: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition"
            >
              Add Promotion
            </button>
          </div>
        </form>

        {/* Existing Promotions List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Current Promotions</h2>
          {promotions.length === 0 ? (
            <p className="text-gray-400">No promotions yet</p>
          ) : (
            promotions.map((promotion) => (
              <div key={promotion.id} className="bg-gray-800 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{promotion.title}</h3>
                  <button
                    onClick={() => handleDeletePromotion(promotion.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-gray-300 mb-2">{promotion.details}</p>
                <div className="text-sm text-gray-400">
                  <p>Start: {new Date(promotion.startDate).toLocaleDateString()}</p>
                  <p>End: {new Date(promotion.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 