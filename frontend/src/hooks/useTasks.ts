import { useState, useCallback } from "react";
import { User } from "firebase/auth";
import { Task } from "@/types/task";

export const useTasks = (classId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [showCanvasModal, setShowCanvasModal] = useState(false);

  const fetchTasks = useCallback(
    async (user: User) => {
      if (!user || !classId) return;

      setTasksLoading(true);
      setTasksError(null);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/classes/${classId}/tasks?google_id=${user.uid}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch tasks: ${response.status} - ${errorText}`
          );
        }

        const data: Task[] = await response.json();
        setTasks(data);
      } catch (err: any) {
        console.error("Failed to fetch tasks:", err);
        setTasksError("Failed to load tasks. Please try again later.");
      } finally {
        setTasksLoading(false);
      }
    },
    [classId]
  );

  const handleTaskStatusChange = async (
    taskId: string,
    newStatus: string,
    user: User
  ) => {
    if (!user || !classId) return;

    // Optimistically update the UI
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus as any } : task
      )
    );

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/canvas/tasks/${taskId}/status`, // Corrected endpoint
        {
          method: "PUT", // Changed to PUT
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            google_id: user.uid,
            status: newStatus, // Ensure this matches what backend expects, e.g., 'status'
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to parse error response" }));
        throw new Error(
          `Failed to update task status: ${response.status} - ${
            errorData.error || response.statusText
          }`
        );
      }
      // Optionally, re-fetch tasks or update based on response if backend returns the updated task
      // For now, relying on optimistic update. If backend returns updated task:
      // const updatedTask = await response.json();
      // setTasks((prevTasks) =>
      //  prevTasks.map((task) =>
      //    task.id === taskId ? updatedTask : task
      //  )
      // );
      console.log("Task status updated successfully");
    } catch (err: any) {
      console.error("Failed to update task status:", err);
      setTasksError(err.message || "Failed to update task. Please try again.");
      // Revert optimistic update on error
      fetchTasks(user); // Or store original state and revert
    }
  };

  const handleCanvasImportSuccess = (user: User) => {
    fetchTasks(user);
  };

  return {
    tasks,
    tasksLoading,
    tasksError,
    showCanvasModal,
    setShowCanvasModal,
    fetchTasks,
    handleTaskStatusChange,
    handleCanvasImportSuccess,
  };
};
