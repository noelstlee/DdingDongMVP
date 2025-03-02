"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function SurveyPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState({
    diningExperience: "",
    easeOfUse: 3,
    preference: "",
    feedback: "",
  });

  const [userId, setUserId] = useState(null);
  const [showModal, setShowModal] = useState(false); // State for the Google Review popup

  useEffect(() => {
    const generatedUserId = `survey_${Date.now()}`;
    setUserId(generatedUserId);
  }, []);

  const handleSelect = (question, answer) => {
    setAnswers((prev) => ({ ...prev, [question]: answer }));
  };

  const handleSubmit = async () => {
    try {
      if (!userId) return;

      await setDoc(doc(db, "survey", userId), {
        ...answers,
        timestamp: new Date(),
      });

      setShowModal(true); // Show the modal instead of redirecting immediately
    } catch (err) {
      console.error("Error saving survey:", err);
    }
  };

  return (
    <div className={`flex justify-center items-center min-h-screen bg-white text-black ${poppins.className}`}>
      <div className="w-96 bg-gray-100 p-6 rounded-lg shadow-lg text-center">
        
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Quick Survey</h1>
        <p className="mb-6 text-gray-600 text-lg">Help us improve your experience!</p>

        {/* Question 1 */}
        <p className="text-lg font-semibold mb-2 text-gray-800">Did the app make dining easier?</p>
        <div className="flex justify-center space-x-2 mb-4">
          <button
            className={`px-4 py-2 rounded-lg transition active:scale-90 ${
              answers.diningExperience === "Yes" ? "bg-yellow-500 text-black" : "bg-gray-300 text-black"
            }`}
            onClick={() => handleSelect("diningExperience", "Yes")}
          >
            ✅ Yes
          </button>
          <button
            className={`px-4 py-2 rounded-lg transition active:scale-90 ${
              answers.diningExperience === "Maybe" ? "bg-gray-500 text-white" : "bg-gray-300 text-black"
            }`}
            onClick={() => handleSelect("diningExperience", "Maybe")}
          >
            🤔 Maybe
          </button>
          <button
            className={`px-4 py-2 rounded-lg transition active:scale-90 ${
              answers.diningExperience === "No" ? "bg-red-500 text-white" : "bg-gray-300 text-black"
            }`}
            onClick={() => handleSelect("diningExperience", "No")}
          >
            ❌ No
          </button>
        </div>

        {/* Question 2 (Ease of Use - Horizontal Scroll Rating) */}
        <p className="text-lg font-semibold mb-2 text-gray-800">How easy was the app to use?</p>
        <div className="flex items-center justify-between w-full mb-4">
          <span className="text-lg font-bold text-red-600 flex items-center">😠 Hard</span>
          <input
            type="range"
            min="1"
            max="5"
            value={answers.easeOfUse}
            step="1"
            className="w-3/5 cursor-pointer"
            onChange={(e) => handleSelect("easeOfUse", parseInt(e.target.value))}
          />
          <span className="text-lg font-bold text-green-600 flex items-center">😀 Easy</span>
        </div>

        {/* Question 3 */}
        <p className="text-lg font-semibold mb-2 text-gray-800">Would you use this over calling a server?</p>
        <div className="flex justify-center space-x-2 mb-4">
          <button
            className={`px-4 py-2 rounded-lg transition active:scale-90 ${
              answers.preference === "Yes" ? "bg-yellow-500 text-black" : "bg-gray-300 text-black"
            }`}
            onClick={() => handleSelect("preference", "Yes")}
          >
            ✅ Yes
          </button>
          <button
            className={`px-4 py-2 rounded-lg transition active:scale-90 ${
              answers.preference === "Maybe" ? "bg-gray-500 text-white" : "bg-gray-300 text-black"
            }`}
            onClick={() => handleSelect("preference", "Maybe")}
          >
            🤔 Maybe
          </button>
          <button
            className={`px-4 py-2 rounded-lg transition active:scale-90 ${
              answers.preference === "No" ? "bg-red-500 text-white" : "bg-gray-300 text-black"
            }`}
            onClick={() => handleSelect("preference", "No")}
          >
            ❌ No
          </button>
        </div>

        {/* Optional Feedback */}
        <p className="text-lg font-semibold mb-2 text-gray-800">Any suggestions? (Optional)</p>
        <textarea
          className="w-full px-4 py-2 bg-gray-200 border border-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          rows="3"
          placeholder="Write your feedback..."
          onChange={(e) => handleSelect("feedback", e.target.value)}
        />

        {/* Submit Button */}
        <button
          className="w-full px-6 py-3 mt-6 bg-gradient-to-b from-[#FFD700] to-[#FFC700] text-black text-xl font-bold rounded-lg shadow-lg hover:bg-yellow-600 transition active:scale-90"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>

      {/* Google Review Popup Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center w-96 relative">
            {/* Close Button (Redirects to ending page) */}
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => router.push("/endingPage")}
            >
              ❌
            </button>

            <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
            <p className="text-gray-600 mt-2">Your review matters—share your experience on Google and help others discover great dining spots!</p>

            <div className="flex justify-center mt-4 space-x-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                onClick={() => window.open("https://search.google.com/local/writereview?placeid=ChIJ-7n8wJ0F9YgRTJpNQS1gDnM", "_blank")}
              >
                ✅ Yes, Write Review
              </button>
              <button
                className="px-4 py-2 bg-gray-400 text-black rounded-lg"
                onClick={() => router.push("/endingPage")}
              >
                ❌ No, Thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}