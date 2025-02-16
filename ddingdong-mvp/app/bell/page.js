"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Poppins } from "next/font/google";
import Image from "next/image";
import { db } from "@/firebase";
import { doc, getDoc, collection, addDoc, onSnapshot } from "firebase/firestore";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function BellPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("restaurantId"); // ✅ Get from URL
  const tableId = searchParams.get("tableId"); // ✅ Get from URL

  const [menuURL, setMenuURL] = useState(""); // ✅ Store restaurant menu URL
  const [requestOptions, setRequestOptions] = useState([]); // ✅ Dynamically loaded request buttons
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (!restaurantId || !tableId) {
      alert("Invalid QR Code. Please scan again.");
      router.push("/"); // Redirect back if data is missing
      return;
    }

    const fetchMenuURL = async () => {
      try {
        const restaurantDoc = await getDoc(doc(db, "restaurants", restaurantId));
        if (restaurantDoc.exists()) {
          setMenuURL(restaurantDoc.data().menuURL || "");
        } else {
          console.warn("No menu URL found for the restaurant.");
        }
      } catch (error) {
        console.error("Error fetching menu URL:", error);
      }
    };

    fetchMenuURL();

    // ✅ Listen for dynamic request menu updates
    const unsubscribe = onSnapshot(collection(db, "requestsMenu"), (snapshot) => {
      const requests = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((req) => req.restaurantId === restaurantId);
      setRequestOptions(requests);
    });

    setLoading(false);
    return () => unsubscribe(); // ✅ Cleanup on unmount
  }, [restaurantId, tableId, router]);

  const handleItemClick = (item, change) => {
    setSelectedItems((prev) => ({
      ...prev,
      [item]: Math.max(0, (prev[item] || 0) + change), // ✅ Ensure quantity is non-negative
    }));
  };

  const handleRequest = async (customRequest = null) => {
    if (!restaurantId || !tableId) {
      alert("Error: Missing restaurant or table information.");
      return;
    }

    const requestedItems = customRequest
      ? [{ item: customRequest, quantity: 1 }] // ✅ Special requests
      : Object.entries(selectedItems)
          .filter(([, quantity]) => quantity > 0)
          .map(([item, quantity]) => ({ item, quantity }));

    if (requestedItems.length === 0) {
      alert("Please select at least one item.");
      return;
    }

    try {
      await addDoc(collection(db, "requests"), {
        table: tableId,
        items: requestedItems,
        resolved: false,
        timestamp: new Date(),
        restaurantId,
        requestType: customRequest ? "special" : "regular",
      });

      setSelectedItems({});
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Failed to send request.");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-yellow-400 text-xl">Loading...</div>;
  }

  return (
    <div className={`flex flex-col items-center min-h-screen p-5 bg-gray-900 text-white ${poppins.className}`}>
      <h1 className="text-3xl font-bold my-6 text-yellow-500"> {tableId}</h1>

      {/* ✅ Menu Button */}
      <button
        className="w-72 px-6 py-4 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-xl font-bold rounded-lg 
                    shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner mb-8"
<<<<<<< Updated upstream
        onClick={() => restaurantId && router.push(`/menu/${restaurantId}`)} // ✅ Route dynamically
=======
        onClick={() => {
          if (menuURL) {
            window.open(menuURL, "_blank"); // ✅ Open in new tab
          } else {
            alert("Menu URL not available.");
          }
        }}
>>>>>>> Stashed changes
      >
        Menu
      </button>

      {/* ✅ Fixed Call Server & Request Bill Buttons */}
      <div className="grid grid-cols-2 gap-6">
        <button
          className="w-40 px-4 py-3 bg-red-500 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-red-600"
          onClick={() => handleRequest("Call Server")}
        >
          Call Server 🛎️
        </button>
        <button
          className="w-40 px-4 py-3 bg-blue-500 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-blue-600"
          onClick={() => handleRequest("Request Bill")}
        >
          Request Bill 💳
        </button>
      </div>

      {/* ✅ Dynamically Generated Request Buttons */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        {requestOptions.map((request) => (
          <div key={request.id} className="flex flex-col items-center">
            <p className="text-lg font-semibold mb-2">{request.item}</p>
            <div
              className={`flex items-center rounded-lg px-4 py-3 transition-all ${
                selectedItems[request.item] > 0
                  ? "bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black"
                  : "bg-gray-200 text-black"
              }`}
            >
              <button
                className="px-3 py-1 text-xl font-bold bg-gray-400 text-white rounded-l-lg hover:bg-gray-500"
                onClick={() => handleItemClick(request.item, -1)}
              >
                −
              </button>
              <span className="px-5 text-lg">{selectedItems[request.item] || 0}</span>
              <button
                className="px-3 py-1 text-xl font-bold bg-gray-400 text-white rounded-r-lg hover:bg-gray-500"
                onClick={() => handleItemClick(request.item, 1)}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Send Request Button */}
      <button
        className="w-72 px-6 py-4 bg-transparent flex items-center justify-center mt-10"
        onClick={() => handleRequest()}
      >
        <Image src="/assets/logo.png" alt="Dding Dong Logo" width={120} height={120} />
      </button>

      {/* ✅ Request Confirmation Popup */}
      {showConfirmation && (
        <div className="fixed bottom-10 bg-black text-white px-6 py-3 rounded-lg shadow-lg text-center">
          <p className="text-lg font-semibold">Request sent!</p>
        </div>
      )}
    </div>
  );
}