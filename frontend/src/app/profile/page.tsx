"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Import useSearchParams
import { auth, signOut } from "@/utils/firebase"; // Import signOut

// Define the structure of the user profile data
interface UserProfile {
  google_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  academic_year: number | null;
  academic_level: string | null;
  institution: string | null;
  plan_type: string | null;
  created_at?: string;
  last_logged_in?: string;
  // Add new fields from schema to potentially display status
  google_refresh_token?: string | null;
}

// Define academic levels for the dropdown
const academicLevels = [
  "High School",
  "Undergraduate",
  "Graduate",
  "Postgraduate",
  "Other",
];

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook to read query params
  const [user, setUser] = useState<any | null>(null); // Firebase user object
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [calendarStatusMessage, setCalendarStatusMessage] = useState<
    string | null
  >(null);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    full_name: "",
    academic_year: undefined, // Use undefined for optional number
    academic_level: "",
    institution: "",
  });

  // Effect to check auth state and fetch profile
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch profile data from backend
        try {
          // Use google_id (currentUser.uid from Firebase often matches google_id)
          const googleId = currentUser.uid;
          const response = await fetch(
            `http://localhost:8000/users/${googleId}`
          ); // Use google_id in URL

          if (!response.ok) {
            if (response.status === 404) {
              setError("Profile not found. Please complete your profile.");
              // Initialize form data for a new profile
              setFormData({
                full_name: currentUser.displayName || "",
                email: currentUser.email || "",
                academic_year: undefined,
                academic_level: "",
                institution: "",
              });
              setIsEditing(true); // Start in editing mode for new users
            } else {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            setProfile(null); // Ensure profile is null on error
          } else {
            const data = await response.json();
            const userProfile: UserProfile = data.user;
            setProfile(userProfile);
            // Initialize form data with fetched profile
            setFormData({
              full_name: userProfile.full_name || "",
              academic_year: userProfile.academic_year || undefined,
              academic_level: userProfile.academic_level || "",
              institution: userProfile.institution || "",
            });
            // Check if calendar is already connected based on refresh token presence
            setIsCalendarConnected(!!userProfile.google_refresh_token);
            setError(null); // Clear previous errors
          }
        } catch (err) {
          console.error("Failed to fetch profile:", err);
          setError("Failed to load profile data. Please try again later.");
          setProfile(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Not logged in, redirect to home or login page
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        router.push("/"); // Redirect to home page if not logged in
      }
    });

    // Check for Google Calendar auth status from query params ONCE on mount
    const status = searchParams.get("google_auth_status");
    if (status) {
      if (status === "success") {
        setCalendarStatusMessage("Google Calendar connected successfully!");
        setIsCalendarConnected(true); // Assume connection if success param is present
      } else if (status === "error_saving") {
        setCalendarStatusMessage(
          "Failed to save Google Calendar connection. Please try again."
        );
      } else if (status === "callback_failed") {
        setCalendarStatusMessage(
          "Google Calendar connection failed. Please try again."
        );
      }
      // Clean the URL (optional, requires navigation)
      // router.replace('/profile', { scroll: false });
    }

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [router, searchParams]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === ""
            ? undefined
            : parseInt(value, 10)
          : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.uid) {
      setError("User not authenticated.");
      return;
    }

    setIsLoading(true); // Show loading state during submission
    setError(null);

    try {
      const googleId = user.uid;
      const response = await fetch(`http://localhost:8000/users/${googleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          // No Authorization header needed for now
        },
        body: JSON.stringify(formData), // Send only updated fields
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedData = await response.json();
      setProfile(updatedData.user); // Update local profile state
      // Re-initialize form data in case PUT returns the full updated object
      setFormData({
        full_name: updatedData.user.full_name || "",
        academic_year: updatedData.user.academic_year || undefined,
        academic_level: updatedData.user.academic_level || "",
        institution: updatedData.user.institution || "",
      });
      setIsEditing(false); // Exit editing mode after successful save
      alert("Profile updated successfully!"); // Simple success feedback
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add handleLogout function
  const handleLogout = async () => {
    setError(null);
    try {
      await signOut(auth);
      // No need to setUser(null) here, onAuthStateChanged will trigger redirect
      // router.push('/'); // onAuthStateChanged handles the redirect
    } catch (error: any) {
      console.error("Logout Error:", error);
      setError("Failed to logout. Please try again.");
    }
  };

  // Function to initiate Google Calendar connection
  const connectGoogleCalendar = () => {
    if (user && user.uid) {
      // Redirect to the backend initiation endpoint
      window.location.href = `http://localhost:8000/auth/google/calendar/initiate?google_id=${user.uid}`;
    } else {
      setError("You must be logged in to connect Google Calendar.");
    }
  };

  // Render loading state
  if (isLoading && !profile && !error) {
    // Show loading only if no profile/error yet
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex justify-center items-center">
        Loading profile...
      </div>
    );
  }

  // Render error state
  if (error && !isEditing) {
    // Show error only if not in forced editing mode for new user
    return (
      <div className="min-h-screen bg-black/[0.96] text-red-500 flex flex-col justify-center items-center p-8">
        <p>{error}</p>
        {/* Optionally provide a button to retry or go back */}
        <button
          onClick={() => window.location.reload()} // Simple retry
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render profile display or edit form
  return (
    <div className="min-h-screen bg-black/[0.96] text-white pt-20 px-4 md:px-8 lg:px-16">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Profile</h1>

      {/* Display Calendar Connection Status */}
      {calendarStatusMessage && (
        <div
          className={`mb-4 p-3 rounded text-center ${
            calendarStatusMessage.includes("success")
              ? "bg-green-800/70 text-green-100"
              : "bg-red-800/70 text-red-100"
          }`}
        >
          {calendarStatusMessage}
        </div>
      )}

      {isEditing || (error && profile === null) ? ( // Show form if editing or new user error
        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto bg-gray-800/50 p-6 rounded-lg shadow-xl space-y-4"
        >
          {/* Display Email (Read-only) */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={user?.email || ""}
              readOnly
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400 focus:outline-none"
            />
          </div>
          {/* Full Name */}
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="Your Full Name"
            />
          </div>
          {/* Academic Year */}
          <div>
            <label
              htmlFor="academic_year"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Academic Year / Grade
            </label>
            <input
              type="number"
              id="academic_year"
              name="academic_year"
              value={formData.academic_year || ""} // Handle potential null/undefined
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 1, 2, 11, 12"
            />
          </div>
          {/* Academic Level */}
          <div>
            <label
              htmlFor="academic_level"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Academic Level
            </label>
            <select
              id="academic_level"
              name="academic_level"
              value={formData.academic_level || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
            >
              <option value="" disabled>
                Select Level
              </option>
              {academicLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          {/* Institution */}
          <div>
            <label
              htmlFor="institution"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              School / University
            </label>
            <input
              type="text"
              id="institution"
              name="institution"
              value={formData.institution || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="Name of your institution"
            />
          </div>
          {/* Display Plan Type (Read-only) */}
          {profile && profile.plan_type && (
            <div className="mb-4">
              <label
                htmlFor="plan_type"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Current Plan
              </label>
              <input
                type="text"
                id="plan_type"
                value={profile.plan_type}
                readOnly
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400 focus:outline-none capitalize"
              />
            </div>
          )}
          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                // Reset form data if canceling edit of existing profile
                if (profile) {
                  setFormData({
                    full_name: profile.full_name || "",
                    academic_year: profile.academic_year || undefined,
                    academic_level: profile.academic_level || "",
                    institution: profile.institution || "",
                  });
                }
                setError(null); // Clear any errors on cancel
              }}
              disabled={isLoading || profile === null} // Disable if loading or no profile loaded yet
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2 text-center">
              Error: {error}
            </p>
          )}{" "}
          {/* Display error during edit */}
        </form>
      ) : (
        // Display Profile Information (Read-only view)
        <div className="max-w-xl mx-auto bg-gray-800/50 p-6 rounded-lg shadow-xl space-y-3">
          {profile?.avatar_url && (
            <img
              src={profile.avatar_url}
              alt="Profile Avatar"
              className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-indigo-500"
            />
          )}
          <p>
            <span className="font-semibold text-gray-400">Name:</span>{" "}
            {profile?.full_name || "Not Set"}
          </p>
          <p>
            <span className="font-semibold text-gray-400">Email:</span>{" "}
            {profile?.email}
          </p>
          <p>
            <span className="font-semibold text-gray-400">Academic Year:</span>{" "}
            {profile?.academic_year || "Not Set"}
          </p>
          <p>
            <span className="font-semibold text-gray-400">Level:</span>{" "}
            {profile?.academic_level || "Not Set"}
          </p>
          <p>
            <span className="font-semibold text-gray-400">Institution:</span>{" "}
            {profile?.institution || "Not Set"}
          </p>
          <p>
            <span className="font-semibold text-gray-400 capitalize">
              Plan:
            </span>{" "}
            {profile?.plan_type || "basic"}
          </p>
          {/* Google Calendar Connection Section */}
          <div className="pt-4 mt-4 border-t border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-gray-200">
              Integrations
            </h3>
            {isCalendarConnected ? (
              <div className="flex items-center justify-between p-3 bg-green-800/50 rounded">
                <p className="text-green-100">Google Calendar Connected</p>
                {/* Optionally add a disconnect button later */}
              </div>
            ) : (
              <button
                onClick={connectGoogleCalendar}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                disabled={isLoading} // Disable while loading profile
              >
                {/* Basic Google Icon Placeholder */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"></path>
                </svg>
                <span>Connect Google Calendar</span>
              </button>
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-700">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700 transition duration-200"
            >
              Edit Profile
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
