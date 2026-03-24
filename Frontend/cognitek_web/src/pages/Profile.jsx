import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import ktuData from "../data/ktu_courses.json";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import axios from "axios";
import {
    User as UserIcon, LogOut, Pencil, Check, X, Database, Activity,
    BookOpen, Zap, Target, Brain, Code2, Layers, BadgeCheck,
    ChevronDown, ChevronUp, Bluetooth, Watch, Plus, Wifi,
    FlaskConical, Briefcase, BookMarked, Trash2, Loader2, GraduationCap,
    Trophy, ChevronRight, Settings, Shield
} from "lucide-react";

const STORAGE_KEY = "cognitek_profile";
const DEFAULT_SKILL = { python: 0, aiml: 0, fullstack: 0 };

function loadProfile() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveProfile(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = "lg" }) {
    const initials = (name || "S").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const sz = size === "lg" ? "w-16 h-16 text-xl" : "w-10 h-10 text-sm";
    return (
        <div className={`${sz} rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-black shadow-lg flex-shrink-0`}>
            {initials}
        </div>
    );
}

// ── Bottom Sheet ──────────────────────────────────────────────────────────────
function Sheet({ open, onClose, title, children }) {
    return (
        <>
            {open && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />}
            <div className={`fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"}`}
                style={{ maxHeight: "85vh" }}>
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-slate-200 rounded-full" />
                </div>
                <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100">
                    <h2 className="font-black text-slate-800 text-base">{title}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: "calc(85vh - 80px)" }}>
                    {children}
                </div>
            </div>
        </>
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
            whisperSensitivity: lp.whisperSensitivity ?? "Medium",
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
            try { await axios.get(`${API_URL}/`, { timeout: 5000 }); setServerOnline(true); }
            catch { setServerOnline(false); }
        };
        check(); const iv = setInterval(check, 30000); return () => clearInterval(iv);
    }, [API_URL]);

    // Skill data derived from tasks API
    const [skills, setSkills] = useState({ completion: 0, breadth: 0, consistency: 1 });
    const [knowledgeStats, setKnowledgeStats] = useState({ lectures: 0, flashcards: 0 });
    useEffect(() => {
        if (!user?.id) return;
        // Tasks
        api.get("/api/tasks", { params: { user_id: user.id } }).then(r => {
            const tasks = r.data || [];
            const done = tasks.filter(t => t.is_completed).length;
            const total = tasks.length;
            const completion = total > 0 ? Math.round((done / total) * 100) : 0;
            const subjects = new Set(tasks.filter(t => t.is_completed).map(t => t.subject?.split(":")[0]?.trim()).filter(Boolean));
            const breadth = Math.min(100, subjects.size * 20);
            const streak = (() => { try { return JSON.parse(localStorage.getItem("cognitek_streak") || "{}").count || 1; } catch { return 1; }})();
            const consistency = Math.min(100, streak * 10);
            setSkills({ completion, breadth, consistency });
            setKnowledgeStats(prev => ({ ...prev, lectures: total }));
        }).catch(() => {});
        // Flashcards
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
    const [sheet, setSheet] = useState(null); // key string

    const GRID = [
        { key: "identity",  label: "Academic Identity", icon: GraduationCap, color: "from-violet-50 to-purple-50 border-violet-200 text-violet-700" },
        { key: "lab",       label: "CogniTek Lab",      icon: FlaskConical,   color: "from-cyan-50 to-blue-50 border-cyan-200 text-cyan-700" },
        { key: "skills",    label: "Skill Matrix",      icon: Activity,       color: "from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700" },
        { key: "knowledge", label: "Knowledge Bank",    icon: BookOpen,       color: "from-amber-50 to-orange-50 border-amber-200 text-amber-700" },
        { key: "settings",  label: "AI & Cloud",        icon: Settings,       color: "from-slate-50 to-gray-50 border-slate-200 text-slate-700" },
        { key: "logout",    label: "Sign Out",          icon: LogOut,         color: "from-red-50 to-rose-50 border-red-200 text-red-600" },
    ];

    const lastSync = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    return (
        <div className="min-h-screen bg-[#f7f7f9]">

            {/* ── HERO HEADER ─────────────────────────────────── */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-5 pt-12 pb-6 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4">
                    <Avatar name={profile.name} />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-black text-white truncate">{profile.name}</h1>
                        <p className="text-sm text-white/50 truncate">{profile.major}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-bold bg-white/10 text-white/70 px-2 py-0.5 rounded-full">{profile.semester}</span>
                            <span className="text-[10px] font-bold bg-white/10 text-white/70 px-2 py-0.5 rounded-full">KTU {profile.scheme}</span>
                        </div>
                    </div>
                    <button onClick={startEdit}
                        className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-white/60 hover:bg-white/20 transition-colors">
                        <Pencil className="w-4 h-4" />
                    </button>
                </div>
                <div className="mt-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <p className="text-xs text-white/50 truncate">{user?.email}</p>
                    <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">Verified</span>
                </div>
            </div>

            {/* ── PLACEMENT CARD (conditional) ────────────────── */}
            {placements.length > 0 && (
                <div className="mx-4 mt-4 p-4 rounded-2xl bg-white border border-amber-200 shadow-sm">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-amber-600 mb-3 flex items-center gap-1.5">
                        <Trophy className="w-3 h-3" /> Upcoming Placement Milestones
                    </p>
                    <div className="space-y-2">
                        {placements.map(p => (
                            <button key={p.id} onClick={() => togglePlacement(p.id, p.is_done)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                                    p.is_done ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-slate-800"
                                }`}>
                                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${p.is_done ? "bg-emerald-500 border-emerald-500" : "border-amber-400"}`}>
                                    {p.is_done && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${p.is_done ? "line-through opacity-60" : ""}`}>{p.title}</p>
                                    {p.company && <span className="text-[11px] text-slate-500">{p.company} · </span>}
                                    <span className="text-[11px] text-slate-400">{p.due_date}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-right">Detected from your recordings</p>
                </div>
            )}

            {/* ── TWO-COLUMN BUTTON GRID ──────────────────────── */}
            <div className="mx-4 mt-4 grid grid-cols-2 gap-3 pb-32">
                {GRID.map(item => (
                    <button
                        key={item.key}
                        onClick={() => item.key === "logout" ? logout() : setSheet(item.key)}
                        className={`flex flex-col items-start gap-2 p-4 rounded-2xl border bg-gradient-to-br ${item.color} shadow-sm hover:shadow-md active:scale-95 transition-all`}
                    >
                        <item.icon className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-bold leading-tight text-left">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* ══════════════════════════ SHEETS ══════════════════════════ */}

            {/* ── Academic Identity ── */}
            <Sheet open={sheet === "identity"} onClose={() => setSheet(null)} title="🎓 Academic Identity">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white">
                        <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center font-black text-sm">KTU</div>
                        <div><p className="text-[10px] font-bold uppercase text-white/60">University</p>
                            <p className="text-sm font-semibold">APJ Abdul Kalam Technological University</p></div>
                    </div>
                    {[ ["Student ID", "studentId", "e.g. TCH22EC001"],
                       ["College", "college", "Institution name"],
                       ["Major", "major", "Branch"],
                    ].map(([label, key, ph]) => (
                        <div key={key}>
                            <label className="text-xs font-bold uppercase tracking-wide text-slate-400 ml-1 mb-1 block">{label}</label>
                            {editing ? (
                                <input className="input-ghost" value={draft[key] || ""} onChange={e => setDraft({ ...draft, [key]: e.target.value })} placeholder={ph} />
                            ) : (
                                <div className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm font-medium">
                                    {profile[key] || <span className="text-slate-400 italic">Not set</span>}
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="grid grid-cols-2 gap-3">
                        {[["Semester", "semester", ["S1","S2","S3","S4","S5","S6","S7","S8"]],
                          ["Scheme", "scheme", ["2019","2024"]]].map(([label, key, opts]) => (
                            <div key={key}>
                                <label className="text-xs font-bold uppercase tracking-wide text-slate-400 ml-1 mb-1 block">{label}</label>
                                <select className="w-full px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm outline-none"
                                    value={editing ? draft[key] : profile[key]}
                                    onChange={e => editing ? setDraft({ ...draft, [key]: e.target.value }) : {}}>
                                    {opts.map(o => <option key={o}>{o}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                    {editing && (
                        <div className="flex gap-2">
                            <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-bold">Cancel</button>
                            <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold">Save</button>
                        </div>
                    )}
                    {/* Subjects */}
                    <div className="pt-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Enrolled Subjects</p>
                        <div className="space-y-2 mb-3">
                            {localSubjects.length === 0 && <p className="text-xs text-slate-400 text-center py-3">No subjects — complete onboarding.</p>}
                            {localSubjects.map(sub => <SubjectRow key={sub.id} sub={sub} onRemove={handleRemoveSubject} />)}
                        </div>
                        <div className="flex gap-2">
                            <input className="input-ghost flex-1 !py-2 text-xs" value={newSubjectName}
                                onChange={e => setNewSubjectName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleAddSubject()}
                                placeholder="Add custom subject name" />
                            <button onClick={handleAddSubject} disabled={addingSubject}
                                className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-60">
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
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-3">Server Status</p>
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
                <p className="text-[10px] text-slate-400 text-center mt-4">Record more sessions to improve your scores.</p>
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
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">{label}</p>
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
                <div className="space-y-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Whisper Sensitivity</p>
                        <div className="grid grid-cols-3 gap-2">
                            {["Low", "Medium", "High"].map(s => (
                                <button key={s} onClick={() => { const u = {...profile, whisperSensitivity: s}; setProfile(u); saveProfile(u); }}
                                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${profile.whisperSensitivity === s ? "bg-slate-900 text-white border-slate-900" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Sylens Mode</p>
                        <p className="text-xs text-slate-500 mb-3">Switch to a dedicated mode for focused study or deep research.</p>
                        {[
                            { label: "🎓 Exam Mode", sub: "Laser-focused, PYQ-ready", route: "/exam-mode", color: "border-red-200 text-red-600 hover:bg-red-50" },
                            { label: "🔬 Research Mode", sub: "Deep-dive, citation-aware", route: "/research-mode", color: "border-blue-200 text-blue-600 hover:bg-blue-50" },
                        ].map(({ label, sub, route, color }) => (
                            <button key={route} onClick={() => { setSheet(null); window.location.hash = route; }}
                                className={`w-full mb-2 flex items-center justify-between px-4 py-3 rounded-xl border bg-white text-left transition-all ${color}`}>
                                <div><p className="text-sm font-bold">{label}</p><p className="text-xs opacity-60">{sub}</p></div>
                                <ChevronRight className="w-4 h-4 opacity-40" />
                            </button>
                        ))}
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">AI Model</p>
                        <p className="text-sm font-semibold text-slate-800">Gemini 2.5 Flash</p>
                        <p className="text-xs text-slate-400">Powers Sylens, task extraction & flashcards</p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Cloud Storage</p>
                        <p className="text-sm font-semibold text-slate-800">Supabase</p>
                        <p className="text-xs text-slate-400">Profiles, subjects, sync across devices</p>
                    </div>
                </div>
            </Sheet>
        </div>
    );
}
