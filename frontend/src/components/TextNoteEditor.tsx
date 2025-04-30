"use client";

import React, { useState, useEffect, useCallback } from "react";

interface TextNoteEditorProps {
  initialContent: string;
  resourceId: string;
  userId: string;
  onSaveSuccess?: (updatedContent: string) => void; // Optional callback on successful save
}

const TextNoteEditor: React.FC<TextNoteEditorProps> = ({
  initialContent,
  resourceId,
  userId,
  onSaveSuccess,
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null); // To show feedback like "Saved!"

  // Update local state if initialContent prop changes (e.g., fetched data updates)
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setSaveStatus(null);

    try {
      const response = await fetch(
        `http://localhost:8000/users/${userId}/resources/${resourceId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Failed to save note." }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const updatedResource = await response.json();
      // Update local state with potentially processed content from backend (if applicable)
      setContent(updatedResource.content);
      setSaveStatus("Saved successfully!");
      if (onSaveSuccess) {
        onSaveSuccess(updatedResource.content);
      }
      // Clear the status message after a delay
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error("Failed to save text note:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  }, [content, resourceId, userId, onSaveSuccess]);

  return (
    <div className="mt-4 p-4 border border-gray-700 rounded-lg bg-gray-900/50">
      <h3 className="text-lg font-semibold mb-3 text-white">
        Edit Note Content
      </h3>
      {error && (
        <p className="text-red-500 text-sm mb-3 bg-red-100 border border-red-400 p-2 rounded">
          Error: {error}
        </p>
      )}
      {saveStatus && (
        <p className="text-green-500 text-sm mb-3 bg-green-100 border border-green-400 p-2 rounded">
          {saveStatus}
        </p>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={15}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-white placeholder-gray-500"
        placeholder="Start typing your notes here..."
      />
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || content === initialContent} // Disable if saving or no changes
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default TextNoteEditor;
