"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from "firebase/firestore";
import { Poppins } from "next/font/google";

// Import Font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ManagerMainPage() {
  const router = useRouter();
  const [managerData, setManagerData] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [tableRequests, setTableRequests] = useState({});
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const managerEmail = localStorage.getItem("managerEmail")?.trim().toLowerCase();

        if (!managerEmail) {
          console.error("❌ No manager email found in localStorage.");
          router.push("/login"); // Redirect to login if no email is found
          return;
        }

        console.log(`🔍 Searching for manager with email: "${managerEmail}"`);

        const managersRef = collection(db, "managers");
        const managerQuery = query(managersRef, where("email", "==", managerEmail));
        const managerSnapshot = await getDocs(managerQuery);

        if (managerSnapshot.empty) {
          console.error("❌ Manager email not found in Firestore.");
          router.push("/login");
          return;
        }

        const managerDoc = managerSnapshot.docs[0];
        const managerInfo = managerDoc.data();

        console.log("✅ Manager found:", managerInfo);

        setManagerData(managerInfo);
        setRestaurantId(managerInfo.restaurantId); // Extract restaurantId
        setLoading(false);
      } catch (err) {
        console.error("❌ Error fetching manager data:", err);
        setError("Failed to fetch manager data. Please try again.");
        setLoading(false);
      }
    };

    fetchManagerData();
  }, [router]);

  useEffect(() => {
    if (!restaurantId) return;

    console.log(`📡 Fetching tables for restaurant: ${restaurantId}`);

    const unsubscribeTables = onSnapshot(
      query(collection(db, "tables"), where("restaurantId", "==", restaurantId)),
      (snapshot) => {
        const tableList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log("✅ Tables fetched:", tableList);
        setTables(tableList);
      }
    );

    console.log(`📡 Listening for requests for restaurant: ${restaurantId}`);

    const unsubscribeRequests = onSnapshot(
      query(collection(db, "requests"), where("restaurantId", "==", restaurantId)),
      (snapshot) => {
        const updatedRequests = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          const tableNumber = String(data.table);
          if (!updatedRequests[tableNumber]) updatedRequests[tableNumber] = [];
          updatedRequests[tableNumber].push({ id: doc.id, ...data });
        });

        console.log("✅ Requests fetched:", updatedRequests);
        setTableRequests(updatedRequests);
      }
    );

    return () => {
      unsubscribeTables();
      unsubscribeRequests();
    };
  }, [restaurantId]);

  const handleMarkDone = async (tableNumber, requestId) => {
    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, { resolved: true });
      await updateDoc(requestRef, { customerNotification: "Your request is on its way!" });

      setTableRequests((prev) => {
        const updated = { ...prev };
        updated[tableNumber] = updated[tableNumber].filter((req) => req.id !== requestId);
        return updated;
      });
    } catch (err) {
      console.error("❌ Error marking request as done:", err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-yellow-400">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center h-screen justify-center bg-gray-900 text-white">
        <h1 className="text-3xl text-red-500 font-bold mb-4">Error</h1>
        <p className="text-lg">{error}</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-6 px-6 py-3 bg-yellow-500 text-black text-lg font-bold rounded-lg shadow-lg"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center min-h-screen p-5 bg-gray-900 text-white ${poppins.className}`}>
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Manager Dashboard</h1>
        <button
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
          onClick={() => router.push("/managerMain/settings")}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Manager Info */}
      {managerData && (
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome, {managerData.firstName} {managerData.lastName}!</h2>
          <p className="text-lg text-gray-400">Restaurant ID: {managerData.restaurantId}</p>
        </div>
      )}

      {/* Tables */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {tables.map((table) => {
          const tableNumber = String(table.id);
          const unresolvedRequests = tableRequests[tableNumber]?.filter((req) => !req.resolved) || [];

          return (
            <button
              key={tableNumber}
              className={`relative w-40 h-40 flex items-center justify-center text-xl font-bold rounded-lg 
                          transition-all ${unresolvedRequests.length > 0 ? "bg-yellow-500" : "bg-gray-700"} 
                          text-black shadow-lg`}
              onClick={() => router.push(`/manager/table/${tableNumber}`)}
            >
              {table.name}
              {unresolvedRequests.length > 0 && (
                <span className="absolute top-2 right-2 bg-red-600 text-white text-sm font-bold px-2 py-1 rounded-full">
                  {unresolvedRequests.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Requests */}
      <div className="w-full max-w-4xl bg-gray-800 p-5 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Active Requests</h2>

        {Object.keys(tableRequests).length === 0 ? (
          <p className="text-gray-400 text-center">No active requests.</p>
        ) : (
          Object.entries(tableRequests).map(([tableNumber, requests]) =>
            requests.map((req) =>
              !req.resolved && (
                <div key={req.id} className="flex justify-between items-center bg-gray-700 p-3 mb-3 rounded-lg">
                  <div>
                    <p className="text-lg font-semibold">Table {tableNumber}</p>
                    {req.items && req.items.map((item, index) => (
                      <p key={index} className="text-gray-300 text-sm">
                        {item.quantity} x {item.item}
                      </p>
                    ))}
                  </div>
                  <button
                    className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition"
                    onClick={() => handleMarkDone(tableNumber, req.id)}
                  >
                    Mark Done
                  </button>
                </div>
              )
            )
          )
        )}
      </div>
    </div>
  );
}
