"use client";

import React from "react";
import { useParams } from "next/navigation";

export default function ClassDetailsPage() {
  const params = useParams();
  // The param name ([classId]) should match the directory name
  const classId = params.classId;

  // Basic loading/error state could be added here later
  if (!classId) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex justify-center items-center">
        Loading class details...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/[0.96] text-white pt-20 px-4 md:px-8 lg:px-16">
      <h1 className="text-3xl font-bold mb-6">Class Details</h1>
      <div className="bg-gray-800/50 p-6 rounded-lg shadow-xl">
        <p>Displaying details for Class ID:</p>
        {/* Display the class ID - ensure it's a string or handle arrays if needed */}
        <p className="text-xl font-mono text-indigo-300 break-all">
          {Array.isArray(classId) ? classId.join(", ") : classId}
        </p>

        {/* Placeholder for actual class content fetching and display */}
        <p className="mt-4 text-gray-400">
          [Future content for this class will go here - e.g., syllabus upload,
          notes, etc.]
        </p>
      </div>
    </div>
  );
}
