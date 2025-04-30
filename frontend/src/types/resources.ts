export interface ResourceInfo {
  id: string; // UUID
  class_id: string;
  user_id: string;
  type: string;
  name: string;
  class_name?: string; // Make optional to allow null/undefined from fetch
  created_at: string; // ISO datetime string
  content?: Record<string, any>; // JSONB content
}

export interface MindmapContent {}

export interface NoteContent {}

export interface FlashcardContent {}
