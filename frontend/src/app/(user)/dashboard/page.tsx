"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebase";
import AddClassForm from "@/components/AddClassForm"; // Import the form component
import { User } from "firebase/auth"; // Import User type
import Link from "next/link"; // Import Link
import { ClassData } from "@/types/class";

// Define the structure of class data (matches backend ClassInfo)

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Effect for auth state and initial data fetching
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch classes once user is confirmed
        try {
          const googleId = currentUser.uid;
          const response = await fetch(
            `http://localhost:8000/users/${googleId}/classes`
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const fetchedClasses: ClassData[] = await response.json();
          setClasses(fetchedClasses);
          setError(null);
        } catch (err: any) {
          console.error("Failed to fetch classes:", err);
          setError("Failed to load classes. Please try again later.");
          setClasses([]); // Clear classes on error
        } finally {
          setIsLoading(false);
        }
      } else {
        // Not logged in
        setUser(null);
        setIsLoading(false);
        router.push("/"); // Redirect to home
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Callback function for AddClassForm
  const handleClassAdded = (newClass: ClassData) => {
    setClasses((prevClasses) => [newClass, ...prevClasses]); // Add new class to the top of the list
    setShowAddForm(false); // Hide form after adding
  };

  // Render Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex justify-center items-center">
        Loading dashboard...
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-red-500 flex flex-col justify-center items-center p-8">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()} // Simple retry
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render Dashboard Content
  return (
    <div className="min-h-screen bg-black/[0.96] text-white pt-20 px-4 md:px-8 lg:px-16 pt-35">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Classes</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200 shadow-lg"
        >
          + Add New Class
        </button>
      </div>

      {/* Class List or Prompt */}
      {classes.length === 0 ? (
        <div className="text-center py-10 px-6 bg-gray-800/40 rounded-lg shadow-md">
          <h2 className="text-xl text-gray-300 mb-4">No classes added yet.</h2>
          <p className="text-gray-400 mb-6">
            Get started by adding your first class!
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200 shadow-lg text-lg font-semibold"
          >
            Add Your First Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/class/${cls.id}`}
              className="block group"
            >
              <div className="bg-gray-800/70 p-5 h-full rounded-lg shadow-lg group-hover:shadow-indigo-500/30 transition-shadow duration-300 border border-transparent group-hover:border-indigo-600/50 cursor-pointer flex flex-col justify-between">
                <div>
                  <h3
                    className="text-xl font-semibold text-white mb-2 truncate"
                    title={cls.name}
                  >
                    {cls.name}
                  </h3>
                  {cls.code && (
                    <p className="text-sm text-indigo-300 mb-1">
                      Code: {cls.code}
                    </p>
                  )}
                  {cls.instructor && (
                    <p className="text-sm text-gray-400 mb-3">
                      Instructor: {cls.instructor}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 text-right mt-4">
                    Added: {new Date(cls.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showAddForm && user && (
        <AddClassForm
          userId={user.uid} // Pass user's google_id (uid)
          onClassAdded={handleClassAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}
