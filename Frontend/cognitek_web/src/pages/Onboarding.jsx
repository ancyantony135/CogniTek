import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import ktuData from "../data/ktu_courses.json";
import {
    User, BookOpen, Plus, X,
    ChevronRight, ChevronLeft, Check, Loader2
} from "lucide-react";
import Logo from "../components/Logo";

const BRANCHES = Object.entries(ktuData.meta.branches).map(([code, name]) => ({ code, name }));
const SEMESTERS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];
const SCHEMES = ["2019", "2024"];

// Derive courses for branch + semester + scheme
function getCourses(branch, semester, scheme) {
    if (["S1", "S2"].includes(semester)) {
        return { core: ktuData.common[semester]?.core ?? [], electives: [] };
    }
    const branchData = ktuData.curriculum[branch];
    if (!branchData) return { core: [], electives: [] };
    // Try exact scheme, fallback to any available scheme
    const schemeData = branchData[scheme] ?? branchData[Object.keys(branchData)[0]];
    return schemeData?.[semester] ?? { core: [], electives: [] };
}

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepDot({ step, current, label }) {
    const done = step < current;
    const active = step === current;
    return (
        <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${done ? "bg-emerald-500 text-white" :
                active ? "bg-slate-900 text-white scale-110" :
                    "bg-slate-100 text-slate-400"
                }`}>
                {done ? <Check className="w-4 h-4" /> : step}
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${active ? "text-slate-900" : "text-slate-400"}`}>
                {label}
            </span>
        </div>
    );
}

// ─── Field component ─────────────────────────────────────────────────────────
function Field({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

const inputClass = "w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm font-medium outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 transition-all placeholder:text-slate-300";
const selectClass = `${inputClass} cursor-pointer`;

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Onboarding() {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Step 1
    const [fullName, setFullName] = useState(user?.user_metadata?.display_name ?? "");
    const [college, setCollege] = useState("Toc H Institute of Science and Technology");
    const [studentId, setStudentId] = useState("");

    // Step 2
    const [branch, setBranch] = useState("CSE");
    const [semester, setSemester] = useState("S5");
    const [scheme, setScheme] = useState("2019");

    // Step 3 — subjects
    const [selectedElectives, setSelectedElectives] = useState([]);
    const [deselectedCore, setDeselectedCore] = useState(new Set()); // codes unchecked by user
    const [customInput, setCustomInput] = useState("");
    const [customSubjects, setCustomSubjects] = useState([]);

    // Reset deselectedCore when branch/semester/scheme changes
    const { core, electives } = getCourses(branch, semester, scheme);

    const toggleCore = (code) => {
        setDeselectedCore(prev => {
            const next = new Set(prev);
            next.has(code) ? next.delete(code) : next.add(code);
            return next;
        });
    };

    const toggleElective = (code) => {
        setSelectedElectives(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    const addCustom = () => {
        const val = customInput.trim();
        if (!val) return;
        setCustomSubjects(prev => [...prev, { name: val, code: "" }]);
        setCustomInput("");
    };

    const removeCustom = (i) => setCustomSubjects(prev => prev.filter((_, idx) => idx !== i));
    const updateCustomCode = (i, code) =>
        setCustomSubjects(prev => prev.map((s, idx) => idx === i ? { ...s, code } : s));

    // ── Validate step 1 ────────────────────────────────────────────────────────
    const canAdvanceStep1 = fullName.trim().length >= 2;
    const canAdvanceStep2 = branch && semester && scheme;

    // ── Final Save ─────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            // 1. Upsert profile
            const { error: profErr } = await supabase.from("profiles").upsert({
                id: user.id,
                full_name: fullName.trim(),
                college: college.trim(),
                student_id: studentId.trim(),
                branch,
                semester: parseInt(semester.replace("S", "")),
                scheme,
            });
            if (profErr) throw profErr;

            // 2. Insert subjects (delete old first for idempotency)
            await supabase.from("user_subjects").delete().eq("user_id", user.id);

            const rows = [
                ...core
                    .filter(c => !deselectedCore.has(c.code))
                    .map(c => ({
                        user_id: user.id,
                        course_code: c.code,
                        course_name: c.name,
                        credits: c.credits,
                        is_elective: false,
                        is_custom: false,
                    })),
                ...electives
                    .filter(e => selectedElectives.includes(e.code))
                    .map(e => ({
                        user_id: user.id,
                        course_code: e.code,
                        course_name: e.name,
                        credits: e.credits,
                        is_elective: true,
                        is_custom: false,
                    })),
                ...customSubjects.map((sub, i) => ({
                    user_id: user.id,
                    course_code: sub.code?.trim() || `CUSTOM${i + 1}`,
                    course_name: sub.name,
                    credits: null,
                    is_elective: false,
                    is_custom: true,
                })),
            ];

            if (rows.length > 0) {
                const { error: subErr } = await supabase.from("user_subjects").insert(rows);
                if (subErr) throw subErr;
            }

            // 3. Refresh context + navigate
            await refreshProfile();
            navigate("/dashboard", { replace: true });
        } catch (err) {
            console.error("Onboarding save error:", err);
            const msg = err.message ?? "";
            if (msg.includes("profiles") || msg.includes("user_subjects") || msg.includes("does not exist")) {
                setError("⚠️ Database tables not set up yet. Ask your admin to run the setup SQL in Supabase, then try again.");
            } else {
                setError(msg || "Something went wrong. Please try again.");
            }
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-start justify-center px-4 py-10">
            <div className="w-full max-w-lg">

                {/* Logo + Title */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#0a0a0a] flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <Logo className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Set Up Your Profile</h1>
                    <p className="text-sm text-slate-500 mt-1">Takes about 60 seconds. Helps Cognitek personalise everything.</p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <StepDot step={1} current={step} label="Personal" />
                    <div className={`flex-1 max-w-[60px] h-0.5 rounded-full transition-colors ${step > 1 ? "bg-emerald-400" : "bg-slate-200"}`} />
                    <StepDot step={2} current={step} label="Academic" />
                    <div className={`flex-1 max-w-[60px] h-0.5 rounded-full transition-colors ${step > 2 ? "bg-emerald-400" : "bg-slate-200"}`} />
                    <StepDot step={3} current={step} label="Subjects" />
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 space-y-5">

                    {/* ── STEP 1: Personal ────────────────────────────────────────── */}
                    {step === 1 && (
                        <>
                            <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-slate-500" />
                                <h2 className="font-bold text-slate-800">Personal Details</h2>
                            </div>
                            <Field label="Full Name *">
                                <input className={inputClass} value={fullName} onChange={e => setFullName(e.target.value)}
                                    placeholder="e.g. Hansel Sabu" autoFocus />
                            </Field>
                            <Field label="College / Institution">
                                <input className={inputClass} value={college} onChange={e => setCollege(e.target.value)}
                                    placeholder="Your institution name" />
                            </Field>
                            <Field label="KTU Student ID (optional)">
                                <input className={inputClass} value={studentId} onChange={e => setStudentId(e.target.value)}
                                    placeholder="e.g. TCH22CS001" />
                            </Field>
                        </>
                    )}

                    {/* ── STEP 2: Academic ────────────────────────────────────────── */}
                    {step === 2 && (
                        <>
                            <div className="flex items-center gap-2 mb-1">
                                <BookOpen className="w-4 h-4 text-slate-500" />
                                <h2 className="font-bold text-slate-800">Academic Details</h2>
                            </div>
                            <Field label="Branch *">
                                <select className={selectClass} value={branch} onChange={e => setBranch(e.target.value)}>
                                    {BRANCHES.map(b => (
                                        <option key={b.code} value={b.code}>{b.code} — {b.name}</option>
                                    ))}
                                </select>
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Semester *">
                                    <select className={selectClass} value={semester} onChange={e => setSemester(e.target.value)}>
                                        {SEMESTERS.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </Field>
                                <Field label="KTU Scheme *">
                                    <select className={selectClass} value={scheme} onChange={e => setScheme(e.target.value)}>
                                        {SCHEMES.map(s => <option key={s}>{s} Scheme</option>)}
                                    </select>
                                </Field>
                            </div>
                            <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3">
                                Based on your selection, we'll pre-fill your subject list. You can customise it in the next step.
                            </p>
                        </>
                    )}

                    {/* ── STEP 3: Subjects ─────────────────────────────────────────── */}
                    {step === 3 && (
                        <>
                            <div className="flex items-center gap-2 mb-1">
                                <BookOpen className="w-4 h-4 text-slate-500" />
                                <h2 className="font-bold text-slate-800">Your Subjects — {branch} · {semester}</h2>
                            </div>

                            {/* Core subjects (locked) + custom subjects as rows */}
                            {(core.length > 0 || customSubjects.length > 0) && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Core (mandatory)</p>
                                        <p className="text-[10px] text-slate-300">Tap to remove if not in your syllabus</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        {core.map(c => {
                                            const active = !deselectedCore.has(c.code);
                                            return (
                                                <button
                                                    key={c.code}
                                                    type="button"
                                                    onClick={() => toggleCore(c.code)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${active
                                                        ? "bg-slate-50 border-slate-100"
                                                        : "bg-white border-slate-100 opacity-40"
                                                        }`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${active ? "bg-emerald-500" : "bg-slate-200 border border-slate-300"
                                                        }`}>
                                                        {active && <Check className="w-2.5 h-2.5 text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-slate-700 truncate">{c.code} — {c.name}</p>
                                                    </div>
                                                    {c.credits && (
                                                        <span className="text-[10px] font-bold text-slate-400 shrink-0">{c.credits}cr</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                        {/* Custom subjects appear as core-style rows */}
                                        {customSubjects.map((sub, i) => (
                                            <div key={i} className="rounded-xl border border-indigo-100 bg-indigo-50 overflow-hidden">
                                                <div className="flex items-center gap-3 px-3 py-2.5">
                                                    <div className="w-4 h-4 rounded-full bg-indigo-400 flex items-center justify-center flex-shrink-0">
                                                        <Check className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-indigo-800 truncate">{sub.name}</p>
                                                        {sub.code ? (
                                                            <p className="text-[10px] text-indigo-500">{sub.code}</p>
                                                        ) : (
                                                            <p className="text-[10px] text-indigo-400 italic">Code not set — tap to add</p>
                                                        )}
                                                    </div>
                                                    <button onClick={() => removeCustom(i)}
                                                        className="p-1 rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-red-500 transition-colors">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                {/* Inline code input */}
                                                {!sub.code && (
                                                    <div className="px-3 pb-2.5">
                                                        <input
                                                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs text-indigo-800 placeholder:text-indigo-300 outline-none focus:border-indigo-400"
                                                            placeholder="Course code (optional, e.g. HSS301)"
                                                            value={sub.code}
                                                            onChange={e => updateCustomCode(i, e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Electives */}
                            {electives.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Electives (pick yours)</p>
                                    <div className="space-y-1.5">
                                        {electives.map(e => {
                                            const selected = selectedElectives.includes(e.code);
                                            return (
                                                <button key={e.code} onClick={() => toggleElective(e.code)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${selected ? "bg-slate-900 border-slate-900" : "bg-white border-slate-200 hover:border-slate-400"
                                                        }`}>
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? "bg-white border-white" : "border-slate-300"
                                                        }`}>
                                                        {selected && <Check className="w-2.5 h-2.5 text-slate-900" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-semibold truncate ${selected ? "text-white" : "text-slate-700"}`}>
                                                            {e.code} — {e.name}
                                                        </p>
                                                    </div>
                                                    {e.credits && (
                                                        <span className={`text-[10px] font-bold shrink-0 ${selected ? "text-white/60" : "text-slate-400"}`}>
                                                            {e.credits}cr
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Add custom subject */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Add Custom / Honours / Minor</p>
                                <div className="flex gap-2">
                                    <input className={`${inputClass} flex-1 !py-2.5 text-xs`}
                                        value={customInput} onChange={e => setCustomInput(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && addCustom()}
                                        placeholder="Full course name (e.g. Management Studies)" />
                                    <button onClick={addCustom}
                                        className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-700 transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Course code can be added after setup if you don't know it now.</p>
                            </div>

                            {core.length === 0 && electives.length === 0 && (
                                <p className="text-sm text-center text-slate-400 py-4">
                                    No preset courses found for {branch} · {semester} · {scheme} Scheme.<br />
                                    <span className="text-xs">Add your courses manually using the field above.</span>
                                </p>
                            )}

                            {error && (
                                <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
                            )}
                        </>
                    )}

                    {/* ── Navigation ─────────────────────────────────────────────── */}
                    <div className="flex gap-3 pt-2">
                        {step > 1 && (
                            <button onClick={() => setStep(s => s - 1)}
                                className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                <ChevronLeft className="w-4 h-4" /> Back
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                onClick={() => setStep(s => s + 1)}
                                disabled={step === 1 ? !canAdvanceStep1 : !canAdvanceStep2}
                                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60">
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> Complete Setup</>}
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 mt-4">
                    You can update your subjects anytime from the Profile page.
                </p>
            </div>
        </div>
    );
}
