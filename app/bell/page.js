"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Poppins } from "next/font/google";
import Image from "next/image";
import { db } from "@/firebase";
import { doc, getDoc, collection, addDoc, onSnapshot } from "firebase/firestore";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

function BellPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("restaurantId");
  const tableId = searchParams.get("tableId");

  const [menuURL, setMenuURL] = useState("");
  const [requestOptions, setRequestOptions] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (!restaurantId || !tableId) {
      setError("Invalid QR Code. Please scan again.");
      router.push("/");
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
      } catch (err) {
        console.error("Error fetching menu URL:", err);
        setError("Failed to load menu URL. Please try again later.");
      }
    };

    const unsubscribe = onSnapshot(
      collection(db, "requestsMenu"),
      (snapshot) => {
        const requests = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((req) => req.restaurantId === restaurantId);
        setRequestOptions(requests);
      },
      (err) => {
        console.error("Error listening for request options:", err);
        setError("Failed to load request options.");
      }
    );

    fetchMenuURL();
    setLoading(false);

    return () => unsubscribe();
  }, [restaurantId, tableId, router]);

  const handleItemClick = (item, change) => {
    setSelectedItems((prev) => ({
      ...prev,
      [item]: Math.max(0, (prev[item] || 0) + change),
    }));
  };

  const handleRequest = async (customRequest = null) => {
    if (!restaurantId || !tableId) {
      alert("Error: Missing restaurant or table information.");
      return;
    }

    const requestedItems = customRequest
      ? [{ item: customRequest, quantity: 1 }]
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
    } catch (err) {
      console.error("Error sending request:", err);
      alert("Failed to send request.");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-yellow-400 text-xl">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500 text-xl">
        {error}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center min-h-screen p-5 bg-gray-900 text-white ${poppins.className}`}>
      <h1 className="text-3xl font-bold my-6 text-yellow-500">{tableId}</h1>

      <button
        className="w-72 px-6 py-4 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-xl font-bold rounded-lg shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner mb-8"
        onClick={() => {
          if (menuURL) {
            window.open(menuURL, "_blank");
          } else {
            alert("Menu URL not available.");
          }
        }}
      >
        Menu
      </button>

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

      <button
        className="w-72 px-6 py-4 bg-transparent flex items-center justify-center mt-10"
        onClick={() => handleRequest()}
      >
        <Image src="/assets/logo.png" alt="Dding Dong Logo" width={120} height={120} />
      </button>

      {showConfirmation && (
        <div className="fixed bottom-10 bg-black text-white px-6 py-3 rounded-lg shadow-lg text-center">
          <p className="text-lg font-semibold">Request sent!</p>
        </div>
      )}
    </div>
  );
}

export default function BellPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen text-yellow-400 text-xl">Loading...</div>}>
      <BellPageContent />
    </Suspense>
  );
}