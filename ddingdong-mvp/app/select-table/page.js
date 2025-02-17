"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Poppins } from "next/font/google";
import { db } from "@/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import Image from "next/image";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

function SelectTablePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("restaurantId");

  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!restaurantId) {
      setError("Error: No restaurant ID found. Please scan the QR code again.");
      router.push("/");
      return;
    }

    console.log("🔍 Fetching tables for restaurant:", restaurantId);

    const fetchTables = async () => {
      try {
        const tableCollectionRef = collection(db, `tables/${restaurantId}/table_items`);
        const querySnapshot = await getDocs(tableCollectionRef);

        let tableList = [];

        if (!querySnapshot.empty) {
          tableList = querySnapshot.docs.map((doc) => doc.id);
        } else {
          const restaurantDoc = await getDoc(doc(db, "tables", restaurantId));
          if (restaurantDoc.exists()) {
            const data = restaurantDoc.data();
            if (data.table_items && Array.isArray(data.table_items)) {
              tableList = data.table_items;
            }
          }
        }

        if (tableList.length > 0) {
          tableList.sort((a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, "")));
          console.log("✅ Sorted Tables:", tableList);
        } else {
          console.warn("❌ No tables found for restaurant:", restaurantId);
        }

        setTables(tableList);
      } catch (error) {
        console.error("🔥 Error fetching tables:", error);
        setError("Error fetching tables. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, [restaurantId, router]);

  const handleTableClick = (table) => {
    setSelectedTable(table);
  };

  const handleConfirm = () => {
    if (!selectedTable) {
      alert("Please select a table.");
      return;
    }

    router.push(`/bell?restaurantId=${restaurantId}&tableId=${selectedTable}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white text-black text-xl font-semibold">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white text-red-500 text-xl font-semibold">
        {error}
      </div>
    );
  }

  
  return (
    <div className={`flex flex-col justify-center items-center min-h-screen bg-white text-blue p-6 ${poppins.className}`}>

      {/* Animated Logo */}
      <div className="flex justify-center items-center mb-6">
        <Image 
          src="/assets/logo.png" 
          alt="DdingDong Logo" 
          width={120} 
          height={120} 
          className="animate-bounceSlow"
        />
      </div>

      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-gray-900 mb-6 text-center">Please select your table number!</h1>

      {/* Scrollable Table Selection */}
      <div 
        className="relative w-full max-w-sm h-60 overflow-y-scroll bg-gray-100 rounded-lg shadow-md flex flex-col items-center" 
        ref={scrollRef}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} // Hide scrollbar
      >
        {tables.map((table) => (
          <div
            key={table}
            className={`p-4 text-lg text-center cursor-pointer w-full flex items-center justify-center transition-all ${
              selectedTable === table ? "font-semibold bg-[#FFC700] text-navy  shadow-lg" : "font-medium bg-gray-200 text-gray-500 hover:bg-gray-300"
            }`}
            onClick={() => handleTableClick(table)}
          >
            {table}
          </div>
        ))}
      </div>

      {/* Confirm Button */}
      <button
        className={`mt-6 w-full max-w-sm px-6 py-3 text-xl rounded-lg shadow-md transition-all ${
          selectedTable
            ? "font-semibold bg-[#FFC700] text-navy hover:bg-[#FFC700] active:scale-95"
            : "font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        onClick={handleConfirm}
        disabled={!selectedTable}
      >
        Confirm
      </button>
    </div>
  );
}

export default function SelectTablePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen text-yellow-500 text-xl">Loading...</div>}>
      <SelectTablePageContent />
    </Suspense>
  );
}