import { API_BASE_URL, fetchAPI } from "./client";
import { ResourceInfo, CreateResourcePayload } from "@/types";

/**
 * Resources Services
 */

export const fetchResources = async (
  googleId: string,
  classId: string
): Promise<ResourceInfo[]> => {
  // Original fetch was: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${user.uid}/resources?class_id=${classId}`
  // Assuming token for auth is handled by fetchAPI if needed, or backend uses googleId for auth from URL
  // The original call also used a token in headers. fetchAPI should handle this if configured.
  return fetchAPI(
    `${API_BASE_URL}/users/${googleId}/resources?class_id=${classId}`
  );
};

export const createResource = async (
  googleId: string,
  classId: string,
  resourceData: CreateResourcePayload
): Promise<ResourceInfo> => {
  // Original fetch was: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${user.uid}/resources`
  // Body was: JSON.stringify({ class_id: classId, user_id: user.uid, type: selectedType, name: newResourceName, content: {} })
  const payload = {
    ...resourceData, // contains type, name, content
    class_id: classId,
    user_id: googleId, // Backend might expect user_id in body, even if googleId is in URL for routing
  };
  return fetchAPI(`${API_BASE_URL}/users/${googleId}/resources`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
