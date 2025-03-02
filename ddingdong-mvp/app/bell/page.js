"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Poppins } from "next/font/google";
import Image from "next/image";
import { db } from "@/firebase";
import { doc, getDoc, collection, addDoc, onSnapshot, query, where, getDocs } from "firebase/firestore";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

function BellPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("restaurantId");
  const tableId = searchParams.get("tableId");

  const [restaurantName, setRestaurantName] = useState("");
  const [requestOptions, setRequestOptions] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("Request sent!");
  const [showBillConfirmation, setShowBillConfirmation] = useState(false); // New state for bill confirmation popup

  useEffect(() => {
    if (!restaurantId || !tableId) {
      setError("Invalid QR Code. Please scan again.");
      router.push("/");
      return;
    };

    const fetchRestaurantName = async () => {
      try {
        const restaurantDoc = await getDoc(doc(db, "restaurants", restaurantId));
        if (restaurantDoc.exists()) {
          setRestaurantName(restaurantDoc.data().name || "");
        }
      } catch (err) {
        console.error("Error fetching restaurant name:", err);
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

    fetchRestaurantName();
    setLoading(false);

    return () => unsubscribe();
  }, [restaurantId, tableId, router]);

  const handleItemClick = (item, change) => {
    setSelectedItems((prev) => ({
      ...prev,
      [item]: Math.max(0, (prev[item] || 0) + change),
    }));
  };

  const handleRequest = async (customRequest = null, collectionName = "requests", message = "Request sent!") => {
    if (!restaurantId || !tableId) {
      alert("Error: Missing restaurant or table information.");
      return;
    }

    const formattedTableId = tableId.replace("Table ", "").trim();

      // Fetch unresolved "Call Server" requests
    if (customRequest === "Call Server") {
      const q = query(
        collection(db, "serverCallRequest"),
        where("restaurantId", "==", restaurantId),
        where("table", "==", formattedTableId),
        where("resolved", "==", false)
      );
      const querySnapshot = await getDocs(q);
      
      // Prevent third unresolved request
      if (querySnapshot.size >= 2) {
        alert("You already have two unresolved 'Call Server' requests. Please wait.");
        return;
      }
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
      await addDoc(collection(db, collectionName), {
        table: formattedTableId,
        items: requestedItems,
        resolved: false,
        timestamp: new Date(),
        restaurantId,
        requestType: customRequest ? "special" : "regular",
      });

      setSelectedItems({});
      setConfirmationMessage(message);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    } catch (err) {
      console.error("Error sending request:", err);
      alert("Failed to send request.");
    }
  };

  const handleBillRequest = () => {
    setShowBillConfirmation(true); // ✅ Fix: Open popup
  };

  const confirmBillRequest = async () => {
    setShowBillConfirmation(false);

    if (!restaurantId || !tableId) {
      alert("Error: Missing restaurant or table information.");
      return;
    }

    const formattedTableId = tableId.replace("Table ", "").trim();

    try {
      // Add bill request to Firestore
      await addDoc(collection(db, "billRequest"), {
        table: formattedTableId,
        items: [{ item: "Bill Request", quantity: 1 }],
        resolved: false,
        timestamp: new Date(),
        restaurantId,
        requestType: "bill",
      });


      // Redirect to survey page
      router.push("/survey");

    } catch (err) {
      console.error("Error handling bill request:", err);
      alert("Failed to process bill request.");
    }
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-white text-black text-xl font-semibold">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-white text-red-500 text-xl font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center min-h-screen bg-white text-black p-6 relative ${poppins.className}`}>
      {/* Restaurant Name */}
      <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 text-center">{restaurantName}</h1>

      {/* Table Header */}
      <h1 className="text-md md:text-2xl font-semi-bold text-gray-900 mb-6 text-center">{tableId}</h1>

      {/* Menu Button */}
      <button
        className="w-full max-w-xs px-6 py-4 bg-[#FFC700] text-black text-lg md:text-xl font-bold rounded-lg shadow-lg hover:bg-yellow-600 transition active:scale-95 mb-6"
        onClick={() => router.push(`/menu?restaurantId=${restaurantId}`)}
      >
        🍽️ View Menu
      </button>

      {/* Request Buttons */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-10">
        <button
          className="w-full px-3 py-3 bg-[#FFD700] text-white text-md font-semibold rounded-lg shadow-md hover:bg-[#E6C200] transition"
          onClick={() => handleRequest("Call Server", "serverCallRequest", "Your server is on its way!")}
        >
          🛎️ Call Server
        </button>
        <button
          className="w-full px-3 py-3 bg-[#F4A261] text-white text-md font-semibold rounded-lg shadow-md hover:bg-[#DC8A50] transition"
          onClick={handleBillRequest} // ✅ Correctly use handleBillRequest
        >
          💳 Request Bill
        </button>
      </div>

      {/* Bill Request Confirmation Popup */}
        {showBillConfirmation && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg w-96 text-center">
            <h2 className="text-2xl font-medium mb-4">Are you sure you want to request the bill?</h2>
            <button className="px-6 py-3 bg-red-500 text-white text-md font-semibold rounded-lg shadow-md transition" onClick={confirmBillRequest}>
              Yes
            </button>
            <button className="px-6 py-3 bg-gray-500 text-white text-md font-semibold rounded-lg shadow-md transition ml-4" onClick={() => setShowBillConfirmation(false)}>
              No
            </button>
          </div>
        </div>
      )}

      {/* Dynamically Generated Requests (2 per row) */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        {requestOptions.map((request) => (
          <div key={request.id} className="flex flex-col items-center w-full">
            <p className="text-lg font-semibold mb-1">{request.item}</p>
            <div
              className={`flex items-center justify-center w-full rounded-lg px-4 py-3 transition-all ${
                selectedItems[request.item] > 0 ? "bg-[#FFC700] text-black" : "bg-gray-200 text-gray-700"
              }`}
            >
              <button
                className="px-3 py-1 text-xl font-semibold bg-gray-400 text-white rounded-l-lg hover:bg-gray-500"
                onClick={() => handleItemClick(request.item, -1)}
              >
                −
              </button>
              <span className="px-5 text-lg font-medium">{selectedItems[request.item] || 0}</span>
              <button
                className="px-3 py-1 text-xl font-semibold bg-gray-400 text-white rounded-r-lg hover:bg-gray-500"
                onClick={() => handleItemClick(request.item, 1)}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bell Button - Fixed at Bottom Center */}
      <button
        className="w-30 h-30 md:w-28 md:h-28 fixed bottom-8 bg-white text-black flex items-center justify-center rounded-full shadow-lg border-2 border-gray-300 active:scale-90"
        onClick={() => handleRequest()}
        style={{ boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.1)" }}
      >
        <Image src="/assets/logo.png" alt="Bell" width={90} height={90} />
      </button>
      
      {showConfirmation && (
        <div
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-black bg-opacity-80 text-white px-12 py-6 rounded-lg shadow-lg 
                    text-center text-xl backdrop-blur-md animate-fadeIn opacity-100 
                    transition-opacity duration-1000 ease-in-out"
          style={{ animation: "fadeOut 3s ease-in-out forwards" }}
        >
          <p className="font-semibold">{confirmationMessage}</p>
        </div>
      )}
    </div>
  );
}

export default function BellPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BellPageContent />
    </Suspense>
  );
}