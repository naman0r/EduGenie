"use client";

import React, { useState, useEffect } from "react";

interface Note {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface NotesComponentProps {
  userId: string;
}

const NotesComponent: React.FC<NotesComponentProps> = ({ userId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/users/${userId}/notes`
      );
      if (!response.ok) throw new Error("Failed to fetch notes");
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      setError("Failed to load notes.");
    }
  };

  const addNote = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/users/${userId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newNote }),
        }
      );
      if (!response.ok) throw new Error("Failed to add note");
      const note = await response.json();
      setNotes((prev) => [note, ...prev]);
      setNewNote("");
    } catch (err) {
      setError("Failed to add note.");
    }
  };

  return (
    <div>
      <h2>Your Notes</h2>
      {error && <p>{error}</p>}
      <ul>
        {notes.map((note) => (
          <li key={note.id}>{note.content}</li>
        ))}
      </ul>
      <input
        type="text"
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        placeholder="New note"
      />
      <button onClick={addNote}>Add Note</button>
    </div>
  );
};

export default NotesComponent;
