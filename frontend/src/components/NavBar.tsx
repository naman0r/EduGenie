"use client";

import React, { useState } from "react";
import { Menu, MenuItem } from "@/components/ui/navbar-menu";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { auth, googleProvider, signInWithPopup } from "@/utils/firebase";
import { usePathname } from "next/navigation";
import { ChevronsUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { syncUserWithBackend } from "@/services";

function NavBar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const {
    firebaseUser,
    credits,
    isLoading: authLoading,
    authError,
  } = useAuth();
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const pathname = usePathname();

  const handleLogin = async () => {
    if (loginInProgress) return;
    setLoginInProgress(true);
    setLoginError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserWithBackend(result.user);
      } else {
        setLoginError("Login successful, but no user data received.");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === "auth/popup-closed-by-user") {
        setLoginError("Login cancelled. Please try again.");
      } else {
        setLoginError("Failed to login. Please try again.");
      }
    } finally {
      setLoginInProgress(false);
    }
  };

  const displayError = loginError || authError;

  return (
    <div
      className={cn(
        "fixed top-10 inset-x-0 z-50 flex justify-center",
        className
      )}
    >
      {displayError && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded text-xs shadow-lg">
          {displayError}
        </div>
      )}
      <div className="relative mx-auto max-w-2xl overflow-hidden rounded-full">
        <div className="absolute inset-0 bg-[url('/nav-background.jpg')] bg-top bg-cover" />
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
          {authLoading ? (
            <MenuItem setActive={setActive} active={active} item="Loading..." />
          ) : firebaseUser ? (
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
                <ChevronsUp className="w-4 h-4" />: {credits ?? 0}
              </Link>
              <Link href="/profile" className="flex items-center">
                <img
                  src={firebaseUser.photoURL || "/default-avatar.png"}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border border-gray-300 hover:opacity-80 transition-opacity duration-200"
                  title="Profile"
                />
              </Link>
            </>
          ) : (
            <div
              onClick={loginInProgress ? undefined : handleLogin}
              className={cn(
                "cursor-pointer",
                loginInProgress && "opacity-50 cursor-not-allowed"
              )}
            >
              <MenuItem
                setActive={setActive}
                active={active}
                item={loginInProgress ? "Logging in..." : "Login / Sign Up"}
              />
            </div>
          )}
        </Menu>
      </div>
    </div>
  );
}

export default NavBar;
