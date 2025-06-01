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

// Video generation service using Canvas and FFmpeg.wasm
interface SlideData {
  text: string;
  narration: string;
  duration: number;
}

interface VideoSettings {
  width: number;
  height: number;
  fps: number;
  background_color: string;
  text_color: string;
  font_family: string;
  font_size: number;
  text_align: string;
}

interface VideoGenerationData {
  video_id: string;
  title: string;
  audio_url: string;
  slides: SlideData[];
  total_duration: number;
  video_settings: VideoSettings;
}

export class VideoGenerationService {
  private ffmpeg: any = null;
  private isLoaded = false;

  async loadFFmpeg() {
    if (this.isLoaded) return;

    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

      this.ffmpeg = new FFmpeg();

      // Load FFmpeg with CDN URLs
      await this.ffmpeg.load({
        coreURL: await toBlobURL("/ffmpeg/ffmpeg-core.js", "text/javascript"),
        wasmURL: await toBlobURL(
          "/ffmpeg/ffmpeg-core.wasm",
          "application/wasm"
        ),
      });

      this.isLoaded = true;
      console.log("FFmpeg loaded successfully");
    } catch (error) {
      console.error("Failed to load FFmpeg:", error);
      throw new Error("Failed to initialize video processing");
    }
  }

  generateSlideImage(
    slide: SlideData,
    settings: VideoSettings,
    slideIndex: number
  ): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      // Set canvas size
      canvas.width = settings.width;
      canvas.height = settings.height;

      // Fill background
      ctx.fillStyle = settings.background_color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set text style
      ctx.fillStyle = settings.text_color;
      ctx.font = `${settings.font_size}px ${settings.font_family}`;
      ctx.textAlign = settings.text_align as CanvasTextAlign;

      // Calculate text position
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Split text into lines for better readability
      const words = slide.text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      words.forEach((word) => {
        const testLine = currentLine + (currentLine ? " " : "") + word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > canvas.width * 0.8) {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          }
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) {
        lines.push(currentLine);
      }

      // Draw each line
      const lineHeight = settings.font_size * 1.2;
      const startY = centerY - (lines.length * lineHeight) / 2;

      lines.forEach((line, index) => {
        ctx.fillText(line, centerX, startY + index * lineHeight);
      });

      // Add slide number (small text in corner)
      ctx.font = `24px ${settings.font_family}`;
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillText(`${slideIndex + 1}`, canvas.width - 30, 40);

      canvas.toBlob((blob) => {
        resolve(blob!);
      }, "image/png");
    });
  }

  async downloadAudio(audioUrl: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`);
      }
      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error downloading audio:", error);
      throw error;
    }
  }

  async generateVideo(videoData: VideoGenerationData): Promise<Blob> {
    if (!this.isLoaded) {
      await this.loadFFmpeg();
    }

    try {
      console.log("Starting video generation...");

      // 1. Generate slide images
      console.log("Generating slide images...");
      const slideImages: Blob[] = [];

      for (let i = 0; i < videoData.slides.length; i++) {
        const slideBlob = await this.generateSlideImage(
          videoData.slides[i],
          videoData.video_settings,
          i
        );
        slideImages.push(slideBlob);
      }

      // 2. Download audio
      console.log("Downloading audio...");
      const audioBuffer = await this.downloadAudio(videoData.audio_url);

      // 3. Write files to FFmpeg filesystem
      console.log("Preparing files for video compilation...");

      // Write audio file
      await this.ffmpeg.writeFile("audio.mp3", new Uint8Array(audioBuffer));

      // Write slide images and create video segments
      for (let i = 0; i < slideImages.length; i++) {
        const imageBuffer = await slideImages[i].arrayBuffer();
        await this.ffmpeg.writeFile(
          `slide_${i}.png`,
          new Uint8Array(imageBuffer)
        );
      }

      // 4. Create video from slides
      console.log("Compiling video...");

      // Create a concat file for slides with durations
      let concatContent = "";
      for (let i = 0; i < videoData.slides.length; i++) {
        const duration = videoData.slides[i].duration;
        concatContent += `file 'slide_${i}.png'\nduration ${duration}\n`;
      }
      // Add last frame
      if (videoData.slides.length > 0) {
        concatContent += `file 'slide_${videoData.slides.length - 1}.png'\n`;
      }

      await this.ffmpeg.writeFile("slides.txt", concatContent);

      // Generate video from slides
      await this.ffmpeg.exec([
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "slides.txt",
        "-vf",
        `fps=${videoData.video_settings.fps}`,
        "-y",
        "slides_video.mp4",
      ]);

      // 5. Combine video with audio
      await this.ffmpeg.exec([
        "-i",
        "slides_video.mp4",
        "-i",
        "audio.mp3",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-strict",
        "experimental",
        "-shortest",
        "-y",
        "final_video.mp4",
      ]);

      // 6. Read the final video
      const videoData_output = await this.ffmpeg.readFile("final_video.mp4");
      const videoBlob = new Blob([videoData_output], { type: "video/mp4" });

      console.log("Video generation completed successfully");
      return videoBlob;
    } catch (error) {
      console.error("Error generating video:", error);
      throw error;
    }
  }

  async uploadVideoToSupabase(
    videoBlob: Blob,
    videoId: string
  ): Promise<string> {
    // This would integrate with your Supabase upload logic
    // For now, return a local blob URL
    return URL.createObjectURL(videoBlob);
  }
}
