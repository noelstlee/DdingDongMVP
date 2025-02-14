"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase"; // Ensure Firebase is initialized
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Poppins } from "next/font/google";

// Import Poppins font
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

// Dynamic imports for React-Leaflet
const DynamicMapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const DynamicTileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const DynamicMarker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const DynamicPopup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

export default function MapPage() {
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Custom Leaflet Icon for User Location
  const userIcon = L.icon({
    iconUrl: "/assets/redMarker.jpg",
    iconSize: [25, 25], // Smaller and circular
    iconAnchor: [12.5, 12.5],
    popupAnchor: [0, -10],
    className: "rounded-full border border-white",
  });

  // Custom Leaflet Icons for Restaurants
  const createCustomIcon = (imageUrl) =>
    L.icon({
      iconUrl: imageUrl,
      iconSize: [40, 40], // Smaller and circular
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
      className: "rounded-full border border-yellow-500",
    });

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "restaurants"));
        const restaurantList = querySnapshot.docs.map((doc) => {
          const data = doc.data();

          if (!data.latitude || !data.longitude) {
            console.error(`❌ Missing latitude/longitude for ${data.name || "Unknown Restaurant"}`);
            return null; // Skip this entry
          }

          return {
            id: doc.id, // Firestore Document ID (e.g., "ABC123")
            name: data.name,
            latitude: data.latitude,
            longitude: data.longitude,
            image: data.image || "/assets/default.jpg",
          };
        }).filter(Boolean); // Remove null entries

        if (restaurantList.length === 0) {
          console.error("❌ No valid restaurant data found in Firestore.");
        } else {
          console.log("✅ Restaurants fetched:", restaurantList);
          setRestaurants(restaurantList);
          setSelectedRestaurant(restaurantList[0]); // Default to first restaurant
        }
      } catch (error) {
        console.error("🔥 Error fetching restaurants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
        },
        (error) => {
          console.error("⚠️ Error getting location:", error);
          setLoading(false);
        }
      );
    }
  }, []);

  const handleYesClick = () => {
    if (selectedRestaurant) {
      localStorage.setItem("selectedRestaurantId", selectedRestaurant.id); // Store restaurant ID
      router.push("/select-table");
    }
  };

  const handleNoClick = () => {
    setErrorMessage("Please select the icon in the map that corresponds to your current restaurant.");
  };

  const handleMarkerClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setErrorMessage(""); // Clear the error message when a restaurant is selected
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-yellow-400">Loading...</div>;
  }

  return (
    <div className={`flex flex-col items-center min-h-screen p-5 bg-gray-900 text-white ${poppins.className}`}>
      <h1 className="text-3xl font-bold my-4 text-yellow-500">Are you dining in this restaurant?</h1>

      {selectedRestaurant && (
        <div className="flex flex-col items-center mb-6">
          <Image
            src={selectedRestaurant.image}
            alt={selectedRestaurant.name}
            width={120}
            height={120}
            className="rounded-full border-4 border-yellow-500 shadow-lg"
          />
          <h2 className="text-xl font-semibold text-yellow-400 mt-2">{selectedRestaurant.name}</h2>
        </div>
      )}

      {/* Yes and No Buttons */}
      <div className="flex justify-center items-center gap-6 mb-6">
        <button
          className="w-32 px-6 py-3 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-lg font-bold rounded-full 
                     shadow-[0_4px_0_#b38600] hover:bg-yellow-600 transition active:translate-y-1 active:shadow-inner"
          onClick={handleYesClick}
        >
          Yes
        </button>
        <button
          className="w-32 px-6 py-3 bg-gray-500 text-white text-lg font-bold rounded-full hover:bg-gray-600 transition"
          onClick={handleNoClick}
        >
          No
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && <p className="text-red-500 font-semibold mb-4">{errorMessage}</p>}

      <DynamicMapContainer
        center={[location?.latitude || 33.7804, location?.longitude || -84.3892]}
        zoom={16}
        style={{ width: "90%", height: "450px", borderRadius: "20px", overflow: "hidden" }}
      >
        <DynamicTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <DynamicMarker position={[location?.latitude || 33.7804, location?.longitude || -84.3892]} icon={userIcon}>
          <DynamicPopup>You are here!</DynamicPopup>
        </DynamicMarker>
        {restaurants.map((restaurant) => (
          <DynamicMarker
            key={restaurant.id}
            position={[restaurant.latitude, restaurant.longitude]}
            icon={createCustomIcon(restaurant.image)}
            eventHandlers={{
              click: () => handleMarkerClick(restaurant),
            }}
          >
            <DynamicPopup>{restaurant.name}</DynamicPopup>
          </DynamicMarker>
        ))}
      </DynamicMapContainer>
    </div>
  );
}