import React from "react";
import Link from "next/link";
import { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  showClassInfo?: boolean;
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  showClassInfo = false,
  onStatusChange,
}) => {
  // Format date helper function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Determine if task is overdue
  const isOverdue = () => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    return dueDate < new Date() && task.status !== "completed";
  };

  // Get status styling
  const getStatusStyles = () => {
    if (task.status === "completed") {
      return "bg-green-500/20 text-green-300";
    } else if (task.status === "in-progress") {
      return "bg-yellow-500/20 text-yellow-300";
    } else if (isOverdue()) {
      return "bg-red-500/20 text-red-300";
    } else {
      return "bg-gray-500/20 text-gray-300";
    }
  };

  // Handle status change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onStatusChange) {
      onStatusChange(task.id, e.target.value);
    }
  };

  return (
    <div className="bg-gray-700/50 p-4 rounded-md border border-gray-600 hover:bg-gray-700/70 transition duration-150">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-gray-100">{task.title}</h3>
        <div className="flex items-center gap-2">
          {task.from_canvas && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300">
              Canvas
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusStyles()}`}
          >
            {isOverdue() && task.status !== "completed"
              ? "Overdue"
              : task.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-400 mb-3">
        {task.assigned_date && (
          <div>
            Assigned:{" "}
            <span className="text-gray-300">
              {formatDate(task.assigned_date)}
            </span>
          </div>
        )}
        <div>
          Due:{" "}
          <span
            className={`${
              isOverdue() ? "text-red-400" : "text-gray-300"
            } font-medium`}
          >
            {formatDate(task.due_date)}
          </span>
        </div>
        {task.personal_deadline && (
          <div>
            Personal Goal:{" "}
            <span className="text-blue-400">
              {formatDate(task.personal_deadline)}
            </span>
          </div>
        )}
      </div>

      {/* Canvas URL Link */}
      {task.canvas_html_url && (
        <div className="mb-3">
          <a
            href={task.canvas_html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline flex items-center"
          >
            <span className="mr-1">View in Canvas</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      )}

      {/* Status Change Dropdown */}
      {onStatusChange && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <label
            htmlFor={`status-${task.id}`}
            className="text-xs text-gray-400 block mb-1"
          >
            Update Status:
          </label>
          <select
            id={`status-${task.id}`}
            value={task.status}
            onChange={handleStatusChange}
            className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-600 w-full md:w-auto"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
