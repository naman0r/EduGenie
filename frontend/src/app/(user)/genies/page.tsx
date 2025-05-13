"use client";

import React, {
  useState,
  useEffect,
  useRef,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button"; // Removed Shadcn
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card"; // Removed Shadcn
import Link from "next/link";
import { formatDistanceToNow } from "date-fns"; // For relative time
import { Pencil, Trash2, Check, X } from "lucide-react"; // Import icons

// Removed placeholder useAuth hook
// const useAuth = () => ({ user: { google_id: "test-user-id" } });

interface Genie {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// --- Skeleton Component (Updated Styling) ---
const SkeletonCard: React.FC = () => (
  <div className="h-28 rounded-lg border border-slate-700 bg-slate-800/50 p-4 shadow-sm animate-pulse flex flex-col justify-between">
    <div>
      <div className="h-5 bg-slate-700 rounded w-3/4 mb-3"></div>{" "}
      {/* Title placeholder */}
      <div className="h-4 bg-slate-700 rounded w-1/2"></div>{" "}
      {/* Subtitle placeholder */}
    </div>
    <div className="h-3 bg-slate-700 rounded w-1/4 self-end"></div>{" "}
    {/* Date placeholder */}
  </div>
);

const GeniesPage: React.FC = () => {
  const [genies, setGenies] = useState<Genie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCreate, setIsLoadingCreate] = useState(false); // Separate loading state for create
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // We will get google_id from localStorage inside functions

  // State for Edit/Delete
  const [editingGenieId, setEditingGenieId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingGenieId, setDeletingGenieId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false); // Loading state for PUT/DELETE

  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingGenieId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select(); // Select text for easy replacement
    }
  }, [editingGenieId]);

  // --- Fetch Genies ---
  useEffect(() => {
    const googleId = localStorage.getItem("google_id"); // Get from local storage
    if (!googleId) {
      setError("User not logged in. Please log in to view Genies.");
      setIsLoading(false);
      return;
    }

    const fetchGenies = async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (!backendUrl) {
          throw new Error("Backend URL environment variable not set.");
        }
        const response = await fetch(`${backendUrl}/genie/users/${id}`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch genies (${response.status}): ${response.statusText}`
          );
        }
        const data: Genie[] = await response.json();
        setGenies(data);
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching genies.");
        console.error("Fetch Genies Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGenies(googleId);
  }, []); // Only run once on mount

  // --- Handle New Genie Creation ---
  const handleNewGenie = async () => {
    const googleId = localStorage.getItem("google_id"); // Get from local storage
    if (!googleId) {
      setError("User not logged in. Cannot create Genie.");
      console.error("Create Genie Error: google_id not found in localStorage.");
      return;
    }

    console.log("Attempting to create new Genie for user:", googleId);
    setIsLoadingCreate(true); // Use separate loading state
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        throw new Error("Backend URL environment variable not set.");
      }
      const apiUrl = `${backendUrl}/genie/users/${googleId}`;
      console.log("Calling API:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // Creates with default name "New Genie"
      });

      console.log("API Response Status:", response.status);
      const responseText = await response.text(); // Read response body once
      console.log("API Response Body:", responseText);

      if (!response.ok) {
        // Try to parse error from backend if JSON, otherwise use text
        let errorDetails = responseText;
        try {
          const errorJson = JSON.parse(responseText);
          errorDetails =
            errorJson.description || errorJson.error || responseText;
        } catch (parseError) {
          /* Ignore if not JSON */
        }
        throw new Error(
          `Failed to create genie (${response.status}): ${errorDetails}`
        );
      }

      const newGenie: Genie = JSON.parse(responseText); // Parse the successful response
      console.log("New Genie created:", newGenie);
      router.push(`/genies/${newGenie.id}`);
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the genie.");
      console.error("Create Genie Error:", err);
    } finally {
      setIsLoadingCreate(false); // Stop loading create state
    }
  };

  // --- Edit Handlers ---
  const handleStartEdit = (genie: Genie) => {
    console.log("Starting edit for:", genie.id); // Log
    setEditingGenieId(genie.id);
    setEditingName(genie.name || "");
    setDeletingGenieId(null); // Cancel delete if editing
  };

  const handleCancelEdit = () => {
    console.log("Canceling edit"); // Log
    setEditingGenieId(null);
    setEditingName("");
  };

  // Ensure onChange updates state
  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Log
    setEditingName(event.target.value);
  };

  const handleSaveName = async () => {
    if (!editingGenieId || !editingName.trim()) {
      handleCancelEdit();
      return;
    }
    const originalGenie = genies.find((g) => g.id === editingGenieId);
    if (originalGenie?.name === editingName.trim()) {
      handleCancelEdit();
      return; // No change
    }

    const googleId = localStorage.getItem("google_id");
    if (!googleId) {
      setError("Login required");
      return;
    }

    setIsUpdating(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) throw new Error("Backend URL not set.");
      const response = await fetch(`${backendUrl}/genie/${editingGenieId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Google-ID": googleId,
        }, // Pass user ID
        body: JSON.stringify({ name: editingName.trim() }),
      });
      const responseText = await response.text();
      if (!response.ok) {
        let details = responseText;
        try {
          details = JSON.parse(responseText).description || details;
        } catch (e) {}
        throw new Error(`Update failed (${response.status}): ${details}`);
      }
      const updatedGenie: Genie = JSON.parse(responseText);
      setGenies((prev) =>
        prev.map((g) => (g.id === editingGenieId ? updatedGenie : g))
      );
      handleCancelEdit(); // Exit edit mode
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsUpdating(false);
      handleCancelEdit(); // Ensure edit mode is exited even on error
    }
  };

  const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSaveName();
    } else if (event.key === "Escape") {
      handleCancelEdit();
    }
  };

  // --- Delete Handlers ---
  const handleStartDelete = (genieId: string) => {
    console.log("Starting delete for:", genieId); // Log
    setDeletingGenieId(genieId);
    setEditingGenieId(null); // Cancel edit if deleting
  };

  const handleCancelDelete = () => {
    console.log("Canceling delete"); // Log
    setDeletingGenieId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingGenieId) return;
    const googleId = localStorage.getItem("google_id");
    if (!googleId) {
      setError("Login required");
      return;
    }

    console.log(`Confirming delete for: ${deletingGenieId}`); // Log
    setIsUpdating(true);
    setError(null);
    const genieToDeleteId = deletingGenieId; // Store ID before clearing state
    setDeletingGenieId(null); // Clear confirmation prompt immediately

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) throw new Error("Backend URL not set.");
      const response = await fetch(`${backendUrl}/genie/${genieToDeleteId}`, {
        method: "DELETE",
        headers: { "X-Google-ID": googleId }, // Pass user ID for ownership check
      });
      if (!response.ok) {
        const responseText = await response.text();
        let details = responseText;
        try {
          details = JSON.parse(responseText).description || details;
        } catch (e) {}
        throw new Error(`Delete failed (${response.status}): ${details}`);
      }
      // Remove from UI
      setGenies((prev) => prev.filter((g) => g.id !== genieToDeleteId));
      console.log(`Successfully deleted genie ${genieToDeleteId}`); // Log success
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    // Use a dark background, ensure full height, add padding
    <div className="flex flex-col min-h-screen p-6 md:p-8 bg-gradient-to-b from-gray-900 to-black text-slate-100">
      {/* Adjusted padding top to pt-20 assuming a fixed header */}
      <div className="w-full max-w-6xl mx-auto flex-grow pt-20">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Your Genies
          </h1>
          <button
            onClick={handleNewGenie}
            disabled={isLoadingCreate}
            // Style button like the inspiration image
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {isLoadingCreate ? "Creating..." : "+ New Genie"}
          </button>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-900/30 border border-red-700 rounded-md text-red-300">
            <p className="font-medium">Error:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-grow">
          {isLoading ? (
            // Loading Skeletons Grid
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : genies.length === 0 && !error ? (
            // No Genies Message - Centered
            <div className="flex items-center justify-center h-64 text-slate-400">
              <p className="text-lg text-center">
                You haven't created any Genies yet. <br />
                Click "+ New Genie" to start!
              </p>
            </div>
          ) : (
            // Genies List Grid
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {genies.map((genie) => (
                <div key={genie.id} className="relative group">
                  {" "}
                  {/* Parent container for positioning */}
                  {/* Link now directly wraps the card visuals */}
                  <Link
                    href={
                      editingGenieId === genie.id ||
                      deletingGenieId === genie.id
                        ? "#" // Prevent navigation during edit/delete states
                        : `/genies/${genie.id}`
                    }
                    // Remove legacyBehavior
                    // Add necessary classes directly to Link if needed for styling/layout
                    className={`block cursor-pointer ${
                      editingGenieId === genie.id ||
                      deletingGenieId === genie.id
                        ? "cursor-default" // Change cursor when link is inactive
                        : ""
                    }`}
                    // Prevent link navigation if clicking on buttons inside (though buttons are now outside)
                    onClick={(e) => {
                      if (
                        editingGenieId === genie.id ||
                        deletingGenieId === genie.id
                      ) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div
                      className={`h-full flex flex-col justify-between bg-slate-800/50 border text-slate-100 rounded-lg p-4 shadow-lg transition-all duration-200 ease-in-out group-hover:bg-slate-800 group-hover:shadow-indigo-900/30 ${
                        editingGenieId === genie.id
                          ? "border-indigo-500" // Highlight when editing
                          : deletingGenieId === genie.id
                          ? "border-red-500" // Highlight when deleting
                          : "border-slate-700 group-hover:border-indigo-500/70" // Default hover
                      }`}
                    >
                      {/* Card Content Top */}
                      <div>
                        {editingGenieId === genie.id ? (
                          // Edit State: Input field - Now definitely inside the Link area but interaction handled by buttons outside
                          <div className="mb-2 relative z-0">
                            {" "}
                            {/* Ensure input doesn't overlap buttons */}
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editingName}
                              onChange={handleNameChange} // Keep this
                              onKeyDown={handleEditKeyDown} // Keep this
                              disabled={isUpdating}
                              // REMOVED onClick stopPropagation - might not be needed if buttons are correctly positioned outside
                              className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-lg font-semibold text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            />
                          </div>
                        ) : (
                          // Default State: Display name
                          <h2 className="font-semibold text-lg text-white truncate mb-2 group-hover:text-indigo-400 transition-colors">
                            {genie.name || "Untitled Genie"}
                          </h2>
                        )}
                        {/* Optional subtitle area */}
                      </div>

                      {/* Delete Confirmation State or Timestamp */}
                      {
                        deletingGenieId === genie.id ? (
                          // Delete confirmation is now separate from action buttons below
                          <div className="mt-3 text-center z-0">
                            {" "}
                            {/* Ensure this doesn't overlap buttons */}
                            <p className="text-sm text-red-400 mb-2">
                              Delete this Genie?
                            </p>
                            {/* Delete confirmation buttons are handled by the absolute positioned block below */}
                          </div>
                        ) : editingGenieId !== genie.id ? ( // Only show timestamp if not editing
                          // Default State: Timestamp
                          <div className="text-right text-xs text-slate-500 mt-3 z-0">
                            {" "}
                            {/* Ensure this doesn't overlap buttons */}
                            Updated{" "}
                            {formatDistanceToNow(new Date(genie.updated_at), {
                              addSuffix: true,
                            })}
                          </div>
                        ) : (
                          <div className="h-4 mt-3"></div>
                        ) /* Placeholder height during edit */
                      }
                    </div>
                  </Link>
                  {/* --- Action Buttons Overlay --- */}
                  {/* Placed outside the Link, positioned absolutely relative to the parent div */}
                  {/* Apply z-index here to ensure they are clickable */}
                  <div className="absolute top-2 right-2 z-10">
                    {editingGenieId === genie.id ? (
                      // Buttons for Save/Cancel Edit
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveName();
                          }} // Add stopPropagation
                          disabled={isUpdating}
                          className="p-1 bg-green-600/80 hover:bg-green-500 rounded text-white disabled:opacity-50"
                          title="Save Name"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }} // Add stopPropagation
                          disabled={isUpdating}
                          className="p-1 bg-slate-500/80 hover:bg-slate-400 rounded text-white disabled:opacity-50"
                          title="Cancel Edit"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : deletingGenieId === genie.id ? (
                      // Buttons for Confirm/Cancel Delete
                      <div className="flex flex-col items-end space-y-1">
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmDelete();
                            }} // Add stopPropagation
                            disabled={isUpdating}
                            className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded text-white disabled:opacity-50"
                          >
                            {isUpdating ? "Deleting..." : "Yes, Delete"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelDelete();
                            }} // Add stopPropagation
                            disabled={isUpdating}
                            className="px-2 py-1 text-xs bg-slate-500 hover:bg-slate-600 rounded text-white disabled:opacity-50"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Buttons for Start Edit/Delete (only show on hover if not editing/deleting)
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(genie);
                          }} // Add stopPropagation
                          className="p-1 bg-slate-600/70 hover:bg-indigo-600 rounded text-slate-300 hover:text-white"
                          title="Edit Name"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartDelete(genie.id);
                          }} // Add stopPropagation
                          className="p-1 bg-slate-600/70 hover:bg-red-600 rounded text-slate-300 hover:text-white"
                          title="Delete Genie"
                        >
                          <Trash2 size={16} /> {/* Removed z-100 from icon */}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeniesPage;
