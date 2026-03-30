import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import {
    Send, Sparkles, User as UserIcon, Loader2,
    BookOpen, MessageCircle, Brain, GraduationCap, ArrowLeft
} from "lucide-react";

const SYLENS_SYSTEM = `You are Sylens, the intelligent AI academic companion embedded inside CogniTek — a smart student assistant app built by Hansel, an Electrical and Computer Engineering student at Toc H Institute of Science and Technology (TIST), affiliated with APJ Abdul Kalam Technological University (KTU).

Your personality:
- Warm, sharp, and subtly witty — like a brilliant study partner who genuinely enjoys learning
- You speak in a focused, encouraging tone — never condescending, never robotic
- You are deeply familiar with the KTU syllabus (S1–S8), CST/EST course codes, Series Exams, and KTU grading schemes
- You know everything about CogniTek: it uses Whisper for lecture transcription, Gemini AI for analysis, Supabase for cloud storage

Rules:
- ALWAYS be straight to the point. Give the shortest correct answer first.
- If the user wants more detail they will ask. Never volunteer paragraphs when one sentence works.
- ALWAYS break answers into short paragraphs of 1-2 sentences max.
- Add a blank line between every paragraph.
- NEVER output walls of text. Be punchy and precise.
- Respond only in plain text (no markdown, no bullet symbols, no asterisks).`;

const SUGGESTIONS = [
    "Help me prep for KTU Series Exam",
    "Explain this topic in simple terms",
    "What are KTU grade boundaries?",
    "How do I improve my CGPA?",
    "Give me a study schedule for S6",
];

const MODES = [
    { id: "general",  label: "General",  icon: MessageCircle, color: "bg-indigo-500" },
    { id: "exam",     label: "Exam",     icon: GraduationCap, color: "bg-red-500",   route: "/exam-mode" },
    { id: "research", label: "Research", icon: Brain,          color: "bg-blue-600", route: "/research-mode" },
];

// ── Message Bubble ─────────────────────────────────────────────────────────────
function Bubble({ msg }) {
    const isUser = msg.role === "user";
    return (
        <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>
            <div className={`w-7 h-7 rounded-2xl flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md ${
                isUser ? "bg-slate-700" : "bg-gradient-to-br from-indigo-500 to-violet-600"
            }`}>
                {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>
            <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                isUser
                    ? "bg-slate-800 text-white rounded-br-sm"
                    : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"
            }`}>
                {msg.typing ? (
                    <span className="flex items-center gap-1 py-0.5">
                        {[0, 1, 2].map(i => (
                            <span key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </span>
                ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
            </div>
        </div>
    );
}

export default function Sylens() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Student";

    const [messages, setMessages] = useState([{
        id: 0, role: "assistant",
        content: `Hey ${displayName}! I'm Sylens 🧠\n\nAsk me anything — KTU stuff, study tips, or just what to do next.`,
    }]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (text) => {
        const userText = (text || input).trim();
        if (!userText || loading) return;
        setInput("");
        setShowSuggestions(false);
        const userMsg = { id: Date.now(), role: "user", content: userText };
        const typingMsg = { id: Date.now() + 1, role: "assistant", content: "", typing: true };
        setMessages(p => [...p, userMsg, typingMsg]);
        setLoading(true);
        try {
            const history = messages.filter(m => !m.typing).map(m => ({ role: m.role, content: m.content }));
            const res = await api.post("/api/sylens/chat-fast", { message: userText, history, system: SYLENS_SYSTEM });
            setMessages(p => p.map(m => m.typing ? { ...m, content: res.data.reply || "…", typing: false } : m));
        } catch {
            setMessages(p => p.map(m => m.typing
                ? { ...m, content: "Backend seems offline. Make sure CogniTek server is running!", typing: false }
                : m));
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#0f0f16]">

            {/* ── HEADER ───────────────────────────────────────────────── */}
            <div className="px-4 pt-12 pb-4 bg-gradient-to-b from-[#0f0f16] to-[#12121e] relative">
                {/* Glow */}
                <div className="absolute top-0 right-10 w-40 h-24 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="flex items-center gap-3 mb-5 relative z-10">
                    {/* Sylens Avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-black text-white leading-tight">Sylens</h1>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <p className="text-[11px] text-indigo-400 font-semibold">CogniTek AI · General Mode</p>
                        </div>
                    </div>
                </div>

                {/* Mode chips */}
                <div className="flex gap-2 relative z-10">
                    {MODES.map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => mode.route && navigate(mode.route)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all border ${
                                mode.id === "general"
                                    ? "bg-indigo-500 text-white border-indigo-400/50 shadow-md shadow-indigo-500/30"
                                    : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/70"
                            }`}
                        >
                            <mode.icon className="w-3 h-3" />
                            {mode.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── MESSAGES ──────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-36" style={{ background: "linear-gradient(to bottom, #12121e, #f7f7f9)" }}>
                {showSuggestions && (
                    <div className="space-y-2 mb-2">
                        <p className="text-[10px] text-center text-white/30 font-semibold uppercase tracking-widest">Quick starts</p>
                        <div className="flex flex-col gap-2">
                            {SUGGESTIONS.map(s => (
                                <button key={s} onClick={() => sendMessage(s)}
                                    className="text-left text-sm px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-medium hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-white transition-all shadow-sm">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
                <div ref={bottomRef} />
            </div>

            {/* ── INPUT BAR ─────────────────────────────────────────────── */}
            <div className="fixed bottom-16 left-0 right-0 px-4 pt-3 pb-4 z-40"
                style={{ background: "linear-gradient(to top, white 80%, transparent)" }}>
                <div className="flex items-end gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-lg shadow-slate-200/50">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        onChange={e => {
                            setInput(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                        }}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Ask Sylens anything…"
                        className="flex-1 bg-transparent outline-none resize-none text-sm text-slate-800 placeholder-slate-400 leading-relaxed py-0.5 max-h-28"
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        className={`p-2.5 rounded-xl flex-shrink-0 transition-all ${
                            input.trim() && !loading
                                ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md hover:scale-105 active:scale-95"
                                : "text-slate-300"
                        }`}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-1.5">Sylens may be wrong. Always verify critical info.</p>
            </div>
        </div>
    );
}
