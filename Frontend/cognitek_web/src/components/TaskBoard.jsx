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
      const res = await api.get("/tasks");
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
      await api.patch(`/tasks/${id}`, { is_completed: !currentStatus });
    } catch (err) {
      console.error("Failed to update task", err);
      // Revert on error
      fetchTasks();
    }
  };

  if (loading) return <div className="p-4 text-center text-slate-500">Loading tasks...</div>;

  return (
    <div className="space-y-4">
      {tasks.length === 0 && (
        <div className="glass-card p-6 text-center text-slate-400">
          No upcoming tasks. Good job!
        </div>
      )}

      {tasks.map((task) => (
        <div
          key={task.id}
          className={`glass-card p-5 flex items-start justify-between group transition-all ${task.is_completed ? "opacity-60 bg-slate-50" : "bg-white"}`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full 
                    ${task.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {task.priority || "Normal"}
              </span>
              <span className="text-xs text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-full">
                {task.subject || "General"}
              </span>
            </div>
            <h3 className={`font-semibold text-slate-800 ${task.is_completed ? "line-through text-slate-400" : ""}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
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
                ? "text-emerald-500 bg-emerald-50 hover:bg-emerald-100"
                : "text-slate-300 hover:text-indigo-500 hover:bg-indigo-50"
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
