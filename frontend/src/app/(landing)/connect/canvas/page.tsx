"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ConnectCanvasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [googleId, setGoogleId] = useState<string | null>(null);
  const [canvasDomain, setCanvasDomain] = useState("");
  const [canvasAccessToken, setCanvasAccessToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("google_id");
    if (!id) {
      // If google_id is missing, redirect back to profile with an error maybe?
      // Or show an error message on this page.
      setError("Missing user identifier. Cannot connect Canvas.");
      // Optionally redirect after a delay:
      // setTimeout(() => router.push('/profile'), 3000);
    }
    setGoogleId(id);
  }, [searchParams, router]);

  const handleConnectCanvas = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    if (!googleId) {
      setError("User identifier is missing.");
      return;
    }
    if (!canvasDomain || !canvasAccessToken) {
      setError("Canvas Domain and Access Token are required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/canvas/connect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            domain: canvasDomain,
            access_token: canvasAccessToken,
            google_id: googleId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Determine the type of error for redirection
        const errorType = response.status === 500 ? "error_saving" : "error";
        throw new Error(
          result.error || `Failed to connect Canvas (HTTP ${response.status})`,
          { cause: errorType } // Pass error type via cause
        );
      }

      // Success: Redirect to configuration page, passing google_id
      router.push(`/connect/canvas/configure?google_id=${googleId}`);
    } catch (err: any) {
      console.error("Failed to connect Canvas:", err);
      const redirectErrorType = err.cause || "error"; // Get error type from cause or default
      setError(`Error connecting Canvas: ${err.message}`);
      // Redirect back to profile page with error status
      router.push(`/profile?canvas_auth_status=${redirectErrorType}`);
      // Alternatively, keep the user on this page to show the error directly:
      // setError(`Error connecting Canvas: ${err.message}. Please check your details and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic styling consistent with the profile page
  return (
    <div className="min-h-screen bg-black/[0.96] text-white pt-20 px-4 md:px-8 lg:px-16 pb-20 flex justify-center items-start pt-50">
      <div className="w-full max-w-md bg-gray-800/50 p-8 rounded-lg shadow-xl space-y-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          Connect Canvas Account
        </h1>

        {/* Initial instructions */}
        {!error && !isLoading && (
          <p className="text-sm text-gray-400 text-center">
            Enter your Canvas domain (e.g.,{" "}
            <code className="bg-gray-700 px-1 rounded">
              myschool.instructure.com
            </code>
            ) and an Access Token generated from your Canvas account settings
            (Account &gt; Settings &gt; Approved Integrations &gt; New Access
            Token).
          </p>
        )}

        {/* Display error if googleId is missing */}
        {error && !googleId && (
          <p className="text-red-500 text-center">{error}</p>
        )}

        {/* Show form only if googleId is present */}
        {googleId && (
          <form onSubmit={handleConnectCanvas} className="space-y-4">
            <div>
              <label
                htmlFor="canvasDomain"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Canvas Domain
              </label>
              <input
                type="text"
                id="canvasDomain"
                name="canvasDomain"
                value={canvasDomain}
                onChange={(e) => setCanvasDomain(e.target.value.trim())} // Trim whitespace
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                placeholder="e.g., canvas.university.edu"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label
                htmlFor="canvasAccessToken"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Canvas Access Token
              </label>
              <input
                type="password"
                id="canvasAccessToken"
                name="canvasAccessToken"
                value={canvasAccessToken}
                onChange={(e) => setCanvasAccessToken(e.target.value.trim())} // Trim whitespace
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                placeholder="Enter your generated token"
                required
                disabled={isLoading}
              />
            </div>

            {/* Display connection error messages */}
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <div className="pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={() => router.push("/profile")} // Go back button
                className="w-full sm:w-auto px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition duration-200 disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
                disabled={isLoading || !canvasDomain || !canvasAccessToken}
              >
                {isLoading ? "Connecting..." : "Connect Canvas Account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
