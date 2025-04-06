"use client";

import { useState, useEffect } from "react";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
} from "@/utils/firebase";
import { User } from "firebase/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      console.log("User updated:", user); // debug step
    });

    return () => unsubscribe();
  }, []);

  const syncUserWithBackend = async (userData: User) => {
    try {
      console.log(
        `Attempting to sync user with backend at ${API_URL}/auth/google`
      );
      console.log("User data being sent:", {
        google_id: userData.uid,
        email: userData.email,
        full_name: userData.displayName,
        avatar_url: userData.photoURL,
      });

      const response = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          google_id: userData.uid,
          email: userData.email,
          full_name: userData.displayName,
          avatar_url: userData.photoURL,
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response text:", errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Backend response data:", data);
      return data;
    } catch (error) {
      console.error("Backend sync error:", error);
      throw error;
    }
  };

  const handleLogin = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Login successful:", result.user);
      setUser(result.user);

      // Sync with backend
      await syncUserWithBackend(result.user);
    } catch (error: any) {
      console.error("Login Error:", error);
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      setError(null);
      // Sync with backend before signing out
      if (user) {
        await syncUserWithBackend(user);
      }

      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      console.error("Logout Error:", error);
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-black">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-md rounded-lg p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error}
          </div>
        )}
        {user ? (
          <div className="flex flex-col items-center text-center">
            <img
              src={user.photoURL || "/default-profile.png"}
              alt="Profile"
              className="w-24 h-24 rounded-full border border-gray-300"
            />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
              {user.displayName}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">{user.email}</p>

            <button
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              You are not logged in
            </h1>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleLogin}
            >
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
