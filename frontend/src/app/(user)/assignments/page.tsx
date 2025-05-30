"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAllUpcomingAssignments } from "@/services/canvas";
import { CanvasAssignment } from "@/types/assignment";

const AssignmentsPage: React.FC = () => {
  const { firebaseUser, isCanvasIntegrated } = useAuth();
  const [assignments, setAssignments] = useState<CanvasAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!firebaseUser || !isCanvasIntegrated) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const assignmentsData = await getAllUpcomingAssignments(
          firebaseUser.uid
        );
        setAssignments(assignmentsData);
      } catch (err: any) {
        console.error("Failed to fetch assignments:", err);
        setError(err.message || "Failed to fetch assignments");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [firebaseUser, isCanvasIntegrated]);

  const formatDueDate = (dueDateString: string | null): string => {
    if (!dueDateString) return "No due date";

    const dueDate = new Date(dueDateString);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue (${Math.abs(diffDays)} days ago)`;
    } else if (diffDays === 0) {
      return "Due today";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return dueDate.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  const getDueDateColor = (dueDateString: string | null): string => {
    if (!dueDateString) return "text-gray-500";

    const dueDate = new Date(dueDateString);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "text-red-400";
    } else if (diffDays <= 1) {
      return "text-orange-400";
    } else if (diffDays <= 3) {
      return "text-yellow-400";
    } else {
      return "text-green-400";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex justify-center items-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p>Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex flex-col justify-center items-center pt-20">
        <p className="text-xl mb-4">Please log in to view your assignments.</p>
      </div>
    );
  }

  if (!isCanvasIntegrated) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex flex-col justify-center items-center pt-20 px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Canvas Not Connected</h2>
          <p className="text-gray-300 mb-6">
            To view your assignments, please connect your Canvas account in your
            profile settings.
          </p>
          <a
            href="/settings"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg"
          >
            Go to Settings
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex flex-col justify-center items-center pt-20 px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">
            Error Loading Assignments
          </h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/[0.96] text-white pt-20 px-4 md:px-8 lg:px-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Assignments</h1>
        <div className="text-sm text-gray-400">
          {assignments.length} upcoming assignments
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-10 px-6 bg-gray-800/40 rounded-lg shadow-md">
          <h2 className="text-xl text-gray-300 mb-4">
            No upcoming assignments found.
          </h2>
          <p className="text-gray-400 mb-6">
            You're all caught up! Check back later for new assignments.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div
              key={`${assignment.course_id}-${assignment.id}`}
              className="bg-gray-800/70 p-6 rounded-lg shadow-lg border border-gray-700 hover:shadow-indigo-500/20 hover:border-indigo-600/50 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex-1 mb-4 md:mb-0 md:mr-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {assignment.title}
                    </h3>
                    {assignment.points_possible && (
                      <span className="text-sm text-gray-400 ml-2 flex-shrink-0">
                        {assignment.points_possible} pts
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-indigo-300 mb-2">
                    {assignment.course_name}
                  </p>

                  {assignment.description && (
                    <div
                      className="text-sm text-gray-300 mb-3 line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html:
                          assignment.description
                            .replace(/<[^>]*>/g, "")
                            .substring(0, 150) +
                          (assignment.description.length > 150 ? "..." : ""),
                      }}
                    />
                  )}

                  {assignment.submission_types &&
                    assignment.submission_types.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {assignment.submission_types.map((type) => (
                          <span
                            key={type}
                            className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded"
                          >
                            {type.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    )}
                </div>

                <div className="flex flex-col items-end space-y-3">
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${getDueDateColor(
                        assignment.due_date
                      )}`}
                    >
                      {formatDueDate(assignment.due_date)}
                    </p>
                    {assignment.due_date && (
                      <p className="text-xs text-gray-500">
                        {new Date(assignment.due_date).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    )}
                  </div>

                  <a
                    href={assignment.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition duration-200 shadow-md"
                  >
                    View in Canvas
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
