"use client";

import React, { useState, useEffect, useRef } from "react";

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

interface VideoContent {
  video_id: string;
  title: string;
  type: string;
  status: string;
  audio_url: string;
  slides: SlideData[];
  total_duration: number;
  format: string;
  video_settings: VideoSettings;
  video_url?: string;
}

interface VideoPlayerComponentProps {
  content: VideoContent;
}

const VideoPlayerComponent: React.FC<VideoPlayerComponentProps> = ({
  content,
}) => {
  const [videoStatus, setVideoStatus] = useState<
    "ready" | "generating" | "completed" | "error"
  >("ready");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<string>("");
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate preview slide
  const generatePreviewSlide = (slideIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    const slide = content.slides[slideIndex];
    const settings = content.video_settings;

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

    // Split text into lines
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

    // Add slide number
    ctx.font = `24px ${settings.font_family}`;
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText(`${slideIndex + 1}`, canvas.width - 30, 40);
  };

  // Update preview when slide index changes
  useEffect(() => {
    generatePreviewSlide(previewSlideIndex);
  }, [previewSlideIndex, content]);

  // Initialize canvas on first load
  useEffect(() => {
    generatePreviewSlide(0);
  }, []);

  const generateVideo = async () => {
    setVideoStatus("generating");
    setGenerationProgress("Initializing video generation...");

    try {
      // Simulate video generation process
      // In a real implementation, you'd use the VideoGenerationService here

      setGenerationProgress("Loading FFmpeg...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setGenerationProgress("Generating slide images...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setGenerationProgress("Downloading audio...");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setGenerationProgress("Compiling video...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setGenerationProgress("Finalizing...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For now, use the audio URL as a placeholder
      // In production, this would be the generated MP4
      setVideoUrl(content.audio_url);
      setVideoStatus("completed");
      setGenerationProgress("Video generation completed!");
    } catch (error) {
      console.error("Video generation failed:", error);
      setVideoStatus("error");
      setGenerationProgress("Video generation failed. Please try again.");
    }
  };

  if (content.format === "slide_compilation") {
    return (
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-slate-200">
            {content.title}
          </h3>
          <p className="text-sm text-slate-400">
            Duration: ~{content.total_duration} seconds •{" "}
            {content.slides.length} slides
          </p>
        </div>

        {/* Video Status */}
        {videoStatus === "ready" && (
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-slate-300">
                Ready to Generate Video
              </h4>
              <button
                onClick={generateVideo}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                🎬 Generate MP4 Video
              </button>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Preview:</span>
                <select
                  value={previewSlideIndex}
                  onChange={(e) =>
                    setPreviewSlideIndex(parseInt(e.target.value))
                  }
                  className="bg-slate-700 text-slate-200 px-2 py-1 rounded text-sm"
                >
                  {content.slides.map((_, index) => (
                    <option key={index} value={index}>
                      Slide {index + 1}
                    </option>
                  ))}
                </select>
              </div>

              <canvas
                ref={canvasRef}
                className="w-full max-w-md rounded-lg border border-slate-600"
                style={{ aspectRatio: "16/9" }}
              />

              <p className="text-xs text-slate-400 italic">
                "{content.slides[previewSlideIndex]?.text}"
              </p>
            </div>
          </div>
        )}

        {videoStatus === "generating" && (
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
              <h4 className="text-sm font-medium text-slate-300">
                Generating Video...
              </h4>
            </div>
            <p className="text-sm text-slate-400">{generationProgress}</p>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
              <div className="bg-indigo-600 h-2 rounded-full w-1/3 animate-pulse"></div>
            </div>
          </div>
        )}

        {videoStatus === "completed" && videoUrl && (
          <div className="bg-slate-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3">
              ✅ Video Generated Successfully!
            </h4>
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
              <video
                controls
                src={videoUrl}
                className="w-full h-full"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {videoStatus === "error" && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-300 mb-2">
              ❌ Video Generation Failed
            </h4>
            <p className="text-sm text-red-400">{generationProgress}</p>
            <button
              onClick={() => setVideoStatus("ready")}
              className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Audio Player */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">
            Audio Narration:
          </h4>
          <audio
            controls
            src={content.audio_url}
            className="w-full"
            preload="metadata"
          >
            Your browser does not support the audio tag.
          </audio>
        </div>

        {/* Slides Breakdown */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">
            Video Script:
          </h4>
          <div className="space-y-3">
            {content.slides.map((slide, index) => (
              <div
                key={index}
                className="bg-slate-700 rounded-lg p-3 border border-slate-600"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                    Slide {index + 1}
                  </span>
                  <span className="text-xs text-slate-400">
                    {slide.duration}s
                  </span>
                </div>
                <p className="text-sm text-slate-200 font-medium mb-1">
                  "{slide.text}"
                </p>
                <p className="text-xs text-slate-400">
                  Narration: {slide.narration}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fallback for other video formats
  return (
    <div className="w-full">
      <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
        <video
          controls
          src={content.video_url}
          className="w-full h-full"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default VideoPlayerComponent;
