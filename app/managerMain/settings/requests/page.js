"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/firebase"; // Ensure auth is imported
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { Poppins } from "next/font/google";

// Import Font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ManageRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [newRequest, setNewRequest] = useState("");
  const [restaurantId, setRestaurantId] = useState(null);

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

  useEffect(() => {
    if (!restaurantId) return;

    const fetchRequests = async () => {
      const snapshot = await getDocs(collection(db, "requestsMenu"));
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(req => req.restaurantId === restaurantId));
    };

    fetchRequests();
  }, [restaurantId]);

  const handleAddRequest = async () => {
    if (!newRequest) return alert("Please enter a request item.");
    if (!restaurantId) return alert("Error: Restaurant ID not found. Please try again.");

    try {
      await addDoc(collection(db, "requestsMenu"), { item: newRequest, restaurantId });
      setNewRequest("");
      alert("✅ Request added successfully!");
    } catch (error) {
      console.error("❌ Error adding request:", error);
    }
  };

  const handleDeleteRequest = async (id) => {
    await deleteDoc(doc(db, "requestsMenu", id));
    setRequests(requests.filter(req => req.id !== id));
  };

  return (
    <div className={`p-5 bg-gray-900 text-white ${poppins.className}`}>
      <h1 className="text-4xl font-bold mb-6">Manage Request Menu</h1>

      {/* Add New Request */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <input 
          type="text" placeholder="New Request" 
          className="w-full p-2 mb-2 bg-gray-700 text-white" 
          value={newRequest} 
          onChange={(e) => setNewRequest(e.target.value)} 
        />
        <button 
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg"
          onClick={handleAddRequest}
        >
          Add Request ➕
        </button>
      </div>

      {/* Request List */}
      {requests.map(req => (
        <div key={req.id} className="flex justify-between items-center bg-gray-800 p-4 mb-2 rounded-lg">
          <p>{req.item}</p>
          <button className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg" onClick={() => handleDeleteRequest(req.id)}>❌</button>
        </div>
      ))}
    </div>
  );
}