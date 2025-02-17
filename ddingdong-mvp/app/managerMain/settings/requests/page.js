"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { db, auth } from "@/firebase"; 
import { collection, addDoc, deleteDoc, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { Poppins } from "next/font/google";

// Import Font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ManageRequestsPage() {
  const router = useRouter(); 
  const [requests, setRequests] = useState([]);
  const [newRequest, setNewRequest] = useState("");
  const [restaurantId, setRestaurantId] = useState(null);

  // Fetch restaurant ID
  useEffect(() => {
    const fetchManagerData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const managerRef = doc(db, "managers", user.uid);
        const managerSnap = await getDoc(managerRef);

        if (managerSnap.exists()) {
          const managerData = managerSnap.data();
          setRestaurantId(managerData.restaurantId);
        } else {
          console.error("❌ Manager data not found!");
        }
      } catch (error) {
        console.error("❌ Error fetching manager data:", error);
      }
    };

    fetchManagerData();
  }, []);

  // Fetch & Sync Requests in Real Time
  useEffect(() => {
    if (!restaurantId) return;

    const q = query(collection(db, "requestsMenu"), where("restaurantId", "==", restaurantId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe(); // Clean up listener
  }, [restaurantId]);

  // Add a new request
  const handleAddRequest = async () => {
    if (!newRequest.trim()) {
      alert("Please enter a request item.");
      return;
    }
    if (!restaurantId) {
      alert("Error: Restaurant ID not found. Please try again.");
      return;
    }

    try {
      await addDoc(collection(db, "requestsMenu"), { item: newRequest, restaurantId });
      setNewRequest(""); // Clear input after adding
    } catch (error) {
      console.error("❌ Error adding request:", error);
    }
  };

  // Delete a request
  const handleDeleteRequest = async (id) => {
    try {
      await deleteDoc(doc(db, "requestsMenu", id));
    } catch (error) {
      console.error("❌ Error deleting request:", error);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-6 bg-gray-900 text-white font-semibold ${poppins.className}`}>
      
      {/* Back Button (Fixed at Top-Left) */}
      <button
        className="absolute left-4 top-4 text-yellow-400 text-lg hover:text-yellow-500 transition font-medium"
        onClick={() => router.push("/managerMain/settings")}
      >
        ← Back
      </button>

      {/* Header (Centered) */}
      <h1 className="text-2xl font-semibold text-center mb-6">Add a New Request Option</h1>

      {/* Settings Container */}
      <div className="w-full max-w-lg space-y-6 text-center">
        
        {/* Add New Request */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <input 
            type="text" placeholder="Enter request item..." 
            className="w-full p-3 mb-4 bg-gray-700 text-white rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            value={newRequest} 
            onChange={(e) => setNewRequest(e.target.value)} 
          />
          <button 
            className="w-full px-6 py-4 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-lg font-semibold rounded-lg 
                      shadow-[0_4px_0_#b38600] transition active:translate-y-1 active:shadow-inner"
            onClick={handleAddRequest}
          >
            ➕ Add Request
          </button>
        </div>

        {/* Existing Requests List */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Current Requests</h2>
          {requests.length === 0 ? (
            <p className="text-gray-400">No special requests added yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="flex justify-between items-center bg-gray-700 p-4 rounded-lg">
                  <p className="text-lg">{req.item}</p>
                  <button 
                    className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-[0_4px_0_#b30000] 
                              transition active:translate-y-1 active:shadow-inner"
                    onClick={() => handleDeleteRequest(req.id)}
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}