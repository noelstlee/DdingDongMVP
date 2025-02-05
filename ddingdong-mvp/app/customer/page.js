"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function CustomerPage() {
    const [tableNumber, setTableNumber] = useState("");
    const router = useRouter();

    const handleSubmit = async () => {
        if (!tableNumber) return;

        await addDoc(collection(db, "tables"), {
            tableNumber: Number(tableNumber),
            status: "waiting",
            requestTime: serverTimestamp(),
            assignedServer: null,
        });

        router.push(`/customer/loading?table=${tableNumber}`);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-5">
            <h1 className="text-2xl font-bold mb-6 text-white">Enter Your Table Number</h1>
            
            <input 
                type="number" 
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Table Number"
                className="border p-2 rounded mb-4 text-black"
            />
            
            <button 
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={handleSubmit}
            >
                Confirm
            </button>
        </div>
    );
}