"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/utils/firebase"; // For auth check
import { User } from "firebase/auth";

// Reuse ClassData interface from dashboard or redefine if needed
interface ClassData {
  id: string;
  user_id: string;
  name: string;
  code?: string | null;
  instructor?: string | null;
  created_at: string;
}

// Define Task interface for mock data
interface Task {
  id: string;
  title: string;
  assigned_date: string;
  deadline: string;
  personal_completion_deadline: string;
  status: "pending" | "in-progress" | "completed";
}

// Mock Task Data
const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Problem Set 1",
    assigned_date: "2024-08-01",
    deadline: "2024-08-15",
    personal_completion_deadline: "2024-08-13",
    status: "pending",
  },
  {
    id: "task-2",
    title: "Read Chapter 3",
    assigned_date: "2024-08-05",
    deadline: "2024-08-12",
    personal_completion_deadline: "2024-08-11",
    status: "in-progress",
  },
  {
    id: "task-3",
    title: "Midterm Paper Outline",
    assigned_date: "2024-08-10",
    deadline: "2024-08-25",
    personal_completion_deadline: "2024-08-22",
    status: "pending",
  },
  {
    id: "task-4",
    title: "Lab Report 1 (Completed)",
    assigned_date: "2024-07-20",
    deadline: "2024-08-05",
    personal_completion_deadline: "2024-08-03",
    status: "completed",
  },
];

export default function ClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string; // Assume it's a string for now, troubleshooting,

  const [user, setUser] = useState<User | null>(null);
  const [classDetails, setClassDetails] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Now fetch class details if we have a classId
        if (classId) {
          try {
            setIsLoading(true); // Set loading true before fetch
            const response = await fetch(
              `http://localhost:8000/classes/${classId}`
            );

            if (!response.ok) {
              if (response.status === 404) {
                setError("Class not found.");
              } else {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              setClassDetails(null); // Clear details on error
            } else {
              const data: ClassData = await response.json();
              // Optional: Check if fetched class belongs to the logged-in user if needed
              // if (data.user_id !== currentUser.uid) {
              //     setError("You do not have permission to view this class.");
              //     setClassDetails(null);
              // } else {
              setClassDetails(data);
              setError(null); // Clear error on success
              // }
            }
          } catch (err: any) {
            console.error("Failed to fetch class details:", err);
            setError("Failed to load class details. Please try again later.");
            setClassDetails(null);
          } finally {
            setIsLoading(false);
          }
        } else {
          // Handle case where classId is missing or invalid
          setError("Invalid Class ID.");
          setIsLoading(false);
        }
      } else {
        // Not logged in
        setUser(null);
        setIsLoading(false);
        router.push("/"); // Redirect to home
      }
    });

    return () => unsubscribe();
  }, [classId, router]); // Add classId and router to dependency array

  // Render Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex justify-center items-center">
        Loading class details...
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-red-500 flex flex-col justify-center items-center p-8">
        <p className="text-xl mb-4">{error}</p>
        <button
          onClick={() => router.push("/dashboard")} // Go back to dashboard
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Render Class Details
  if (!classDetails) {
    // This case might occur briefly or if there was an issue not caught by error state
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex justify-center items-center">
        No class details found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/[0.96] text-white pt-20 px-4 md:px-8 lg:px-16">
      {/* Header with Class Name */}
      <div className="mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold truncate" title={classDetails.name}>
          {classDetails.name}
        </h1>
        <div className="flex space-x-4 text-sm text-gray-400 mt-2">
          {classDetails.code && (
            <span>
              Code: <span className="text-indigo-300">{classDetails.code}</span>
            </span>
          )}
          {classDetails.instructor && (
            <span>
              Instructor:{" "}
              <span className="text-gray-300">{classDetails.instructor}</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-gray-800/30 p-6 rounded-lg shadow-xl min-h-[400px]">
        <h2 className="text-xl font-semibold mb-4 border-b border-gray-600 pb-2">
          Upcoming Tasks & Assignments
        </h2>

        {/* Task List */}
        <div className="space-y-4">
          {mockTasks.length === 0 ? (
            <p className="text-gray-400 italic">
              No tasks added for this class yet.
            </p>
          ) : (
            mockTasks.map((task) => (
              <div
                key={task.id}
                className="bg-gray-700/50 p-4 rounded-md border border-gray-600 hover:bg-gray-700/70 transition duration-150"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-100">
                    {task.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      task.status === "completed"
                        ? "bg-green-500/20 text-green-300"
                        : task.status === "in-progress"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-gray-500/20 text-gray-300"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-400">
                  <div>
                    Assigned:{" "}
                    <span className="text-gray-300">{task.assigned_date}</span>
                  </div>
                  <div>
                    Deadline:{" "}
                    <span className="text-red-400 font-medium">
                      {task.deadline}
                    </span>
                  </div>
                  <div>
                    Personal Goal:{" "}
                    <span className="text-blue-400">
                      {task.personal_completion_deadline}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Placeholder for future content */}
        {/* <h2 className="text-xl font-semibold mt-8 mb-4 border-b border-gray-600 pb-2">
          Other Class Content
        </h2>
        <p className="text-gray-400">
          [Future content for this class will go here - e.g., syllabus upload
          section, generated study plans, notes integration, etc.]
        </p> */}

        {/* Display Class ID for reference */}
        <p className="text-xs text-gray-600 mt-10">
          Class ID: {classDetails.id}
        </p>
      </div>
    </div>
  );
}
