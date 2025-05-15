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
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: await response.text() };
    }
    console.error("API Error:", response.status, errorData);
    const error = new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
    // You could attach more info to the error object if needed
    // (error as any).status = response.status;
    // (error as any).data = errorData;
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
