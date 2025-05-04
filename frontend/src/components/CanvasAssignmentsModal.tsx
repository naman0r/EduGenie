import React, { useState, useEffect } from "react";

interface CanvasAssignment {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  html_url: string;
  submission_types: string[];
  points_possible: number | null;
}

interface CanvasAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  classId: string;
  canvasCourseId: number;
  onImportSuccess: () => void;
}

const CanvasAssignmentsModal: React.FC<CanvasAssignmentsModalProps> = ({
  isOpen,
  onClose,
  userId,
  classId,
  canvasCourseId,
  onImportSuccess,
}) => {
  const [assignments, setAssignments] = useState<CanvasAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fetch assignments from Canvas
  useEffect(() => {
    if (!isOpen || !canvasCourseId) return;

    const fetchAssignments = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/canvas/assignments/${canvasCourseId}?google_id=${userId}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to fetch Canvas assignments"
          );
        }

        const data = await response.json();
        setAssignments(data);
      } catch (err: any) {
        console.error("Error fetching Canvas assignments:", err);
        setError(err.message || "Failed to fetch Canvas assignments");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [isOpen, canvasCourseId, userId]);

  // Toggle assignment selection
  const toggleAssignment = (assignmentId: number) => {
    setSelectedAssignments((prev) => {
      if (prev.includes(assignmentId)) {
        return prev.filter((id) => id !== assignmentId);
      } else {
        return [...prev, assignmentId];
      }
    });
  };

  // Select all assignments
  const selectAll = () => {
    if (selectedAssignments.length === assignments.length) {
      setSelectedAssignments([]);
    } else {
      setSelectedAssignments(assignments.map((assignment) => assignment.id));
    }
  };

  // Import selected assignments
  const handleImport = async () => {
    if (selectedAssignments.length === 0) {
      setError("Please select at least one assignment to import");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/classes/${classId}/canvas/import-assignments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            google_id: userId,
            assignment_ids: selectedAssignments,
          }),
        }
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Server error: ${response.status}`
          );
        } else {
          const errorText = await response.text();
          throw new Error(
            `Failed to import assignments (${
              response.status
            }): ${errorText.substring(0, 100)}`
          );
        }
      }

      const result = await response.json();
      console.log("Import successful:", result);
      onImportSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error importing assignments:", err);
      setError(
        err.message || "Failed to import assignments. Please try again."
      );
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            Import Assignments from Canvas
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={importing}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              <svg
                className="animate-spin h-8 w-8 mx-auto mb-4 text-indigo-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading assignments from Canvas...
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700 rounded-md p-4 text-center text-red-300">
              {error}
              <button
                onClick={onClose}
                className="block mx-auto mt-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No upcoming assignments found in Canvas.
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <button
                  onClick={selectAll}
                  className="text-sm text-indigo-400 hover:text-indigo-300"
                >
                  {selectedAssignments.length === assignments.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <span className="text-sm text-gray-400">
                  {selectedAssignments.length} of {assignments.length} selected
                </span>
              </div>

              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`p-4 rounded-md border transition-colors ${
                      selectedAssignments.includes(assignment.id)
                        ? "bg-indigo-900/20 border-indigo-700"
                        : "bg-gray-700/30 border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id={`assignment-${assignment.id}`}
                        checked={selectedAssignments.includes(assignment.id)}
                        onChange={() => toggleAssignment(assignment.id)}
                        className="mr-3 mt-1"
                      />
                      <div className="flex-grow">
                        <label
                          htmlFor={`assignment-${assignment.id}`}
                          className="block text-lg font-medium text-white mb-1 cursor-pointer"
                        >
                          {assignment.title}
                        </label>

                        <div className="text-sm text-gray-400">
                          Due:{" "}
                          <span className="text-gray-300">
                            {formatDate(assignment.due_date)}
                          </span>
                        </div>

                        {assignment.points_possible && (
                          <div className="text-sm text-gray-400 mt-1">
                            Points:{" "}
                            <span className="text-gray-300">
                              {assignment.points_possible}
                            </span>
                          </div>
                        )}

                        <a
                          href={assignment.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline mt-2 inline-block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View in Canvas
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-700 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            disabled={importing}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedAssignments.length === 0 || importing}
          >
            {importing
              ? "Importing..."
              : `Import ${selectedAssignments.length} Assignment${
                  selectedAssignments.length !== 1 ? "s" : ""
                }`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvasAssignmentsModal;
