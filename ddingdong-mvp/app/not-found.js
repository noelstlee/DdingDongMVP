"use client";

import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function NotFound() {
  const router = useRouter();

  return (
    <div className={`min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 ${poppins.className}`}>
      <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8">Page Not Found</h2>
      <p className="text-lg text-gray-300 mb-8 text-center">
        The page you are looking for does not exist or has been moved.
      </p>
      <button
        onClick={() => router.push("/")}
        className="px-6 py-3 bg-yellow-400 text-black text-lg font-bold rounded-lg shadow-lg hover:bg-yellow-500 transition"
      >
        Go to Home
      </button>
    </div>
  );
} 