import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { useWakeLock } from "../hooks/useWakeLock";
import {
    ArrowLeft, Mic, Square, Loader2, CheckCircle2,
    Clock, CalendarClock, AlarmClock, X, Play, Bell,
    ChevronRight, Coffee, Sparkles
} from "lucide-react";

const TIMETABLE_KEY = "cognitek_timetable";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const HOUR_LABELS = {
    "09:00": "9:00 AM", "10:00": "10:00 AM", "11:00": "11:00 AM",
    "12:00": "12:00 PM", "13:00": "1:00 PM", "14:00": "2:00 PM",
    "15:00": "3:00 PM", "16:00": "4:00 PM"
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
    const idx = new Date().getDay(); // 0=Sun
    return DAYS[idx === 0 ? 6 : idx - 1]; // map to Mon-Sat
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
    if (secs <= 0) return "Now";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

// ── Waveform bars ──────────────────────────────────────────────────────────────
function WaveformBars({ active }) {
    return (
        <div className="flex items-center gap-1 h-10">
            {Array.from({ length: 7 }).map((_, i) => (
                <div
                    key={i}
                    className={`w-1 rounded-full transition-all ${active ? "bg-white" : "bg-white/30"}`}
                    style={{
                        height: active ? `${20 + Math.sin(i * 1.2) * 16}px` : "8px",
                        animation: active ? `wavebar 0.8s ease-in-out ${i * 0.1}s infinite alternate` : "none",
                    }}
                />
            ))}
            <style>{`
                @keyframes wavebar {
                    from { height: 8px; }
                    to { height: 38px; }
                }
            `}</style>
        </div>
    );
}

// ── Period card ────────────────────────────────────────────────────────────────
function PeriodCard({ hour, slot, onSchedule, scheduled, countdown }) {
    const isBreak = slot?.type === "break";
    const endHour = NEXT_HOUR[hour] || "17:00";
    const timeLabel = `${HOUR_LABELS[hour]} – ${HOUR_LABELS[endHour] || "5:00 PM"}`;

    if (isBreak) {
        return (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200">
                <Coffee className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div className="flex-1">
                    <p className="text-xs font-bold text-amber-700">Break</p>
                    <p className="text-[10px] text-amber-500">{timeLabel}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
            scheduled
                ? "bg-indigo-50 border-indigo-300 shadow-sm"
                : "bg-white border-slate-200"
        }`}>
            <div className={`w-2 h-10 rounded-full flex-shrink-0 ${scheduled ? "bg-indigo-500" : "bg-slate-200"}`} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{slot?.subject || "Free Period"}</p>
                <p className="text-[10px] text-slate-400">{timeLabel}</p>
                {scheduled && countdown !== null && (
                    <p className="text-[10px] font-bold text-indigo-500 mt-0.5 flex items-center gap-1">
                        <AlarmClock className="w-2.5 h-2.5" />
                        Starts in {formatCountdown(countdown)}
                    </p>
                )}
            </div>
            {scheduled ? (
                <button
                    onClick={() => onSchedule(null)}
                    className="p-1.5 rounded-xl bg-indigo-100 text-indigo-600 hover:bg-red-100 hover:text-red-500 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            ) : (
                <button
                    onClick={() => onSchedule(hour)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-indigo-600 active:scale-95 transition-all"
                >
                    <Bell className="w-3 h-3" /> Schedule
                </button>
            )}
        </div>
    );
}

// ── Main Record Page ───────────────────────────────────────────────────────────
export default function Record() {
    const navigate = useNavigate();
    const { user, subjects } = useAuth();
    const { requestWakeLock, releaseWakeLock } = useWakeLock();

    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [status, setStatus] = useState("Ready");
    const [recordingTime, setRecordingTime] = useState(0);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    // Scheduled recording
    const [scheduledHour, setScheduledHour] = useState(null);
    const [countdown, setCountdown] = useState(null);
    const countdownRef = useRef(null);

    const timetable = loadTimetable();
    const todayKey = getTodayKey();
    const todaySlots = HOURS
        .map(h => ({ hour: h, slot: timetable[todayKey]?.[h] || null }))
        .filter(({ slot }) => slot !== null);

    useEffect(() => {
        if (isRecording) requestWakeLock();
        else releaseWakeLock();
    }, [isRecording]);

    // Recording timer
    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
        } else {
            clearInterval(timerRef.current);
            setRecordingTime(0);
        }
        return () => clearInterval(timerRef.current);
    }, [isRecording]);

    // Countdown timer for scheduled recording
    useEffect(() => {
        if (!scheduledHour) {
            clearInterval(countdownRef.current);
            setCountdown(null);
            return;
        }
        const tick = () => {
            const secs = getSecondsUntil(scheduledHour);
            if (secs === null) {
                setCountdown(0);
                clearInterval(countdownRef.current);
                startRecording();
            } else {
                setCountdown(secs);
            }
        };
        tick();
        countdownRef.current = setInterval(tick, 1000);
        return () => clearInterval(countdownRef.current);
    }, [scheduledHour]);

    const startRecording = async () => {
        if (isRecording || isProcessing) return;
        if (window.AudioContext || window.webkitAudioContext) {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === "suspended") await ctx.resume();
        }
        setStatus("Listening…");
        setIsRecording(true);
        audioChunksRef.current = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            mediaRecorderRef.current.onstop = handleAudioUpload;
            mediaRecorderRef.current.start();
        } catch (err) {
            setStatus(`Mic Error: ${err.name}`);
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (!mediaRecorderRef.current || !isRecording) return;
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
        setIsRecording(false);
        setIsProcessing(true);
        setStatus("Processing…");
        setScheduledHour(null);
    };

    const handleAudioUpload = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "recording.webm");
        if (user?.id) formData.append("user_id", user.id);
        if (subjects?.length) {
            formData.append("subjects", JSON.stringify(subjects.map(s => ({ code: s.course_code, name: s.course_name }))));
        }
        try {
            await api.post("/api/process-audio", formData, { headers: { "Content-Type": "multipart/form-data" } });
            setStatus("Synced!");
            setIsSuccess(true);
            setIsProcessing(false);
            setTimeout(() => { setIsSuccess(false); setStatus("Ready"); }, 3500);
        } catch {
            setStatus("Upload Failed");
            setIsProcessing(false);
        }
    };

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    return (
        <div className="min-h-screen bg-[#0f0f16] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-12 pb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-white">Record Session</h1>
                    <p className="text-xs text-white/40">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col px-4 pb-10 gap-6">

                {/* ── Main Record Button ─────────────────────────────────────── */}
                <div className="flex flex-col items-center justify-center pt-4 pb-2">
                    {/* Outer pulse ring */}
                    <div className="relative flex items-center justify-center">
                        {isRecording && (
                            <>
                                <div className="absolute w-44 h-44 rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: "1.5s" }} />
                                <div className="absolute w-36 h-36 rounded-full bg-red-500/15 animate-ping" style={{ animationDuration: "1.5s", animationDelay: "0.3s" }} />
                            </>
                        )}
                        {/* Button */}
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isProcessing || isSuccess}
                            className={`relative w-32 h-32 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                                isSuccess
                                    ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/40"
                                    : isProcessing
                                        ? "bg-gradient-to-br from-slate-700 to-slate-800 shadow-slate-900/50"
                                        : isRecording
                                            ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/50"
                                            : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/40"
                            }`}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-10 h-10 text-white animate-spin" />
                            ) : isSuccess ? (
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            ) : isRecording ? (
                                <>
                                    <WaveformBars active={true} />
                                    <Square className="w-5 h-5 text-white fill-white" />
                                </>
                            ) : (
                                <Mic className="w-10 h-10 text-white" />
                            )}
                        </button>
                    </div>

                    {/* Status */}
                    <div className="mt-5 text-center">
                        <p className={`text-2xl font-black transition-all ${
                            isRecording ? "text-red-400" : isSuccess ? "text-emerald-400" : "text-white"
                        }`}>
                            {isSuccess ? "Session Synced!" : isRecording ? formatTime(recordingTime) : status}
                        </p>
                        <p className="text-xs text-white/30 mt-1">
                            {isRecording ? "Tap to stop & process" : isProcessing ? "Analyzing with Whisper + Gemini…" : isSuccess ? "Tasks & flashcards saved" : "Tap to start manual recording"}
                        </p>
                    </div>
                </div>

                {/* ── Scheduled Recording Section ──────────────────────────── */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            <CalendarClock className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <p className="text-sm font-black text-white">Schedule Recording</p>
                        <p className="ml-auto text-[10px] text-white/30 font-medium">{todayKey}</p>
                    </div>

                    {todaySlots.length === 0 ? (
                        <div className="text-center py-6">
                            <CalendarClock className="w-8 h-8 text-white/20 mx-auto mb-2" />
                            <p className="text-sm text-white/40 font-medium">No classes today</p>
                            <p className="text-xs text-white/25 mt-1">Add your timetable in Profile → Class Timetable</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {todaySlots.map(({ hour, slot }) => (
                                <PeriodCard
                                    key={hour}
                                    hour={hour}
                                    slot={slot}
                                    scheduled={scheduledHour === hour}
                                    countdown={scheduledHour === hour ? countdown : null}
                                    onSchedule={(h) => setScheduledHour(h)}
                                />
                            ))}
                        </div>
                    )}

                    {scheduledHour && countdown !== null && (
                        <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30">
                            <AlarmClock className="w-4 h-4 text-indigo-400 animate-pulse flex-shrink-0" />
                            <p className="text-sm font-bold text-indigo-300">
                                Auto-recording in <span className="text-white">{formatCountdown(countdown)}</span>
                            </p>
                            <button onClick={() => setScheduledHour(null)} className="ml-auto p-1 text-indigo-400 hover:text-red-400 transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Quick tip ──────────────────────────────────────────────── */}
                <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
                    <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-white/40 leading-relaxed">
                        Speak naturally. Sylens will auto-extract tasks, flashcards, and placement info from your session.
                    </p>
                </div>
            </div>
        </div>
    );
}
