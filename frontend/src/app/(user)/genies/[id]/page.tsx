"use client";

import React, { useState, useEffect, useRef, FormEvent } from "react";
import { useParams } from "next/navigation"; // To get ID from URL
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext"; // Added

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

  const { firebaseUser, isGoogleCalendarIntegrated } = useAuth(); // Added

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showResourcePanel, setShowResourcePanel] = useState(false);
  const [resourcePanelIndex, setResourcePanelIndex] = useState(0);
  const resourceOptions = [
    "mindmap",
    "flashcard",
    "quiz",
    "summary",
    "calendar event",
  ];
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

    const originalUserMessage = newMessage.trim();
    console.log("[DEBUG] Original User Message:", originalUserMessage); // DEBUG

    setNewMessage(""); // Clear input immediately
    setIsSending(true);
    setError(null);

    // Optimistically add user message to UI
    const optimisticUserMessage: ChatMessage = {
      id: crypto.randomUUID(), // Temporary client-side ID
      chat_id: chatId,
      sender: "user",
      message_text: originalUserMessage,
      resource_type: null,
      content: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);
    setTimeout(scrollToBottom, 0);

    // Calendar event command regex: @calendar event <SUMMARY> from <HH:MM AM/PM> to <HH:MM AM/PM> on <YYYY-MM-DD>
    const calendarCmdRegex =
      /@calendar\s+event\s+(.+?)\s+from\s+(\d{1,2}:\d{2}\s*[AP]M)\s+to\s+(\d{1,2}:\d{2}\s*[AP]M)\s+on\s+(\d{4}-\d{2}-\d{2})/i;

    console.log(
      "[DEBUG] Regex Test:",
      calendarCmdRegex.test(originalUserMessage)
    ); // DEBUG
    const calendarMatch = originalUserMessage.match(calendarCmdRegex);
    console.log("[DEBUG] Calendar Match Object:", calendarMatch); // DEBUG

    if (calendarMatch) {
      console.log(
        "[DEBUG] Matched calendar command. Proceeding with calendar logic."
      ); // DEBUG
      console.log(
        "[DEBUG] isGoogleCalendarIntegrated:",
        isGoogleCalendarIntegrated
      ); // DEBUG
      console.log(
        "[DEBUG] firebaseUser:",
        firebaseUser ? firebaseUser.uid : "null"
      ); // DEBUG

      if (!isGoogleCalendarIntegrated || !firebaseUser) {
        console.log("[DEBUG] Calendar not integrated or user not logged in."); // DEBUG
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          chat_id: chatId,
          sender: "ai",
          message_text:
            "Please connect your Google Calendar through your profile page first and ensure you are logged in.",
          resource_type: null,
          content: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsSending(false);
        return;
      }

      const [, summary, startTimeStr, endTimeStr, dateStr] = calendarMatch;

      const parseDateTime = (
        dateString: string,
        timeString: string
      ): string | null => {
        const [time, modifier] = timeString.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        if (modifier && modifier.toUpperCase() === "PM" && hours < 12)
          hours += 12;
        if (modifier && modifier.toUpperCase() === "AM" && hours === 12)
          hours = 0; // Midnight case

        if (isNaN(hours) || isNaN(minutes) || hours > 23 || minutes > 59)
          return null;

        const dateObj = new Date(dateString);
        if (isNaN(dateObj.getTime())) return null; // Invalid dateStr

        dateObj.setHours(hours, minutes, 0, 0);

        // Format to YYYY-MM-DDTHH:MM:SS
        const pad = (num: number) => num.toString().padStart(2, "0");
        return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(
          dateObj.getDate()
        )}T${pad(hours)}:${pad(minutes)}:00`;
      };

      const start_datetime = parseDateTime(dateStr, startTimeStr);
      const end_datetime = parseDateTime(dateStr, endTimeStr);
      console.log("[DEBUG] Parsed Start DateTime:", start_datetime); // DEBUG
      console.log("[DEBUG] Parsed End DateTime:", end_datetime); // DEBUG

      if (!start_datetime || !end_datetime) {
        console.log("[DEBUG] Invalid date/time format after parsing."); // DEBUG
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          chat_id: chatId,
          sender: "ai",
          message_text:
            "Invalid date/time format. Please use: @calendar event SUMMARY from HH:MM AM/PM to HH:MM AM/PM on YYYY-MM-DD",
          resource_type: null,
          content: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsSending(false);
        return;
      }

      // Check if start time is before end time
      if (new Date(start_datetime) >= new Date(end_datetime)) {
        console.log("[DEBUG] Start time is not before end time."); // DEBUG
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          chat_id: chatId,
          sender: "ai",
          message_text: "Event start time must be before the end time.",
          resource_type: null,
          content: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsSending(false);
        return;
      }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (!backendUrl) {
          console.error("[DEBUG] Backend URL not set."); // DEBUG
          throw new Error("Backend URL not set.");
        }
        console.log("[DEBUG] Attempting to call calendar API endpoint."); // DEBUG

        const response = await fetch(
          `${backendUrl}/calendar/users/${firebaseUser.uid}/calendar/events`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summary, start_datetime, end_datetime }),
          }
        );

        const responseData = await response.json(); // Always try to parse JSON
        console.log("[DEBUG] Calendar API Response Data:", responseData); // DEBUG

        if (!response.ok) {
          const errorDetails =
            responseData.description ||
            responseData.message ||
            `HTTP error ${response.status}`;
          console.error("[DEBUG] Calendar API Error:", errorDetails); // DEBUG
          throw new Error(errorDetails);
        }

        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          chat_id: chatId,
          sender: "ai",
          message_text: `Calendar event '${summary}' created successfully!`,
          resource_type: null,
          content: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (err: any) {
        console.error("[DEBUG] Error in calendar processing block:", err); // DEBUG
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          chat_id: chatId,
          sender: "ai",
          message_text: `Failed to create calendar event: ${
            err.message || "Unknown error"
          }`,
          resource_type: null,
          content: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } finally {
        setIsSending(false);
      }
      return; // Calendar event handled, stop further processing
    }
    console.log(
      "[DEBUG] Did not match calendar command. Proceeding with OpenAI logic."
    ); // DEBUG

    // --- Existing OpenAI/Resource Message Submission Logic ---
    let userMessageText = originalUserMessage; // Use the original message for AI
    let resourceType: string | null = null;

    // Detect @mindmap annotation (case-insensitive, word boundary)
    const mindmapRegex = /@mindmap\\b/i;
    if (mindmapRegex.test(userMessageText)) {
      resourceType = "mindmap";
      // Remove the annotation from the message text
      userMessageText = userMessageText.replace(mindmapRegex, "mindmap").trim();
    }

    // If no specific command handled above, proceed to call AI
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

      const responseText = await response.text();

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
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      setError(err.message || "An error occurred sending the message.");
      console.error("Send Message Error:", err);
      // Remove optimistic user message on actual error
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
