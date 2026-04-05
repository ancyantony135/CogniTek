import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import ktuData from "../data/ktu_courses.json";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import axios from "axios";
import {
    User as UserIcon, LogOut, Pencil, Check, X, Database, Activity,
    BookOpen, Zap, Target, Brain, Code2, Layers, BadgeCheck,
    ChevronDown, ChevronUp, Bluetooth, Watch, Plus, Wifi, ArrowLeft,
    FlaskConical, Briefcase, BookMarked, Trash2, Loader2, GraduationCap,
    Trophy, ChevronRight, Settings, Shield, CalendarClock, Clock,
    Upload, Image as ImageIcon, Sun, Moon, Coffee, AlertCircle, PlusCircle
} from "lucide-react";
import ServerStatus from "../components/ServerStatus";

const STORAGE_KEY = "cognitek_profile";
const TIMETABLE_KEY = "cognitek_timetable";
const DEFAULT_SKILL = { python: 0, aiml: 0, fullstack: 0 };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getSchedule(scheme) {
    const is2024 = scheme === "2024";
    const periods = is2024 ? [
        { start: "09:00", end: "09:50", label: "9:00 – 9:50" },
        { start: "10:00", end: "10:50", label: "10:00 – 10:50" },
        { start: "10:50", end: "11:40", label: "10:50 – 11:40" },
        { start: "12:30", end: "13:20", label: "12:30 – 1:20" },
        { start: "13:20", end: "14:10", label: "1:20 – 2:10" },
        { start: "14:10", end: "15:00", label: "2:10 – 3:00" },
        { start: "15:00", end: "15:50", label: "3:00 – 3:50" },
    ] : [
        { start: "09:00", end: "09:50", label: "9:00 – 9:50" },
        { start: "09:50", end: "10:40", label: "9:50 – 10:40" },
        { start: "10:50", end: "11:40", label: "10:50 – 11:40" },
        { start: "11:40", end: "12:30", label: "11:40 – 12:30" },
        { start: "13:20", end: "14:10", label: "1:20 – 2:10" },
        { start: "14:10", end: "15:00", label: "2:10 – 3:00" },
        { start: "15:00", end: "15:50", label: "3:00 – 3:50" },
    ];
    
    return {
        PERIODS: periods,
        BREAK_SLOTS: is2024 ? [
            { label: "Snack time", time: "9:50 – 10:00", key: "break1" },
            { label: "Lunch time", time: "11:40 – 12:30", key: "lunch" },
        ] : [
            { label: "Snack time", time: "10:40 – 10:50", key: "break1" },
            { label: "Lunch time", time: "12:30 – 1:20", key: "lunch" },
        ],
        HOURS: periods.map(p => p.start),
        HOUR_LABELS: Object.fromEntries(periods.map(p => [p.start, p.label]))
    };
}


function loadProfile() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveProfile(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function loadTimetable() {
    try { return JSON.parse(localStorage.getItem(TIMETABLE_KEY) || "{}"); } catch { return {}; }
}
function saveTimetable(data) {
    localStorage.setItem(TIMETABLE_KEY, JSON.stringify(data));
}

// ── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ name, size = "lg", src = null, onClick }) {
    const initials = (name || "S").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const sz = size === "lg" ? "w-20 h-20 text-2xl" : "w-10 h-10 text-sm";
    const clickable = size === "lg" && (src || true);
    
    if (src) {
        return (
            <img 
                src={src} 
                alt="Profile" 
                onClick={onClick}
                className={`${sz} rounded-2xl object-cover shadow-lg flex-shrink-0 border border-white/20 ${clickable ? "cursor-pointer hover:scale-105 active:scale-95 transition-transform" : ""}`}
            />
        );
    }
    
    return (
        <div 
            onClick={onClick}
            className={`${sz} rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black shadow-lg flex-shrink-0 ${clickable ? "cursor-pointer hover:scale-105 active:scale-95 transition-transform" : ""}`}
        >
            {initials}
        </div>
    );
}

// ── Avatar Fullscreen Modal ──────────────────────────────────────────────────
function AvatarModal({ src, name, open, onClose }) {
    if (!open) return null;
    const initials = (name || "S").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div className="relative" onClick={e => e.stopPropagation()}>
                {src ? (
                    <img 
                        src={src} 
                        alt="Profile" 
                        className="w-72 h-72 rounded-3xl object-cover shadow-2xl border-4 border-white/20"
                    />
                ) : (
                    <div className="w-72 h-72 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-8xl shadow-2xl">
                        {initials}
                    </div>
                )}
                <button 
                    onClick={onClose} 
                    className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-600 hover:text-red-500 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
                <p className="text-center text-white/70 text-sm mt-3 font-medium">{name}</p>
            </div>
        </div>
    );
}

// ── Light-mode text input ────────────────────────────────────────────────────
function LightInput({ value, onChange, placeholder, className = "" }) {
    return (
        <input
            className={`w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder-slate-400 transition-all ${className}`}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
        />
    );
}

// ── Full Screen View ────────────────────────────────────────────────────────────
function Sheet({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 bg-[#f4f6f9] flex flex-col" style={{ animation: "slideIn 0.3s ease-out forwards" }}>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white border-b border-slate-200 shadow-sm shrink-0">
                <button onClick={onClose} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="font-black text-slate-800 text-lg flex-1 truncate">{title}</h2>
            </div>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-6 pb-28">
                {children}
            </div>
        </div>
    );
}

// ── Skill Ring ────────────────────────────────────────────────────────────────
function SkillRing({ label, value, color }) {
    const radius = 38;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (value / 100) * circ;
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="relative w-20 h-20">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
                    <circle cx="45" cy="45" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="7" />
                    <circle cx="45" cy="45" r={radius} fill="none" stroke={color} strokeWidth="7"
                        strokeDasharray={circ} strokeDashoffset={offset}
                        strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-slate-800">{value}%</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 text-center">{label}</p>
        </div>
    );
}

// ── Subject row ───────────────────────────────────────────────────────────────
function SubjectRow({ sub, onRemove, confirmId }) {
    const isPending = confirmId === sub.id;
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${isPending ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{sub.course_code}</p>
                <p className="text-xs text-slate-500 truncate">{sub.course_name}</p>
                {isPending && (
                    <p className="text-[10px] text-red-500 font-semibold mt-0.5">⚠️ This will remove all related flashcards — tap again to confirm</p>
                )}
            </div>
            {sub.credits && <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full">{sub.credits}cr</span>}
            {(sub.is_elective || sub.is_custom) && onRemove && (
                <button onClick={() => onRemove(sub.id)} className={`p-1.5 rounded-lg transition-colors ${isPending ? "bg-red-200 text-red-700" : "hover:bg-red-50 hover:text-red-500 text-slate-400"}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}

// ── Health Dot ────────────────────────────────────────────────────────────────
function HealthDot({ online }) {
    return (
        <span className="relative flex h-2.5 w-2.5">
            {online && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${online === null ? "bg-gray-400" : online ? "bg-emerald-500" : "bg-red-500"}`} />
        </span>
    );
}

// ── Timetable Sheet ───────────────────────────────────────────────────────────
function TimetableSheet({ open, onClose, subjects }) {
    const [timetable, setTimetable] = useState(loadTimetable);
    const [activeDay, setActiveDay] = useState("Monday");
    const [analyzing, setAnalyzing] = useState(false);
    const [analyzeStatus, setAnalyzeStatus] = useState("");
    const [saveConfirm, setSaveConfirm] = useState(false);
    const fileRef = useRef(null);
    const API_URL = import.meta.env.VITE_API_URL;

    const getSlot = (day, hour) => timetable[day]?.[hour] || null;

    const setSlot = (day, hour, value) => {
        const updated = {
            ...timetable,
            [day]: { ...(timetable[day] || {}), [hour]: value }
        };
        setTimetable(updated);
        saveTimetable(updated);
        setSaveConfirm(true);
        setTimeout(() => setSaveConfirm(false), 2000);
    };

    const clearSlot = (day, hour) => {
        const updated = { ...timetable };
        if (updated[day]) { delete updated[day][hour]; }
        setTimetable(updated);
        saveTimetable(updated);
        setSaveConfirm(true);
        setTimeout(() => setSaveConfirm(false), 2000);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAnalyzing(true);
        setAnalyzeStatus("Uploading image to AI…");
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await axios.post(`${API_URL}/api/parse-timetable-image`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 30000,
            });
            if (res.data?.timetable) {
                const merged = { ...timetable, ...res.data.timetable };
                setTimetable(merged);
                saveTimetable(merged);
                setAnalyzeStatus("✅ Timetable imported successfully!");
            } else {
                setAnalyzeStatus("⚠️ Could not parse timetable. Try a clearer image.");
            }
        } catch {
            setAnalyzeStatus("❌ AI parsing failed. Check server connection.");
        } finally {
            setAnalyzing(false);
            setTimeout(() => setAnalyzeStatus(""), 4000);
        }
    };

    const subjectOptions = subjects?.map(s => s.course_name) || [];
    
    // Get schedule configuration based on the user's scheme
    const profile = loadProfile();
    const { PERIODS, BREAK_SLOTS, HOURS, HOUR_LABELS } = getSchedule(profile.scheme);

    return (
        <Sheet open={open} onClose={onClose} title="📅 Class Timetable">
            {/* Save Confirmation Toast */}
            {saveConfirm && (
                <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <span className="text-emerald-600 font-bold text-sm">✓</span>
                    <p className="text-xs text-emerald-700 font-medium">Schedule saved to device</p>
                </div>
            )}
            <div className="space-y-5">
                {/* AI Image Upload */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">AI Timetable Import</p>
                            <p className="text-xs text-slate-500 mt-0.5 mb-2">Upload a photo of your timetable and Sylens will auto-fill the schedule for you.</p>
                            <button
                                onClick={() => fileRef.current?.click()}
                                disabled={analyzing}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60"
                            >
                                {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                {analyzing ? "Analyzing…" : "Upload Photo"}
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            {analyzeStatus && (
                                <p className="text-xs mt-2 font-medium text-slate-600">{analyzeStatus}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Day selector */}
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Select Day</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {DAYS.map(d => (
                            <button
                                key={d}
                                onClick={() => setActiveDay(d)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all border ${
                                    activeDay === d
                                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                {d.slice(0, 3)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Time slots with dynamic breaks interspersed */}
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">{activeDay} Schedule</p>
                    <div className="space-y-2">
                        {(() => {
                            const profile = loadProfile();
                            const is2024 = profile.scheme === "2024";
                            const { PERIODS } = getSchedule(profile.scheme);

                            return PERIODS.map((period, i) => {
                                const slot = getSlot(activeDay, period.start);
                                
                                const showSnack = is2024 ? i === 1 : i === 2;
                                const snackLabel = is2024 ? { time: "9:50 – 10:00", start: "9:50", m: "10 min" } : { time: "10:40 – 10:50", start: "10:40", m: "10 min" };
                                
                                const showLunch = is2024 ? i === 3 : i === 4;
                                const lunchLabel = is2024 ? { time: "11:40 – 12:30", start: "11:40", m: "50 min" } : { time: "12:30 – 1:20", start: "12:30", m: "50 min" };

                                return (
                                    <div key={period.start}>
                                        {/* Snack Break Check */}
                                        {showSnack && (
                                            <div className="flex items-center gap-2 p-3 rounded-xl border bg-amber-50 border-amber-200 mb-2">
                                                <div className="w-16 flex-shrink-0">
                                                    <p className="text-[11px] font-black text-amber-600">{snackLabel.start}</p>
                                                    <p className="text-[9px] text-amber-400">– {snackLabel.time.split(" – ")[1]}</p>
                                                </div>
                                                <Coffee className="w-3.5 h-3.5 text-amber-500" />
                                                <span className="text-xs font-bold text-amber-700">Snack time</span>
                                                <span className="ml-auto text-[10px] text-amber-500 font-medium">· {snackLabel.m}</span>
                                            </div>
                                        )}
                                        {/* Lunch Break Check */}
                                        {showLunch && (
                                            <div className="flex items-center gap-2 p-3 rounded-xl border bg-orange-50 border-orange-200 mb-2">
                                                <div className="w-16 flex-shrink-0">
                                                    <p className="text-[11px] font-black text-orange-600">{lunchLabel.start}</p>
                                                    <p className="text-[9px] text-orange-400">– {lunchLabel.time.split(" – ")[1]}</p>
                                                </div>
                                                <Coffee className="w-3.5 h-3.5 text-orange-500" />
                                                <span className="text-xs font-bold text-orange-700">Lunch time</span>
                                                <span className="ml-auto text-[10px] text-orange-500 font-medium">· {lunchLabel.m}</span>
                                            </div>
                                        )}
                                        
                                        <div className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                                            slot?.subject
                                                ? "bg-indigo-50 border-indigo-200"
                                                : "bg-white border-slate-100"
                                        }`}>
                                            {/* Time label */}
                                            <div className="w-16 flex-shrink-0">
                                                <p className="text-[10px] font-black text-slate-500">{period.label.split(" – ")[0]}</p>
                                                <p className="text-[9px] text-slate-300">– {period.label.split(" – ")[1]}</p>
                                            </div>

                                            {/* Slot content */}
                                            {slot?.subject ? (
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-indigo-700 truncate">{slot.subject}</p>
                                                </div>
                                            ) : (
                                                <div className="flex-1">
                                                    <p className="text-xs text-slate-300 italic">Free — tap to assign</p>
                                                </div>
                                            )}

                                        {/* Actions */}
                                        <div className="flex gap-1 flex-shrink-0">
                                            {slot ? (
                                                <button
                                                    onClick={() => clearSlot(activeDay, period.start)}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-300 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            ) : (
                                                <>
                                                    <SlotPicker
                                                        label="+"
                                                        subjectOptions={subjectOptions}
                                                        onSelect={(val) => setSlot(activeDay, period.start, { subject: val, type: "class" })}
                                                    />
                                                    <button
                                                        onClick={() => setSlot(activeDay, period.start, { type: "break" })}
                                                        className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-bold hover:bg-amber-100 transition-colors"
                                                    >
                                                        Break
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        });
                        })()}
                    </div>
                </div>

                {/* Weekly overview */}
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Weekly Overview</p>
                    <div className="overflow-x-auto">
                        <div className="grid min-w-[420px]" style={{ gridTemplateColumns: "60px repeat(6, 1fr)" }}>
                            {/* Header row */}
                            <div />
                            {DAYS.map(d => (
                                <div key={d} className="text-center text-[10px] font-black text-slate-400 pb-2">{d.slice(0,3)}</div>
                            ))}
                            {/* Period rows */}
                            {(() => {
                                const profile = loadProfile();
                                const is2024 = profile.scheme === "2024";
                                const { PERIODS } = getSchedule(profile.scheme);

                                return PERIODS.map((period, i) => {
                                    const showSnackRow = is2024 ? i === 1 : i === 2;
                                    const showLunchRow = is2024 ? i === 3 : i === 4;

                                    return (
                                        <div key={period.start} className="contents">
                                            {showSnackRow && <div key="b1" className="col-span-7 h-1 bg-amber-100 rounded my-0.5 opacity-60" />}
                                            {showLunchRow && <div key="b2" className="col-span-7 h-1.5 bg-orange-100 rounded my-0.5 opacity-60" />}
                                            <div key={`h-${period.start}`} className="text-[9px] text-slate-400 font-bold flex items-center">{period.label.split(" – ")[0]}</div>
                                            {DAYS.map(day => {
                                                const slot = getSlot(day, period.start);
                                                return (
                                                    <div key={`${day}-${period.start}`} className={`h-7 mx-0.5 mb-1 rounded text-[8px] font-bold flex items-center justify-center truncate px-0.5 ${
                                                        slot?.type === "break" ? "bg-amber-100 text-amber-600" :
                                                        slot?.subject ? "bg-indigo-100 text-indigo-700" :
                                                        "bg-slate-50"
                                                    }`}>
                                                        {slot?.type === "break" ? "☕" : slot?.subject?.split(" ")[0] || ""}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>

            </div>
        </Sheet>
    );
}

// Small inline picker for subject assignment
function SlotPicker({ subjectOptions, onSelect }) {
    const [open, setOpen] = useState(false);
    const [custom, setCustom] = useState("");
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className="px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-[10px] font-bold hover:bg-indigo-100 transition-colors"
            >
                + Class
            </button>
            {open && (
                <div className="absolute right-0 bottom-8 z-10 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                        <input
                            className="w-full px-2 py-1.5 text-xs bg-slate-100 rounded-lg outline-none text-slate-800 placeholder-slate-400"
                            placeholder="Type subject name…"
                            value={custom}
                            onChange={e => setCustom(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && custom.trim()) { onSelect(custom.trim()); setOpen(false); setCustom(""); }}}
                        />
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                        {subjectOptions.map(s => (
                            <button key={s} onClick={() => { onSelect(s); setOpen(false); }}
                                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors truncate">
                                {s}
                            </button>
                        ))}
                        {subjectOptions.length === 0 && (
                            <p className="px-3 py-2 text-xs text-slate-400 italic">Type a subject name above</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Shared UI for inline editing data records ───────────────────────────────
function EditableDataRow({ record, type, onSave, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(record.title || "");
    const [desc, setDesc] = useState(record.subject || record.company || record.notes || "");
    const [timeField, setTimeField] = useState(record.time || record.due_date || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = { title };
            if (type === "task") {
                updates.subject = desc;
                updates.time = timeField;
            } else {
                updates.notes = desc;
                updates.due_date = timeField;
            }
            await onSave(record.id, updates);
            setIsEditing(false);
        } catch (e) {
            console.error("Save failed", e);
        } finally {
            setSaving(false);
        }
    };

    if (!isEditing) {
        return (
            <div className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm mb-2 group">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{record.title}</p>
                    <p className="text-xs text-slate-500 truncate">{record.subject || record.company || record.notes}</p>
                    {(record.time || record.due_date) && (
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{record.time || record.due_date}</p>
                    )}
                </div>
                <button onClick={() => setIsEditing(true)} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">
                    <Pencil className="w-4 h-4" />
                </button>
                {onDelete && (
                    <button onClick={() => onDelete(record.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl mb-2 flex flex-col gap-2">
            <input 
                type="text" value={title} onChange={e => setTitle(e.target.value)} 
                className="w-full text-sm font-semibold bg-white border border-indigo-100 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 ring-indigo-500" 
                placeholder="Title" 
            />
            <input 
                type="text" value={desc} onChange={e => setDesc(e.target.value)} 
                className="w-full text-xs bg-white border border-indigo-100 rounded-lg px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 ring-indigo-500" 
                placeholder={type === "task" ? "Subject/Description" : type === "exam" ? "Subject Name" : "Notes"} 
            />
            {type === "exam" && (
                <div className="grid grid-cols-2 gap-2">
                    <input 
                        type="text" value={record.subject_code || ""} onChange={e => onSave(record.id, { subject_code: e.target.value })} 
                        className="w-full text-[11px] bg-white border border-indigo-100 rounded-lg px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 ring-indigo-500" 
                        placeholder="Subject Code" 
                    />
                    <input 
                        type="text" value={record.venue || ""} onChange={e => onSave(record.id, { venue: e.target.value })} 
                        className="w-full text-[11px] bg-white border border-indigo-100 rounded-lg px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 ring-indigo-500" 
                        placeholder="Venue" 
                    />
                </div>
            )}
            <input 
                type="text" value={timeField} onChange={e => setTimeField(e.target.value)} 
                className="w-full text-[11px] bg-white border border-indigo-100 rounded-lg px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 ring-indigo-500" 
                placeholder={type === "task" ? "Time (e.g. 10:00 AM)" : type === "exam" ? "Exam Date (e.g. 2025-04-10)" : "Due Date"} 
            />
            <div className="flex items-center justify-end gap-2 mt-1">
                <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">
                    Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1 disabled:opacity-60">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3"/>} Save
                </button>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Profile() {
    const { user, logout, profile: authProfile, subjects, refreshProfile } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL;

    const [profile, setProfile] = useState(() => {
        const lp = loadProfile();
        return {
            name: authProfile?.full_name || lp.name || "Student",
            major: authProfile?.branch ? (ktuData.meta.branches[authProfile.branch] || authProfile.branch) : lp.major || "B.Tech",
            college: authProfile?.college || lp.college || "TIST",
            studentId: authProfile?.student_id || lp.studentId || "",
            semester: authProfile?.semester ? `S${authProfile.semester}` : lp.semester || "S6",
            scheme: authProfile?.scheme || lp.scheme || "2019",
            birthday: authProfile?.birthday || lp.birthday || "",
            hardwareSync: lp.hardwareSync ?? false,
            avatarDataUrl: authProfile?.avatar_url || lp.avatarDataUrl || "",
        };
    });

    useEffect(() => {
        if (authProfile) {
            const updated = {
                ...profile,
                name: authProfile.full_name || profile.name,
                major: authProfile.branch ? (ktuData.meta.branches[authProfile.branch] || authProfile.branch) : profile.major,
                college: authProfile.college || profile.college,
                studentId: authProfile.student_id || profile.studentId,
                semester: authProfile.semester ? `S${authProfile.semester}` : profile.semester,
                scheme: authProfile.scheme || profile.scheme,
                birthday: authProfile.birthday || profile.birthday,
                avatarDataUrl: authProfile.avatar_url || profile.avatarDataUrl,
            };
            setProfile(updated);
            saveProfile(updated);
        }
    }, [authProfile]);

    // Subjects
    const [localSubjects, setLocalSubjects] = useState(subjects ?? []);
    const [newSubjectName, setNewSubjectName] = useState("");
    const [addingSubject, setAddingSubject] = useState(false);
    useEffect(() => { setLocalSubjects(subjects ?? []); }, [subjects]);

    const handleAddSubject = async () => {
        const name = newSubjectName.trim();
        if (!name || !user?.id) return;
        setAddingSubject(true);
        try {
            const idx = localSubjects.filter(s => s.is_custom).length + 1;
            const { data, error } = await supabase.from("user_subjects").insert({
                user_id: user.id, course_code: `CUSTOM${idx}`, course_name: name,
                credits: null, is_elective: true, is_custom: true,
            }).select().single();
            if (!error && data) { setLocalSubjects(p => [...p, data]); setNewSubjectName(""); await refreshProfile(); }
        } catch (err) { console.error(err); } finally { setAddingSubject(false); }
    };

    const [subjectToRemove, setSubjectToRemove] = useState(null);
    const handleRemoveSubject = async (id) => {
        if (!subjectToRemove || subjectToRemove !== id) {
            setSubjectToRemove(id);
            return; // First tap: show confirmation
        }
        // Second tap: confirmed
        setSubjectToRemove(null);
        setLocalSubjects(p => p.filter(s => s.id !== id));
        await supabase.from("user_subjects").delete().eq("id", id);
        await refreshProfile();
    };

    // Edit mode
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({});
    const startEdit = () => { setDraft({ ...profile }); setEditing(true); };
    const saveEdit = async () => {
        const updated = { ...profile, ...draft };
        setProfile(updated); saveProfile(updated); setEditing(false);
        if (user?.id) {
            const updates = { full_name: draft.name, college: draft.college, student_id: draft.studentId };
            if (draft.semester?.startsWith("S")) updates.semester = parseInt(draft.semester.replace("S", ""));
            if (draft.scheme) updates.scheme = draft.scheme;
            if (draft.birthday) updates.birthday = draft.birthday;
            const branch = Object.entries(ktuData.meta.branches).find(([, n]) => n === draft.major || n === draft.major);
            if (branch) updates.branch = branch[0];

            // Upload avatar to Supabase Storage if changed
            if (draft.avatarDataUrl && draft.avatarDataUrl !== profile.avatarDataUrl && draft.avatarDataUrl.startsWith("data:")) {
                try {
                    const res = await fetch(draft.avatarDataUrl);
                    const blob = await res.blob();
                    const filePath = `${user.id}/avatar.jpg`;
                    const { error: uploadErr } = await supabase.storage
                        .from("avatars")
                        .upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });
                    if (uploadErr) {
                        console.error("Avatar upload error:", uploadErr);
                        alert("Avatar upload failed: " + uploadErr.message + "\n\nMake sure the 'avatars' bucket has a policy allowing authenticated uploads.");
                    } else {
                        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
                        if (urlData?.publicUrl) {
                            updates.avatar_url = urlData.publicUrl + "?t=" + Date.now();
                        }
                    }
                } catch (e) {
                    console.warn("Avatar upload exception:", e);
                }
            }

            try { await supabase.from("profiles").update(updates).eq("id", user.id); if (refreshProfile) await refreshProfile(); } catch (e) { console.error("Profile save error:", e); }
        }
    };

    // Server health
    const [serverOnline, setServerOnline] = useState(null);
    useEffect(() => {
        const check = async () => {
            try { await api.get("/", { timeout: 5000 }); setServerOnline(true); }
            catch { setServerOnline(false); }
        };
        check(); const iv = setInterval(check, 30000); return () => clearInterval(iv);
    }, []);

    const [skills, setSkills] = useState({ completion: 0, breadth: 0, consistency: 1 });
    const [knowledgeStats, setKnowledgeStats] = useState({ lectures: 0, flashcards: 0 });
    const [allTasks, setAllTasks] = useState([]);
    const [recordings, setRecordings] = useState([]);
    useEffect(() => {
        if (!user?.id) return;
        api.get("/api/tasks", { params: { user_id: user.id } }).then(r => {
            const tasks = r.data || [];
            setAllTasks(tasks);
            const done = tasks.filter(t => t.is_completed).length;
            const total = tasks.length;
            const completion = total > 0 ? Math.round((done / total) * 100) : 0;
            const subjs = new Set(tasks.filter(t => t.is_completed).map(t => t.subject?.split(":")[0]?.trim()).filter(Boolean));
            const breadth = Math.min(100, subjs.size * 20);
            const streak = (() => { try { return JSON.parse(localStorage.getItem("cognitek_streak") || "{}").count || 1; } catch { return 1; }})();
            const consistency = Math.min(100, streak * 10);
            setSkills({ completion, breadth, consistency });
        }).catch(() => {});

        api.get("/api/flashcards", { params: { user_id: user.id } }).then(r => {
            const sessions = r.data || [];
            setRecordings(sessions);
            const cardCount = sessions.reduce((sum, d) => sum + (d.content?.length || 0), 0);
            setKnowledgeStats({ lectures: sessions.length, flashcards: cardCount });
        }).catch(() => {});
    }, [user?.id]);

    // Placement milestones
    const [placements, setPlacements] = useState([]);
    useEffect(() => {
        if (!user?.id) return;
        api.get("/api/placement-milestones", { params: { user_id: user.id } }).then(r => setPlacements(r.data || [])).catch(() => {});
    }, [user?.id]);
    const togglePlacement = async (id, current) => {
        await api.patch(`/api/placement-milestones/${id}`, { is_done: !current });
        setPlacements(ps => ps.map(p => p.id === id ? { ...p, is_done: !p.is_done } : p));
    };

    // History (exam sessions + placements combined timeline)
    const [examHistory, setExamHistory] = useState([]);
    useEffect(() => {
        if (!user?.id) return;
        api.get("/api/exam-sessions", { params: { user_id: user.id } }).then(r => setExamHistory(r.data || [])).catch(() => {});
    }, [user?.id]);

    // Streak
    const streak = (() => { try { return JSON.parse(localStorage.getItem("cognitek_streak") || "{}").count || 1; } catch { return 1; }})();
    const tasksDoneThisWeek = (() => {
        const week = new Date(); week.setDate(week.getDate() - 7);
        return allTasks.filter(t => t.is_completed && new Date(t.created_at) >= week).length;
    })();

    // Birthday Logic
    const isBirthday = (() => {
        if (!profile.birthday) return false;
        const today = new Date();
        const bday = new Date(profile.birthday);
        return today.getDate() === bday.getDate() && today.getMonth() === bday.getMonth();
    })();

    useEffect(() => {
        if (isBirthday) {
            // Simple CSS/JS confetti trigger
            createConfetti();
        }
    }, [isBirthday]);

    const createConfetti = () => {
        const colors = ["#6366f1", "#a855f7", "#ec4899", "#22c55e", "#eab308"];
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.inset = "0";
        container.style.pointerEvents = "none";
        container.style.zIndex = "200";
        document.body.appendChild(container);

        for (let i = 0; i < 50; i++) {
            const dot = document.createElement("div");
            dot.style.position = "absolute";
            dot.style.width = "8px";
            dot.style.height = "8px";
            dot.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            dot.style.borderRadius = "50%";
            dot.style.left = Math.random() * 100 + "vw";
            dot.style.top = "-20px";
            dot.style.animation = `fall ${2 + Math.random() * 3}s linear forwards`;
            container.appendChild(dot);
        }

        const style = document.createElement("style");
        style.innerHTML = `
            @keyframes fall {
                to { transform: translateY(110vh) rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => container.remove(), 5000);
    };

    // Active sheet
    const [sheet, setSheet] = useState(null);
    const [timetableOpen, setTimetableOpen] = useState(false);
    const [avatarModalOpen, setAvatarModalOpen] = useState(false);

    const lastSync = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const GRID = [
        { key: "identity",  label: "Academic Identity", icon: GraduationCap, color: "from-violet-500/10 to-purple-500/10 border-violet-200", iconColor: "text-violet-600", desc: "Profile & subjects" },
        { key: "timetable", label: "Class Timetable",   icon: CalendarClock, color: "from-sky-500/10 to-blue-500/10 border-sky-200",    iconColor: "text-sky-600",    desc: "Weekly schedule" },
        { key: "skills",    label: "Skill Matrix",      icon: Activity,      color: "from-emerald-500/10 to-green-500/10 border-emerald-200", iconColor: "text-emerald-600", desc: "Performance & goals" },
        { key: "knowledge", label: "Knowledge Bank",    icon: BookOpen,      color: "from-amber-500/10 to-orange-500/10 border-amber-200", iconColor: "text-amber-600",  desc: "Study library" },
        { key: "history",   label: "Activity History",  icon: Clock,         color: "from-rose-500/10 to-pink-500/10 border-rose-200",     iconColor: "text-rose-600",   desc: "Sessions & exams" },
        { key: "settings",  label: "About the App",     icon: Settings,      color: "from-slate-500/10 to-gray-500/10 border-slate-200",  iconColor: "text-slate-600",  desc: "App info & AI pipeline" },
        { key: "edit_data", label: "Manage Data",       icon: Pencil,        color: "from-indigo-500/10 to-blue-500/10 border-indigo-200", iconColor: "text-indigo-600", desc: "Edit tasks & exams" },
    ];

    return (
        <div className="min-h-screen bg-[#f0f2f7]">
            <AvatarModal
                src={profile.avatarDataUrl}
                name={profile.name}
                open={avatarModalOpen}
                onClose={() => setAvatarModalOpen(false)}
            />

            {/* ── HERO HEADER ─────────────────────────────────── */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-5 pt-14 pb-8 relative overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute -top-16 -right-12 w-52 h-52 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute top-8 -left-8 w-32 h-32 bg-violet-500/5 rounded-full blur-lg pointer-events-none" />

                {/* Avatar row */}
                <div className="flex items-end gap-4 relative z-10">
                    <Avatar name={profile.name} src={profile.avatarDataUrl} onClick={() => setAvatarModalOpen(true)} />
                    <div className="flex-1 min-w-0 pb-1">
                        <h1 className="text-2xl font-black text-white truncate leading-tight">{profile.name}</h1>
                        <p className="text-sm text-indigo-300 truncate font-medium">{profile.major}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">{profile.semester}</span>
                            <span className="text-[10px] font-black bg-white/10 text-white/60 px-2.5 py-0.5 rounded-full">KTU {profile.scheme}</span>
                        </div>
                    </div>
                </div>

                {/* Email chip */}
                <div className="mt-4 px-3 py-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5 relative z-10">
                    <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <p className="text-xs text-white/50 truncate flex-1">{user?.email}</p>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">Verified</span>
                </div>

                {/* ── Personalized Stats Row ── */}
                <div className="mt-3 grid grid-cols-4 gap-2 relative z-10">
                    {[
                        { label: "Streak", value: `${streak}🔥`, sub: "days" },
                        { label: "Done", value: tasksDoneThisWeek, sub: "this week" },
                        { label: "Subjects", value: localSubjects.length, sub: "enrolled" },
                        { label: "Today", value: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }), sub: new Date().toLocaleDateString("en-IN", { weekday: "short" }) },
                    ].map(stat => (
                        <div key={stat.label} className="flex flex-col items-center py-2 px-1 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-sm font-black text-white leading-tight">{stat.value}</p>
                            <p className="text-[9px] text-white/40 font-medium mt-0.5">{stat.sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── PLACEMENT CARD ──────────────────────────────── */}
            {placements.length > 0 && (
                <div className="mx-4 mt-4 p-4 rounded-2xl bg-white border border-amber-200 shadow-sm">
                    <p className="text-[10px] uppercase tracking-widest font-black text-amber-600 mb-3 flex items-center gap-1.5">
                        <Trophy className="w-3 h-3" /> Upcoming Milestones
                    </p>
                    <div className="space-y-2">
                        {placements.slice(0, 2).map(p => (
                            <button key={p.id} onClick={() => togglePlacement(p.id, p.is_done)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                                    p.is_done ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-slate-800"
                                }`}>
                                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${p.is_done ? "bg-emerald-500 border-emerald-500" : "border-amber-400"}`}>
                                    {p.is_done && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${p.is_done ? "line-through opacity-60" : ""}`}>{p.title}</p>
                                    <span className="text-[11px] text-slate-400">{p.due_date}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── GRID ──────────────────────────────────────── */}
            <div className="mx-4 mt-4 grid grid-cols-2 gap-3 pb-4">
                {GRID.map(item => (
                    <button
                        key={item.key}
                        onClick={() => item.key === "timetable" ? setTimetableOpen(true) : setSheet(item.key)}
                        className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border bg-gradient-to-br ${item.color} bg-white shadow-sm hover:shadow-md active:scale-95 transition-all`}
                    >
                        <div className={`w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center ${item.iconColor} shadow-sm`}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800 leading-tight">{item.label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Sign Out */}
            <div className="mx-4 mb-32">
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-200 bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 active:scale-95 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>

            {/* ════════════════════ TIMETABLE SHEET ════════════════════ */}
            <TimetableSheet open={timetableOpen} onClose={() => setTimetableOpen(false)} subjects={localSubjects} />

            {/* ════════════════════════ SHEETS ════════════════════════ */}

            {/* ── Academic Identity ── */}
            <Sheet open={sheet === "identity"} onClose={() => setSheet(null)} title="🎓 Academic Identity">
                <div className="space-y-4">
                    {/* KTU badge */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
                        <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center font-black text-sm">KTU</div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-white/60">University</p>
                            <p className="text-sm font-semibold">APJ Abdul Kalam Technological University</p>
                        </div>
                    </div>

                    {!editing ? (
                        /* View mode */
                        <div className="space-y-3">
                            {[
                                ["Student ID", profile.studentId],
                                ["College", profile.college],
                                ["Major / Branch", profile.major],
                                ["Birthday", profile.birthday || "Not set"]
                            ].map(([label, val]) => (
                                <div key={label}>
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1 ml-1">{label}</p>
                                    <div className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm font-medium">
                                        {val}
                                    </div>
                                </div>
                            ))}
                            <div className="grid grid-cols-2 gap-3">
                                {[["Semester", profile.semester], ["Scheme", profile.scheme]].map(([label, val]) => (
                                    <div key={label}>
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1 ml-1">{label}</p>
                                        <div className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm font-medium">{val}</div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={startEdit}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 active:scale-95 transition-all"
                            >
                                <Pencil className="w-3.5 h-3.5" /> Edit Profile
                            </button>
                        </div>
                    ) : (
                        /* Edit mode */
                        <div className="space-y-3">
                            <div className="flex items-center gap-4 py-2 border-b border-slate-100 mb-2">
                                <Avatar name={draft.name} src={draft.avatarDataUrl} size="sm" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Profile Photo</p>
                                    <label className="inline-block px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold cursor-pointer hover:bg-indigo-100 transition-colors">
                                        Upload Image
                                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const img = new Image();
                                            img.onload = () => {
                                                const SIZE = 400; // Increased from 200 for crispness
                                                const canvas = document.createElement("canvas");
                                                canvas.width = SIZE;
                                                canvas.height = SIZE;
                                                const ctx = canvas.getContext("2d");
                                                ctx.imageSmoothingEnabled = true;
                                                ctx.imageSmoothingQuality = "high";
                                                // Center-crop to square
                                                const min = Math.min(img.width, img.height);
                                                const sx = (img.width - min) / 2;
                                                const sy = (img.height - min) / 2;
                                                ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
                                                const compressed = canvas.toDataURL("image/jpeg", 0.9); // Increased from 0.6
                                                setDraft(d => ({...d, avatarDataUrl: compressed}));
                                            };
                                            img.src = URL.createObjectURL(file);
                                        }} />
                                    </label>
                                </div>
                            </div>
                            {[
                                ["Student ID", "studentId", "e.g. TCH22EC001"],
                                ["Full Name",  "name",      "Your full name"],
                                ["College",    "college",   "Institution name"],
                                ["Major",      "major",     "Branch"],
                            ].map(([label, key, ph]) => (
                                <div key={key}>
                                    <label className="text-xs font-bold uppercase tracking-wide text-slate-400 ml-1 mb-1 block">{label}</label>
                                    <LightInput
                                        value={draft[key] || ""}
                                        onChange={e => setDraft({ ...draft, [key]: e.target.value })}
                                        placeholder={ph}
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wide text-slate-400 ml-1 mb-1 block">Birthday</label>
                                <input 
                                    type="date"
                                    value={draft.birthday || ""}
                                    onChange={e => setDraft({ ...draft, birthday: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-300 transition-all font-medium"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[["Semester", "semester", ["S1","S2","S3","S4","S5","S6","S7","S8"]],
                                  ["Scheme", "scheme", ["2019","2024"]]].map(([label, key, opts]) => (
                                    <div key={key}>
                                        <label className="text-xs font-bold uppercase tracking-wide text-slate-400 ml-1 mb-1 block">{label}</label>
                                        <select
                                            className="w-full px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                                            value={draft[key] || ""}
                                            onChange={e => setDraft({ ...draft, [key]: e.target.value })}
                                        >
                                            {opts.map(o => <option key={o}>{o}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                                <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors">Save Changes</button>
                            </div>
                        </div>
                    )}

                    {/* Subjects */}
                    <div className="pt-2 border-t border-slate-100">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">Enrolled Subjects</p>
                        <div className="space-y-2 mb-3">
                            {localSubjects.length === 0 && <p className="text-xs text-slate-400 text-center py-3">No subjects — complete onboarding.</p>}
                            {localSubjects.map(sub => <SubjectRow key={sub.id} sub={sub} onRemove={handleRemoveSubject} confirmId={subjectToRemove} />)}
                        </div>
                        <div className="flex gap-2">
                            <LightInput
                                className="flex-1 !py-2 text-xs"
                                value={newSubjectName}
                                onChange={e => setNewSubjectName(e.target.value)}
                                placeholder="Add custom subject name"
                            />
                            <button onClick={handleAddSubject} disabled={addingSubject}
                                className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-60 hover:bg-slate-800 transition-colors">
                                {addingSubject ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </Sheet>


            {/* ── Skill Matrix ── */}
            <Sheet open={sheet === "skills"} onClose={() => setSheet(null)} title="📊 Skill Matrix">
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">Performance breakdown across your enrolled subjects and study habits. Derived from task completions and study streak.</p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <SkillRing label="Task Completion" value={skills.completion} color="#6366f1" />
                    <SkillRing label="Knowledge Breadth" value={skills.breadth} color="#10b981" />
                    <SkillRing label="Study Streak" value={skills.consistency} color="#f59e0b" />
                </div>

                {/* Per-subject breakdown */}
                {localSubjects.length > 0 && (
                    <div className="mb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">By Subject</p>
                        <div className="space-y-3">
                            {localSubjects.map(sub => {
                                const subTasks = allTasks.filter(t => t.subject?.includes(sub.course_code) || t.subject?.toLowerCase().includes((sub.course_name || "").toLowerCase().split(" ")[0]));
                                const done = subTasks.filter(t => t.is_completed).length;
                                const pct = subTasks.length > 0 ? Math.round((done / subTasks.length) * 100) : 0;
                                return (
                                    <div key={sub.id} className="px-4 py-3 rounded-xl border border-slate-200 bg-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-slate-800 truncate">{sub.course_code}</p>
                                                <p className="text-[10px] text-slate-400 truncate">{sub.course_name}</p>
                                            </div>
                                            <span className={`text-sm font-black ml-2 flex-shrink-0 ${
                                                pct >= 75 ? "text-emerald-600" : pct >= 40 ? "text-amber-500" : "text-slate-400"
                                            }`}>{pct}%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-700 ${
                                                pct >= 75 ? "bg-gradient-to-r from-emerald-400 to-teal-400" :
                                                pct >= 40 ? "bg-gradient-to-r from-amber-400 to-yellow-400" :
                                                "bg-slate-300"
                                            }`} style={{ width: `${pct}%` }} />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">{done}/{subTasks.length} tasks done</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    {[
                        { label: "Total Tasks Completed", value: `${allTasks.filter(t=>t.is_completed).length}`, desc: `out of ${allTasks.length} total` },
                        { label: "Subjects Actively Working", value: `${Math.round(skills.breadth / 20)}`, desc: "have at least one completion" },
                        { label: "Streak", value: `${Math.round(skills.consistency / 10)} day${Math.round(skills.consistency / 10) !== 1 ? "s" : ""}`, desc: "in a row" },
                    ].map(item => (
                        <div key={item.label} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                                <p className="text-xs text-slate-400">{item.desc}</p>
                            </div>
                            <p className="text-lg font-black text-indigo-600">{item.value}</p>
                        </div>
                    ))}
                </div>
            </Sheet>

            {/* ── Knowledge Bank ── */}
            <Sheet open={sheet === "knowledge"} onClose={() => setSheet(null)} title="📖 Knowledge Bank">
                <p className="text-xs text-amber-700 mb-4 leading-relaxed bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">📚 Your personal content library — auto-tracked from every lecture, recording and flashcard session.</p>
                <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                        { label: "Sessions Recorded", value: knowledgeStats.lectures, icon: BookOpen, bg: "bg-amber-100", iconColor: "text-amber-700", textColor: "text-amber-800" },
                        { label: "Flashcards Generated", value: knowledgeStats.flashcards, icon: Zap, bg: "bg-orange-100", iconColor: "text-orange-700", textColor: "text-orange-800" },
                        { label: "Subjects Enrolled", value: localSubjects.length, icon: GraduationCap, bg: "bg-yellow-100", iconColor: "text-yellow-700", textColor: "text-yellow-800" },
                        { label: "Active Tasks", value: allTasks.filter(t=>!t.is_completed).length, icon: Target, bg: "bg-rose-100", iconColor: "text-rose-700", textColor: "text-rose-800" },
                    ].map(({ label, value, icon: Icon, bg, iconColor, textColor }) => (
                        <div key={label} className={`p-4 rounded-2xl ${bg} border border-white`}>
                            <Icon className={`w-5 h-5 mb-2 ${iconColor}`} />
                            <p className={`text-2xl font-black ${textColor}`}>{value}</p>
                            <p className={`text-[10px] font-bold mt-1 ${textColor} opacity-80`}>{label}</p>
                        </div>
                    ))}
                </div>

                {/* Subject tag cloud */}
                {localSubjects.length > 0 && (
                    <div className="mb-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Topics in your Library</p>
                        <div className="flex flex-wrap gap-2">
                            {localSubjects.map(sub => (
                                <span key={sub.id} className="px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-bold">
                                    {sub.course_code}
                                </span>
                            ))}
                            {allTasks.filter(t => t.subject).reduce((acc, t) => {
                                const s = t.subject?.split(":")[0]?.trim();
                                if (s && !acc.includes(s) && !localSubjects.find(sub => sub.course_code === s)) acc.push(s);
                                return acc;
                            }, []).slice(0, 5).map(s => (
                                <span key={s} className="px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-semibold">{s}</span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                    <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider mb-1">📊 Study Insight</p>
                    <p className="text-sm font-semibold text-amber-900">
                        {skills.consistency >= 50
                            ? `🔥 Great streak! Your knowledge bank is growing.`
                            : `💡 Record your lectures daily to build your library faster.`}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                        {knowledgeStats.flashcards > 0
                            ? `You have ${knowledgeStats.flashcards} flashcards across ${knowledgeStats.lectures} sessions.`
                            : `No flashcards yet — start recording a lecture!`}
                    </p>
                </div>
            </Sheet>

            {/* ── Activity History ── */}
            <Sheet open={sheet === "history"} onClose={() => setSheet(null)} title="🕐 Activity History">
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">Your complete academic timeline — recordings, tasks, placements, and exams.</p>
                
                <div className="space-y-8">
                    {/* Lecture Recordings Section */}
                    {recordings.length > 0 && (
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
                                <div className="w-1 h-3 bg-indigo-500 rounded-full" /> Lecture Recordings
                            </p>
                            <div className="space-y-3">
                                {recordings.slice(0, 5).map((rec, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 flex-shrink-0">
                                                <BookOpen className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <div className="flex-1 w-0.5 bg-slate-100 my-1" />
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="text-sm font-bold text-slate-800">{rec.subject || "Unknown Subject"}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-400 font-medium">{rec.date || "Recent Session"}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-[10px] text-indigo-600 font-bold">{rec.cards?.length || 0} cards generated</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tasks Section */}
                    {allTasks.length > 0 && (
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2">
                                <div className="w-1 h-3 bg-rose-500 rounded-full" /> Recent Tasks
                            </p>
                            <div className="space-y-3">
                                {allTasks.slice(0, 5).map(t => (
                                    <div key={t.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border flex-shrink-0 ${
                                                t.is_completed ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
                                            }`}>
                                                {t.is_completed ? <Check className="w-4 h-4 text-emerald-500" /> : <Target className="w-4 h-4 text-rose-500" />}
                                            </div>
                                            <div className="flex-1 w-0.5 bg-slate-100 my-1" />
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className={`text-sm font-bold ${t.is_completed ? "text-slate-400 line-through" : "text-slate-800"}`}>{t.title}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{t.subject} · {t.due_date || "No deadline"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Exams Section */}
                    {examHistory.length > 0 && (
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-4 flex items-center gap-2">
                                <div className="w-1 h-3 bg-violet-500 rounded-full" /> Scheduled Exams
                            </p>
                            <div className="space-y-3">
                                {examHistory.map(e => (
                                    <div key={e.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center border border-violet-100 flex-shrink-0">
                                                <BookMarked className="w-4 h-4 text-violet-500" />
                                            </div>
                                            <div className="flex-1 w-0.5 bg-slate-100 my-1" />
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="text-sm font-bold text-slate-800">{e.subject_name || e.subject_code}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-violet-600 font-bold">{e.exam_date}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-[10px] text-slate-400">{e.venue || "TBA"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {recordings.length === 0 && allTasks.length === 0 && examHistory.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <Clock className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-800">Timeline is empty</p>
                        <p className="text-xs text-slate-400 mt-1">Start recording lectures to build your history!</p>
                    </div>
                )}
            </Sheet>

            {/* ── About the App ── */}
            <Sheet open={sheet === "settings"} onClose={() => setSheet(null)} title="🔬 About CogniTek">
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">System architecture and active configurations for your CogniTek instance. These are read-only diagnostics.</p>
                
                {/* Lab Status Section */}
                <div className="mb-6 p-4 rounded-2xl bg-[#0f0f16] border border-white/5 relative overflow-hidden shadow-xl shadow-black/40">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/80 mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                        CogniTek Lab Status
                    </p>
                    <ServerStatus />
                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">Verifying backend heartbeat and GPU-accelerated inference nodes.</p>
                </div>

                <div className="mb-8 p-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center text-slate-500 mb-6 font-mono">Sylens AI Pipeline Architecture</p>
                    
                    <div className="relative flex flex-col gap-6 items-center px-4">
                        {/* Vertical Flow Line */}
                        <div className="absolute top-6 bottom-6 left-[38px] w-0.5 bg-gradient-to-b from-sky-400 via-indigo-500 to-emerald-400 opacity-20" />

                        {/* Step 1: Perception */}
                        <div className="group relative w-full flex items-start gap-4">
                            <div className="relative z-10 w-9 h-9 rounded-xl bg-[#1a1a2e] border border-sky-500/30 flex items-center justify-center shadow-lg shadow-sky-500/10 group-hover:scale-110 transition-transform">
                                <div className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-pulse" />
                            </div>
                            <div className="flex-1 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] font-black text-white uppercase tracking-wider">1. Perception</p>
                                    <span className="text-[9px] font-bold text-sky-400 px-1.5 py-0.5 bg-sky-400/10 rounded-md border border-sky-400/20">Whisper v3</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed italic">"Audio lecture transcoded to semantic-rich text segments via OpenAI Whisper."</p>
                            </div>
                        </div>

                        {/* Step 2: Logic Extraction */}
                        <div className="group relative w-full flex items-start gap-4">
                            <div className="relative z-10 w-9 h-9 rounded-xl bg-[#1a1a2e] border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform">
                                <Zap className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="flex-1 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] font-black text-white uppercase tracking-wider">2. Logic Engine</p>
                                    <span className="text-[9px] font-bold text-indigo-400 px-1.5 py-0.5 bg-indigo-400/10 rounded-md border border-indigo-400/20">Gemini 2.5 Flash</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed italic">"De-noising, context mapping, and extraction of tasks, exams, and flashcards."</p>
                            </div>
                        </div>

                        {/* Step 3: Deployment */}
                        <div className="group relative w-full flex items-start gap-4">
                            <div className="relative z-10 w-9 h-9 rounded-xl bg-[#1a1a2e] border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:scale-110 transition-transform">
                                <Database className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="flex-1 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] font-black text-white uppercase tracking-wider">3. Persistence</p>
                                    <span className="text-[9px] font-bold text-emerald-400 px-1.5 py-0.5 bg-emerald-400/10 rounded-md border border-emerald-400/20">Supabase DB</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed italic">"Encrypted storage for actionable records, synced across all devices."</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Privacy Note */}
                <div className="p-4 mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-2xl pointer-events-none" />
                    <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" /> Privacy Secure
                    </p>
                    <p className="text-[10px] text-emerald-100 leading-relaxed">
                        Lectures are processed in volatile memory. Raw audio files are <strong>never stored</strong>. Only the intelligent data parsed from them persists.
                    </p>
                </div>

                <div className="p-4 rounded-2xl border border-white/5 bg-white/5 text-center mb-4">
                    <p className="text-[10px] text-slate-500">Built by Hansel Sabu · Electrical and Computer Engineering · TIST-KTU</p>
                    <p className="text-[9px] text-slate-600 mt-1 uppercase tracking-widest font-black">CogniTek System v2.1.4_STRIKE</p>
                </div>
            </Sheet>

            {/* ── Manage Data Sheet ── */}
            <Sheet open={sheet === "edit_data"} onClose={() => setSheet(null)} title="📝 Manage Academic Data">
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">Fix any discrepancies parsed by Sylens. You can also manually add upcoming exams or tasks here.</p>
                
                <div className="space-y-6">
                    {/* Tasks Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Target className="w-4 h-4 text-rose-500" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Tasks</h3>
                        </div>
                        {allTasks.length === 0 ? (
                            <p className="text-xs text-slate-500 italic px-2">No tasks available.</p>
                        ) : (
                            <div className="space-y-2">
                                {allTasks.map(task => (
                                    <EditableDataRow 
                                        key={task.id} 
                                        record={task} 
                                        type="task" 
                                        onSave={async (id, updates) => {
                                            await api.patch(`/api/tasks/${id}`, updates);
                                            setAllTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
                                        }}
                                        onDelete={async (id) => {
                                            if (!window.confirm("Delete this task?")) return;
                                            await api.delete(`/api/tasks/${id}`);
                                            setAllTasks(prev => prev.filter(t => t.id !== id));
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Exam Sessions Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <BookMarked className="w-4 h-4 text-violet-500" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Exam Schedule</h3>
                        </div>
                        {examHistory.length === 0 ? (
                            <p className="text-xs text-slate-500 italic px-2">No exams scheduled.</p>
                        ) : (
                            <div className="space-y-2">
                                {examHistory.map(exam => (
                                    <EditableDataRow 
                                        key={exam.id} 
                                        record={{
                                            ...exam,
                                            title: exam.subject_name || exam.subject_code,
                                            notes: exam.venue,
                                            due_date: exam.exam_date
                                        }}
                                        type="exam" 
                                        onSave={async (id, updates) => {
                                            const backendUpdates = {
                                                subject_name: updates.title,
                                                venue: updates.notes,
                                                exam_date: updates.due_date,
                                                subject_code: updates.subject_code
                                            };
                                            await api.patch(`/api/exam-sessions/${id}`, backendUpdates);
                                            setExamHistory(prev => prev.map(e => e.id === id ? { ...e, ...backendUpdates } : e));
                                        }}
                                        onDelete={async (id) => {
                                            if (!window.confirm("Delete this exam session?")) return;
                                            await api.delete(`/api/exam-sessions/${id}`);
                                            setExamHistory(prev => prev.filter(e => e.id !== id));
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Sheet>
        </div>
    );
}
