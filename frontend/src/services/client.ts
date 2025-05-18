export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Helper function for making API requests
export async function fetchAPI(url: string, options: RequestInit = {}) {
  const defaultHeaders = {
    "Content-Type": "application/json",
    // Add other default headers if needed, e.g., Authorization
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorPayload = { message: `HTTP error! status: ${response.status}` }; // Default error
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const jsonError = await response.json();
        // Use a more specific message from JSON error if available
        errorPayload = {
          message:
            jsonError.detail || jsonError.message || JSON.stringify(jsonError),
        };
      } else {
        // If not JSON, try to get text, but be mindful of empty responses
        const textError = await response.text();
        if (textError) {
          errorPayload = { message: textError };
        }
        // If textError is also empty, the default message is used
      }
    } catch (e) {
      // This catch is for if .json() or .text() itself throws an error (e.g. network issue during parsing)
      // The initial default errorPayload is likely sufficient here, or log this specific parsing error.
      console.error("Error parsing error response body:", e);
    }
    console.error("API Error:", response.status, errorPayload.message);
    const error = new Error(errorPayload.message);
    throw error;
  }

  // For 204 No Content or similar, response.json() will fail
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return null;
  }

  return response.json();
}
