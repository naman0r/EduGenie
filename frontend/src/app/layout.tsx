// Metadata export removed as it's incompatible with "use client"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Head from "next/head"; // Keep Head import if used elsewhere, or remove
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// cannot have meta data in a client component if the component itself becomes client-side
// If AuthProvider makes RootLayout effectively client-side, this metadata might need adjustment
// or to be handled at the page level for static pages.
export const metadata: Metadata = {
  title: "EduGenie",
  description: "AI for all your educational needs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <div className="relative w-full flex items-center justify-center">
            {<NavBar />}
          </div>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
