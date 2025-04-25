"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ResourceInfo } from "@/types/resources";

const Resources = () => {
  const [resources, setResources] = useState<ResourceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state

  useEffect(() => {
    // Use the correct key from localStorage
    const googleId = localStorage.getItem("google_id");

    const fetchResources = async () => {
      setIsLoading(true); // Start loading
      setError(null); // Clear previous errors

      if (!googleId) {
        console.error(
          "Google ID not found in localStorage for fetching resources."
        );
        setError("User ID not found. Please log in again.");
        setIsLoading(false);
        return;
      }

      try {
        const apiUrl = `http://localhost:8000/users/${googleId}/resources/all`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched resources:", data);
        // Basic validation: Check if data is an array
        if (Array.isArray(data)) {
          setResources(data);
        } else {
          console.error("API did not return an array for resources:", data);
          setError("Received invalid data format from server.");
          setResources([]); // Set to empty array on error
        }
      } catch (error) {
        console.error("Failed to fetch resources:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred."
        );
        setResources([]); // Clear resources on error
      } finally {
        setIsLoading(false); // Stop loading regardless of outcome
      }
    };

    fetchResources();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-white">My Resources</h1>

      {isLoading && <p className="text-gray-400">Loading resources...</p>}

      {error && (
        <p className="text-red-500 bg-red-100 border border-red-400 p-3 rounded">
          Error: {error}
        </p>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {resources.length > 0 ? (
            resources.map((resource) => (
              <Link href={`/resources/${resource.id}`} key={resource.id}>
                <div className="bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow duration-200 ease-in-out">
                  <h2
                    className="text-xl font-semibold text-white mb-2 truncate"
                    title={resource.name}
                  >
                    {resource.name}
                  </h2>
                  <p className="text-sm text-gray-400 mb-3">
                    Type:{" "}
                    <span className="font-medium text-gray-300">
                      {resource.type}
                    </span>
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-400 col-span-full">No resources found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Resources;
