import { API_BASE_URL, fetchAPI } from "./client";

/**
 * Google Calendar Services
 */
export const initiateGoogleCalendarAuth = (googleId: string): void => {
  window.location.href = `${API_BASE_URL}/auth/google/calendar/initiate?google_id=${googleId}`;
};

interface CalendarEventData {
  summary: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
}

export const createGoogleCalendarTestEvent = async (
  googleId: string,
  eventData: CalendarEventData
): Promise<any> => {
  return fetchAPI(`${API_BASE_URL}/users/${googleId}/calendar/events`, {
    method: "POST",
    body: JSON.stringify(eventData),
  });
};

export const getGoogleCalendarEvents = async (
  googleId: string
): Promise<any> => {
  return fetchAPI(`${API_BASE_URL}/users/${googleId}/calendar/events`, {
    method: "GET",
  });
};
