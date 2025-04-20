"use client";

import React, { useState } from "react";

// Define the shape of the class data being created (matches backend ClassCreate)
interface ClassFormData {
  name: string;
  code?: string;
  instructor?: string;
}

// Define the shape of the created class data returned from backend (matches backend ClassInfo)
interface CreatedClassData {
  id: string; // Assuming UUID comes as string
  user_id: string;
  name: string;
  code?: string | null;
  instructor?: string | null;
  created_at: string; // Assuming timestamp comes as string
}

interface AddClassFormProps {
  userId: string; // Pass the google_id of the logged-in user
  onClassAdded: (newClass: CreatedClassData) => void; // Callback after successful creation
  onCancel: () => void; // Callback to hide the form
}

const AddClassForm: React.FC<AddClassFormProps> = ({
  userId,
  onClassAdded,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ClassFormData>({ name: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || undefined, // Store empty optional fields as undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Class Name is required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/users/${userId}/classes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // Send only non-empty optional fields
          body: JSON.stringify({
            name: formData.name.trim(),
            ...(formData.code?.trim() && { code: formData.code.trim() }),
            ...(formData.instructor?.trim() && {
              instructor: formData.instructor.trim(),
            }),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Failed to add class. Please try again." }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const newClass: CreatedClassData = await response.json();
      onClassAdded(newClass); // Pass the new class data back to the parent
      // Optionally reset form or just rely on parent hiding it
      // setFormData({ name: '' });
    } catch (err: any) {
      console.error("Failed to add class:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md relative transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-fade-in-scale">
        <button
          onClick={onCancel}
          className="absolute top-2 right-3 text-gray-400 hover:text-white text-2xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4 text-white">Add New Class</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Class Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-white"
              placeholder="e.g., Introduction to Programming"
            />
          </div>
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Class Code (Optional)
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-white"
              placeholder="e.g., CS 101"
            />
          </div>
          <div>
            <label
              htmlFor="instructor"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Instructor (Optional)
            </label>
            <input
              type="text"
              id="instructor"
              name="instructor"
              value={formData.instructor || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-white"
              placeholder="e.g., Dr. Smith"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
            >
              {isLoading ? "Adding..." : "Add Class"}
            </button>
          </div>
        </form>
      </div>
      {/* Add CSS for animation if not using Tailwind JIT animations */}
      <style jsx global>{`
        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AddClassForm;
