"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Chat {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export default function ChatListPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const API_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Fetch chats for the current user
  const fetchChats = async () => {
    const googleId =
      typeof window !== "undefined" ? localStorage.getItem("google_id") : null;
    if (!googleId) {
      setError("User ID not found. Please log in again.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const resp = await fetch(`${API_URL}/chats/?user_id=${googleId}`);
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.description || resp.statusText);
      }
      setChats(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load chats.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewChat = async () => {
    const name = window.prompt("Enter a name for your Genie:");
    if (!name || !name.trim()) return;

    const googleId =
      typeof window !== "undefined" ? localStorage.getItem("google_id") : null;
    if (!googleId) {
      alert("User ID not found. Please log in again.");
      return;
    }

    try {
      setIsCreating(true);
      const resp = await fetch(`${API_URL}/chats/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), user_id: googleId }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.description || resp.statusText);
      }
      router.push(`/chat/${data.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to create chat.");
    } finally {
      setIsCreating(false);
    }
  };

  const openChat = (id: string) => {
    router.push(`/chat/${id}`);
  };

  return (
    <div className="min-h-screen bg-black/[0.96] text-white flex flex-col pt-20 px-4 md:px-8 lg:px-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Genies</h1>
        <button
          onClick={handleNewChat}
          disabled={isCreating}
          className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded text-white disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "New Genie"}
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : chats.length === 0 ? (
        <p className="text-gray-400">No genies yet. Create one!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => openChat(chat.id)}
              className="cursor-pointer bg-gray-800/60 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition"
            >
              <h2 className="text-lg font-semibold mb-1">{chat.name}</h2>
              <p className="text-xs text-gray-400">
                Updated {new Date(chat.updated_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
