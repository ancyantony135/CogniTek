import { Clock, Calendar, BookOpen, CheckCircle2, Trash2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import api from "../api/api";

const PRIORITY_STYLES = {
  High: "bg-red-500/10 text-red-500 border-red-500/20",
  Medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export default function TaskCard({ task, onToggle, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const priorityStyle = PRIORITY_STYLES[task.priority] ?? "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div
      className={`tech-glass-card rounded-2xl overflow-hidden transition-all duration-300 ${task.is_completed ? "opacity-60" : ""
        }`}
    >
      {/* Priority accent bar */}
      <div
        className={`h-1 w-full ${task.priority === "High"
            ? "bg-gradient-to-r from-red-500 to-rose-400"
            : task.priority === "Medium"
              ? "bg-gradient-to-r from-amber-400 to-yellow-300"
              : "bg-gradient-to-r from-emerald-500 to-teal-400"
          }`}
      />

      <div className="p-5">
        {/* Row 1 — badges + complete toggle */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span
              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${priorityStyle}`}
            >
              {task.priority || "Normal"}
            </span>
            {task.subject && (
              <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)] font-medium px-2 py-0.5 bg-[var(--glass)] border border-[var(--glass-border)] rounded-full truncate max-w-[180px]">
                <BookOpen className="w-3 h-3 shrink-0" />
                {task.subject}
              </span>
            )}
          </div>

          <button
            onClick={() => onToggle(task.id, task.is_completed)}
            title={task.is_completed ? "Mark incomplete" : "Mark complete"}
            className={`p-1.5 rounded-full shrink-0 transition-all duration-300 ${task.is_completed
                ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
                : "text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--glass)]"
              }`}
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>

        {/* Row 2 — title */}
        <h3
          className={`font-bold text-[var(--text-primary)] text-base leading-snug mb-1 ${task.is_completed ? "line-through text-[var(--text-secondary)]" : ""
            }`}
        >
          {task.title}
        </h3>

        {/* Row 3 — description (collapsible) */}
        {task.description && (
          <div className="mb-3">
            <p
              className={`text-sm text-[var(--text-secondary)] leading-relaxed ${expanded ? "" : "line-clamp-2"
                }`}
            >
              {task.description}
            </p>
            {task.description.length > 100 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-0.5 text-[10px] font-semibold text-[var(--primary)] mt-0.5 hover:opacity-80"
              >
                {expanded ? (
                  <><ChevronUp className="w-3 h-3" /> Show less</>
                ) : (
                  <><ChevronDown className="w-3 h-3" /> Show more</>
                )}
              </button>
            )}
          </div>
        )}

        {/* Row 4 — footer: date · time · delete */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--glass-border)]">
          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {task.due_date}
              </span>
            )}
            {task.time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {task.time}
              </span>
            )}
          </div>

          <button
            onClick={() => onDelete(task.id)}
            title="Delete task"
            className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
