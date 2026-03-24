import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TaskBoard from "../components/TaskBoard";
import FlashcardDeck from "../components/FlashcardDeck";
import api from "../api/api";
import {
    ClipboardList, Zap, Target, CalendarDays, Mic,
    Trophy, ChevronRight, BookOpen, Clock
} from "lucide-react";

// ── Time-based greeting ───────────────────────────────────────────────────────
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return { text: "Good morning", emoji: "☀️", tip: "Start strong — tackle the hardest task first." };
    if (h < 17) return { text: "Good afternoon", emoji: "⚡", tip: "Stay focused. You're in the productivity zone." };
    if (h < 21) return { text: "Good evening", emoji: "🌙", tip: "Review today's progress before winding down." };
    return { text: "Still up?", emoji: "🦉", tip: "Night owl mode: great time for deep study." };
}

// ── Day streak (uses localStorage) ───────────────────────────────────────────
function getStreak() {
    try {
        const today = new Date().toDateString();
        const data = JSON.parse(localStorage.getItem("cognitek_streak") || "{}");
        if (data.lastDate === today) return data.count || 1;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newCount = data.lastDate === yesterday ? (data.count || 1) + 1 : 1;
        localStorage.setItem("cognitek_streak", JSON.stringify({ lastDate: today, count: newCount }));
        return newCount;
    } catch { return 1; }
}

// ── Placement Tab ─────────────────────────────────────────────────────────────
function PlacementTab({ userId }) {
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        api.get("/api/placement-milestones", { params: { user_id: userId } })
            .then(r => setMilestones(r.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [userId]);

    const toggle = async (id, current) => {
        await api.patch(`/api/placement-milestones/${id}`, { is_done: !current });
        setMilestones(ms => ms.map(m => m.id === id ? { ...m, is_done: !m.is_done } : m));
    };

    if (loading) return (
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>
    );

    if (milestones.length === 0) return (
        <div className="flex flex-col items-center justify-center h-52 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
                <Trophy className="w-7 h-7 text-amber-400" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">No placements detected yet</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Record a session mentioning a company drive or interview — Sylens will auto-detect it!
            </p>
        </div>
    );

    return (
        <div className="space-y-3 p-1">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 px-1">
                Detected from your recordings
            </p>
            {milestones.map(m => (
                <div
                    key={m.id}
                    className={`p-4 rounded-2xl border transition-all ${
                        m.is_done
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-white border-slate-200 shadow-sm"
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <button
                            onClick={() => toggle(m.id, m.is_done)}
                            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                                m.is_done ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                            }`}
                        >
                            {m.is_done && <span className="text-white text-[10px] font-black">✓</span>}
                        </button>
                        <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm ${m.is_done ? "line-through text-emerald-600" : "text-slate-800"}`}>
                                {m.title}
                            </p>
                            {m.company && (
                                <span className="inline-block text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full mt-1">
                                    {m.company}
                                </span>
                            )}
                            {m.notes && (
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{m.notes}</p>
                            )}
                            {m.due_date && (
                                <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5">
                                    <Clock className="w-3 h-3" /> {m.due_date}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Schedule Tab ──────────────────────────────────────────────────────────────
function ScheduleTab({ userId }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        api.get("/api/tasks", { params: { user_id: userId } })
            .then(r => {
                const sorted = (r.data || [])
                    .filter(t => !t.is_completed)
                    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
                setTasks(sorted);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) return <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>;

    // Group by due_date
    const groups = tasks.reduce((acc, t) => {
        const key = t.due_date || "Upcoming";
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
    }, {});

    if (Object.keys(groups).length === 0) return (
        <div className="flex flex-col items-center justify-center h-52 text-center">
            <CalendarDays className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">All clear — no upcoming tasks!</p>
        </div>
    );

    return (
        <div className="space-y-4">
            {Object.entries(groups).map(([date, items]) => (
                <div key={date}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">{date}</p>
                    <div className="space-y-2">
                        {items.map(t => (
                            <div key={t.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    t.priority === "High" ? "bg-red-400" :
                                    t.priority === "Medium" ? "bg-amber-400" : "bg-slate-300"
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{t.title}</p>
                                    <p className="text-[11px] text-slate-400 truncate">{t.subject}</p>
                                </div>
                                {t.time && <span className="text-[10px] text-slate-400 flex-shrink-0">{t.time}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const TABS = [
    { id: "tasks",      label: "Tasks",      icon: ClipboardList, color: "text-violet-600 bg-violet-50" },
    { id: "flashcards", label: "Flash",      icon: Zap,            color: "text-amber-600 bg-amber-50"  },
    { id: "placement",  label: "Placement",  icon: Trophy,         color: "text-emerald-600 bg-emerald-50" },
    { id: "schedule",   label: "Schedule",   icon: CalendarDays,   color: "text-sky-600 bg-sky-50"      },
];

export default function Home() {
    const { user, getDisplayName } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("tasks");
    const [refreshKey, setRefreshKey] = useState(0);
    const [urgentTask, setUrgentTask] = useState(null);

    const greeting = getGreeting();
    const streak = getStreak();
    const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });

    // Fetch urgent task for Today's Focus card
    useEffect(() => {
        if (!user?.id) return;
        api.get("/api/tasks", { params: { user_id: user.id } })
            .then(r => {
                const pending = (r.data || []).filter(t => !t.is_completed);
                const high = pending.find(t => t.priority === "High") || pending[0];
                setUrgentTask(high || null);
            })
            .catch(() => {});
        // Silent repair
        api.get("/api/repair-user-data", { params: { user_id: user.id } }).catch(() => {});
    }, [user?.id, refreshKey]);

    return (
        <div className="min-h-screen bg-[#f7f7f9]">

            {/* ── STICKY HEADER ────────────────────────────────────────── */}
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 pt-10 pb-3 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[11px] text-slate-400 font-medium">{today}</p>
                        <h1 className="text-lg font-black text-slate-900 leading-tight">
                            {greeting.emoji} {greeting.text}, {getDisplayName()}
                        </h1>
                    </div>
                    {/* Streak badge */}
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
                        <span className="text-base">🔥</span>
                        <span className="text-sm font-black text-amber-600">{streak}</span>
                        <span className="text-[10px] font-semibold text-amber-500">day{streak !== 1 ? "s" : ""}</span>
                    </div>
                </div>

                {/* Motivational tip */}
                <p className="text-xs text-slate-400 mt-1 italic">{greeting.tip}</p>
            </div>

            <div className="px-4 pb-28">

                {/* ── TODAY'S FOCUS ────────────────────────────────────── */}
                {urgentTask && (
                    <div className="mt-5 mb-4 rounded-2xl overflow-hidden shadow-md">
                        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                                Today's Focus
                            </p>
                            <p className="text-white font-bold text-base leading-snug">{urgentTask.title}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[11px] text-white/50">{urgentTask.subject}</span>
                                {urgentTask.due_date && (
                                    <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-medium">
                                        {urgentTask.due_date}
                                    </span>
                                )}
                                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    urgentTask.priority === "High"
                                        ? "bg-red-500/20 text-red-300"
                                        : "bg-amber-500/20 text-amber-300"
                                }`}>
                                    {urgentTask.priority}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB STRIP ────────────────────────────────────────── */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 mb-4">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 border ${
                                    isActive
                                        ? `${tab.color} border-transparent shadow-sm scale-105`
                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── TAB PANELS ──────────────────────────────────────── */}
                <div className="transition-all duration-200">
                    {activeTab === "tasks" && (
                        <TaskBoard key={`tasks-${refreshKey}`} />
                    )}
                    {activeTab === "flashcards" && (
                        <FlashcardDeck key={`deck-${refreshKey}`} />
                    )}
                    {activeTab === "placement" && (
                        <PlacementTab userId={user?.id} />
                    )}
                    {activeTab === "schedule" && (
                        <ScheduleTab userId={user?.id} />
                    )}
                </div>
            </div>

            {/* ── QUICK RECORD FAB ───────────────────────────────────── */}
            <button
                onClick={() => navigate("/record")}
                className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#6366f1] text-white shadow-xl shadow-indigo-900/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                title="Quick Record"
            >
                <Mic className="w-6 h-6" />
            </button>
        </div>
    );
}
