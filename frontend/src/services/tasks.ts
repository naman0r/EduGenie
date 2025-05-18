import { API_BASE_URL, fetchAPI } from "./client";
import { Task } from "@/types";

/**
 * Tasks Services
 */

export const fetchTasks = async (
  classId: string,
  googleId: string
): Promise<Task[]> => {
  // Original fetch was: `${process.env.NEXT_PUBLIC_BACKEND_URL}/classes/${classId}/tasks?google_id=${user.uid}`
  return fetchAPI(
    `${API_BASE_URL}/classes/${classId}/tasks?google_id=${googleId}`
  );
};

export const updateTaskStatus = async (
  classId: string,
  taskId: string,
  googleId: string,
  status: string
): Promise<Task> => {
  // Assuming the backend returns the updated task. Adjust if it returns void or just a success message.
  // Original fetch was: `${process.env.NEXT_PUBLIC_BACKEND_URL}/classes/${classId}/tasks/${taskId}/status`
  // Body was: JSON.stringify({ google_id: user.uid, status: newStatus })
  return fetchAPI(`${API_BASE_URL}/classes/${classId}/tasks/${taskId}/status`, {
    method: "PUT",
    body: JSON.stringify({ google_id: googleId, status }),
  });
};
