"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useClassDetails } from "@/hooks/useClassDetails";
import { useResources } from "@/hooks/useResources";
import { useTasks } from "@/hooks/useTasks";
import TaskCard from "@/components/TaskCard";
import CanvasAssignmentsModal from "@/components/CanvasAssignmentsModal";
import { ClassData } from "@/types/class";

export default function ClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    user,
    classDetails,
    isLoading,
    error,
    isAuthorized,
    isDeleting,
    deleteError,
    handleDeleteClass,
  } = useClassDetails(classId);

  const {
    resources,
    resourcesLoading,
    resourcesError,
    showCreateResourceModal,
    resourceCreationStep,
    selectedType,
    newResourceName,
    setNewResourceName,
    fetchResources,
    handleOpenCreateModal,
    handleSelectType,
    handleGoBackToTypeSelection,
    handleCancelCreation,
    performResourceCreation,
  } = useResources(classId);

  const {
    tasks,
    tasksLoading,
    tasksError,
    showCanvasModal,
    setShowCanvasModal,
    fetchTasks,
    handleTaskStatusChange,
    handleCanvasImportSuccess,
  } = useTasks(classId);

  // Fetch resources and tasks when user and class details are loaded
  useEffect(() => {
    if (!isLoading && user && classId) {
      fetchResources(user);
      fetchTasks(user);
    }
  }, [isLoading, user, classId, fetchResources, fetchTasks]);

  // Add early return if not authorized
  if (!isAuthorized && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">{error}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Combined Loading State
  if (isLoading || resourcesLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex justify-center items-center">
        {isLoading
          ? "Loading class details..."
          : resourcesLoading
          ? "Loading resources..."
          : "Loading tasks..."}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-red-500 flex flex-col justify-center items-center p-8">
        <p className="text-xl mb-4">{error}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Render Class Details
  if (!classDetails) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex justify-center items-center">
        No class details found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/[0.96] text-white pt-20 px-4 md:px-8 lg:px-16">
      {/* Header with Class Name and Delete Button */}
      <div className="mb-8 border-b border-gray-700 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1
              className="text-3xl font-bold truncate"
              title={classDetails.name}
            >
              {classDetails.name}
            </h1>
            <div className="flex space-x-4 text-sm text-gray-400 mt-2">
              {classDetails.code && (
                <span>
                  Code:{" "}
                  <span className="text-indigo-300">{classDetails.code}</span>
                </span>
              )}
              {classDetails.instructor && (
                <span>
                  Instructor:{" "}
                  <span className="text-gray-300">
                    {classDetails.instructor}
                  </span>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-red-500 hover:text-red-600 transition-colors"
            title="Delete Class"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Columns: Resources & Tasks */}
      <div className="lg:flex lg:space-x-6">
        {/* Left Panel: Resources */}
        <div className="lg:w-1/3 bg-gray-800/30 p-6 rounded-lg shadow-xl mb-6 lg:mb-0 relative">
          <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-4">
            <h2 className="text-xl font-semibold">Study Resources</h2>
            <button
              onClick={handleOpenCreateModal}
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
                <li key={resource.id}>
                  <Link
                    href={`/resources/${resource.id}`}
                    className="block p-3 bg-gray-700/50 rounded hover:bg-gray-600/50 transition duration-150"
                  >
                    <span
                      className="font-medium text-gray-100 block truncate"
                      title={resource.name}
                    >
                      {resource.name}
                    </span>
                    <span className="text-xs text-indigo-300 capitalize">
                      {resource.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Create Resource Modal */}
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
                  {resourcesError && (
                    <p className="text-xs text-red-400 text-center">
                      {resourcesError}
                    </p>
                  )}
                  <button
                    onClick={() => user && performResourceCreation(user)}
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
          <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2">
            <h2 className="text-xl font-semibold">
              Upcoming Tasks & Assignments
            </h2>

            {/* Show Canvas Import button only if canvas_course_id exists */}
            {classDetails.canvas_course_id && (
              <button
                onClick={() => setShowCanvasModal(true)}
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 mr-1"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Import from Canvas
              </button>
            )}
          </div>

          {tasksError && (
            <p className="text-red-500 mb-4">
              Error loading tasks: {tasksError}
            </p>
          )}

          <div className="space-y-4">
            {!tasksLoading && tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="mb-4">
                  No tasks or assignments added for this class yet.
                </p>
                {classDetails.canvas_course_id && (
                  <button
                    onClick={() => setShowCanvasModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Import Assignments from Canvas
                  </button>
                )}
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={(newStatus) =>
                    user && handleTaskStatusChange(task.id, newStatus, user)
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Canvas Assignments Import Modal */}
      {user && classDetails.canvas_course_id && (
        <CanvasAssignmentsModal
          isOpen={showCanvasModal}
          onClose={() => setShowCanvasModal(false)}
          userId={user.uid}
          classId={classId}
          canvasCourseId={classDetails.canvas_course_id}
          onImportSuccess={() => user && handleCanvasImportSuccess(user)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-4 rounded-lg shadow-xl w-[300px]">
            <div className="flex items-center gap-3 mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="text-lg font-medium">Delete Class</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              This action cannot be undone.
            </p>
            {deleteError && (
              <p className="text-sm text-red-500 mb-3">{deleteError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClass}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Display Class ID for reference */}
      <p className="text-xs text-gray-600 mt-10">Class ID: {classDetails.id}</p>
    </div>
  );
}
