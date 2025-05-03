"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Node, Edge } from "reactflow";
import MindmapDisplayWrapper from "@/components/MindmapDisplay";
import { FiPlus, FiSliders, FiSearch, FiArrowUp } from "react-icons/fi";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  message_text: string;
  resource_type: string | null;
  content: any;
}

export default function ChatThreadPage() {
  const params = useParams();
  const chatId = params?.id as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMention, setShowMention] = useState(false);
  const mentionOptions = [
    { key: "flashcards", label: "Flashcards" },
    { key: "video", label: "Video" },
    { key: "mindmap", label: "Mindmap" },
  ];

  const API_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const fetchChat = async () => {
    const googleId =
      typeof window !== "undefined" ? localStorage.getItem("google_id") : null;
    if (!googleId) return;
    try {
      const resp = await fetch(
        `${API_URL}/chats/${chatId}?user_id=${googleId}`
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.description || resp.statusText);
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err.message || "Failed to load chat");
    }
  };

  useEffect(() => {
    if (chatId) fetchChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    // TODO: POST message to backend when endpoint ready
    setInput("");
  };

  const handleMention = (optionKey: string) => {
    // replace trailing '@' with '@optionKey '
    setInput((prev) => prev.replace(/@$|@$/, `@${optionKey} `));
    setShowMention(false);
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.resource_type === "mindmap" && msg.content) {
      const { nodes, edges, resource_id } = msg.content;
      return (
        <MindmapDisplayWrapper
          initialNodes={nodes as Node[]}
          initialEdges={edges as Edge[]}
          resourceId={resource_id}
        />
      );
    }
    return <span>{msg.message_text}</span>;
  };

  return (
    <div className="flex flex-col h-screen bg-[#1E1E1E] text-white">
      {/* Header */}
      <header className="bg-gray-800 px-6 py-4 shadow-md">
        <h1 className="text-xl font-semibold">Genie Chat</h1>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`relative max-w-lg px-5 py-3 rounded-lg break-words
                ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-700 text-gray-100"
                }
                shadow`}
            >
              {renderMessageContent(msg)}
              <span className="absolute bottom-0 right-2 text-xs text-gray-400 mt-1">
                {/* Placeholder time */}
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
      </main>

      {/* Input Bar */}
      <footer className="border border-neutral-700 px-4 py-3 mx-4 my-6 rounded-2xl flex items-center space-x-3">
        {/* Plus button */}
        <button className="p-2 rounded-full hover:bg-neutral-800 focus:outline-none">
          <FiPlus className="h-5 w-5 text-neutral-400" />
        </button>
        {/* Settings sliders */}
        <button className="p-2 rounded-full hover:bg-neutral-800 focus:outline-none">
          <FiSliders className="h-5 w-5 text-neutral-400" />
        </button>
        {/* Research button */}

        {/* Message input area */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Send to Genie..."
            value={input}
            onChange={(e) => {
              const val = e.target.value;
              setInput(val);
              if (/@$/.test(val)) setShowMention(true);
              else setShowMention(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="w-full bg-transparent text-white placeholder-neutral-500 px-4 py-2 rounded-full focus:outline-none"
          />
          {showMention && (
            <ul className="absolute bottom-full mb-2 bg-gray-800 border border-gray-700 rounded shadow-lg w-40 z-10">
              {mentionOptions.map((opt) => (
                <li
                  key={opt.key}
                  onClick={() => handleMention(opt.key)}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Send arrow */}
        <button
          onClick={handleSend}
          className="bg-amber-700 hover:bg-amber-600 p-3 rounded-full focus:outline-none shadow-md"
        >
          <FiArrowUp className="h-5 w-5 text-white" />
        </button>
      </footer>
    </div>
  );
}
