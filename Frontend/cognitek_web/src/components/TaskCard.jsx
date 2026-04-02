import { Clock, Calendar, BookOpen, CheckCircle2, Trash2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const PRIORITY_STYLES = {
  High: "bg-red-500/10 text-red-500 border-red-500/20",
  Medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

// Resolves "today", "tomorrow", raw date strings to a human-friendly label
function resolveDisplayDate(dateStr) {
  if (!dateStr) return null;
  const lower = dateStr.toLowerCase().trim();
  const now = new Date();

  const fmt = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  if (lower === "today") {
    return { label: `Today · ${fmt(now)}`, isToday: true, isTomorrow: false, isOverdue: false };
  }
  if (lower === "tomorrow") {
    const tom = new Date(now); tom.setDate(tom.getDate() + 1);
    return { label: `Tomorrow · ${fmt(tom)}`, isToday: false, isTomorrow: true, isOverdue: false };
  }
  // Try to parse as date
  const parsed = new Date(dateStr);
  if (!isNaN(parsed)) {
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const parsedMid = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    const diffDays = Math.round((parsedMid - todayMid) / 86400000);
    const isOverdue = diffDays < 0;
    const isToday = diffDays === 0;
    const isTomorrow = diffDays === 1;
    let label = fmt(parsed);
    if (isToday) label = `Today · ${fmt(parsed)}`;
    else if (isTomorrow) label = `Tomorrow · ${fmt(parsed)}`;
    else if (diffDays === 2) label = `In 2 days · ${fmt(parsed)}`;
    else if (isOverdue) label = `Overdue · ${fmt(parsed)}`;
    return { label, isToday, isTomorrow, isOverdue, diffDays };
  }
  return { label: dateStr, isToday: false, isTomorrow: false, isOverdue: false };
}

export default function TaskCard({ task, onToggle, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const dateInfo = resolveDisplayDate(task.due_date);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-300 ${task.is_completed ? "opacity-60 grayscale-[0.5]" : "hover:border-indigo-200 hover:shadow-md"}`}
    >
      {/* Priority Indicator */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${
        task.priority === "High" ? "bg-rose-500" :
        task.priority === "Medium" ? "bg-amber-400" : "bg-emerald-400"
      }`} />

      <div className="pl-5 pr-4 py-4">
        {/* Top Meta info */}
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                   task.priority === "High" ? "bg-rose-50 border-rose-100 text-rose-600" :
                   task.priority === "Medium" ? "bg-amber-50 border-amber-100 text-amber-600" :
                   "bg-emerald-50 border-emerald-100 text-emerald-600"
                }`}>
                    {task.priority || "Normal"}
                </span>
                {task.subject && (
                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">
                        {task.subject}
                    </span>
                )}
            </div>
            <button
                onClick={() => onToggle(task.id, task.is_completed)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    task.is_completed ? "bg-emerald-500 border-emerald-500" : "border-slate-200 hover:border-indigo-500"
                }`}
            >
                {task.is_completed && <CheckCircle2 className="w-4 h-4 text-white" />}
            </button>
        </div>

        {/* Task Title */}
        <h3 className={`text-sm font-black text-slate-800 mb-2 leading-snug ${task.is_completed ? "line-through opacity-50" : ""}`}>
            {task.title}
        </h3>

        {/* Bottom Detail */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-3">
                {dateInfo && (
                    <div className="flex items-center gap-1.5 font-bold">
                        <Calendar className={`w-3 h-3 ${dateInfo.isOverdue && !task.is_completed ? "text-rose-500" : "text-slate-400"}`} />
                        <span className={`text-[10px] ${
                            dateInfo.isOverdue && !task.is_completed ? "text-rose-600" : "text-slate-500"
                        }`}>
                            {dateInfo.label}
                        </span>
                    </div>
                )}
                {task.time && (
                    <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-500">{task.time}</span>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-1">
                <button onClick={() => onDelete(task.id)} className="p-1 px-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
                {(task.description || task.notes) && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-1 px-2 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-all"
                    >
                        {expanded ? "Less" : "Info"}
                    </button>
                )}
            </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
            {task.description && (
              <div className="flex flex-col gap-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Description</p>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{task.description}</p>
              </div>
            )}
            {task.notes && (
              <div className="flex flex-col gap-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sylens Insight</p>
                <p className="text-[11px] text-slate-500 italic leading-relaxed">{task.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
