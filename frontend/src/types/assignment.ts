export interface CanvasAssignment {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  html_url: string;
  submission_types: string[];
  points_possible: number | null;
  course_id: number;
  course_name: string;
}
