export interface Task {
  id: string;
  title: string;
  assigned_date: string;
  deadline: string;
  personal_completion_deadline: string;
  status: "pending" | "in-progress" | "completed";
}
