"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddClassForm from "@/components/AddClassForm";
import Link from "next/link";
import { ClassData } from "@/types/class";
import { useAuth } from "@/context/AuthContext";

// Define the payload structure AddClassForm will provide, matching AuthContext's addClass
interface AddClassFormPayload {
  name: string;
  code?: string;
  instructor?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    firebaseUser,
    isLoading: authIsLoading,
    authError,
    classes,
    isLoadingClasses,
    fetchClassesError,
    addClass,
    refreshData,
  } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  // Local error state for the add class form submission itself
  const [addClassFormError, setAddClassFormError] = useState<string | null>(
    null
  );

  // useEffect for redirecting if not logged in is implicitly handled by AuthContext or a wrapper component
  // However, an explicit check before rendering content is still good practice.
  useEffect(() => {
    if (!authIsLoading && !firebaseUser && !authError) {
      router.push("/");
    }
  }, [authIsLoading, firebaseUser, authError, router]);

  const handleAddNewClass = async (formData: AddClassFormPayload) => {
    if (!firebaseUser) {
      setAddClassFormError("You must be logged in to add a class.");
      return;
    }
    setAddClassFormError(null);
    try {
      await addClass(formData); // Use addClass from AuthContext
      setShowAddForm(false); // Close form on success
    } catch (err: any) {
      console.error("Failed to add class:", err);
      setAddClassFormError(
        err.message || "Could not add class. Please try again."
      );
    }
  };

  const handleRetry = () => {
    if (authError) {
      // If there's an auth error, the primary action should be to guide the user to resolve auth.
      // This might involve redirecting to login or a generic refresh.
      // For now, if authError is present, it's likely a broader issue than just classes.
      // Attempting a full refreshData might re-trigger the auth flow or update user state.
      refreshData();
      // Or, router.push("/") if it's a persistent auth issue.
    } else if (fetchClassesError) {
      refreshData(); // This will call loadUserData which includes fetching classes
    }
  };

  const pageIsLoading = authIsLoading || (firebaseUser && isLoadingClasses); // Classes only load if firebaseUser exists

  if (pageIsLoading) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex justify-center items-center">
        Loading dashboard...
      </div>
    );
  }

  const displayError = authError || fetchClassesError;

  if (displayError) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-red-500 flex flex-col justify-center items-center p-8">
        <p>{displayError}</p>
        <button
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
        >
          {authError ? "Try to Reload" : "Retry Fetching Classes"}
        </button>
      </div>
    );
  }

  if (!firebaseUser) {
    // Should be caught by useEffect redirect, but as a fallback
    // This state indicates auth is resolved (not loading), no authError, but no firebaseUser.
    // The useEffect above should have redirected to '/'.
    // If somehow reached, provide a clear message.
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex flex-col justify-center items-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/[0.96] text-white pt-20 px-4 md:px-8 lg:px-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Classes</h1>
        <button
          onClick={() => {
            setShowAddForm(true);
            setAddClassFormError(null); // Clear previous form error when opening
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200 shadow-lg"
        >
          + Add New Class
        </button>
      </div>

      {classes.length === 0 && !isLoadingClasses ? ( // Ensure not loading before showing 'no classes'
        <div className="text-center py-10 px-6 bg-gray-800/40 rounded-lg shadow-md">
          <h2 className="text-xl text-gray-300 mb-4">No classes added yet.</h2>
          <p className="text-gray-400 mb-6">
            Get started by adding your first class!
          </p>
          <button
            onClick={() => {
              setShowAddForm(true);
              setAddClassFormError(null); // Clear previous form error
            }}
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

      {showAddForm && (
        <AddClassForm
          onSubmitClass={handleAddNewClass}
          onCancel={() => {
            setShowAddForm(false);
            setAddClassFormError(null);
          }}
          formError={addClassFormError}
        />
      )}
    </div>
  );
}
