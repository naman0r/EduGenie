import { Credits } from "@/types";
import { API_BASE_URL, fetchAPI } from "./client";

/**
 * Credits Services
 */
export const fetchUserCredits = async (googleId: string): Promise<Credits> => {
  return fetchAPI(`${API_BASE_URL}/credits/${googleId}/get_credits`);
};
