"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Import useSearchParams
import { signOut as firebaseSignOut, auth } from "@/utils/firebase"; // Renamed signOut to avoid conflict
import { useAuth } from "@/context/AuthContext";
import {
  updateUserProfile,
  initiateGoogleCalendarAuth,
  createGoogleCalendarTestEvent,
  connectCanvas as connectCanvasService, // Aliased to avoid conflict
  disconnectCanvas as disconnectCanvasService, // Aliased to avoid conflict
} from "@/services";
import { UserProfileUpdateData, UserProfile as UserProfileType } from "@/types"; // Explicitly import UserProfileType

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
  credits: number | null;
  created_at?: string;
  last_logged_in?: string;
  // Add new fields from schema to potentially display status
  google_refresh_token?: string | null;
  canvas_domain?: string | null; // Add canvas fields
  canvas_access_token?: string | null; // Add canvas fields (might not be needed directly in UI)
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
  const {
    firebaseUser,
    userProfile,
    credits,
    isLoading: authLoading, // Renamed to avoid conflict with local isLoading
    authError,
    refreshData,
  } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfileUpdateData>>({});

  // Page-specific loading states
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isCreatingTestEvent, setIsCreatingTestEvent] = useState(false);
  const [isDisconnectingCanvas, setIsDisconnectingCanvas] = useState(false);
  const [isConnectingCanvas, setIsConnectingCanvas] = useState(false); // Added for Canvas connection initiation

  // Page-specific error/status messages
  const [pageError, setPageError] = useState<string | null>(null);
  const [calendarStatusMessage, setCalendarStatusMessage] = useState<
    string | null
  >(null);
  const [testEventFeedback, setTestEventFeedback] = useState<string | null>(
    null
  );
  const [canvasStatusMessage, setCanvasStatusMessage] = useState<string | null>(
    null
  );

  // Derived states for connection status (from userProfile)
  const isCalendarConnected = !!userProfile?.google_refresh_token;
  const isCanvasConnected = !!userProfile?.canvas_domain;

  // Effect to initialize formData when userProfile or firebaseUser loads or changes
  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || firebaseUser?.displayName || "",
        academic_year: userProfile.academic_year || undefined,
        academic_level: userProfile.academic_level || "",
        institution: userProfile.institution || "",
      });
      if (!userProfile.full_name && firebaseUser?.displayName) {
        // If profile exists but name is empty, and firebase has a display name, prefill and suggest editing
        setIsEditing(true);
      }
    } else if (firebaseUser && !authLoading && !userProfile) {
      // New user or profile not yet created, prefill from Firebase and start editing
      setFormData({
        full_name: firebaseUser.displayName || "",
        academic_year: undefined,
        academic_level: "",
        institution: "",
      });
      setIsEditing(true);
      setPageError("Profile not found. Please complete your profile."); // Inform user
    }
  }, [userProfile, firebaseUser, authLoading]);

  // Effect to handle redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push("/");
    }
  }, [authLoading, firebaseUser, router]);

  // Effect for handling query params for Calendar and Canvas connection status
  useEffect(() => {
    const googleAuthStatus = searchParams.get("google_auth_status");
    if (googleAuthStatus) {
      if (googleAuthStatus === "success") {
        setCalendarStatusMessage("Google Calendar connected successfully!");
        refreshData(); // Refresh data to get new token status
      } else {
        setCalendarStatusMessage(
          "Google Calendar connection failed or was cancelled. Please try again."
        );
      }
      router.replace("/profile", { scroll: false }); // Clean URL
    }

    const canvasAuthStatus = searchParams.get("canvas_auth_status");
    if (canvasAuthStatus) {
      if (canvasAuthStatus === "success") {
        setCanvasStatusMessage("Canvas account connected successfully!");
        refreshData(); // Refresh data to get new canvas status
      } else {
        setCanvasStatusMessage(
          "Failed to connect Canvas account. Please ensure credentials are correct and try again."
        );
      }
      router.replace("/profile", { scroll: false }); // Clean URL
    }
  }, [searchParams, router, refreshData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const val =
      e.target.type === "number"
        ? value === ""
          ? undefined
          : parseInt(value, 10)
        : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      setPageError("User not authenticated.");
      return;
    }
    setIsSubmittingProfile(true);
    setPageError(null);
    try {
      await updateUserProfile(firebaseUser.uid, formData);
      await refreshData(); // Refresh context data
      setIsEditing(false);
      // Optionally show a success message
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setPageError(
        err.message || "Failed to update profile. Please try again."
      );
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleLogout = async () => {
    setPageError(null);
    try {
      await firebaseSignOut(auth);
      // AuthContext will handle redirect and state clearing via onAuthStateChanged
      // router.push("/"); // This redirect is now handled by the useEffect above
    } catch (err: any) {
      console.error("Logout Error:", err);
      setPageError(err.message || "Failed to logout. Please try again.");
    }
  };

  const handleConnectGoogleCalendar = () => {
    if (firebaseUser) {
      setCalendarStatusMessage(null); // Clear previous messages
      initiateGoogleCalendarAuth(firebaseUser.uid);
      // The page will reload/redirect via backend to Google and then back here with query params
    }
  };

  const handleCreateTestEvent = async () => {
    if (!firebaseUser) {
      setTestEventFeedback("User not authenticated.");
      return;
    }
    setIsCreatingTestEvent(true);
    setTestEventFeedback(null);
    try {
      const now = new Date();
      const later = new Date(now.getTime() + 60 * 60 * 1000);
      // Construct eventData with flat start_datetime and end_datetime
      const eventData = {
        summary: "Test Event from EduGenie",
        description: "This is a test event from your EduGenie profile.",
        start_datetime: now.toISOString(), // Use ISO string directly
        end_datetime: later.toISOString(), // Use ISO string directly
        // timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Backend might infer from ISO string or need it separately
      };
      const result = await createGoogleCalendarTestEvent(
        firebaseUser.uid,
        eventData
      );
      setTestEventFeedback(
        `Success! Event '${result?.summary || "Test Event"}' created.`
      );
    } catch (err: any) {
      setTestEventFeedback(err.message || "Failed to create test event.");
    } finally {
      setIsCreatingTestEvent(false);
    }
  };

  const handleInitiateCanvasConnection = () => {
    if (firebaseUser) {
      setCanvasStatusMessage(null);
      router.push(`/connect/canvas?google_id=${firebaseUser.uid}`);
    }
  };

  // Actual connection logic might be on a separate page or modal
  // This is just a placeholder if you were to call it directly (not typical for OAuth like flows)
  const connectToCanvas = async (domain: string, token: string) => {
    if (!firebaseUser) return;
    setIsConnectingCanvas(true);
    setCanvasStatusMessage(null);
    try {
      await connectCanvasService(firebaseUser.uid, domain, token);
      await refreshData();
      setCanvasStatusMessage("Canvas connected successfully!");
    } catch (err: any) {
      setCanvasStatusMessage(err.message || "Failed to connect Canvas.");
    } finally {
      setIsConnectingCanvas(false);
    }
  };

  const handleDisconnectCanvas = async () => {
    if (!firebaseUser) {
      setCanvasStatusMessage("User not authenticated.");
      return;
    }
    setIsDisconnectingCanvas(true);
    setCanvasStatusMessage(null);
    try {
      await disconnectCanvasService(firebaseUser.uid);
      await refreshData(); // Refresh context to reflect disconnection
      setCanvasStatusMessage("Canvas disconnected successfully.");
    } catch (err: any) {
      console.error("Failed to disconnect Canvas:", err);
      setCanvasStatusMessage(
        err.message || "Failed to disconnect Canvas. Please try again."
      );
    } finally {
      setIsDisconnectingCanvas(false);
    }
  };

  // Overall loading state for the page, primarily driven by AuthContext
  if (authLoading && !userProfile && !authError) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex justify-center items-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  // If firebaseUser is null after loading, and no authError, it means user is logged out (redirect handled by useEffect)
  // AuthError from context will be displayed, or pageError for page-specific issues.
  const generalError = authError || pageError;

  // Determine if we should be in a state to force profile completion
  const forceProfileCompletion =
    firebaseUser && !userProfile && !authLoading && !isEditing;

  return (
    <div className="min-h-screen bg-black/[0.96] text-white px-4 md:px-8 lg:px-16 pb-20 pt-35">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Profile</h1>

      {generalError && !isEditing && (
        <div className="max-w-xl mx-auto mb-4 p-3 rounded text-center bg-red-800/70 text-red-100">
          <p>{generalError}</p>
        </div>
      )}
      {calendarStatusMessage && (
        <div
          className={`max-w-xl mx-auto mb-4 p-3 rounded text-center ${
            calendarStatusMessage.includes("success")
              ? "bg-green-800/70 text-green-100"
              : "bg-red-800/70 text-red-100"
          }`}
        >
          {calendarStatusMessage}
        </div>
      )}
      {canvasStatusMessage && (
        <div
          className={`max-w-xl mx-auto mb-4 p-3 rounded text-center ${
            canvasStatusMessage.includes("success")
              ? "bg-green-800/70 text-green-100"
              : "bg-red-800/70 text-red-100"
          }`}
        >
          {canvasStatusMessage}
        </div>
      )}

      {/* Main Content Area: Form or Display View */}
      <div className="max-w-xl mx-auto bg-gray-800/70 p-6 rounded-lg shadow-xl">
        {isEditing || forceProfileCompletion ? (
          <form onSubmit={handleSubmitProfile} className="space-y-4">
            {firebaseUser?.email && (
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
                  value={firebaseUser.email}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400 focus:outline-none"
                />
              </div>
            )}
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
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Your Full Name"
              />
            </div>
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
                value={formData.academic_year || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., 1, 2, 11, 12"
              />
            </div>
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
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Name of your institution"
              />
            </div>
            {pageError && isEditing && (
              <p className="text-red-400 text-sm">{pageError}</p>
            )}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setPageError(null);
                  if (userProfile)
                    setFormData({
                      full_name:
                        userProfile.full_name ||
                        firebaseUser?.displayName ||
                        "",
                      academic_year: userProfile.academic_year || undefined,
                      academic_level: userProfile.academic_level || "",
                      institution: userProfile.institution || "",
                    });
                  else if (firebaseUser)
                    setFormData({ full_name: firebaseUser.displayName || "" });
                }}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingProfile}
                className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
              >
                {isSubmittingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {firebaseUser?.photoURL && (
              <img
                src={firebaseUser.photoURL}
                alt="Profile Avatar"
                className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-indigo-500"
              />
            )}
            <p>
              <span className="font-semibold text-gray-400">Name:</span>{" "}
              {userProfile?.full_name || firebaseUser?.displayName || "Not Set"}
            </p>
            <p>
              <span className="font-semibold text-gray-400">Email:</span>{" "}
              {userProfile?.email || firebaseUser?.email}
            </p>
            <p>
              <span className="font-semibold text-gray-400">
                Academic Year:
              </span>{" "}
              {userProfile?.academic_year || "Not Set"}
            </p>
            <p>
              <span className="font-semibold text-gray-400">Level:</span>{" "}
              {userProfile?.academic_level || "Not Set"}
            </p>
            <p>
              <span className="font-semibold text-gray-400">Institution:</span>{" "}
              {userProfile?.institution || "Not Set"}
            </p>
            <p>
              <span className="font-semibold text-gray-400">Plan:</span>{" "}
              <span className="capitalize">
                {userProfile?.plan_type || "basic"}
              </span>
            </p>
            <p>
              <span className="font-semibold text-gray-400">Credits:</span>{" "}
              {credits ?? "-"}
            </p>

            {/* Integrations Section - Display View */}
            <div className="pt-4 mt-4 border-t border-gray-700 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-200">
                  Integrations
                </h3>
                {isCalendarConnected ? (
                  <div className="p-3 bg-green-800/30 rounded-md space-y-2">
                    <p className="text-green-300">Google Calendar Connected</p>
                    <button
                      onClick={handleCreateTestEvent}
                      className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition duration-200 disabled:opacity-50"
                      disabled={isCreatingTestEvent}
                    >
                      {isCreatingTestEvent
                        ? "Creating Test Event..."
                        : "Create Test Calendar Event"}
                    </button>
                    {testEventFeedback && (
                      <p
                        className={`text-sm ${
                          testEventFeedback.includes("Error")
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {testEventFeedback}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleConnectGoogleCalendar}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 flex items-center justify-center space-x-2"
                  >
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

              <div>
                {isCanvasConnected ? (
                  <div className="flex items-center justify-between p-3 bg-green-800/30 rounded-md">
                    <p className="text-green-300">
                      Canvas Account Connected ({userProfile?.canvas_domain})
                    </p>
                    <button
                      onClick={handleDisconnectCanvas}
                      className="ml-4 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition duration-200 disabled:opacity-50"
                      disabled={isDisconnectingCanvas}
                    >
                      {isDisconnectingCanvas
                        ? "Disconnecting..."
                        : "Disconnect"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleInitiateCanvasConnection}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition duration-200 flex items-center justify-center space-x-2"
                  >
                    {/* Basic Canvas/LMS Icon Placeholder */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <span>Connect Canvas Account</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-700">
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
    </div>
  );
}
