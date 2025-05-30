import { API_BASE_URL, fetchAPI } from "./client";

/**
 * Canvas Services
 */
interface CanvasConnectionData {
  google_id: string;
  domain?: string | null;
  access_token?: string | null;
}

export const connectCanvas = async (
  googleId: string,
  domain: string,
  accessToken: string
): Promise<any> => {
  const payload: CanvasConnectionData = {
    google_id: googleId,
    domain,
    access_token: accessToken,
  };
  return fetchAPI(`${API_BASE_URL}/canvas/connect`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const disconnectCanvas = async (googleId: string): Promise<any> => {
  const payload: CanvasConnectionData = {
    google_id: googleId,
    domain: null,
    access_token: null,
  };
  return fetchAPI(`${API_BASE_URL}/canvas/connect`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getAllUpcomingAssignments = async (
  googleId: string
): Promise<any> => {
  return fetchAPI(
    `${API_BASE_URL}/canvas/assignments?google_id=${encodeURIComponent(
      googleId
    )}`,
    {
      method: "GET",
    }
  );
};
