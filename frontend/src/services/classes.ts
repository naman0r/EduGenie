import { API_BASE_URL, fetchAPI } from "./client";
import { ClassData } from "@/types"; // Assuming ClassData is exported from @/types

interface AddClassPayload {
  name: string;
  code?: string;
  instructor?: string;
  // Ensure this matches the backend expectation for POST /users/{google_id}/classes
}

/**
 * Classes Services
 */

export const fetchUserClasses = async (
  googleId: string
): Promise<ClassData[]> => {
  // The backend for GET /users/{google_id}/classes might return the classes directly
  // or an object like { classes: ClassData[] }. Adjust based on actual backend response.
  // For now, assuming it returns ClassData[] directly as per previous DashboardPage logic.
  return fetchAPI(`${API_BASE_URL}/users/${googleId}/classes`);
};

export const addClass = async (
  googleId: string,
  classDetails: AddClassPayload
): Promise<ClassData> => {
  // The backend for POST /users/{google_id}/classes might return the newly created class directly.
  // Adjust based on actual backend response.
  return fetchAPI(`${API_BASE_URL}/users/${googleId}/classes`, {
    method: "POST",
    body: JSON.stringify(classDetails),
  });
};

export const deleteClass = async (
  googleId: string,
  classId: string
): Promise<any> => {
  return fetchAPI(`${API_BASE_URL}/users/${googleId}/classes`, {
    method: "DELETE",
    body: JSON.stringify({ user_id: googleId, class_id: classId }),
  });
};

export const fetchClassDetails = async (
  classId: string
): Promise<ClassData> => {
  return fetchAPI(`${API_BASE_URL}/classes/${classId}`);
};

export const checkClassAccess = async (
  classId: string,
  googleId: string
): Promise<{ has_access: boolean }> => {
  return fetchAPI(
    `${API_BASE_URL}/classes/${classId}/check-access/${googleId}`
  );
};

// The backend for syllabus upload might need the googleId in the body or as a query param
// For now, assuming it might be part of the FormData or handled by backend session if not in URL.
// If googleId is strictly needed by the endpoint logic (e.g. for auth or record association)
// and not implicitly handled by session/token, it might need to be passed differently.
// The original ClassDetailsPage.tsx didn't seem to pass googleId explicitly in the syllabus upload fetch call.
export const uploadSyllabus = async (
  classId: string,
  formData: FormData // FormData will contain the file
): Promise<any> => {
  // Replace 'any' with a more specific type if backend response is known
  return fetchAPI(`${API_BASE_URL}/classes/${classId}/syllabus`, {
    method: "POST",
    body: formData, // Don't stringify FormData, fetch handles it
    // Headers are not typically set for FormData, browser sets multipart/form-data
  });
};
