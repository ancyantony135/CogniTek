import { useEffect, useState } from "react";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import api from "../api/api";

export default function TaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get("/api/tasks");
      // Filter out completed tasks for the "Upcoming" view, or show all?
      // Let's show active tasks first
      const sorted = res.data.sort((a, b) => (a.is_completed === b.is_completed ? 0 : a.is_completed ? 1 : -1));
      setTasks(sorted);
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (id, currentStatus) => {
    // Optimistic update
    setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));

    try {
      await api.patch(`/api/tasks/${id}`, { is_completed: !currentStatus });
    } catch (err) {
      console.error("Failed to update task", err);
      // Revert on error
      fetchTasks();
    }
  };

  if (loading) return <div className="p-4 text-center text-[var(--text-secondary)]">Loading tasks...</div>;

  return (
    <div className="space-y-4">
      {tasks.length === 0 && (
        <div className="tech-glass-card p-6 text-center text-[var(--text-secondary)] rounded-xl">
          No upcoming tasks. Good job!
        </div>
      )}

      {tasks.map((task) => (
        <div
          key={task.id}
          className={`tech-glass-card p-5 flex items-start justify-between group transition-all rounded-xl ${task.is_completed ? "opacity-60" : ""}`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full 
                    ${task.priority === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                {task.priority || "Normal"}
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-medium px-2 py-0.5 bg-[var(--glass)] border border-[var(--glass-border)] rounded-full">
                {task.subject || "General"}
              </span>
            </div>
            <h3 className={`font-semibold text-[var(--text-primary)] ${task.is_completed ? "line-through text-[var(--text-secondary)]" : ""}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{task.due_date || "No date"}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => toggleTask(task.id, task.is_completed)}
            className={`
                p-2 rounded-full transition-all duration-300
                ${task.is_completed
                ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
                : "text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--glass)]"
              }
            `}
          >
            <CheckCircle2 className="w-6 h-6" />
          </button>
        </div>
      ))}
    </div>
  );
}
