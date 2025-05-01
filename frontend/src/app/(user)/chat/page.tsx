"use client";

import React, { useState } from "react";

// Simple message interface for the chat placeholder
interface ChatMessage {
  id: number;
  sender: "user" | "ai";
  text: string;
}

const ChatPage = () => {
  // State for Video Generation
  const [videoInputText, setVideoInputText] = useState<string>("");
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // State for Chat
  const [chatInput, setChatInput] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    // Example initial message
    {
      id: 1,
      sender: "ai",
      text: "Hello! How can I help you today? You can ask me to generate a video based on text.",
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false); // For potential future AI chat responses

  const handleGenerateVideo = async () => {
    if (!videoInputText.trim()) {
      setVideoError("Please enter some text to generate a video from.");
      return;
    }
    setIsVideoLoading(true);
    setVideoError(null);
    setVideoUrl(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/generate-video`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: videoInputText }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.description || `HTTP error! Status: ${response.status}`
        );
      }
      if (data.video_url) {
        const fullUrl = data.video_url.startsWith("/")
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${data.video_url}`
          : data.video_url;
        setVideoUrl(fullUrl);
        // Optionally clear video input: setVideoInputText("");
      } else {
        throw new Error("Backend did not return a video URL.");
      }
    } catch (err: any) {
      console.error("Video generation error:", err);
      setVideoError(
        err.message || "An unknown error occurred during video generation."
      );
    } finally {
      setIsVideoLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newUserMessage: ChatMessage = {
      id: Date.now(), // simple unique id
      sender: "user",
      text: chatInput,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setChatInput("");

    setIsChatLoading(true);
    setTimeout(() => {
      // Simulate AI thinking
      const aiResponse: ChatMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: `Okay, I received: "${newUserMessage.text.substring(
          0,
          50
        )}...". I'm not fully connected yet, but you can use the Video Generator section!`,
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsChatLoading(false);
    }, 1500);
  };

  return (
    // Use flex column for overall layout
    <div className="min-h-screen flex flex-col bg-black/[0.96] text-white">
      {/* Header/Navbar space - assuming layout.tsx handles the actual navbar */}
      <div className="pt-20"></div>

      {/* Main content area */}
      <div className="flex-grow flex flex-col md:flex-row gap-6 px-4 md:px-8 lg:px-16 pb-6">
        {/* Left Panel: Chat Interface */}
        <div className="flex-1 flex flex-col bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
          {/* Chat messages area */}
          <div className="flex-grow p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-lg max-w-[80%] break-words ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-600 text-gray-100"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-lg bg-gray-600 text-gray-100 animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Chat input area */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !isChatLoading && handleSendMessage()
                } // Send on Enter
                placeholder="Send a message..."
                className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400"
                disabled={isChatLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isChatLoading || !chatInput.trim()}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 transition disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Video Generator */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          {/* Input Section */}
          <div className="p-6 bg-gray-800/70 rounded-xl border border-gray-700 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
              AI Video Generator
            </h2>
            <label
              htmlFor="videoText"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Enter text to convert to video:
            </label>
            <textarea
              id="videoText"
              rows={5}
              value={videoInputText}
              onChange={(e) => setVideoInputText(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition text-white placeholder-gray-400 shadow-sm"
              placeholder="Paste text here..."
              disabled={isVideoLoading}
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleGenerateVideo}
                disabled={isVideoLoading || !videoInputText.trim()}
                className="flex items-center justify-center px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
              >
                {isVideoLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  "Generate Video"
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {videoError && (
            <div className="p-4 bg-red-900/70 border border-red-700 rounded-lg text-red-200 shadow-md">
              <p className="font-semibold text-red-100">Video Error:</p>
              <p className="mt-1 text-sm">{videoError}</p>
            </div>
          )}

          {/* Loading Placeholder */}
          {isVideoLoading && !videoUrl && (
            <div className="p-6 bg-gray-800/70 rounded-xl border border-gray-700 shadow-lg flex flex-col items-center justify-center h-40">
              <svg
                className="animate-spin h-8 w-8 text-indigo-400 mb-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-md text-gray-300">Generating video...</p>
            </div>
          )}

          {/* Video Player Section */}
          {videoUrl && (
            <div className="p-6 bg-gray-800/70 rounded-xl border border-gray-700 shadow-lg">
              <h2 className="text-lg font-semibold mb-3 text-gray-100">
                Generated Video:
              </h2>
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden ring-1 ring-gray-600">
                <video controls src={videoUrl} className="w-full h-full">
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
