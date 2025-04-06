"use client";

import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/utils/firebase";
import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function GoogleLogin() {
  const [user, setUser] = useState(auth.currentUser);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setError(null); // Clear any previous errors
    });
    return () => unsubscribe();
  }, []);

  const syncUserWithBackend = async (userData) => {
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
      setUser(result.user);
      console.log("User Info:", result.user);

      // Sync with backend
      await syncUserWithBackend(result.user);
    } catch (error) {
      console.error("Login Error:", error);
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      setError(null);
      if (user) {
        // Sync with backend before signing out
        await syncUserWithBackend(user);
      }

      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout Error:", error);
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      {user ? (
        <div>
          <p>Welcome, {user.displayName}</p>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={handleLogin}
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
}
