"use client";
import React, { useEffect, useState } from "react";
import { ResourceInfo } from "@/types/resources";
import ResourceCard from "@/components/ResourceCard";

const Resources = () => {
  const [resources, setResources] = useState<ResourceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const googleId = localStorage.getItem("google_id");

    const fetchResources = async () => {
      setIsLoading(true);
      setError(null);

      if (!googleId) {
        console.error(
          "Google ID not found in localStorage for fetching resources."
        );
        setError("User ID not found. Please log in again.");
        setIsLoading(false);
        return;
      }

      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${googleId}/resources/all`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched resources:", data);
        if (Array.isArray(data)) {
          setResources(data);
        } else {
          console.error("API did not return an array for resources:", data);
          setError("Received invalid data format from server.");
          setResources([]);
        }
      } catch (error) {
        console.error("Failed to fetch resources:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred."
        );
        setResources([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, []);

  const handleUpdateResourceName = async (
    resourceId: string,
    newName: string
  ) => {
    const googleId = localStorage.getItem("google_id");
    if (!googleId) {
      setError("User ID not found. Cannot update resource.");
      throw new Error("User ID not found");
    }

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${googleId}/resources/${resourceId}`;
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.description ||
          `API request failed with status ${response.status}`;
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const updatedResource = await response.json();
      console.log("Resource name updated:", updatedResource);

      setResources((currentResources) =>
        currentResources.map((r) =>
          r.id === resourceId ? { ...r, name: updatedResource.name } : r
        )
      );
      setError(null);
    } catch (error) {
      console.error("Failed to update resource name:", error);
      if (!error) {
        setError(
          error instanceof Error
            ? error.message
            : "An unknown error occurred during update."
        );
      }
      throw error;
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    const googleId = localStorage.getItem("google_id");
    if (!googleId) {
      setError("User ID not found. Cannot delete resource.");
      throw new Error("User ID not found");
    }

    const originalResources = [...resources];
    setResources((currentResources) =>
      currentResources.filter((r) => r.id !== resourceId)
    );
    setError(null);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${googleId}/resources/${resourceId}`;
      const response = await fetch(apiUrl, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.description ||
          `API request failed with status ${response.status}`;
        setError(errorMessage);
        setResources(originalResources);
        throw new Error(errorMessage);
      }

      console.log("Resource deleted successfully:", resourceId);
    } catch (error) {
      console.error("Failed to delete resource:", error);
      if (!error) {
        setError(
          error instanceof Error
            ? error.message
            : "An unknown error occurred during deletion."
        );
        setResources(originalResources);
      }
      throw error;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-white pt-25">My Resources</h1>

      {isLoading && <p className="text-gray-400">Loading resources...</p>}

      {error && (
        <p className="text-red-500 bg-red-100 border border-red-400 p-3 rounded mb-4">
          Error: {error}
        </p>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {resources.length > 0
            ? resources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onUpdateName={handleUpdateResourceName}
                  onDelete={handleDeleteResource}
                  onError={setError}
                />
              ))
            : !error && (
                <p className="text-gray-400 col-span-full">
                  No resources found.
                </p>
              )}
        </div>
      )}
    </div>
  );
};

export default Resources;
