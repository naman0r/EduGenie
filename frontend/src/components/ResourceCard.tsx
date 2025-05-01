"use client";
import React, { useState, MouseEvent } from "react";
import Link from "next/link";
import { ResourceInfo } from "@/types/resources";
import { FaEdit, FaSave, FaTimes, FaTrash } from "react-icons/fa";

interface ResourceCardProps {
  resource: ResourceInfo;
  onUpdateName: (resourceId: string, newName: string) => Promise<void>; // Make async to handle errors
  onDelete: (resourceId: string) => Promise<void>; // Add onDelete prop
  onError: (message: string | null) => void; // Pass error handler
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onUpdateName,
  onDelete,
  onError,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(resource.name);

  const startEditing = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setTempName(resource.name); // Reset temp name to current actual name
    setIsEditing(true);
    onError(null); // Clear any previous errors
  };

  const cancelEditing = (
    e: MouseEvent<HTMLButtonElement | HTMLInputElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(false);
    setTempName(resource.name); // Reset temp name
    onError(null); // Clear any errors shown during edit attempt
  };

  const saveEditing = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmedName = tempName.trim();
    if (!trimmedName) {
      onError("Resource name cannot be empty.");
      return; // Don't close editing mode
    }
    if (trimmedName === resource.name) {
      setIsEditing(false); // No change, just exit editing
      onError(null);
      return;
    }

    try {
      await onUpdateName(resource.id, trimmedName);
      setIsEditing(false); // Exit editing mode on successful update
      onError(null); // Clear error on success
    } catch (error) {
      // Error state is handled by the parent via onUpdateName,
      // but we keep the editing mode active here so the user can retry/cancel.
      // onError is already called within the parent's handleUpdateResourceName catch block
      console.error(
        "Save failed in card, error should be displayed by parent."
      );
    }
  };

  const handleDeleteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Stop propagation to prevent link navigation
    if (
      window.confirm(
        `Are you sure you want to delete "${resource.name}"? This action cannot be undone.`
      )
    ) {
      onError(null);
      onDelete(resource.id).catch(() => {
        console.error("Deletion failed, error set by parent.");
      });
    }
  };

  const handleEditClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Stop propagation to prevent link navigation
    startEditing(e); // Call the original startEditing logic
  };

  // Handle clicks on the input itself to prevent navigation
  const handleInputClick = (e: MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      key={resource.id}
      className="bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow duration-200 ease-in-out relative min-h-[120px]"
    >
      {isEditing ? (
        // --- Editing State ---
        <>
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onClick={handleInputClick} // Prevent Link navigation
            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 mb-2 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEditing(e as any);
              if (e.key === "Escape") cancelEditing(e as any);
            }} // Keyboard shortcuts
          />
          {/* Position buttons at bottom-right for editing state */}
          <div className="flex justify-end space-x-2 mt-1 absolute bottom-4 right-4">
            {" "}
            {/* Position buttons */}
            <button
              onClick={saveEditing}
              className="text-green-400 hover:text-green-300 p-1"
              title="Save Name"
            >
              <FaSave />
            </button>
            <button
              onClick={cancelEditing}
              className="text-gray-400 hover:text-white p-1" // Changed color for consistency
              title="Cancel Edit"
            >
              <FaTimes />
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Content goes here, positioned relative within the card */}
          <h2
            className="text-sky-100 font-semibold mb-2 truncate pr-16 relative z-10 " // Ensure z-index, add padding for buttons
            title={resource.name}
          >
            {resource.name}
          </h2>

          {/* Type text absolutely positioned at bottom-left */}
          <p className="text-sm text-gray-400 absolute bottom-4 left-4 z-10">
            Type:{" "}
            <span className="font-medium text-gray-300">{resource.type}</span>
          </p>

          {/* Buttons absolutely positioned at top-right */}
          <div className="absolute top-3 right-3 flex space-x-1 z-20">
            {" "}
            {/* Higher z-index for buttons */}
            <button
              onClick={handleEditClick} // Use handler that stops propagation
              className="text-gray-400 hover:text-white p-1"
              title="Edit Name"
            >
              <FaEdit />
            </button>
            <button
              onClick={handleDeleteClick} // Use handler that stops propagation
              className="text-red-500 hover:text-red-400 p-1"
              title="Delete Resource"
            >
              <FaTrash />
            </button>
          </div>

          {/* legacyBehavior tag required to get rid of the stupid hydration error */}
          <Link href={`/resources/${resource.id}`} legacyBehavior>
            <a
              className="block w-full h-full absolute top-0 left-0 z-0"
              aria-hidden="true"
            ></a>
          </Link>
        </>
      )}
    </div>
  );
};

export default ResourceCard;
