"use client";

import React, { useState, useEffect } from "react";
import { Menu, MenuItem } from "@/components/ui/navbar-menu";
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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    console.log(user);
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <div
      className={cn("fixed top-10 inset-x-0 max-w-2xl mx-auto z-50", className)}
    >
      <div>
        <Menu setActive={setActive}>
          <Link href="/">
            <MenuItem setActive={setActive} active={active} item="Home" />
          </Link>
          <MenuItem
            setActive={setActive}
            active={active}
            item="Get Started Now"
          />
          <MenuItem setActive={setActive} active={active} item="Contact us" />

          {/* Profile Section */}
          {user ? (
            <div className="flex items-center gap-3 cursor-pointer">
              <Link href="/profile">
                <img
                  src={
                    user.photoURL ||
                    "https://cdn1.iconfinder.com/data/icons/elevator/154/elevator-user-man-ui-round-login-512.png"
                  }
                  alt="Profile"
                  className="w-8 h-8 rounded-full border border-gray-300"
                />
              </Link>
            </div>
          ) : (
            <Link href="/profile">
              <MenuItem
                setActive={setActive}
                active={active}
                item="Login/Sign up"
              />
            </Link>
          )}
        </Menu>
      </div>
    </div>
  );
}

export default NavBar;
