import { User as FirebaseUser } from "firebase/auth";
import { API_BASE_URL, fetchAPI } from "./client";

/**
 * Auth Services
 */
export const syncUserWithBackend = async (
  firebaseUser: FirebaseUser
): Promise<any> => {
  const payload = {
    google_id: firebaseUser.uid,
    email: firebaseUser.email,
    full_name: firebaseUser.displayName,
    avatar_url: firebaseUser.photoURL,
  };
  return fetchAPI(`${API_BASE_URL}/auth/google`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
