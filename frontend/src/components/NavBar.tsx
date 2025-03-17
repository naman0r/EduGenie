"use client";

import React, { useState, useEffect } from "react";
import {
  HoveredLink,
  Menu,
  MenuItem,
  ProductItem,
} from "@/components/ui/navbar-menu";
import { cn } from "@/utils/cn";
import Link from "next/link";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
} from "@/utils/firebase";

function NavBar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [user, setUser] = useState(auth.currentUser);

  // Track user authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Handle Google Login
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      console.log("User Info:", result.user);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <div
      className={cn("fixed top-10 inset-x-0 max-w-2xl mx-auto z-50", className)}
    >
      <div>
        <Menu setActive={setActive}>
          <Link href="/">
            <MenuItem
              setActive={setActive}
              active={active}
              item="Home"
            ></MenuItem>
          </Link>
          <MenuItem
            setActive={setActive}
            active={active}
            item="Get Started Now"
          ></MenuItem>
          <MenuItem
            setActive={setActive}
            active={active}
            item="Contact us"
          ></MenuItem>

          {/* Profile Section */}
          {user ? (
            <div className="flex items-center gap-3 cursor-pointer">
              <Link href="/profile">
                <img
                  src={
                    user.photoURL ||
                    "https://cdn.vectorstock.com/i/1000v/92/16/default-profile-picture-avatar-user-icon-vector-46389216.jpg"
                  }
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
              </Link>
            </div>
          ) : (
            <MenuItem
              setActive={setActive}
              active={active}
              item="Login/Sign up"
            />
          )}
        </Menu>
      </div>
    </div>
  );
}

export default NavBar;
