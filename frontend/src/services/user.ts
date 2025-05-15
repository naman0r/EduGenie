import { UserProfile, UserProfileUpdateData } from "@/types";
import { API_BASE_URL, fetchAPI } from "./client";

/**
 * User Profile Services
 */
export const fetchUserProfile = async (
  googleId: string
): Promise<{ user: UserProfile }> => {
  return fetchAPI(`${API_BASE_URL}/users/${googleId}`);
};

export const updateUserProfile = async (
  googleId: string,
  profileData: UserProfileUpdateData
): Promise<{ user: UserProfile }> => {
  return fetchAPI(`${API_BASE_URL}/users/${googleId}`, {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
};
