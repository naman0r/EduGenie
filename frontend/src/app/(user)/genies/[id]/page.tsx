"use client";

import React, { useState, useEffect, useRef, FormEvent } from "react";
import { useParams } from "next/navigation"; // To get ID from URL
import dynamic from "next/dynamic";

interface ChatMessage {
  id: string; // UUID
  chat_id: string; // UUID
  sender: "user" | "ai";
  message_text: string | null;
  resource_type: string | null;
  content: any | null; // JSONB content
  created_at: string; // ISO timestamp
}

const MindmapChatView = dynamic(
  () => import("../_chatComponents/MindmapChatView"),
  { ssr: false }
);

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const chatId = params.id as string; // Get chat ID from route

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showResourcePanel, setShowResourcePanel] = useState(false);
  const [resourcePanelIndex, setResourcePanelIndex] = useState(0);
  const resourceOptions = ["mindmap", "flashcard", "quiz", "summary"];
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Helper: Scroll to bottom ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Fetch Initial Messages ---
  useEffect(() => {
    if (!chatId) return; // Don't fetch if chatId is not available yet

    const fetchMessages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (!backendUrl) throw new Error("Backend URL not set.");

        const response = await fetch(`${backendUrl}/genie/${chatId}/messages`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch messages (${response.status}): ${response.statusText}`
          );
        }
        const data: ChatMessage[] = await response.json();
        setMessages(data);
      } catch (err: any) {
        setError(err.message || "An error occurred fetching messages.");
        console.error("Fetch Messages Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [chatId]);

  // --- Scroll on new messages ---
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Handle Message Submission ---
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newMessage.trim() || isSending) return;

    let userMessageText = newMessage.trim();
    let resourceType: string | null = null;

    // Detect @mindmap annotation (case-insensitive, word boundary)
    const mindmapRegex = /@mindmap\b/i;
    if (mindmapRegex.test(userMessageText)) {
      resourceType = "mindmap";
      // Remove the annotation from the message text
      userMessageText = userMessageText.replace(mindmapRegex, "").trim();
    }

    setNewMessage(""); // Clear input immediately
    setIsSending(true);
    setError(null);

    // Optimistically add user message to UI
    const optimisticUserMessage: ChatMessage = {
      id: crypto.randomUUID(), // Temporary client-side ID
      chat_id: chatId,
      sender: "user",
      message_text: userMessageText,
      resource_type: null,
      content: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

    // Wait a tick for the state update and then scroll
    setTimeout(scrollToBottom, 0);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) throw new Error("Backend URL not set.");

      const body: any = { message_text: userMessageText };
      if (resourceType) body.resource_type = resourceType;

      const response = await fetch(`${backendUrl}/genie/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseText = await response.text(); // Read response body once

      if (!response.ok) {
        let errorDetails = responseText;
        try {
          const errorJson = JSON.parse(responseText);
          errorDetails =
            errorJson.description || errorJson.error || responseText;
        } catch (parseError) {
          /* Ignore */
        }
        throw new Error(
          `Failed to send message (${response.status}): ${errorDetails}`
        );
      }

      const aiMessage: ChatMessage = JSON.parse(responseText);

      console.log("AI resource_type:", aiMessage.resource_type);
      console.log("AI content:", aiMessage.content);

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      setError(err.message || "An error occurred sending the message.");
      console.error("Send Message Error:", err);
      // Optional: Remove optimistic message on error
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimisticUserMessage.id)
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-900 to-black text-slate-200 overflow-y-auto">
      {/* Assume header takes ~pt-16 or 4rem. Adjust padding below header */}
      <div className="flex-grow flex flex-col pt-16">
        {/* Message Display Area: Takes remaining height, scrollable */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4">
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <p className="text-center text-slate-400">Loading messages...</p>
            </div>
          )}
          {!isLoading && messages.length === 0 && !error && (
            <div className="flex justify-center items-center h-full">
              <p className="text-center text-slate-400">
                Start the conversation by typing below.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl px-4 py-3 rounded-xl shadow-md break-words ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-700 text-slate-100"
                }`}
                style={
                  msg.sender === "ai" &&
                  msg.resource_type === "mindmap" &&
                  msg.content
                    ? { width: "100%", height: "400px", minWidth: "300px" }
                    : {}
                }
              >
                {/* Render mindmap if AI and resource_type is mindmap and content exists */}
                {msg.sender === "ai" &&
                msg.resource_type === "mindmap" &&
                msg.content ? (
                  <MindmapChatView content={msg.content} />
                ) : (
                  <p className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap">
                    {msg.message_text}
                  </p>
                )}
              </div>
            </div>
          ))}
          {/* Anchor for scrolling */}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display Area */}
        {error && (
          <div className="p-3 border-t border-slate-700 bg-red-900/30 text-red-300 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Message Input Area: Stick to bottom */}
        <div className="p-3 md:p-4 border-t border-slate-700 bg-slate-800/50">
          <form
            onSubmit={handleSubmit}
            className="flex items-center space-x-3 w-full max-w-4xl mx-auto"
          >
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                // Show panel if last character is '@' and not already showing
                if (e.target.value.endsWith("@")) {
                  setShowResourcePanel(true);
                  setResourcePanelIndex(0);
                } else if (!e.target.value.includes("@")) {
                  setShowResourcePanel(false);
                }
              }}
              onKeyDown={(e) => {
                if (showResourcePanel) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setResourcePanelIndex(
                      (prev) => (prev + 1) % resourceOptions.length
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setResourcePanelIndex(
                      (prev) =>
                        (prev - 1 + resourceOptions.length) %
                        resourceOptions.length
                    );
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    // Insert selected resource at the position of '@'
                    const atIdx = newMessage.lastIndexOf("@");
                    if (atIdx !== -1) {
                      const before = newMessage.slice(0, atIdx);
                      const after = newMessage.slice(atIdx + 1);
                      const newVal = `${before}@${resourceOptions[resourcePanelIndex]} ${after}`;
                      setNewMessage(newVal);
                      setShowResourcePanel(false);
                      // Move cursor to after inserted resource
                      setTimeout(() => {
                        if (inputRef.current) {
                          inputRef.current.selectionStart =
                            inputRef.current.selectionEnd =
                              before.length +
                              resourceOptions[resourcePanelIndex].length +
                              2;
                          inputRef.current.focus();
                        }
                      }, 0);
                    }
                  } else if (e.key === "Escape") {
                    setShowResourcePanel(false);
                  }
                }
              }}
              placeholder="Type your message..."
              disabled={isSending}
              className="flex-grow px-4 py-2.5 border border-slate-600 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-60"
            />
            {showResourcePanel && (
              <div className="absolute bottom-16 left-0 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-10">
                {resourceOptions.map((option, idx) => (
                  <div
                    key={option}
                    className={`px-4 py-2 cursor-pointer ${
                      idx === resourcePanelIndex
                        ? "bg-indigo-600 text-white"
                        : "text-slate-200"
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      // Insert selected resource at the position of '@'
                      const atIdx = newMessage.lastIndexOf("@");
                      if (atIdx !== -1) {
                        const before = newMessage.slice(0, atIdx);
                        const after = newMessage.slice(atIdx + 1);
                        const newVal = `${before}@${option} ${after}`;
                        setNewMessage(newVal);
                        setShowResourcePanel(false);
                        setTimeout(() => {
                          if (inputRef.current) {
                            inputRef.current.selectionStart =
                              inputRef.current.selectionEnd =
                                before.length + option.length + 2;
                            inputRef.current.focus();
                          }
                        }, 0);
                      }
                    }}
                  >
                    @{option}
                  </div>
                ))}
              </div>
            )}
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium flex-shrink-0 shadow-md"
            >
              {isSending ? (
                // Simple spinner
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
              ) : (
                // Send Icon (optional) or Text
                // <SendHorizonal className="h-5 w-5" />
                "Send"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
