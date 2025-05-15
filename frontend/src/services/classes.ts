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
