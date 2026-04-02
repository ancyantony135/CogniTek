import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TaskBoard from "../components/TaskBoard";
import FlashcardDeck from "../components/FlashcardDeck";
import api from "../api/api";
import {
    ClipboardList, Zap, Target, CalendarDays,
    Trophy, ChevronRight, BookOpen, Clock, Bell,
    AlertCircle, Trash2, Lock, GraduationCap, Flame,
    X, BookMarked, ChevronDown, ChevronUp, CalendarCheck,
    Plus, Check, Loader2
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

// ── Date diff helper ─────────────────────────────────────────────────────────
function getDueDiff(dateStr) {
    if (!dateStr) return null;
    const lower = dateStr.toLowerCase().trim();
    const now = new Date();
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (lower === "today") return 0;
    if (lower === "tomorrow") return 1;
    const parsed = new Date(dateStr);
    if (isNaN(parsed)) return null;
    const parsedMid = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    return Math.round((parsedMid - todayMid) / 86400000);
}

// ── Deadline Alert Banner ─────────────────────────────────────────────────────
function DeadlineAlert({ tasks, milestones, onDismiss }) {
    const now = new Date();
    const fmt = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

    const urgent = [];
    [...(tasks || []), ...(milestones || [])].forEach(item => {
        if (item.is_completed || item.is_done) return;
        const diff = getDueDiff(item.due_date || item.time);
        if (diff !== null && diff <= 2 && diff >= 0) {
            urgent.push({ ...item, diff, isTask: !!item.title });
        }
    });

    if (urgent.length === 0) return null;

    return (
        <div className="mx-0 mt-3 mb-1 rounded-2xl border border-red-200 bg-red-50 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                <Bell className="w-4 h-4 text-red-500 animate-bounce" />
                <p className="text-xs font-black text-red-700 flex-1">
                    {urgent.length} deadline{urgent.length > 1 ? "s" : ""} approaching!
                </p>
                <button onClick={onDismiss} className="p-1 rounded-lg hover:bg-red-100 text-red-400">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="px-4 pb-3 space-y-1.5">
                {urgent.map(item => (
                    <div key={item.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                        item.diff === 0 ? "bg-red-100 border-red-300" : "bg-amber-50 border-amber-200"
                    }`}>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.diff === 0 ? "bg-red-500" : "bg-amber-400"}`} />
                        <p className="text-xs font-semibold text-slate-800 flex-1 truncate">{item.title}</p>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                            item.diff === 0 ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800"
                        }`}>
                            {item.diff === 0 ? "Today!" : item.diff === 1 ? "Tomorrow" : `${item.diff}d`}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Streak Tooltip ────────────────────────────────────────────────────────────
function StreakBadge({ streak }) {
    const [show, setShow] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!show) return;
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [show]);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setShow(s => !s)}
                className="relative z-10 flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 rounded-xl px-2.5 py-1.5 flex-shrink-0 active:scale-95 transition-transform"
            >
                <span className="text-base leading-none">🔥</span>
                <span className="text-sm font-black text-amber-300 leading-none">{streak}</span>
            </button>
            {show && (
                <div className="absolute right-0 top-12 z-[100] w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3">
                    <p className="text-xs font-black text-slate-800 mb-1">🔥 Study Streak</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                        You've opened CogniTek <strong>{streak} day{streak !== 1 ? "s" : ""} in a row!</strong>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                        Opens each consecutive day keep your streak alive. Missing a day resets it to 1.
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] font-semibold text-amber-600">Keep it going!</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Placement Tab (with semester lock) ────────────────────────────────────────
function PlacementTab({ userId, semester }) {
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOverdue, setShowOverdue] = useState(false);

    // Extract semester number
    const semNum = parseInt((semester || "S1").replace("S", "")) || 1;
    const isLocked = semNum < 7;

    useEffect(() => {
        if (!userId || isLocked) { setLoading(false); return; }
        api.get("/api/placement-milestones", { params: { user_id: userId } })
            .then(r => setMilestones(r.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [userId, isLocked]);

    const toggle = async (id, current) => {
        await api.patch(`/api/placement-milestones/${id}`, { is_done: !current });
        setMilestones(ms => ms.map(m => m.id === id ? { ...m, is_done: !m.is_done } : m));
    };

    const archiveOverdue = async () => {
        const overdue = milestones.filter(m => getDueDiff(m.due_date) < 0 && !m.is_done);
        for (const m of overdue) {
            await api.patch(`/api/placement-milestones/${m.id}`, { is_done: true });
        }
        setMilestones(prev => prev.map(m => {
            if (getDueDiff(m.due_date) < 0 && !m.is_done) return { ...m, is_done: true };
            return m;
        }));
    };

    // ── Locked state ─────────────────────────────────────────────────────────
    if (isLocked) {
        return (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                {/* Lock overlay */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/95 backdrop-blur-sm p-6 text-center">
                    <div className="relative">
                        {/* Vine/lock animation */}
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-4 border-slate-200 shadow-inner">
                            <Lock className="w-7 h-7 text-slate-500" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-xs animate-bounce">
                            🌿
                        </div>
                    </div>
                    <div>
                        <p className="text-base font-black text-slate-800">Eyes on your books,<br />not the boardroom.</p>
                        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                            Grow up first 🌱
                            <br />
                            <span className="text-xs font-semibold text-indigo-500">Placement features unlock at S7.</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2">
                            Currently: <span className="font-bold">{semester || "S1"}</span> · Need S7 or above 🔒
                        </p>
                    </div>
                    {/* Vine decoration */}
                    <div className="flex items-center gap-1 text-emerald-500 font-black text-sm">
                        🌿🌿🔒🌿🌿
                    </div>
                </div>

                {/* Blurred background content */}
                <div className="filter blur-sm pointer-events-none p-4 space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 rounded-xl bg-slate-100 border border-slate-200" />
                    ))}
                </div>
            </div>
        );
    }

    if (loading) return <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>;

    const now = new Date();
    const active = milestones.filter(m => !m.is_done && getDueDiff(m.due_date) >= 0);
    const overdue = milestones.filter(m => !m.is_done && getDueDiff(m.due_date) < 0);
    const done = milestones.filter(m => m.is_done);

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

            {/* Overdue section */}
            {overdue.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 overflow-hidden">
                    <div
                        className="flex items-center gap-2 px-4 py-3 cursor-pointer"
                        onClick={() => setShowOverdue(s => !s)}
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                        <p className="text-xs font-black text-red-700 flex-1">{overdue.length} overdue milestone{overdue.length > 1 ? "s" : ""}</p>
                        <button
                            onClick={(e) => { e.stopPropagation(); archiveOverdue(); }}
                            className="text-[10px] font-black text-red-600 bg-red-100 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-200 active:scale-95 transition-all"
                        >
                            Archive All
                        </button>
                        {showOverdue ? <ChevronUp className="w-4 h-4 text-red-400" /> : <ChevronDown className="w-4 h-4 text-red-400" />}
                    </div>
                    {showOverdue && (
                        <div className="px-4 pb-3 space-y-2">
                            {overdue.map(m => (
                                <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-red-100">
                                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                    <p className="text-xs font-semibold text-slate-700 flex-1 truncate">{m.title}</p>
                                    <span className="text-[10px] font-black text-red-600">{m.due_date}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Active milestones */}
            {active.map(m => (
                <div key={m.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-start gap-3">
                        <button
                            onClick={() => toggle(m.id, m.is_done)}
                            className="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all border-slate-300 hover:border-indigo-400"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-slate-800">{m.title}</p>
                            {m.company && (
                                <span className="inline-block text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full mt-1">
                                    {m.company}
                                </span>
                            )}
                            {m.notes && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{m.notes}</p>}
                            {m.due_date && (
                                <p className={`flex items-center gap-1 text-[11px] mt-1.5 ${
                                    getDueDiff(m.due_date) <= 1 ? "text-amber-600 font-semibold" : "text-slate-400"
                                }`}>
                                    <Clock className="w-3 h-3" /> {m.due_date}
                                    {getDueDiff(m.due_date) === 0 && " · Today!"}
                                    {getDueDiff(m.due_date) === 1 && " · Tomorrow"}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* Done milestones */}
            {done.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-emerald-500 px-1">✓ Completed</p>
                    {done.map(m => (
                        <div key={m.id} className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => toggle(m.id, m.is_done)}
                                    className="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center bg-emerald-500 border-emerald-500"
                                >
                                    <span className="text-white text-[10px] font-black">✓</span>
                                </button>
                                <p className="font-semibold text-sm line-through text-emerald-600">{m.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
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

    const now = new Date();
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const fmt = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

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

    const resolveGroupLabel = (key) => {
        const lower = key.toLowerCase();
        if (lower === "today") return `Today · ${fmt(now)}`;
        if (lower === "tomorrow") { const t = new Date(now); t.setDate(t.getDate() + 1); return `Tomorrow · ${fmt(t)}`; }
        const parsed = new Date(key);
        if (!isNaN(parsed)) {
            const parsedMid = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
            const diff = Math.round((parsedMid - todayMid) / 86400000);
            if (diff === 0) return `Today · ${fmt(parsed)}`;
            if (diff === 1) return `Tomorrow · ${fmt(parsed)}`;
            if (diff < 0) return `Overdue · ${fmt(parsed)}`;
            return fmt(parsed);
        }
        return key;
    };

    return (
        <div className="space-y-4">
            {Object.entries(groups).map(([date, items]) => (
                <div key={date}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">{resolveGroupLabel(date)}</p>
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

// ── Exam Tab ──────────────────────────────────────────────────────────────────
function ExamTab({ userId, semester, onRefresh }) {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPromotion, setShowPromotion] = useState(false);

    const [promoting, setPromoting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newExam, setNewExam] = useState({ type: "Series IA1", subject: "", date: "", time: "", venue: "" });
    const [saving, setSaving] = useState(false);

    // Enrolled subjects from profile
    const enrolledSubjects = (() => {
        try { return JSON.parse(localStorage.getItem("cognitek_profile") || "{}").subjects || []; } catch { return []; }
    })();

    const handleAddExam = async () => {
        if (!newExam.subject || !newExam.date) { alert("Please set subject and date."); return; }
        setSaving(true);
        try {
            const payload = {
                user_id: userId,
                subject_name: newExam.subject,
                subject_code: enrolledSubjects.find(s=>s.course_name === newExam.subject || s.course_code === newExam.subject)?.course_code || "",
                exam_date: newExam.date,
                exam_time: newExam.time,
                venue: newExam.venue,
                notes: newExam.type
            };
            await api.post("/api/exam-sessions", payload);
            setIsAdding(false);
            setNewExam({ type: "Series IA1", subject: "", date: "", time: "", venue: "" });
            // Refresh list
            const r = await api.get("/api/exam-sessions", { params: { user_id: userId } });
            setExams(r.data || []);
        } catch (e) {
            alert("Failed to add exam.");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (!userId) return;
        api.get("/api/exam-sessions", { params: { user_id: userId } })
            .then(r => {
                const data = r.data || [];
                setExams(data);
                if (data.length === 0) return;
                // Check if all exams are past
                const allPast = data.every(e => {
                    const diff = getDueDiff(e.exam_date);
                    return diff !== null && diff < 0;
                });
                if (allPast) setShowPromotion(true);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [userId]);

    const handlePromote = async () => {
        const semStr = String(semester || "S1");
        const nextSemNum = (parseInt(semStr.replace("S", "")) || 1) + 1;
        const nextSem = `S${nextSemNum}`;
        if (!window.confirm(`Moving to ${nextSem}? Your current semester progress will be archived.`)) return;

        setPromoting(true);
        try {
            const data = JSON.parse(localStorage.getItem("cognitek_profile") || "{}");
            data.semester = nextSem;
            localStorage.setItem("cognitek_profile", JSON.stringify(data));
            await api.post("/api/repair-user-data", { user_id: userId, semester: nextSem });
            alert(`Welcome to ${nextSem}!`);
            setShowPromotion(false);
            if (onRefresh) onRefresh();
        } catch (e) {
            console.error("Promotion failed", e);
        } finally {
            setPromoting(false);
        }
    };

    const prepTips = [
        { emoji: "📅", tip: "Create a revision timetable — spread topics across days." },
        { emoji: "🃏", tip: "Use CogniTek flashcards to drill key definitions." },
        { emoji: "📝", tip: "Practice past KTU papers for each module." },
        { emoji: "⏰", tip: "Study in 45-minute blocks with 10-minute breaks (Pomodoro)." },
        { emoji: "🧘", tip: "Sleep 7-8 hours the night before — memory consolidates during sleep." },
        { emoji: "💧", tip: "Stay hydrated. Brain performance drops with dehydration." },
    ];

    if (loading) return <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>;

    return (
        <div className="space-y-4">
            {/* Semester promotion banner */}
            {showPromotion && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-xl border border-emerald-400">
                    <p className="text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span>🎓 Exams Over!</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                    </p>
                    <p className="text-sm font-semibold opacity-95">All exams have passed. Ready for the next level?</p>
                    <button 
                        onClick={handlePromote}
                        disabled={promoting}
                        className="mt-3 w-full py-2.5 rounded-xl bg-white text-emerald-600 font-black text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {promoting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <GraduationCap className="w-3.5 h-3.5"/>}
                        Promote to S{(parseInt(String(semester || "S1").replace("S", "")) || 1) + 1}
                    </button>
                    <p className="text-[9px] text-emerald-50/70 mt-2 text-center">This will update your semester in Academic Identity.</p>
                </div>
            )}

            {/* Manual Entry Form */}
            <div className="p-4 rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-500/20">
                {!isAdding ? (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="w-full py-4 flex items-center justify-center gap-3 text-white font-black text-sm group"
                    >
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-5 h-5" />
                        </div>
                        Add Exam Entry
                    </button>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-black text-white/70 uppercase tracking-widest">New Exam Entry</p>
                            <button onClick={() => setIsAdding(false)} className="p-1 rounded-lg hover:bg-white/10 text-white/50">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <select 
                            value={newExam.type} 
                            onChange={e => setNewExam({...newExam, type: e.target.value})}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 ring-white/30"
                        >
                            <option className="text-slate-800" value="Series IA1">Series IA1 (Internal)</option>
                            <option className="text-slate-800" value="Series IA2">Series IA2 (Internal)</option>
                            <option className="text-slate-800" value="Semester Exam">Semester Exam</option>
                            <option className="text-slate-800" value="Supplementary">Supplementary Exam</option>
                            <option className="text-slate-800" value="Class Test">Class Test</option>
                        </select>
                        <select 
                            value={newExam.subject} 
                            onChange={e => setNewExam({...newExam, subject: e.target.value})}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 ring-white/30"
                        >
                            <option className="text-slate-800" value="">Select Subject</option>
                            {enrolledSubjects.map(s => (
                                <option key={s.id} className="text-slate-800" value={s.course_name}>{s.course_code}: {s.course_name}</option>
                            ))}
                        </select>
                        <div className="grid grid-cols-2 gap-3">
                            <input 
                                type="date" value={newExam.date} onChange={e => setNewExam({...newExam, date: e.target.value})}
                                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 ring-white/30 color-white"
                                style={{ colorScheme: "dark" }}
                            />
                            <input 
                                type="text" placeholder="Time (e.g. 10 AM)" value={newExam.time} onChange={e => setNewExam({...newExam, time: e.target.value})}
                                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 ring-white/30"
                            />
                        </div>
                        <input 
                            type="text" placeholder="Venue / Hall" value={newExam.venue} onChange={e => setNewExam({...newExam, venue: e.target.value})}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 ring-white/30"
                        />
                        <button 
                            onClick={handleAddExam}
                            disabled={saving}
                            className="w-full py-3 bg-white text-indigo-600 font-black text-sm rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                            Save Exam Schedule
                        </button>
                    </div>
                )}
            </div>

            {/* Exam timetable */}
            {exams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-3">
                        <CalendarCheck className="w-7 h-7 text-violet-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No exams scheduled</p>
                    <p className="text-xs text-slate-400 mt-1">Record a session mentioning exams or add them via Manage Data in Profile.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Exam Schedule</p>
                    {[...(exams || [])].sort((a, b) => (a.exam_date || "").localeCompare(b.exam_date || "")).map(exam => {
                        const diff = getDueDiff(exam.exam_date);
                        const isPast = diff !== null && diff < 0;
                        const isToday = diff === 0;
                        const isSoon = diff !== null && diff <= 3 && diff > 0;
                        return (
                            <div key={exam.id} className={`p-4 rounded-2xl border transition-all ${
                                isPast ? "bg-slate-50 border-slate-200 opacity-60" :
                                isToday ? "bg-red-50 border-red-300 shadow-md" :
                                isSoon ? "bg-amber-50 border-amber-200" :
                                "bg-white border-slate-200 shadow-sm"
                            }`}>
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ${
                                        isPast ? "bg-slate-200 text-slate-500" :
                                        isToday ? "bg-red-500 text-white" :
                                        "bg-violet-100 text-violet-700"
                                    }`}>
                                        {isPast ? "✓" : isToday ? "!" : "📝"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm ${isPast ? "line-through text-slate-400" : "text-slate-800"}`}>
                                            {exam.subject_name || exam.subject_code}
                                        </p>
                                        {exam.subject_code && exam.subject_name && (
                                            <p className="text-[10px] font-semibold text-slate-400">{exam.subject_code}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5">
                                            {exam.exam_date && (
                                                <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                                                    isToday ? "text-red-600" : isSoon ? "text-amber-600" : "text-slate-500"
                                                }`}>
                                                    <CalendarDays className="w-3 h-3" />
                                                    {exam.exam_date}
                                                    {isToday && " · TODAY!"}
                                                    {isSoon && ` · In ${diff} day${diff > 1 ? "s" : ""}`}
                                                </span>
                                            )}
                                            {exam.exam_time && (
                                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {exam.exam_time}
                                                </span>
                                            )}
                                        </div>
                                        {exam.venue && <p className="text-[10px] text-slate-400 mt-0.5">📍 {exam.venue}</p>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Exam prep tips */}
            <div className="rounded-2xl border border-violet-200 bg-violet-50 overflow-hidden">
                <div className="px-4 pt-3 pb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-1">💡 Exam Prep Tips</p>
                </div>
                <div className="px-4 pb-4 space-y-2">
                    {prepTips.map((t, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-violet-100">
                            <span className="text-base">{t.emoji}</span>
                            <p className="text-[11px] text-slate-700 leading-relaxed">{t.tip}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const TABS = [
    { id: "tasks",      label: "Tasks",      icon: ClipboardList, color: "text-violet-600 bg-violet-50" },
    { id: "exams",      label: "Exams",      icon: BookMarked,     color: "text-violet-600 bg-violet-50" },
    { id: "placement",  label: "Placement",  icon: Trophy,         color: "text-emerald-600 bg-emerald-50" },
    { id: "schedule",   label: "Schedule",   icon: CalendarDays,   color: "text-sky-600 bg-sky-50"      },
];

export default function Home() {
    const { user, getDisplayName, profile } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("tasks");
    const [refreshKey, setRefreshKey] = useState(0);
    const [urgentTask, setUrgentTask] = useState(null);
    const [allTasks, setAllTasks] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [alertDismissed, setAlertDismissed] = useState(false);

    const greeting = getGreeting();
    const streak = getStreak();
    const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });

    const semester = profile?.semester
        ? `S${profile.semester}`
        : (() => { try { return JSON.parse(localStorage.getItem("cognitek_profile") || "{}").semester || "S1"; } catch { return "S1"; } })();

    // Fetch urgent task + all tasks + milestones for deadline banner
    useEffect(() => {
        if (!user?.id) return;
        api.get("/api/tasks", { params: { user_id: user.id } })
            .then(r => {
                const pending = (r.data || []).filter(t => !t.is_completed);
                const high = pending.find(t => t.priority === "High") || pending[0];
                setUrgentTask(high || null);
                setAllTasks(r.data || []);
            })
            .catch(() => {});

        const semNum = parseInt(semester.replace("S", "")) || 1;
        if (semNum >= 7) {
            api.get("/api/placement-milestones", { params: { user_id: user.id } })
                .then(r => setMilestones(r.data || []))
                .catch(() => {});
        }

        api.get("/api/repair-user-data", { params: { user_id: user.id } }).catch(() => {});
    }, [user?.id, refreshKey]);

    return (
        <div className="min-h-screen bg-[#f7f7f9]">

            {/* ── STICKY HEADER ────────────────────────────────────────── */}
            <div className="sticky top-0 z-30 shadow-sm">
                <div
                    className="px-4 pt-10 pb-4 relative flex items-center justify-between border-b border-indigo-900/10 shadow-sm"
                    style={{ background: "linear-gradient(135deg, #0f0f16 0%, #16213e 60%, #1a1a2e 100%)" }}
                >
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-16 bg-violet-500/10 rounded-full blur-xl pointer-events-none" />

                    <div className="relative z-10 flex-1 min-w-0 pr-4">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                            {today} <span className="w-1 h-1 rounded-full bg-indigo-500/40" /> {greeting.text}
                        </p>
                        <h1 className="text-xl font-black text-white leading-tight truncate">
                            Hey, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-300 to-indigo-300 animate-gradient-x">{getDisplayName()}</span> {greeting.emoji}
                        </h1>
                    </div>
                    {/* Streak badge (tappable) */}
                    <StreakBadge streak={streak} />
                </div>
            </div>

            <div className="px-4 pb-28">

                {/* ── DEADLINE ALERT ────────────────────────────────────── */}
                {!alertDismissed && (
                    <DeadlineAlert
                        tasks={allTasks}
                        milestones={milestones}
                        onDismiss={() => setAlertDismissed(true)}
                    />
                )}

                {/* ── TODAY'S FOCUS ────────────────────────────────────── */}
                {urgentTask && (
                    <div className="mt-4 mb-4 rounded-2xl overflow-hidden shadow-md">
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
                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-3 mb-4 px-0.5">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border font-black text-[12px] whitespace-nowrap transition-all flex-shrink-0 active:scale-95 ${
                                    isActive
                                        ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200"
                                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                                }`}
                            >
                                <tab.icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── TAB PANELS ──────────────────────────────────────── */}
                <div className="transition-all duration-200">
                    {activeTab === "tasks" && <TaskBoard key={`tasks-${refreshKey}`} />}
                    {activeTab === "exams" && <ExamTab userId={user?.id} semester={semester} onRefresh={() => setRefreshKey(k => k + 1)} />}
                    {activeTab === "placement" && <PlacementTab userId={user?.id} semester={semester} />}
                    {activeTab === "schedule" && <ScheduleTab userId={user?.id} />}
                </div>
            </div>
        </div>
    );
}
