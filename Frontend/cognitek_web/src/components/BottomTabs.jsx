import { useState, useEffect, useRef } from "react";
import { Home, BookOpen, Sparkles, User, Mic, X, AlarmClock, Bell, Coffee } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const TIMETABLE_KEY = "cognitek_timetable";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const HOUR_LABELS = {
    "09:00": "9:00", "10:00": "10:00", "11:00": "11:00",
    "12:00": "12:00", "13:00": "13:00", "14:00": "14:00",
    "15:00": "15:00", "16:00": "16:00"
};
const NEXT_HOUR = {
    "09:00": "10:00", "10:00": "11:00", "11:00": "12:00",
    "12:00": "13:00", "13:00": "14:00", "14:00": "15:00",
    "15:00": "16:00", "16:00": "17:00"
};

function loadTimetable() {
    try { return JSON.parse(localStorage.getItem(TIMETABLE_KEY) || "{}"); } catch { return {}; }
}
function getTodayKey() {
    const idx = new Date().getDay();
    return DAYS[idx === 0 ? 6 : idx - 1];
}
function getSecondsUntil(hourStr) {
    const now = new Date();
    const [h, m] = hourStr.split(":").map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    const diff = (target - now) / 1000;
    return diff > 0 ? Math.floor(diff) : null;
}
function formatCountdown(secs) {
    if (!secs || secs <= 0) return "Now";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

const NAV_TABS = [
    { id: "home",    icon: Home,     label: "Home",    path: "/dashboard" },
    { id: "study",   icon: BookOpen, label: "Study",   path: "/study"     },
    { id: "record",  icon: Mic,      label: "Record",  path: null,        isMain: true },
    { id: "sylens",  icon: Sparkles, label: "Sylens",  path: "/sylens"    },
    { id: "profile", icon: User,     label: "Profile", path: "/profile"   },
];

// ── Record popover ─────────────────────────────────────────────────────────────
function RecordPopover({ onClose, navigate }) {
    const [mode, setMode] = useState(null); // null | 'schedule'
    const [scheduledHour, setScheduledHour] = useState(null);
    const [countdown, setCountdown] = useState(null);
    const countdownRef = useRef(null);

    const timetable = loadTimetable();
    const todayKey = getTodayKey();
    const todaySlots = HOURS
        .map(h => ({ hour: h, slot: timetable[todayKey]?.[h] || null }))
        .filter(({ slot }) => slot !== null && slot?.type !== "break");

    // Schedule countdown
    useEffect(() => {
        if (!scheduledHour) { clearInterval(countdownRef.current); setCountdown(null); return; }
        const tick = () => {
            const secs = getSecondsUntil(scheduledHour);
            if (secs === null) {
                clearInterval(countdownRef.current);
                setCountdown(0);
                onClose();
                navigate("/record?autostart=1&autotime=" + scheduledHour);
            } else {
                setCountdown(secs);
            }
        };
        tick();
        countdownRef.current = setInterval(tick, 1000);
        return () => clearInterval(countdownRef.current);
    }, [scheduledHour]);

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

            {/* Popover card */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                        <Mic className="w-4.5 h-4.5 text-white w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-black text-slate-800">Record Session</p>
                        <p className="text-[10px] text-slate-400">Choose recording mode</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {/* Manual Record */}
                    <button
                        onClick={() => { onClose(); navigate("/record"); }}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl active:scale-95 transition-all"
                    >
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Mic className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-black">Manual Record</p>
                            <p className="text-[11px] text-white/70">Tap to start recording now</p>
                        </div>
                    </button>

                    {/* Schedule Recording */}
                    <button
                        onClick={() => setMode(mode === "schedule" ? null : "schedule")}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                            mode === "schedule"
                                ? "bg-amber-50 border-amber-300"
                                : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        }`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${mode === "schedule" ? "bg-amber-100" : "bg-slate-200"}`}>
                            <AlarmClock className={`w-5 h-5 ${mode === "schedule" ? "text-amber-600" : "text-slate-500"}`} />
                        </div>
                        <div className="text-left flex-1">
                            <p className={`text-sm font-black ${mode === "schedule" ? "text-amber-800" : "text-slate-800"}`}>Schedule Recording</p>
                            <p className={`text-[11px] ${mode === "schedule" ? "text-amber-600" : "text-slate-400"}`}>Auto-record a class period</p>
                        </div>
                    </button>

                    {/* Period selector */}
                    {mode === "schedule" && (
                        <div className="space-y-2 pt-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{todayKey}'s Classes</p>
                            {todaySlots.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-sm text-slate-400">No classes today</p>
                                    <p className="text-[11px] text-slate-300 mt-1">Set your timetable in Profile</p>
                                </div>
                            ) : (
                                todaySlots.map(({ hour, slot }) => {
                                    const nextH = NEXT_HOUR[hour] || "17:00";
                                    const isScheduled = scheduledHour === hour;
                                    return (
                                        <button
                                            key={hour}
                                            onClick={() => setScheduledHour(isScheduled ? null : hour)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                                                isScheduled
                                                    ? "bg-indigo-50 border-indigo-300"
                                                    : "bg-white border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            <div className={`w-2 h-8 rounded-full flex-shrink-0 ${isScheduled ? "bg-indigo-500" : "bg-slate-200"}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate">{slot?.subject || "Free Period"}</p>
                                                <p className="text-[10px] text-slate-400">{HOUR_LABELS[hour]} – {HOUR_LABELS[nextH] || "17:00"}</p>
                                            </div>
                                            {isScheduled && countdown !== null && (
                                                <span className="text-[10px] font-black text-indigo-600 flex items-center gap-1 flex-shrink-0">
                                                    <Bell className="w-2.5 h-2.5 animate-pulse" />
                                                    {formatCountdown(countdown)}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                            {scheduledHour && (
                                <p className="text-[10px] text-center text-indigo-500 font-semibold pt-1">
                                    🔔 Mic will auto-start in {formatCountdown(countdown)}. You can turn it off anytime.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function BottomTabs() {
    const navigate = useNavigate();
    const location = useLocation();
    const [recordOpen, setRecordOpen] = useState(false);

    return (
        <>
            {recordOpen && <RecordPopover onClose={() => setRecordOpen(false)} navigate={navigate} />}

            <div
                className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 pb-6"
                style={{
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    borderTop: "1px solid rgba(0,0,0,0.07)",
                    boxShadow: "0 -8px 32px rgba(0,0,0,0.06)",
                }}
            >
                {NAV_TABS.map(tab => {
                    const isActive = location.pathname === tab.path;

                    if (tab.isMain) {
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setRecordOpen(o => !o)}
                                className={`relative -mt-8 w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all ${
                                    recordOpen
                                        ? "shadow-indigo-500/40 scale-110"
                                        : "shadow-slate-900/30"
                                }`}
                                style={{
                                    background: recordOpen
                                        ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                                        : "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                                }}
                            >
                                {recordOpen ? <X className="w-5 h-5 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                                <span className="absolute inset-0 rounded-full border-2 border-white/10" />
                            </button>
                        );
                    }

                    return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className="relative flex flex-col items-center gap-1 pt-1 pb-0.5 px-3 rounded-2xl transition-all duration-200 active:scale-90"
                        >
                            {isActive && <span className="absolute inset-0 rounded-2xl bg-slate-900/8" />}
                            <tab.icon className={`w-5 h-5 relative z-10 transition-all duration-200 ${isActive ? "text-slate-900 scale-110" : "text-slate-400"}`} />
                            <span className={`text-[10px] font-semibold relative z-10 transition-colors ${isActive ? "text-slate-900" : "text-slate-400"}`}>
                                {tab.label}
                            </span>
                            {isActive && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-slate-900" />}
                        </button>
                    );
                })}
            </div>
        </>
    );
}
