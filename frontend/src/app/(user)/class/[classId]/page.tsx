"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/utils/firebase"; // For auth check
import { User } from "firebase/auth";
import Link from "next/link";
import { ResourceInfo } from "@/types/resources";
import { Task } from "@/types/task";
import { ClassData } from "@/types/class";

// Mock Task Data TODO create a task table on supabase.
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
  const classId = params.classId as string;

  const [user, setUser] = useState<User | null>(null);
  const [classDetails, setClassDetails] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Add Resource State ---
  const [resources, setResources] = useState<ResourceInfo[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState<string | null>(null);

  // --- State for Resource Creation Modal ---
  const [showCreateResourceModal, setShowCreateResourceModal] = useState(false);
  const [resourceCreationStep, setResourceCreationStep] = useState<
    "selectType" | "enterName" | "creating"
  >("selectType");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [newResourceName, setNewResourceName] = useState<string>("");

  // *** RESTORE SYLLABUS STATE HERE ***
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  // We don't need showResourceOptions anymore as it was replaced by the modal logic

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }
    setUploadStatus("uploading");
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const res = await fetch(
        `http://localhost:8000/classes/${classId}/syllabus`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
      setUploadStatus("success");
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadStatus("error");
      setUploadError(err.message);
    }
  };

  // --- Fetch Class Details Effect ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
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
  }, [classId, router]);

  // --- Fetch Resources Effect ---
  const fetchResources = useCallback(async () => {
    if (!user || !classId) return; // Need user and classId

    setResourcesLoading(true);
    setResourcesError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Authentication token not available.");
      }

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${API_URL}/users/${user.uid}/resources?class_id=${classId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch resources: ${response.status} - ${errorText}`
        );
      }

      const data: ResourceInfo[] = await response.json();
      setResources(data);
    } catch (err: any) {
      console.error("Failed to fetch resources:", err);
      setResourcesError("Failed to load resources. Please try again later.");
    } finally {
      setResourcesLoading(false);
    }
  }, [user, classId]);

  // --- Trigger Fetch Resources Effect ---
  useEffect(() => {
    // Fetch resources only after the initial class load attempt is finished (!isLoading)
    // and the user is available.
    if (!isLoading && user && classId) {
      fetchResources();
    }
    // Add classId as a dependency here too
  }, [isLoading, user, classId, fetchResources]);

  // --- Handle Resource Creation (Actual API call) ---
  // Renamed to indicate it performs the final action
  const performResourceCreation = async () => {
    // Guard clauses using the new state variables
    if (!user || !classId || !selectedType || !newResourceName) {
      setResourcesError(
        "Cannot create resource: Missing user, class, type, or name information."
      );
      setResourceCreationStep("enterName"); // Go back to name step if info missing
      return;
    }
    setResourceCreationStep("creating"); // Set step to creating
    setResourcesError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      // No token needed if backend auth is removed, but keep for potential future use
      // if (!token) {
      //   throw new Error("Authentication token not available.");
      // }

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/users/${user.uid}/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`, // Keep commented out for now
        },
        body: JSON.stringify({
          class_id: classId,
          user_id: user.uid,
          type: selectedType, // Use state variable
          name: newResourceName, // Use state variable
          content: {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to create resource: ${response.status} - ${
            errorData.detail || "Unknown error"
          }`
        );
      }

      const newResource: ResourceInfo = await response.json();
      setResources((prevResources) => [newResource, ...prevResources]);
      setShowCreateResourceModal(false); // Close modal on success
    } catch (err: any) {
      console.error("Failed to create resource:", err);
      setResourcesError(
        err.message || "Failed to create resource. Please try again."
      );
      setResourceCreationStep("enterName"); // Go back to name step on error
    }
    // No finally block needed here, step state handles loading/idle transition
  };

  // --- Handler to open modal and reset state ---
  const handleOpenCreateModal = () => {
    setShowCreateResourceModal(true);
    setResourceCreationStep("selectType");
    setSelectedType(null);
    setNewResourceName("");
    setResourcesError(null); // Clear previous errors
  };

  // --- Handler for selecting type ---
  const handleSelectType = (type: string) => {
    setSelectedType(type);
    // Set default name based on type
    let defaultName = "New Resource";
    if (type === "Mindmap") defaultName = "New Mindmap";
    if (type === "flashcards") defaultName = "New Flashcard Set";
    if (type === "Text notes") defaultName = "New Note";
    setNewResourceName(defaultName);
    setResourceCreationStep("enterName");
  };

  // --- Handler to go back to type selection ---
  const handleGoBackToTypeSelection = () => {
    setResourceCreationStep("selectType");
    setResourcesError(null); // Clear errors when going back
  };

  // --- Handler to cancel/close modal ---
  const handleCancelCreation = () => {
    setShowCreateResourceModal(false);
  };

  // --- Combined Loading State ---
  // Show loading if class details are loading OR resources are loading
  if (isLoading || resourcesLoading) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex justify-center items-center">
        {/* Be more specific if possible */}
        {isLoading ? "Loading class details..." : "Loading resources..."}
      </div>
    );
  }

  // --- Error State (Prioritize class details error) ---
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

  // --- Render Class Details (only if classDetails are available) ---
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

      {/* Syllabus Upload Section */}
      <div className="bg-gray-800/30 p-6 rounded-lg shadow-xl mb-6">
        <h2 className="text-xl font-semibold mb-4 border-b border-gray-600 pb-2">
          Upload Syllabus
        </h2>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          className="mb-2 text-gray-100"
        />
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploadStatus === "uploading"}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {uploadStatus === "uploading" ? "Uploading..." : "Upload"}
        </button>
        {uploadStatus === "success" && (
          <p className="text-green-400 mt-2">Upload successful!</p>
        )}
        {uploadStatus === "error" && uploadError && (
          <p className="text-red-500 mt-2">Error: {uploadError}</p>
        )}
      </div>

      {/* Content Columns: Resources & Tasks */}
      <div className="lg:flex lg:space-x-6">
        {/* Left Panel: Resources */}
        <div className="lg:w-1/3 bg-gray-800/30 p-6 rounded-lg shadow-xl mb-6 lg:mb-0 relative">
          <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-4">
            <h2 className="text-xl font-semibold">Study Resources</h2>
            <button
              onClick={handleOpenCreateModal} // Use new handler
              // disabled={isCreatingResource} // Disable handled inside modal now
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              + New Resource
            </button>
          </div>

          {/* Resource List Area */}
          {resourcesError && (
            <p className="text-red-500">
              Error loading resources: {resourcesError}
            </p>
          )}
          {!resourcesLoading && !resourcesError && (
            <ul className="space-y-2">
              {resources.length === 0 && (
                <p className="text-gray-400">No resources created yet.</p>
              )}
              {resources.map((resource) => (
                <Link
                  href={`http://localhost:3000/resources/${resource.id}`}
                  key={resource.id}
                  className="p-3 bg-gray-700/50 rounded hover:bg-gray-600/50 transition duration-150 cursor-pointer"
                  // TODO: Make this navigate to the resource editor page
                  // onClick={() =>
                  //   alert(`Navigate to resource: ${resource.name}`)
                  // }
                >
                  {resource.name} ({resource.type})
                  {/* Add more details like created date if needed */}
                </Link>
              ))}
            </ul>
          )}

          {/* Combined Create Resource Modal */}
          {showCreateResourceModal && (
            <div className="absolute top-16 right-0 left-0 mx-auto w-64 bg-gray-700 rounded-md shadow-lg z-10 p-4 border border-gray-600 flex flex-col space-y-3">
              {/* Step 1: Select Type */}
              {resourceCreationStep === "selectType" && (
                <>
                  <h3 className="text-md font-medium text-gray-100 mb-1 text-center">
                    Select Resource Type
                  </h3>
                  <button
                    onClick={() => handleSelectType("Text notes")}
                    className="w-full text-left px-3 py-2 text-sm text-gray-100 hover:bg-gray-600 rounded"
                  >
                    Text Notes
                  </button>
                  <button
                    onClick={() => handleSelectType("Mindmap")}
                    className="w-full text-left px-3 py-2 text-sm text-gray-100 hover:bg-gray-600 rounded"
                  >
                    Mindmap
                  </button>
                  <button
                    onClick={() => handleSelectType("flashcards")}
                    className="w-full text-left px-3 py-2 text-sm text-gray-100 hover:bg-gray-600 rounded"
                  >
                    Flashcards
                  </button>
                </>
              )}

              {/* Step 2: Enter Name */}
              {resourceCreationStep === "enterName" && selectedType && (
                <>
                  <h3 className="text-md font-medium text-gray-100 mb-1 text-center">
                    Create {selectedType}
                  </h3>
                  <input
                    type="text"
                    value={newResourceName}
                    onChange={(e) => setNewResourceName(e.target.value)}
                    placeholder="Enter name..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {/* Display specific error from creation attempt */}
                  {resourcesError && (
                    <p className="text-xs text-red-400 text-center">
                      {resourcesError}
                    </p>
                  )}
                  <button
                    onClick={performResourceCreation} // Final create action
                    className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={handleGoBackToTypeSelection}
                    className="w-full text-center px-3 py-1 text-xs text-gray-400 hover:text-gray-100"
                  >
                    Back
                  </button>
                </>
              )}

              {/* Step 3: Creating */}
              {resourceCreationStep === "creating" && (
                <p className="text-sm text-center text-yellow-400 py-4">
                  Creating resource...
                </p>
              )}

              {/* Always show Cancel button unless creating */}
              {resourceCreationStep !== "creating" && (
                <button
                  onClick={handleCancelCreation}
                  className="w-full text-center px-3 py-1 mt-2 text-xs text-gray-400 hover:text-gray-100 border-t border-gray-600 pt-2"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Panel: Task List */}
        <div className="bg-gray-800/30 p-6 rounded-lg shadow-xl w-full lg:w-2/3">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-600 pb-2">
            Upcoming Tasks & Assignments
          </h2>
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
                      <span className="text-gray-300">
                        {task.assigned_date}
                      </span>
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
        </div>
      </div>

      {/* Display Class ID for reference */}
      <p className="text-xs text-gray-600 mt-10">Class ID: {classDetails.id}</p>
    </div>
  );
}
