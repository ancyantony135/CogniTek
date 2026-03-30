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
    Upload, Image as ImageIcon, Sun, Moon, Coffee, AlertCircle
} from "lucide-react";

const STORAGE_KEY = "cognitek_profile";
const TIMETABLE_KEY = "cognitek_timetable";
const DEFAULT_SKILL = { python: 0, aiml: 0, fullstack: 0 };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const HOUR_LABELS = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM"];

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
function Avatar({ name, size = "lg", src = null }) {
    const initials = (name || "S").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const sz = size === "lg" ? "w-20 h-20 text-2xl" : "w-10 h-10 text-sm";
    
    if (src) {
        return (
            <img 
                src={src} 
                alt="Profile" 
                className={`${sz} rounded-2xl object-cover shadow-lg flex-shrink-0 border border-white/20`}
            />
        );
    }
    
    return (
        <div className={`${sz} rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black shadow-lg flex-shrink-0`}>
            {initials}
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
function SubjectRow({ sub, onRemove }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{sub.course_code}</p>
                <p className="text-xs text-slate-500 truncate">{sub.course_name}</p>
            </div>
            {sub.credits && <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full">{sub.credits}cr</span>}
            {(sub.is_elective || sub.is_custom) && onRemove && (
                <button onClick={() => onRemove(sub.id)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors">
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
    };

    const clearSlot = (day, hour) => {
        const updated = { ...timetable };
        if (updated[day]) { delete updated[day][hour]; }
        setTimetable(updated);
        saveTimetable(updated);
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

    return (
        <Sheet open={open} onClose={onClose} title="📅 Class Timetable">
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

                {/* Time slots */}
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">{activeDay} Schedule</p>
                    <div className="space-y-2">
                        {HOURS.map((hour, i) => {
                            const slot = getSlot(activeDay, hour);
                            const nextHour = HOURS[i + 1] || "17:00";
                            return (
                                <div key={hour} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                                    slot?.type === "break"
                                        ? "bg-amber-50 border-amber-200"
                                        : slot?.subject
                                            ? "bg-indigo-50 border-indigo-200"
                                            : "bg-white border-slate-100"
                                }`}>
                                    {/* Time label */}
                                    <div className="w-16 flex-shrink-0">
                                        <p className="text-[11px] font-black text-slate-500">{HOUR_LABELS[i]}</p>
                                        <p className="text-[9px] text-slate-300">– {HOUR_LABELS[i + 1] || "5 PM"}</p>
                                    </div>

                                    {/* Slot content */}
                                    {slot?.type === "break" ? (
                                        <div className="flex-1 flex items-center gap-1.5">
                                            <Coffee className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="text-xs font-semibold text-amber-700">Break</span>
                                        </div>
                                    ) : slot?.subject ? (
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-indigo-700 truncate">{slot.subject}</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-300 italic">Free</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-1 flex-shrink-0">
                                        {slot ? (
                                            <button
                                                onClick={() => clearSlot(activeDay, hour)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-300 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        ) : (
                                            <>
                                                <SlotPicker
                                                    label="+"
                                                    subjectOptions={subjectOptions}
                                                    onSelect={(val) => setSlot(activeDay, hour, { subject: val, type: "class" })}
                                                />
                                                <button
                                                    onClick={() => setSlot(activeDay, hour, { type: "break" })}
                                                    className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-bold hover:bg-amber-100 transition-colors"
                                                >
                                                    Break
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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
                            {/* Hour rows */}
                            {HOURS.map((hour, i) => (
                                <>
                                    <div key={`h-${hour}`} className="text-[9px] text-slate-400 font-bold flex items-center">{HOUR_LABELS[i]}</div>
                                    {DAYS.map(day => {
                                        const slot = getSlot(day, hour);
                                        return (
                                            <div key={`${day}-${hour}`} className={`h-7 mx-0.5 mb-1 rounded text-[8px] font-bold flex items-center justify-center truncate px-0.5 ${
                                                slot?.type === "break" ? "bg-amber-100 text-amber-600" :
                                                slot?.subject ? "bg-indigo-100 text-indigo-700" :
                                                "bg-slate-50"
                                            }`}>
                                                {slot?.type === "break" ? "☕" : slot?.subject?.split(" ")[0] || ""}
                                            </div>
                                        );
                                    })}
                                </>
                            ))}
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
            hardwareSync: lp.hardwareSync ?? false,
            avatarDataUrl: lp.avatarDataUrl || "",
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

    const handleRemoveSubject = async (id) => {
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
            const branch = Object.entries(ktuData.meta.branches).find(([, n]) => n === draft.major || n === draft.major);
            if (branch) updates.branch = branch[0];
            try { await supabase.from("profiles").update(updates).eq("id", user.id); if (refreshProfile) await refreshProfile(); } catch {}
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

    // Skill data
    const [skills, setSkills] = useState({ completion: 0, breadth: 0, consistency: 1 });
    const [knowledgeStats, setKnowledgeStats] = useState({ lectures: 0, flashcards: 0 });
    useEffect(() => {
        if (!user?.id) return;
        api.get("/api/tasks", { params: { user_id: user.id } }).then(r => {
            const tasks = r.data || [];
            const done = tasks.filter(t => t.is_completed).length;
            const total = tasks.length;
            const completion = total > 0 ? Math.round((done / total) * 100) : 0;
            const subjs = new Set(tasks.filter(t => t.is_completed).map(t => t.subject?.split(":")[0]?.trim()).filter(Boolean));
            const breadth = Math.min(100, subjs.size * 20);
            const streak = (() => { try { return JSON.parse(localStorage.getItem("cognitek_streak") || "{}").count || 1; } catch { return 1; }})();
            const consistency = Math.min(100, streak * 10);
            setSkills({ completion, breadth, consistency });
            setKnowledgeStats(prev => ({ ...prev, lectures: total }));
        }).catch(() => {});
        api.get("/api/flashcards", { params: { user_id: user.id } }).then(r => {
            const decks = r.data || [];
            const cardCount = decks.reduce((sum, d) => sum + (d.content?.length || 0), 0);
            setKnowledgeStats(prev => ({ ...prev, flashcards: cardCount }));
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

    // Active sheet
    const [sheet, setSheet] = useState(null);
    const [timetableOpen, setTimetableOpen] = useState(false);

    const lastSync = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const GRID = [
        { key: "identity",  label: "Academic Identity", icon: GraduationCap, color: "from-violet-500/10 to-purple-500/10 border-violet-200", iconColor: "text-violet-600", desc: "Profile & subjects" },
        { key: "timetable", label: "Class Timetable",   icon: CalendarClock, color: "from-sky-500/10 to-blue-500/10 border-sky-200",    iconColor: "text-sky-600",    desc: "Weekly schedule" },
        { key: "lab",       label: "CogniTek Lab",      icon: FlaskConical,  color: "from-cyan-500/10 to-teal-500/10 border-cyan-200",   iconColor: "text-cyan-600",   desc: "Server & hardware" },
        { key: "skills",    label: "Skill Matrix",      icon: Activity,      color: "from-emerald-500/10 to-green-500/10 border-emerald-200", iconColor: "text-emerald-600", desc: "Your stats" },
        { key: "knowledge", label: "Knowledge Bank",    icon: BookOpen,      color: "from-amber-500/10 to-orange-500/10 border-amber-200", iconColor: "text-amber-600",  desc: "Sessions & cards" },
        { key: "settings",  label: "AI & Cloud",        icon: Settings,      color: "from-slate-500/10 to-gray-500/10 border-slate-200",  iconColor: "text-slate-600",  desc: "AI settings" },
    ];

    return (
        <div className="min-h-screen bg-[#f0f2f7]">

            {/* ── HERO HEADER ─────────────────────────────────── */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-5 pt-14 pb-8 relative overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute -top-16 -right-12 w-52 h-52 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-8 -left-8 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Avatar row */}
                <div className="flex items-end gap-4 relative z-10">
                    <Avatar name={profile.name} src={profile.avatarDataUrl} />
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
                            <item.icon className="w-4.5 h-4.5 w-5 h-5" />
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
                            ].map(([label, val]) => (
                                <div key={label}>
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1 ml-1">{label}</p>
                                    <div className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm font-medium">
                                        {val || <span className="text-slate-400 italic">Not set</span>}
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
                                            const reader = new FileReader();
                                            reader.onload = ev => setDraft(d => ({...d, avatarDataUrl: ev.target.result}));
                                            reader.readAsDataURL(file);
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
                            {localSubjects.map(sub => <SubjectRow key={sub.id} sub={sub} onRemove={handleRemoveSubject} />)}
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

            {/* ── CogniTek Lab ── */}
            <Sheet open={sheet === "lab"} onClose={() => setSheet(null)} title="🔬 CogniTek Lab">
                <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-3">Server Status</p>
                        {[["ngrok Tunnel", Wifi], ["Supabase Cloud", Database]].map(([label, Icon]) => (
                            <div key={label} className="flex items-center justify-between py-2">
                                <span className="flex items-center gap-2 text-sm font-medium text-slate-700"><Icon className="w-4 h-4 text-slate-400" />{label}</span>
                                <div className="flex items-center gap-2">
                                    <HealthDot online={serverOnline} />
                                    <span className={`text-xs font-semibold ${serverOnline === null ? "text-gray-500" : serverOnline ? "text-emerald-600" : "text-red-500"}`}>
                                        {serverOnline === null ? "Checking…" : serverOnline ? "Active" : "Offline"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center gap-2 text-sm font-medium text-slate-700"><Watch className="w-4 h-4 text-slate-400"/>Wearable Band Sync</span>
                            <button onClick={() => { const u = {...profile, hardwareSync: !profile.hardwareSync }; setProfile(u); saveProfile(u); }}
                                className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${profile.hardwareSync ? "bg-emerald-50 border-emerald-300 text-emerald-600" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
                                <Bluetooth className="w-3 h-3 inline mr-1"/>{profile.hardwareSync ? "Paired" : "Not Paired"}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 pl-6">{profile.hardwareSync ? `Last sync: today at ${lastSync}` : "Tap to simulate pairing"}</p>
                    </div>
                </div>
            </Sheet>

            {/* ── Skill Matrix ── */}
            <Sheet open={sheet === "skills"} onClose={() => setSheet(null)} title="📊 Skill Matrix">
                <p className="text-xs text-slate-400 mb-4">Derived from your task completions, flashcard activity, and study streak.</p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <SkillRing label="Task Completion" value={skills.completion} color="#6366f1" />
                    <SkillRing label="Knowledge Breadth" value={skills.breadth} color="#10b981" />
                    <SkillRing label="Study Streak" value={skills.consistency} color="#f59e0b" />
                </div>
                <div className="space-y-3">
                    {[
                        { label: "Tasks Completed", value: `${skills.completion}%`, desc: "of all recorded tasks" },
                        { label: "Subjects Covered", value: `${Math.round(skills.breadth / 20)}`, desc: "unique subjects with completions" },
                        { label: "Study Streak", value: `${Math.round(skills.consistency / 10)} day${Math.round(skills.consistency / 10) !== 1 ? "s" : ""}`, desc: "consecutive days" },
                    ].map(item => (
                        <div key={item.label} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                                <p className="text-xs text-slate-400">{item.desc}</p>
                            </div>
                            <p className="text-lg font-black text-slate-800">{item.value}</p>
                        </div>
                    ))}
                </div>
            </Sheet>

            {/* ── Knowledge Bank ── */}
            <Sheet open={sheet === "knowledge"} onClose={() => setSheet(null)} title="📚 Knowledge Bank">
                <p className="text-xs text-slate-400 mb-4">Your CogniTek learning stats — auto-tracked from recordings.</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                        { label: "Sessions Recorded", value: knowledgeStats.lectures, icon: BookOpen, color: "from-blue-50 to-indigo-50 border-blue-200 text-blue-600" },
                        { label: "Flashcards Generated", value: knowledgeStats.flashcards, icon: Zap, color: "from-purple-50 to-violet-50 border-purple-200 text-purple-600" },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className={`p-4 rounded-xl border bg-gradient-to-br ${color}`}>
                            <Icon className="w-4 h-4 mb-2 opacity-80" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
                            <p className="text-2xl font-black">{value}</p>
                        </div>
                    ))}
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Target className="w-4 h-4 text-slate-400"/>Task Completion</span>
                        <span className="text-xl font-black text-slate-800">{skills.completion}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700" style={{ width: `${skills.completion}%` }} />
                    </div>
                </div>
            </Sheet>

            {/* ── AI & Cloud Settings ── */}
            <Sheet open={sheet === "settings"} onClose={() => setSheet(null)} title="⚙️ AI & Cloud Settings">
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">System architecture and active configurations for your CogniTek instance. These are read-only diagnostics.</p>
                
                <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                        <div className="flex items-start gap-3">
                            <Zap className="w-5 h-5 text-indigo-500 mt-0.5" />
                            <div>
                                <p className="text-sm font-black text-indigo-900">Primary AI: Gemini 2.5 Flash</p>
                                <p className="text-[11px] text-indigo-700 mt-1 leading-relaxed">Handles core logic: audio task extraction, intelligent flashcard generation, Sylens chat, and automated timetable parsing. Connected via cloud API.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-start gap-3">
                            <Activity className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-slate-800">Transcription: OpenAI Whisper</p>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Runs completely locally on your hardware. Transcribes recorded lecture audio to text offline before sending to Gemini for analysis.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-start gap-3">
                            <Database className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-slate-800">Cloud DB: Supabase Edge</p>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Handles encrypted persistence for your schedules, progress milestones, and Auth JWT sessions. Synced across all your devices.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-slate-800">Local Cache</p>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Profile settings, offline streak tracking, and active class timetables are cached securely in Device LocalStorage to reduce network latency.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Sheet>
        </div>
    );
}
