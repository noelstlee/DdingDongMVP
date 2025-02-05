"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function LoadingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tableNumber = searchParams.get("table");
    const [assignedServer, setAssignedServer] = useState(null);

    useEffect(() => {
        if (!tableNumber) return;

        // Query Firestore to check if the table has an assigned server
        const tableQuery = query(collection(db, "tables"), where("tableNumber", "==", Number(tableNumber)));

        const unsubscribe = onSnapshot(tableQuery, (snapshot) => {
            if (!snapshot.empty) {
                const tableData = snapshot.docs[0].data();
                // Only move to request page if a server is assigned
                if (tableData.assignedServer) {
                    setAssignedServer(tableData.assignedServer);
                    router.push(`/requests?table=${tableNumber}`);
                }
            }
        });

        return () => unsubscribe();
    }, [tableNumber, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-5">
            <h1 className="text-2xl font-bold text-white">A server will be at the table shortly.</h1>
            <p className="text-gray-500">Thank you for your patience.</p>
        </div>
    );
}