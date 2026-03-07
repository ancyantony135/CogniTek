import { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import TaskCard from "./TaskCard";

export default function TaskBoard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [user?.id]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = user?.id ? { user_id: user.id } : {};
      const res = await api.get("/api/tasks", { params });
      // Active tasks first, then completed
      const sorted = res.data.sort((a, b) =>
        a.is_completed === b.is_completed ? 0 : a.is_completed ? 1 : -1
      );
      setTasks(sorted);
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    // Optimistic update
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t)
    );
    try {
      await api.patch(`/api/tasks/${id}`, { is_completed: !currentStatus });
    } catch (err) {
      console.error("Failed to update task", err);
      fetchTasks(); // revert on error
    }
  };

  const handleDelete = async (id) => {
    // Optimistic removal
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await api.delete(`/api/tasks/${id}`);
    } catch (err) {
      console.error("Failed to delete task", err);
      fetchTasks(); // revert on error
    }
  };

  if (loading) return (
    <div className="p-4 text-center text-[var(--text-secondary)]">Loading tasks...</div>
  );

  if (tasks.length === 0) return (
    <div className="tech-glass-card p-6 text-center text-[var(--text-secondary)] rounded-xl">
      No upcoming tasks. Good job!
    </div>
  );

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
