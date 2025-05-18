import { API_BASE_URL, fetchAPI } from "./client";

export interface Genie {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGeniePayload {
  name?: string;
}

export interface UpdateGeniePayload {
  name: string;
}

/**
 * Genies Services
 */

export const fetchGenies = async (googleId: string): Promise<Genie[]> => {
  return fetchAPI(`${API_BASE_URL}/genie/users/${googleId}`);
};

export const createGenie = async (
  googleId: string,
  payload: CreateGeniePayload = {}
): Promise<Genie> => {
  return fetchAPI(`${API_BASE_URL}/genie/users/${googleId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateGenie = async (
  genieId: string,
  googleId: string,
  payload: UpdateGeniePayload
): Promise<Genie> => {
  return fetchAPI(`${API_BASE_URL}/genie/${genieId}`, {
    method: "PUT",
    headers: {
      "X-Google-ID": googleId,
    },
    body: JSON.stringify(payload),
  });
};

export const deleteGenie = async (
  genieId: string,
  googleId: string
): Promise<void> => {
  return fetchAPI(`${API_BASE_URL}/genie/${genieId}`, {
    method: "DELETE",
    headers: {
      "X-Google-ID": googleId,
    },
  });
};
