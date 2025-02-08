"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase"; // Firebase Authentication instance

export default function SignupInfoPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const validatePassword = (password) => {
    if (password.length < 6) {
      return "Password needs to be longer than 6 characters.";
    }
    if (!/[A-Za-z]/.test(password)) {
      return "Password must include at least one letter.";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must include at least one number.";
    }
    if (/(\w)\1{6,}/.test(password)) {
      return "Password cannot have more than 7 sequentially identical characters.";
    }
    return null; // No errors
  };

  const handleSignup = async () => {
    const passwordError = validatePassword(password);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const email = window.localStorage.getItem("emailForSignIn");
      if (!email) {
        setError("No email found. Please go back and sign up again.");
        return;
      }

      // Create the user in Firebase Authentication
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("User created successfully:", auth.currentUser);

      // Redirect to the extraInfo page for new user information
      router.push("/auth/extraInfo");
    } catch (err) {
      console.error("Error creating user:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use.");
      } else {
        setError("Failed to create account. Please try again.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-950 text-yellow-400 p-5">
      <h1 className="text-2xl font-bold mb-6">Set Your Password</h1>

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-64 px-4 py-3 border border-yellow bg-white text-black rounded mb-4 focus:outline-none"
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-64 px-4 py-3 border border-yellow bg-white text-black rounded mb-4 focus:outline-none"
      />
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        className="w-64 px-6 py-3 bg-yellow text-black font-bold rounded hover:bg-yellow-600 transition"
        onClick={handleSignup}
      >
        Create Account
      </button>
    </div>
  );
}