export interface Task {
  id: string;
  class_id: string;
  user_id: string;
  title: string;
  description?: string;
  type: string; // 'assignment', 'personal', etc.
  assigned_date: string | null;
  due_date: string | null;
  personal_deadline?: string | null;
  status: "pending" | "in-progress" | "completed";
  from_canvas: boolean;
  canvas_assignment_id?: number;
  canvas_html_url?: string;
  submission_types?: string[];
  created_at?: string;
}
