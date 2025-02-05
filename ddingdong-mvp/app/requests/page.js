"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, updateDoc, doc, serverTimestamp, getDocs, addDoc, deleteDoc } from "firebase/firestore";

export default function RequestsPage() {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        // Real-time listener for Firestore updates
        const unsubscribe = onSnapshot(collection(db, "requests"), (snapshot) => {
            const requestData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(requestData);
        });

        return () => unsubscribe();
    }, []);

    // 🔹 Create a new request with start time recorded
    const sendRequest = async (requestType) => {
        await addDoc(collection(db, "requests"), {
            tableNumber: 1, // Later, dynamically assign table number
            requestType,
            status: "pending",
            startTime: serverTimestamp(), // Records request creation time
        });
    };

    // 🔹 Mark request as "Completed" & Calculate Response Time
    const markCompleted = async (id, startTime) => {
        const currentTime = new Date();
        const requestStartTime = startTime?.toDate ? startTime.toDate() : new Date(); // Convert Firestore timestamp to JS date
        const responseTime = Math.round((currentTime - requestStartTime) / 1000); // Calculate time difference in seconds

        const requestRef = doc(db, "requests", id);
        await updateDoc(requestRef, {
            status: "completed",
            responseTime, // Store response time in Firestore
            completedAt: serverTimestamp(),
        });
    };

    // 🔹 Reset all requests back to "pending"
    const resetRequests = async () => {
        const querySnapshot = await getDocs(collection(db, "requests"));
        querySnapshot.forEach(async (requestDoc) => {
            const requestRef = doc(db, "requests", requestDoc.id);
            await updateDoc(requestRef, { status: "pending", startTime: serverTimestamp() });
        });
    };

    // 🔹 Delete all requests permanently
    const deleteAllRequests = async () => {
        const querySnapshot = await getDocs(collection(db, "requests"));
        querySnapshot.forEach(async (requestDoc) => {
            await deleteDoc(doc(db, "requests", requestDoc.id));
        });
    };

    return (
        <div className="p-5">
            <h1 className="text-2xl font-bold mb-4">Service Requests</h1>

            {/* 🔹 Buttons for Users to Request Service */}
            <div className="mb-4">
                <button 
                    className="bg-blue-500 text-white px-3 py-1 rounded m-1"
                    onClick={() => sendRequest("More Water")}
                >
                    Request More Water
                </button>
                <button 
                    className="bg-green-500 text-white px-3 py-1 rounded m-1"
                    onClick={() => sendRequest("Bring the Bill")}
                >
                    Request Bill
                </button>
            </div>

            {/* 🔹 Reset and Delete Buttons */}
            <div className="mb-4">
                <button 
                    className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                    onClick={resetRequests}
                >
                    Reset All Requests
                </button>

                <button 
                    className="bg-black text-white px-4 py-2 rounded"
                    onClick={deleteAllRequests}
                >
                    Delete All Requests
                </button>
            </div>

            <ul>
                {requests.map(request => (
                    <li key={request.id} className="border p-3 my-2 rounded">
                        <strong>Table {request.tableNumber}</strong>: {request.requestType} 
                        <span className={`ml-2 px-2 py-1 rounded text-white ${
                            request.status === "pending" ? "bg-red-500" :
                            request.status === "accepted" ? "bg-yellow-500" :
                            request.status === "completed" ? "bg-green-500" : ""
                        }`}>
                            {request.status === "pending" && "Waiting for Server"}
                            {request.status === "accepted" && "Server is on the Way"}
                            {request.status === "completed" && "Completed"}
                        </span>
                        {request.status === "completed" && (
                            <span className="ml-2 text-sm text-gray-500">
                                Response Time: {request.responseTime} seconds
                            </span>
                        )}
                        {request.status === "accepted" && (
                            <button 
                                className="ml-4 bg-green-500 text-white px-3 py-1 rounded"
                                onClick={() => markCompleted(request.id, request.startTime)}
                            >
                                Mark as Completed
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}