export interface UserProfile {
  google_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null; // From Firebase, synced to backend
  academic_year: number | null;
  academic_level: string | null;
  institution: string | null;
  plan_type?: string | null; // Optional, as seen in ProfilePage
  credits?: number | null; // This might be managed separately or part of user profile
  created_at?: string;
  last_logged_in?: string;
  google_refresh_token?: string | null; // For Google Calendar integration
  canvas_domain?: string | null; // For Canvas integration
  canvas_access_token?: string | null; // For Canvas integration (sensitive, usually not sent to FE)
}

// You might also want a type for the data you send when updating the profile
export interface UserProfileUpdateData {
  full_name?: string;
  academic_year?: number | null;
  academic_level?: string | null;
  institution?: string | null;
  // Include other fields that can be updated if necessary
}
