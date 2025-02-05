"use client";

import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, updateDoc, doc, deleteDoc, where, query } from "firebase/firestore";

export default function ServerPage() {
    const [serverName, setServerName] = useState("");
    const [tables, setTables] = useState([]);
    const [assignedTables, setAssignedTables] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        if (!isLoggedIn) return;

        // Fetch all unassigned tables
        const tableQuery = query(collection(db, "tables"), where("status", "==", "waiting"));
        const unsubscribe = onSnapshot(tableQuery, (snapshot) => {
            const tableData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTables(tableData);
        });

        // Fetch tables assigned to this server
        const assignedTableQuery = query(collection(db, "tables"), where("assignedServer", "==", serverName));
        const unsubscribeAssigned = onSnapshot(assignedTableQuery, (snapshot) => {
            const assignedData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAssignedTables(assignedData);
        });

        return () => {
            unsubscribe();
            unsubscribeAssigned();
        };
    }, [isLoggedIn, serverName]);

    // Accept Table Request
    const assignServer = async (tableId) => {
        const tableRef = doc(db, "tables", tableId);
        await updateDoc(tableRef, {
            assignedServer: serverName,
            status: "assigned"
        });
    };

    // Decline Table Request
    const declineTable = async (tableId) => {
        const tableRef = doc(db, "tables", tableId);
        await deleteDoc(tableRef); // Remove request so another customer can try again
    };

    return (
        <div className="p-5">
            {!isLoggedIn ? (
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-bold mb-6 text-black">Enter Your Name</h1>
                    <input 
                        type="text" 
                        value={serverName}
                        onChange={(e) => setServerName(e.target.value)}
                        placeholder="Server Name"
                        className="border p-2 rounded mb-4 text-black"
                    />
                    <button 
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={() => setIsLoggedIn(true)}
                    >
                        Confirm
                    </button>
                </div>
            ) : (
                <div>
                    <h1 className="text-2xl font-bold mb-4 text-white">Hello {serverName}, this is your main page for keeping track of tables!</h1>
                    
                    <h2 className="text-xl font-bold text-white">Pending Table Requests</h2>
                    {tables.map(table => (
                        <div key={table.id} className="border p-3 my-2 rounded">
                            <strong>Table {table.tableNumber}</strong>
                            <button 
                                className="ml-4 bg-green-500 text-white px-3 py-1 rounded"
                                onClick={() => assignServer(table.id)}
                            >
                                Accept
                            </button>
                            <button 
                                className="ml-4 bg-red-500 text-white px-3 py-1 rounded"
                                onClick={() => declineTable(table.id)}
                            >
                                Decline
                            </button>
                        </div>
                    ))}

                    <h2 className="text-xl font-bold text-white mt-6">Assigned Tables</h2>
                    {assignedTables.map(table => (
                        <div key={table.id} className="border p-3 my-2 rounded">
                            <strong>Table {table.tableNumber}</strong>
                            <p className="text-sm text-gray-500">Customer Requests:</p>
                            {/* TODO: Fetch customer requests dynamically */}
                            <button 
                                className="ml-4 bg-orange-500 text-white px-3 py-1 rounded"
                                onClick={() => alert("Service completed!")}
                            >
                                Finish Service
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}