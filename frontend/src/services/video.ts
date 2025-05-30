import { API_BASE_URL, fetchAPI } from "./client";

/**
 * Video Generation Services
 */
export interface VideoGenerationRequest {
  text: string;
}

export interface VideoGenerationResponse {
  message: string;
  video_url: string;
  job_id: string;
}

export interface VideoStatusResponse {
  status: "processing" | "completed" | "error";
  video_url?: string;
  message?: string;
}

export const generateVideo = async (
  text: string
): Promise<VideoGenerationResponse> => {
  return fetchAPI(`${API_BASE_URL}/chat/generate-video`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
};

export const getVideoStatus = async (
  jobId: string
): Promise<VideoStatusResponse> => {
  return fetchAPI(`${API_BASE_URL}/chat/video-status/${jobId}`, {
    method: "GET",
  });
};
