"use client";
import Image from "next/image";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function ThankYouPage() {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-white text-black p-6 ${poppins.className}`}>
      
      {/* Bouncing Mascot */}
      <div className="relative flex items-center justify-center">
        <Image
          src="/assets/ddingdong_mascot.jpg" 
          alt="Ddingdong Mascot"
          width={200} 
          height={200}
          className="animate-bounce drop-shadow-lg"
        />
        
      </div>

      {/* Thank You Text */}
      <h1 className="text-3xl font-bold mt-6">Thank You!</h1>
      <p className="text-lg text-gray-600 text-center mt-2">
        We appreciate your time and feedback. Have a great day!
      </p>

    </div>
  );
}