"use client";

import React, { useState, useEffect } from "react";
import { Menu, MenuItem } from "@/components/ui/navbar-menu";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { auth, googleProvider, signInWithPopup } from "@/utils/firebase";
import { User } from "firebase/auth";
import { usePathname } from "next/navigation";
import { ChevronsUp } from "lucide-react";

const syncUserWithBackend = async (userData: User) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    console.log(`Syncing user ${userData.uid} with backend...`);
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend sync error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Backend sync successful:", data);
    return data;
  } catch (error) {
    console.error("Failed to sync user with backend:", error);
  }
};

function NavBar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const showSidebar = pathname === "/" || pathname === "/profile";

  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Store google_id when user logs in or is already logged in
        localStorage.setItem("google_id", currentUser.uid);
        console.log("Stored google_id in localStorage:", currentUser.uid); // Optional: for debugging
      } else {
        // Remove google_id when user logs out
        localStorage.removeItem("google_id");
        console.log("Removed google_id from localStorage"); // Optional: for debugging
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleCreditLoading = async () => {
      const google_id = localStorage.getItem("google_id");
      try {
        console.log("fetching credits for user");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/credits/${google_id}/get_credits`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch credits");
        }

        const data = await response.json();
        setCredits(data.credits);
      } catch (error) {
        console.error("Error fetching credits:", error);
      }
    };
    handleCreditLoading();
  }, []);

  const handleLogin = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      // Store google_id immediately after successful login
      if (result.user) {
        localStorage.setItem("google_id", result.user.uid);
        console.log(
          "Stored google_id in localStorage from handleLogin:",
          result.user.uid
        ); // Optional: for debugging
        // Sync with backend (can happen after storing locally)
        syncUserWithBackend(result.user).catch((err) => {
          console.error("Background sync failed:", err);
          setError(
            "Failed to sync account data. Some features might be limited."
          );
        });
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      setError("Failed to login. Please try again.");
    }
  };

  return (
    <div
      className={cn(
        "fixed top-10 inset-x-0 z-50 flex justify-center",
        className
      )}
    >
      {/* Error overlay */}
      {error && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded text-xs shadow-lg">
          {error}
        </div>
      )}
      {/* Pill wrapper to clip background */}
      <div className="relative mx-auto max-w-2xl overflow-hidden rounded-full">
        {/* Background image for the pill */}
        <div className="absolute inset-0 bg-[url('/nav-background.jpg')] bg-top bg-cover" />
        {/* Menu overlay */}
        <Menu
          setActive={setActive}
          className={cn(
            "relative z-10 flex items-center justify-center space-x-8",
            "bg-white/50 dark:bg-black/50 backdrop-blur-md",
            "border border-gray-200 dark:border-gray-700",
            "px-20 py-4"
          )}
        >
          <Link href="/">
            <MenuItem setActive={setActive} active={active} item="Home" />
          </Link>
          {user ? (
            <>
              <Link href="/about">
                <MenuItem setActive={setActive} active={active} item="About" />
              </Link>
              <Link href="/dashboard">
                <MenuItem
                  setActive={setActive}
                  active={active}
                  item="Dashboard"
                />
              </Link>
              <Link
                href="/profile"
                className="text-sm text-gray-100 flex items-center gap-2"
              >
                <ChevronsUp className="w-4 h-4" />: {credits}
              </Link>
              <Link href="/profile" className="flex items-center">
                <img
                  src={user.photoURL || "/default-avatar.png"}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border border-gray-300 hover:opacity-80 transition-opacity duration-200"
                  title="Profile"
                />
              </Link>
            </>
          ) : (
            <div onClick={handleLogin} className="cursor-pointer">
              <MenuItem
                setActive={setActive}
                active={active}
                item="Login / Sign Up"
              />
            </div>
          )}
        </Menu>
      </div>
    </div>
  );
}

export default NavBar;
