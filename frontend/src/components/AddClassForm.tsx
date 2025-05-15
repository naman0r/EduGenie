"use client";

import React, { useState } from "react";

// Payload for creating a class
interface AddClassPayload {
  // Renamed from ClassFormData
  name: string;
  code?: string;
  instructor?: string;
}

// CreatedClassData interface removed as it's no longer handled here

interface AddClassFormProps {
  // userId prop removed
  // onClassAdded prop removed
  onSubmitClass: (classDetails: AddClassPayload) => Promise<void>; // New prop for submission logic
  onCancel: () => void;
  formError?: string | null; // Optional: To display errors from parent submission call
}

const AddClassForm: React.FC<AddClassFormProps> = ({
  onSubmitClass, // Destructure new prop
  onCancel,
  formError, // Destructure new prop
}) => {
  const [formData, setFormData] = useState<AddClassPayload>({ name: "" }); // Use AddClassPayload
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null); // Renamed error to validationError for clarity

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      // Store empty optional fields as undefined, or trim non-empty ones
      [name]: value.trim() === "" ? undefined : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      // Ensure name is not just spaces
      setValidationError("Class Name is required.");
      return;
    }
    setValidationError(null); // Clear local validation error

    setIsLoading(true);

    // Prepare data for submission, ensuring name is trimmed
    // Optional fields are already handled by handleInputChange to be undefined if empty
    const submissionData: AddClassPayload = {
      name: formData.name.trim(),
      code: formData.code?.trim() || undefined, // Ensure empty strings become undefined
      instructor: formData.instructor?.trim() || undefined, // Ensure empty strings become undefined
    };

    try {
      await onSubmitClass(submissionData); // Call the passed-in submission handler
      // onCancel(); // The parent (DashboardPage) closes the form on successful addClass context call.
      // If not, onCancel can be called here too. Dashboard already hides it.
    } catch (err: any) {
      // Error is now handled by DashboardPage which passes it via formError prop if needed.
      // This component doesn't need to set its own error state from the submission promise,
      // as DashboardPage will re-render it with the formError prop.
      // However, logging it here can be useful for debugging during development.
      console.error(
        "AddClassForm: onSubmitClass failed internally within AddClassForm scope (should be caught by parent):",
        err
      );
      // If onSubmitClass throws, isLoading might need to be reset if not unmounted.
    } finally {
      setIsLoading(false); // Reset loading state regardless of success/failure of the passed function
      // Parent component (DashboardPage) will handle UI changes based on the promise outcome of addClass
    }
  };

  // Determine which error to display: parent's error takes precedence
  const displayError = formError || validationError;

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

          {displayError && (
            <p className="text-red-500 text-sm">{displayError}</p>
          )}

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
