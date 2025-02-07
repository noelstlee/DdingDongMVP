"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // ✅ Fix for missing styles

const DynamicMap = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });

export default function HomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [nearestRestaurant, setNearestRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });

          const restaurants = [
            { name: "Momonoki", latitude: 33.777, longitude: -84.389, image: "/assets/momonoki.jpg" },
            { name: "Taco Bell", latitude: 33.7772, longitude: -84.3885, image: "/assets/tacobell.jpg" },
            { name: "Insomnia Cookies", latitude: 33.7768, longitude: -84.3892, image: "/assets/insomnia.jpg" },
          ];

          const closest = restaurants.reduce((prev, curr) => {
            const prevDistance = Math.hypot(prev.latitude - latitude, prev.longitude - longitude);
            const currDistance = Math.hypot(curr.latitude - latitude, curr.longitude - longitude);
            return currDistance < prevDistance ? curr : prev;
          });

          setNearestRestaurant(closest);
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoading(false);
        }
      );
    }
  }, []);

  if (loading || !location) {
    return <div className="flex justify-center items-center h-screen text-yellow-500 text-xl">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-white">
      <h1 className="text-2xl font-bold my-4 text-black">Are you dining in this restaurant?</h1>

      {nearestRestaurant && (
        <div className="flex flex-col items-center mb-4">
          <Image src={nearestRestaurant.image} alt={nearestRestaurant.name} width={100} height={100} className="rounded-full border-2 border-yellow-500" />
          <h2 className="text-xl font-bold text-yellow-500 mt-2">{nearestRestaurant.name}</h2>
        </div>
      )}

      {/* Leaflet Map */}
      <MapContainer center={[location.latitude, location.longitude]} zoom={16} style={{ width: "90%", height: "50%", borderRadius: 10 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[location.latitude, location.longitude]}>
          <Popup>You are here!</Popup>
        </Marker>
        {nearestRestaurant && (
          <Marker position={[nearestRestaurant.latitude, nearestRestaurant.longitude]}>
            <Popup>{nearestRestaurant.name}</Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="flex justify-around w-full py-4 bg-gray-100 border-t border-gray-300">
        <span>🏠 Home</span>
        <span>🔍 Search</span>
        <span>🔖 Saved</span>
        <span>👤 Profile</span>
      </div>
    </div>
  );
}