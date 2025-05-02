"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Define the structure of a Canvas course based on your API response
interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  // Add other relevant fields if needed
}

export default function ConfigureCanvasCoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [googleId, setGoogleId] = useState<string | null>(null);
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<number>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch google_id from URL
  useEffect(() => {
    const id = searchParams.get("google_id");
    if (!id) {
      setError("Missing user identifier. Cannot configure courses.");
      setIsLoading(false);
    } else {
      setGoogleId(id);
    }
  }, [searchParams]);

  // Fetch courses when googleId is available
  useEffect(() => {
    if (!googleId) return;

    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Construct URL with query parameter
        const url = new URL(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/canvas/courses`
        );
        url.searchParams.append("google_id", googleId);

        const response = await fetch(
          url.toString(), // Pass the constructed URL string
          {
            method: "GET", // Correct method
            // No headers or body needed for this GET request anymore
            // headers: {
            //   "Content-Type": "application/json",
            // },
            // body: JSON.stringify({ google_id: googleId }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `Failed to fetch courses (HTTP ${response.status})`
          );
        }

        const data: CanvasCourse[] = await response.json();
        setCourses(data);
      } catch (err: any) {
        console.error("Failed to fetch Canvas courses:", err);
        setError(`Error fetching courses: ${err.message}`);
        setCourses([]); // Clear courses on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [googleId]);

  const handleCheckboxChange = (courseId: number) => {
    setSelectedCourseIds((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(courseId)) {
        newSelected.delete(courseId);
      } else {
        newSelected.add(courseId);
      }
      return newSelected;
    });
  };

  const handleSaveSelection = async () => {
    if (!googleId || selectedCourseIds.size === 0) {
      setError("No courses selected or user ID missing.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const selectedCoursesData = courses
      .filter((course) => selectedCourseIds.has(course.id))
      .map((course) => ({
        name: course.name,
        code: course.course_code,
        canvas_course_id: course.id, // Include Canvas ID for reference
      }));

    try {
      // *** TODO: Implement this backend endpoint in routes/classes.py ***
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/classes/batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            google_id: googleId,
            courses: selectedCoursesData,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to save courses (HTTP ${response.status})`
        );
      }

      // Success: Redirect to profile or dashboard
      router.push("/profile"); // Or maybe /dashboard?
    } catch (err: any) {
      console.error("Failed to save selected courses:", err);
      setError(`Error saving courses: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Rendering ---

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white pt-20 px-4 flex justify-center items-center">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/[0.96] text-white pt-20 px-4 md:px-8 lg:px-16 pb-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-4">
          Configure Your Courses
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Select the courses from Canvas you want to manage in EduGenie.
        </p>

        {isLoading ? (
          <div className="text-center text-gray-400">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="text-center text-gray-400">
            No active courses found in your Canvas account, or there was an
            error fetching them.
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {courses.map((course) => (
              <div
                key={course.id}
                className={`p-4 rounded-lg border transition-colors duration-150 ease-in-out flex items-center justify-between ${
                  selectedCourseIds.has(course.id)
                    ? "bg-indigo-900/50 border-indigo-700"
                    : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
                }`}
              >
                <div className="flex-grow mr-4">
                  <label
                    htmlFor={`course-${course.id}`}
                    className="font-semibold text-gray-100 block cursor-pointer"
                  >
                    {course.name}
                  </label>
                  <span className="text-sm text-gray-400 block">
                    {course.course_code}
                  </span>
                </div>
                <input
                  type="checkbox"
                  id={`course-${course.id}`}
                  checked={selectedCourseIds.has(course.id)}
                  onChange={() => handleCheckboxChange(course.id)}
                  className="form-checkbox h-5 w-5 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 cursor-pointer"
                  disabled={isSaving}
                />
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        {!isLoading && courses.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleSaveSelection}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving || selectedCourseIds.size === 0}
            >
              {isSaving
                ? "Saving..."
                : `Add ${selectedCourseIds.size} Selected Courses`}
            </button>
          </div>
        )}
        {/* Display saving error messages */}
        {error && isSaving && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}
