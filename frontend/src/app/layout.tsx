"use client";
// Metadata export removed as it's incompatible with "use client"
// import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Head from "next/head"; // Keep Head import if used elsewhere, or remove
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// cannot have meta data in a client component
/* export const metadata: Metadata = {
  title: "HackVerseAI",
  description: "Build projects with AI guidance, not AI dominance",
}; */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sidebarPaths = ["/", "/profile"];
  const pathname = usePathname();
  const showSidebar = sidebarPaths.includes(pathname);
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="relative w-full flex items-center justify-center">
          {showSidebar && <NavBar />}
        </div>
        {children}
      </body>
    </html>
  );
}
