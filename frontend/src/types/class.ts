export interface ClassData {
  id: string;
  user_id: string;
  name: string;
  code?: string | null;
  instructor?: string | null;
  created_at: string;
  canvas_course_id?: number;
}
