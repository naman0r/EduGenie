"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TextNoteEditor from "@/components/TextNoteEditor";
import MindmapDisplay from "@/components/MindmapDisplay";
import FlashcardEditor from "@/components/FlashcardEditor";
import { ResourceInfo } from "@/types/resources";

import { useAuth } from "@/context/AuthContext";
// Define a more specific type for the fetched resource, including content
interface DetailedResourceInfo extends ResourceInfo {
  content: any; // Or a more specific type based on potential content structures
  class_name?: string;
}

const ResourceDetailPage = () => {
  const { firebaseUser } = useAuth();
  const params = useParams();
  const resourceId = params.id as string;
  const [resource, setResource] = useState<DetailedResourceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get userId from localStorage on the client side
    if (firebaseUser) {
      setUserId(firebaseUser.uid);
    } else {
      setError("User not logged in.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!resourceId) {
      setError("Resource ID missing from URL.");
      setIsLoading(false);
      return;
    }

    const fetchResource = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${firebaseUser?.uid}/resources/${resourceId}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Resource not found.");
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail ||
              `Failed to fetch resource: ${response.statusText}`
          );
        }

        const data: DetailedResourceInfo = await response.json();
        setResource(data);
      } catch (err: any) {
        console.error("Error fetching resource:", err);
        setError(
          err.message ||
            "An unknown error occurred while fetching the resource."
        );
        setResource(null); // Clear resource on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchResource();
  }, [resourceId, userId]); // Re-fetch if resourceId or userId changes

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-white">
        Loading resource details...
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-red-400 p-8">
        <p className="text-xl">Error loading resource:</p>
        <p className="mt-2 bg-red-900/50 p-3 rounded border border-red-700">
          {error}
        </p>
      </div>
    );
  }

  // Handle resource not found or not loaded
  if (!resource) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-400">
        Resource data could not be loaded.
      </div>
    );
  }

  // Render content based on resource type
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 text-white">
      <h1 className="text-3xl font-bold mb-2">{resource.name}</h1>
      <p className="text-sm text-indigo-300 mb-1">Type: {resource.type}</p>
      {resource.class_name && (
        <p className="text-sm text-gray-400 mb-4">
          Class: {resource.class_name}
        </p>
      )}

      {/* Conditional Rendering based on type */}
      {resource.type === "Text notes" && userId ? (
        <TextNoteEditor
          initialContent={
            typeof resource.content === "string"
              ? resource.content
              : JSON.stringify(resource.content || "")
          }
          resourceId={resource.id}
          userId={userId}
        />
      ) : resource.type === "Mindmap" && userId ? (
        <MindmapDisplay
          initialNodes={resource.content?.nodes || []}
          initialEdges={resource.content?.edges || []}
          resourceId={resource.id}
        />
      ) : resource.type === "flashcards" && userId ? (
        <FlashcardEditor
          initialContent={resource.content || { cards: [] }}
          resourceId={resource.id}
          userId={userId}
        />
      ) : (
        <div className="mt-4 p-4 border border-gray-700 rounded-lg bg-gray-800/60">
          <h3 className="text-lg font-semibold mb-2">Resource Content</h3>
          <pre className="text-gray-300 whitespace-pre-wrap break-words">
            {JSON.stringify(resource.content, null, 2)}
          </pre>
          {resource.type !== "Text notes" &&
            resource.type !== "Mindmap" &&
            resource.type !== "flashcards" && (
              <p className="mt-4 text-sm text-yellow-400">
                Display/Editing for '{resource.type}' type is not yet supported.
              </p>
            )}
        </div>
      )}
    </div>
  );
};

export default ResourceDetailPage;
