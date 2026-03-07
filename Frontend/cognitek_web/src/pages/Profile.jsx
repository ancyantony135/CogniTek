import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
    User as UserIcon,
    LogOut,
    Pencil,
    Check,
    X,
    Database,
    Activity,
    BookOpen,
    Zap,
    Target,
    Brain,
    Code2,
    Layers,
    BadgeCheck,
    ChevronDown,
    ChevronUp,
    Bluetooth,
    Watch,
    Plus,
    SlidersHorizontal,
    FlaskConical,
    Briefcase,
    Wifi,
} from "lucide-react";

// ─── Static skill definitions — icons CANNOT be stored in JSON ───────────────
const SKILL_DEFS = [
    { key: "python", label: "Python Programming", icon: Code2, color: "#3b82f6" },
    { key: "aiml", label: "AI / ML", icon: Brain, color: "#8b5cf6" },
    { key: "fullstack", label: "Full-Stack Dev", icon: Layers, color: "#10b981" },
];

// Default skill values stored per key — safe to serialize
const DEFAULT_SKILL_VALUES = { python: 82, aiml: 75, fullstack: 68 };



// ─── helpers ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "cognitek_profile";

function loadProfile() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveProfile(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── sub-components ───────────────────────────────────────────────────────────

/** Animated skill bar */
function SkillBar({ label, icon: Icon, value, color }) {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setWidth(value), 100);
        return () => clearTimeout(t);
    }, [value]);

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                </span>
                <span className="text-[var(--text-secondary)] font-semibold">{value}%</span>
            </div>
            <div className="h-2 rounded-full bg-black/8 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${width}%`, background: color }}
                />
            </div>
        </div>
    );
}

/** Collapsible section wrapper */
function Section({ title, icon: Icon, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="tech-glass-card rounded-2xl overflow-hidden mb-4">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-black/3 transition-colors"
            >
                <span className="flex items-center gap-2.5 font-bold text-[var(--text-primary)]">
                    <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
                    {title}
                </span>
                {open ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                )}
            </button>
            {open && <div className="px-5 pb-5 border-t border-[var(--glass-border)]">{children}</div>}
        </div>
    );
}

/** Toggle switch */
function Toggle({ value, onChange, label }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
            <button
                onClick={() => onChange(!value)}
                className={`w-11 h-6 rounded-full transition-colors duration-300 relative ${value ? "bg-[var(--primary)]" : "bg-black/15"
                    }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${value ? "translate-x-5" : "translate-x-0"
                        }`}
                />
            </button>
        </div>
    );
}

/** Server health dot */
function HealthDot({ online }) {
    return (
        <span className="relative flex h-2.5 w-2.5">
            {online && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${online === null ? "bg-gray-400" : online ? "bg-emerald-500" : "bg-red-500"
                    }`}
            />
        </span>
    );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function Profile() {
    const { user, logout } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL;

    // ── load persisted profile ──────────────────────────────────────────────────
    const [profile, setProfile] = useState(() => ({
        name: "Hansel",
        major: "Electrical and Computer Engineering",
        college: "Toc H Institute of Science and Technology",
        studentId: "",
        semester: "S6",
        scheme: "2019",
        lectures: 0,
        flashcards: 0,
        taskCompletion: 90,
        courses: ["CST 301", "EST 204", "CST 305"],
        skillValues: DEFAULT_SKILL_VALUES,   // ← plain numbers, safe to serialize
        placements: [
            { id: 1, label: "Infosys Higher Package Drive", done: false },
            { id: 2, label: "Kaynes Technology Interview", done: false },
        ],
        ngrokEnabled: true,
        supabaseSync: true,
        whisperSensitivity: "Medium",
        geminiMode: "General Note Mode",
        hardwareSync: false,
        ...loadProfile(),
    }));


    // ── server health ──────────────────────────────────────────────────────────
    const [serverOnline, setServerOnline] = useState(null);
    useEffect(() => {
        const check = async () => {
            try {
                await axios.get(`${API_URL}/`, { timeout: 5000 });
                setServerOnline(true);
            } catch {
                setServerOnline(false);
            }
        };
        check();
        const iv = setInterval(check, 30000);
        return () => clearInterval(iv);
    }, [API_URL]);

    // ── edit mode ──────────────────────────────────────────────────────────────
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({});

    const startEdit = () => {
        setDraft({
            name: profile.name,
            major: profile.major,
            college: profile.college,
            studentId: profile.studentId,
            semester: profile.semester,
            scheme: profile.scheme,
        });
        setEditing(true);
    };

    const cancelEdit = () => setEditing(false);

    const saveEdit = () => {
        const updated = { ...profile, ...draft };
        setProfile(updated);
        saveProfile(updated);
        setEditing(false);
    };

    // ── generic profile field updater ──────────────────────────────────────────
    const update = (key, value) => {
        const updated = { ...profile, [key]: value };
        setProfile(updated);
        saveProfile(updated);
    };



    // ── skill value updater ────────────────────────────────────────────────
    const updateSkill = (key, val) => {
        const updated = {
            ...profile,
            skillValues: { ...(profile.skillValues || DEFAULT_SKILL_VALUES), [key]: Math.min(100, Math.max(0, Number(val))) },
        };
        setProfile(updated);
        saveProfile(updated);
    };

    // ── placement toggle ───────────────────────────────────────────────────────
    const togglePlacement = (id) => {
        const placements = profile.placements.map((p) =>
            p.id === id ? { ...p, done: !p.done } : p
        );
        update("placements", placements);
    };

    // ── course tag helpers ─────────────────────────────────────────────────────
    const [newCourse, setNewCourse] = useState("");
    const addCourse = () => {
        const code = newCourse.trim().toUpperCase();
        if (!code || profile.courses.includes(code)) return;
        update("courses", [...profile.courses, code]);
        setNewCourse("");
    };
    const removeCourse = (c) => update("courses", profile.courses.filter((x) => x !== c));

    // ── avatar initials ────────────────────────────────────────────────────────
    const initials = (profile.name || "S")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const lastSync = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="pt-6 px-4 pb-28">
            {/* ── PAGE HEADER ────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Academic Dashboard</h1>
                    <p className="text-xs text-[var(--text-secondary)]">Your Cognitek identity &amp; lab</p>
                </div>
                {!editing ? (
                    <button
                        onClick={startEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/6 border border-[var(--glass-border)] text-sm font-medium text-[var(--text-primary)] hover:bg-black/10 transition-colors"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={cancelEdit}
                            className="p-1.5 rounded-xl bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            onClick={saveEdit}
                            className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* ── SECTION 1: HERO IDENTITY ────────────────────────────────────────── */}
            <div className="tech-glass-card rounded-2xl p-5 mb-4 relative overflow-hidden">
                {/* decorative gradient blob */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-slate-200 to-slate-100 rounded-full opacity-60 blur-2xl pointer-events-none" />

                <div className="flex items-center gap-4 mb-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2c2c2c] to-[#111] flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        {editing ? (
                            <input
                                className="input-ghost mb-1 text-base font-bold"
                                value={draft.name}
                                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                placeholder="Your name"
                            />
                        ) : (
                            <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">{profile.name}</h2>
                        )}
                        {editing ? (
                            <input
                                className="input-ghost text-xs"
                                value={draft.major}
                                onChange={(e) => setDraft({ ...draft, major: e.target.value })}
                                placeholder="Major"
                            />
                        ) : (
                            <p className="text-xs font-medium text-[var(--text-secondary)] truncate">{profile.major}</p>
                        )}
                    </div>
                </div>

                {/* College */}
                <div className="flex items-start gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-[var(--text-secondary)] mt-0.5 flex-shrink-0" />
                    {editing ? (
                        <input
                            className="input-ghost text-sm flex-1"
                            value={draft.college}
                            onChange={(e) => setDraft({ ...draft, college: e.target.value })}
                            placeholder="Institution"
                        />
                    ) : (
                        <p className="text-sm text-[var(--text-primary)] font-medium">{profile.college}</p>
                    )}
                </div>

                {/* Email (read-only from auth) */}
                <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-black/4 border border-[var(--glass-border)]">
                    <UserIcon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    <span className="text-xs text-[var(--text-secondary)] truncate">{user?.email || "—"}</span>
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        Verified
                    </span>
                </div>
            </div>

            {/* ── SECTION 2: ACADEMIC IDs ─────────────────────────────────────────── */}
            <Section title="Academic Identity" icon={BadgeCheck}>
                <div className="space-y-4 pt-4">
                    {/* University badge */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white">
                        <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center font-black text-sm tracking-tight">
                            KTU
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">University</p>
                            <p className="text-sm font-semibold leading-tight">APJ Abdul Kalam Technological University</p>
                        </div>
                    </div>

                    {/* Student ID */}
                    <div>
                        <label className="text-xs font-semibold text-[var(--text-secondary)] ml-1 mb-1 block uppercase tracking-wide">
                            KTU Student ID
                        </label>
                        {editing ? (
                            <input
                                className="input-ghost"
                                value={draft.studentId}
                                onChange={(e) => setDraft({ ...draft, studentId: e.target.value })}
                                placeholder="e.g. TCH22EC001"
                            />
                        ) : (
                            <div className="px-4 py-2.5 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] text-[var(--text-primary)] font-mono text-sm">
                                {profile.studentId || (
                                    <span className="text-[var(--text-secondary)] italic">Not set — tap Edit</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Semester + Scheme */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-secondary)] ml-1 mb-1 block uppercase tracking-wide">
                                Semester
                            </label>
                            <select
                                className="w-full px-3 py-2.5 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--primary)] transition-colors"
                                value={editing ? draft.semester : profile.semester}
                                onChange={(e) =>
                                    editing
                                        ? setDraft({ ...draft, semester: e.target.value })
                                        : update("semester", e.target.value)
                                }
                            >
                                {["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"].map((s) => (
                                    <option key={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-secondary)] ml-1 mb-1 block uppercase tracking-wide">
                                KTU Scheme
                            </label>
                            <select
                                className="w-full px-3 py-2.5 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--primary)] transition-colors"
                                value={editing ? draft.scheme : profile.scheme}
                                onChange={(e) =>
                                    editing
                                        ? setDraft({ ...draft, scheme: e.target.value })
                                        : update("scheme", e.target.value)
                                }
                            >
                                {["2019", "2024"].map((s) => (
                                    <option key={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Course tags */}
                    <div>
                        <label className="text-xs font-semibold text-[var(--text-secondary)] ml-1 mb-2 block uppercase tracking-wide">
                            Active Courses
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {profile.courses.map((c) => (
                                <span
                                    key={c}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/8 text-xs font-semibold text-[var(--text-primary)] border border-[var(--glass-border)]"
                                >
                                    {c}
                                    <button
                                        onClick={() => removeCourse(c)}
                                        className="text-[var(--text-secondary)] hover:text-red-500 ml-0.5 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                className="input-ghost flex-1 !py-2 text-xs"
                                value={newCourse}
                                onChange={(e) => setNewCourse(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addCourse()}
                                placeholder="Add code (e.g. CST 401)"
                            />
                            <button
                                onClick={addCourse}
                                className="px-3 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-black/80 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── SECTION 3: COGNITEK LAB ─────────────────────────────────────────── */}
            <Section title="Cognitek Lab" icon={FlaskConical}>
                <div className="space-y-3 pt-4">
                    {/* Server status card */}
                    <div className="p-4 rounded-xl border border-[var(--glass-border)] bg-black/3">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] mb-3">
                            Project Cognitek — Server Status
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                                    <Wifi className="w-4 h-4 text-[var(--text-secondary)]" />
                                    ngrok Tunnel
                                </span>
                                <div className="flex items-center gap-2">
                                    <HealthDot online={serverOnline} />
                                    <span
                                        className={`text-xs font-semibold ${serverOnline === null
                                            ? "text-gray-500"
                                            : serverOnline
                                                ? "text-emerald-600"
                                                : "text-red-500"
                                            }`}
                                    >
                                        {serverOnline === null ? "Checking…" : serverOnline ? "Active" : "Offline"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                                    <Database className="w-4 h-4 text-[var(--text-secondary)]" />
                                    Supabase Cloud
                                </span>
                                <div className="flex items-center gap-2">
                                    <HealthDot online={serverOnline} />
                                    <span
                                        className={`text-xs font-semibold ${serverOnline === null
                                            ? "text-gray-500"
                                            : serverOnline
                                                ? "text-emerald-600"
                                                : "text-red-500"
                                            }`}
                                    >
                                        {serverOnline === null ? "Checking…" : serverOnline ? "Synced" : "Disconnected"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hardware Sync */}
                    <div className="p-4 rounded-xl border border-[var(--glass-border)] bg-black/3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                                <Watch className="w-4 h-4 text-[var(--text-secondary)]" />
                                Wearable Band Sync
                            </span>
                            <button
                                onClick={() => update("hardwareSync", !profile.hardwareSync)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${profile.hardwareSync
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                                    : "bg-black/6 border-[var(--glass-border)] text-[var(--text-secondary)]"
                                    }`}
                            >
                                <Bluetooth className="w-3 h-3" />
                                {profile.hardwareSync ? "Paired" : "Not Paired"}
                            </button>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] pl-6">
                            {profile.hardwareSync
                                ? `Last sync: today at ${lastSync}`
                                : "Tap to simulate pairing with the Cognitek band"}
                        </p>
                    </div>
                </div>
            </Section>

            {/* ── SECTION 4: SKILL MATRIX + CAREER PREP ───────────────────────────── */}
            <Section title="Skill Matrix" icon={Activity}>
                <div className="pt-4 space-y-5">
                    {/* Skill bars */}
                    <div className="space-y-4">
                        {SKILL_DEFS.map((def) => {
                            const val = (profile.skillValues || DEFAULT_SKILL_VALUES)[def.key] ?? 50;
                            return (
                                <div key={def.key}>
                                    <SkillBar label={def.label} icon={def.icon} value={val} color={def.color} />
                                    <div className="mt-1 flex items-center gap-2">
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={val}
                                            onChange={(e) => updateSkill(def.key, e.target.value)}
                                            className="flex-1 accent-black h-1"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Career Prep */}
                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] mb-3 flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3" /> Placement Milestones
                        </p>
                        <div className="space-y-2">
                            {profile.placements.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => togglePlacement(p.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${p.done
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                        : "bg-black/3 border-[var(--glass-border)] text-[var(--text-primary)]"
                                        }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${p.done ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                                            }`}
                                    >
                                        {p.done && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className={`text-sm font-medium ${p.done ? "line-through opacity-70" : ""}`}>
                                        {p.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── SECTION 5: KNOWLEDGE BANK ───────────────────────────────────────── */}
            <Section title="Knowledge Bank" icon={BookOpen}>
                <div className="pt-4 space-y-4">
                    {/* Stat counters */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            {
                                label: "Lectures",
                                key: "lectures",
                                icon: BookOpen,
                                suffix: "",
                                color: "from-blue-50 to-indigo-50 border-blue-200 text-blue-600",
                            },
                            {
                                label: "Flashcards",
                                key: "flashcards",
                                icon: Zap,
                                suffix: "",
                                color: "from-purple-50 to-violet-50 border-purple-200 text-purple-600",
                            },
                        ].map(({ label, key, icon: Icon, color }) => (
                            <div
                                key={key}
                                className={`p-4 rounded-xl border bg-gradient-to-br ${color}`}
                            >
                                <Icon className="w-4 h-4 mb-2 opacity-80" />
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">{label}</p>
                                <div className="flex items-end gap-0.5">
                                    <input
                                        type="number"
                                        min={0}
                                        value={profile[key] || 0}
                                        onChange={(e) => update(key, Number(e.target.value))}
                                        className="w-16 text-2xl font-black bg-transparent border-none outline-none focus:underline"
                                    />
                                    <span className="text-xs mb-1 opacity-60">processed</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Task completion */}
                    <div className="p-4 rounded-xl border border-[var(--glass-border)] bg-black/3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                <Target className="w-4 h-4 text-[var(--text-secondary)]" />
                                Task Completion
                            </span>
                            <span className="text-lg font-black text-[var(--text-primary)]">
                                {profile.taskCompletion}%
                            </span>
                        </div>
                        <div className="h-3 rounded-full bg-black/8 overflow-hidden mb-2">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-slate-800 to-slate-600 transition-all duration-700"
                                style={{ width: `${profile.taskCompletion}%` }}
                            />
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={profile.taskCompletion}
                            onChange={(e) => update("taskCompletion", Number(e.target.value))}
                            className="w-full accent-black h-1"
                        />
                        <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                            Project Management efficiency score
                        </p>
                    </div>
                </div>
            </Section>

            {/* ── SECTION 6: AI & CLOUD SETTINGS ──────────────────────────────────── */}
            <Section title="AI & Cloud Settings" icon={SlidersHorizontal} defaultOpen={false}>
                <div className="pt-4 space-y-1">
                    <Toggle
                        label="ngrok Tunnel"
                        value={profile.ngrokEnabled}
                        onChange={(v) => update("ngrokEnabled", v)}
                    />
                    <Toggle
                        label="Supabase Cloud Sync"
                        value={profile.supabaseSync}
                        onChange={(v) => update("supabaseSync", v)}
                    />

                    <div className="pt-3">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">
                            Whisper Sensitivity
                        </label>
                        <div className="flex gap-2">
                            {["Low", "Medium", "High"].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => update("whisperSensitivity", level)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${profile.whisperSensitivity === level
                                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                                        : "bg-black/5 text-[var(--text-secondary)] border-[var(--glass-border)] hover:bg-black/10"
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-3">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">
                            Gemini Mode
                        </label>
                        <div className="space-y-2">
                            {["Exam Mode", "General Note Mode", "Research Mode"].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => update("geminiMode", mode)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all text-sm font-medium ${profile.geminiMode === mode
                                        ? "bg-black text-white border-black"
                                        : "bg-black/3 text-[var(--text-primary)] border-[var(--glass-border)] hover:bg-black/8"
                                        }`}
                                >
                                    <Brain className="w-4 h-4 flex-shrink-0" />
                                    {mode}
                                    {profile.geminiMode === mode && (
                                        <Check className="w-3.5 h-3.5 ml-auto" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── SIGN OUT ─────────────────────────────────────────────────────────── */}
            <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border border-red-200 bg-red-50 text-red-500 font-semibold text-sm hover:bg-red-100 transition-colors"
            >
                <LogOut className="w-4 h-4" />
                Sign Out
            </button>
        </div>
    );
}
