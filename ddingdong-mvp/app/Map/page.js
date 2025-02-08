"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

  // Custom Leaflet Icon for User Location (Red Marker)
  const userIcon = L.icon({
    iconUrl: "/assets/redMarker.jpg",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });

  // Custom Leaflet Icons for Restaurants
  const createCustomIcon = (imageUrl) =>
    L.icon({
      iconUrl: imageUrl,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -50],
    });

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });

          const restaurantData = [
            {
              name: "Momonoki",
              latitude: 33.779824859492,
              longitude: -84.39024104519874,
              image: "/assets/momonoki.jpg",
            },
            {
              name: "Taco Bell",
              latitude: 33.780403041168334,
              longitude: -84.38918372366363,
              image: "/assets/tacobell.jpg",
            },
            {
              name: "Insomnia Cookies",
              latitude: 33.780028010259194,
              longitude: -84.38905470522933,
              image: "/assets/insomnia.jpg",
            },
          ];

          setRestaurants(restaurantData);
          setSelectedRestaurant(restaurantData[0]); // Default to the first restaurant
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoading(false);
        }
      );
    }
  }, []);

  const handleYesClick = () => {
    router.push("/requests");
  };

  const handleNoClick = () => {
    setErrorMessage("Please select the icon in the map that corresponds to your current restaurant.");
  };

  const handleMarkerClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setErrorMessage(""); // Clear the error message when a restaurant is selected
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-yellow-500 text-xl">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-white">
      <h1 className="text-2xl font-bold my-4 text-black">Are you dining in this restaurant?</h1>

      {selectedRestaurant && (
        <div className="flex flex-col items-center mb-4">
          <Image
            src={selectedRestaurant.image}
            alt={selectedRestaurant.name}
            width={150}
            height={150}
            className="rounded-full border-4 border-yellow-500"
          />
          <h2 className="text-xl font-bold text-yellow-500 mt-2">{selectedRestaurant.name}</h2>
        </div>
      )}

      {/* Yes and No Buttons */}
      <div className="flex justify-center items-center gap-4 mb-6">
        <button
          className="bg-yellow-400 text-black font-bold px-6 py-3 rounded hover:bg-yellow-500 transition"
          onClick={handleYesClick}
        >
          Yes
        </button>
        <button
          className="bg-gray-400 text-black font-bold px-6 py-3 rounded hover:bg-gray-500 transition"
          onClick={handleNoClick}
        >
          No
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

      <DynamicMapContainer
        center={[location.latitude, location.longitude]}
        zoom={16}
        style={{ width: "90%", height: "400px" }}
      >
        <DynamicTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <DynamicMarker position={[location.latitude, location.longitude]} icon={userIcon}>
          <DynamicPopup>You are here!</DynamicPopup>
        </DynamicMarker>
        {restaurants.map((restaurant) => (
          <DynamicMarker
            key={restaurant.name}
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