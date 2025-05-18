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

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/classes/${classId}/tasks/${taskId}/status`,
        {
          method: "OPTIONS",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            google_id: user.uid,
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update task status: ${response.status}`);
      }

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus as any } : task
        )
      );
    } catch (err: any) {
      console.error("Failed to update task status:", err);
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
