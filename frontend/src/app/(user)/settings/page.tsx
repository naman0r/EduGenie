"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/services/user";
import { connectCanvas, disconnectCanvas } from "@/services/canvas";
import { initiateGoogleCalendarAuth } from "@/services/calendar";
import { UserProfileUpdateData } from "@/types/user";
import { signOut } from "@/utils/firebase";
import { auth } from "@/utils/firebase";
import { useRouter } from "next/navigation";

const SettingsPage: React.FC = () => {
  const {
    firebaseUser,
    userProfile,
    credits,
    isGoogleCalendarIntegrated,
    isCanvasIntegrated,
    refreshData,
  } = useAuth();

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    academic_year: "",
    academic_level: "",
    institution: "",
  });

  // Canvas connection form
  const [canvasForm, setCanvasForm] = useState({
    domain: "",
    access_token: "",
  });

  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        full_name: userProfile.full_name || "",
        academic_year: userProfile.academic_year?.toString() || "",
        academic_level: userProfile.academic_level || "",
        institution: userProfile.institution || "",
      });
    }
  }, [userProfile]);

  const showMessage = (type: "success" | "error" | "info", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;

    setIsLoading(true);
    try {
      const updateData: UserProfileUpdateData = {
        full_name: profileForm.full_name || undefined,
        academic_year: profileForm.academic_year
          ? parseInt(profileForm.academic_year)
          : null,
        academic_level: profileForm.academic_level || undefined,
        institution: profileForm.institution || undefined,
      };

      await updateUserProfile(firebaseUser.uid, updateData);
      await refreshData();
      showMessage("success", "Profile updated successfully!");
    } catch (error: any) {
      console.error("Profile update error:", error);
      showMessage("error", error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCanvasConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;

    setIsLoading(true);
    try {
      await connectCanvas(
        firebaseUser.uid,
        canvasForm.domain,
        canvasForm.access_token
      );
      await refreshData();
      setCanvasForm({ domain: "", access_token: "" });
      showMessage("success", "Canvas connected successfully!");
    } catch (error: any) {
      console.error("Canvas connection error:", error);
      showMessage("error", error.message || "Failed to connect Canvas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCanvasDisconnect = async () => {
    if (!firebaseUser) return;

    setIsLoading(true);
    try {
      await disconnectCanvas(firebaseUser.uid);
      await refreshData();
      showMessage("success", "Canvas disconnected successfully!");
    } catch (error: any) {
      console.error("Canvas disconnection error:", error);
      showMessage("error", error.message || "Failed to disconnect Canvas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCalendarConnect = () => {
    if (firebaseUser) {
      initiateGoogleCalendarAuth(firebaseUser.uid);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error: any) {
      console.error("Logout Error:", error);
      showMessage("error", "Failed to logout");
    }
  };

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex justify-center items-center pt-20">
        <p className="text-xl">Please log in to access settings.</p>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "integrations", label: "Integrations" },
    { id: "preferences", label: "Preferences" },
    { id: "account", label: "Account" },
  ];

  return (
    <div className="min-h-screen bg-black/[0.96] text-white pt-20 px-4 md:px-8 lg:px-16 md:pt-35 md:pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-900/50 border border-green-600 text-green-300"
              : message.type === "error"
              ? "bg-red-900/50 border border-red-600 text-red-300"
              : "bg-blue-900/50 border border-blue-600 text-blue-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-300"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Profile Information
              </h2>

              {/* Profile Summary */}
              <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  {userProfile?.avatar_url && (
                    <img
                      src={userProfile.avatar_url}
                      alt="Profile"
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-lg font-medium">
                      {userProfile?.full_name || "Name not set"}
                    </p>
                    <p className="text-gray-400">{userProfile?.email}</p>
                    <p className="text-sm text-indigo-300">
                      Credits: {credits || 0}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        full_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Academic Year
                    </label>
                    <input
                      type="number"
                      value={profileForm.academic_year}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          academic_year: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Academic Level
                    </label>
                    <select
                      value={profileForm.academic_level}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          academic_level: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select level</option>
                      <option value="High School">High School</option>
                      <option value="Undergraduate">Undergraduate</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Institution
                  </label>
                  <input
                    type="text"
                    value={profileForm.institution}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        institution: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your school/university"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  {isLoading ? "Updating..." : "Update Profile"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            {/* Canvas Integration */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Canvas LMS Integration
              </h2>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">Canvas Status</p>
                  <p
                    className={`text-sm ${
                      isCanvasIntegrated ? "text-green-400" : "text-gray-400"
                    }`}
                  >
                    {isCanvasIntegrated ? "Connected" : "Not Connected"}
                  </p>
                  {isCanvasIntegrated && userProfile?.canvas_domain && (
                    <p className="text-xs text-gray-500">
                      Domain: {userProfile.canvas_domain}
                    </p>
                  )}
                </div>

                {isCanvasIntegrated ? (
                  <button
                    onClick={handleCanvasDisconnect}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition duration-200"
                  >
                    Disconnect
                  </button>
                ) : null}
              </div>

              {!isCanvasIntegrated && (
                <form onSubmit={handleCanvasConnect} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Canvas Domain
                    </label>
                    <input
                      type="text"
                      value={canvasForm.domain}
                      onChange={(e) =>
                        setCanvasForm({ ...canvasForm, domain: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., myschool.instructure.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Access Token
                    </label>
                    <input
                      type="password"
                      value={canvasForm.access_token}
                      onChange={(e) =>
                        setCanvasForm({
                          ...canvasForm,
                          access_token: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter your Canvas API token"
                      required
                    />
                  </div>

                  <p className="text-sm text-gray-400">
                    To get your Canvas API token, go to your Canvas Account
                    Settings → "Approved Integrations" → "New Access Token"
                  </p>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 transition duration-200"
                  >
                    {isLoading ? "Connecting..." : "Connect Canvas"}
                  </button>
                </form>
              )}
            </div>

            {/* Google Calendar Integration */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Google Calendar Integration
              </h2>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">Calendar Status</p>
                  <p
                    className={`text-sm ${
                      isGoogleCalendarIntegrated
                        ? "text-green-400"
                        : "text-gray-400"
                    }`}
                  >
                    {isGoogleCalendarIntegrated ? "Connected" : "Not Connected"}
                  </p>
                </div>

                {!isGoogleCalendarIntegrated && (
                  <button
                    onClick={handleGoogleCalendarConnect}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200"
                  >
                    Connect Calendar
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-400">
                Connect your Google Calendar to sync events and create calendar
                entries from the app.
              </p>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Application Preferences
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-gray-400">
                      Currently using dark theme
                    </p>
                  </div>
                  <select className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="dark">Dark</option>
                    <option value="light" disabled>
                      Light (Coming Soon)
                    </option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-sm text-gray-400">
                      Receive notifications for assignments and deadlines
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div>
                    <p className="font-medium">Auto-sync Canvas</p>
                    <p className="text-sm text-gray-400">
                      Automatically sync assignments from Canvas
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Credits & Usage</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Available Credits</p>
                    <p className="text-sm text-gray-400">
                      Credits are used for AI-powered features
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-300">
                      {credits || 0}
                    </p>
                    <p className="text-sm text-gray-400">credits</p>
                  </div>
                </div>

                <div className="py-3">
                  <p className="text-sm text-gray-400">
                    Credits are consumed when using AI features like chat,
                    mindmaps, and resource generation. You can purchase
                    additional credits or upgrade to a premium plan for
                    unlimited usage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Account Information
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="font-medium">{userProfile?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Plan Type</p>
                    <p className="font-medium capitalize">
                      {userProfile?.plan_type || "Basic"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Member Since</p>
                    <p className="font-medium">
                      {userProfile?.created_at
                        ? new Date(userProfile.created_at).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Last Login</p>
                    <p className="font-medium">
                      {userProfile?.last_logged_in
                        ? new Date(
                            userProfile.last_logged_in
                          ).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-red-400">
                Danger Zone
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border border-red-800 rounded-lg px-4">
                  <div>
                    <p className="font-medium text-red-300">Sign Out</p>
                    <p className="text-sm text-gray-400">
                      Sign out of your account on this device
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200"
                  >
                    Sign Out
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border border-red-800 rounded-lg px-4">
                  <div>
                    <p className="font-medium text-red-300">Delete Account</p>
                    <p className="text-sm text-gray-400">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <button
                    disabled
                    className="px-4 py-2 bg-red-800 text-red-300 rounded cursor-not-allowed opacity-50"
                  >
                    Delete Account
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  Account deletion is currently not available. Please contact
                  support if you need to delete your account.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
