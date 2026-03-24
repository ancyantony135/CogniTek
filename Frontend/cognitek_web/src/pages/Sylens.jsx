import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import {
    Send, Sparkles, User as UserIcon, Paperclip,
    BookOpen, Zap, MessageCircle, ArrowLeft,
    Brain, GraduationCap
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
    { id: "general",   label: "General",  icon: MessageCircle, color: "bg-indigo-500" },
    { id: "exam",      label: "Exam",     icon: GraduationCap, color: "bg-red-500",   route: "/exam-mode" },
    { id: "research",  label: "Research", icon: Brain,          color: "bg-blue-600", route: "/research-mode" },
];

function Bubble({ msg }) {
    const isUser = msg.role === "user";
    return (
        <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>
            <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${
                isUser ? "bg-slate-800" : "bg-gradient-to-br from-indigo-500 to-violet-600"
            }`}>
                {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>
            <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                isUser
                    ? "bg-slate-900 text-white rounded-br-md whitespace-pre-wrap"
                    : "bg-white text-slate-800 border border-slate-100 rounded-bl-md whitespace-pre-wrap"
            }`}>
                {msg.content}
                {msg.typing && (
                    <span className="inline-flex gap-1 ml-1">
                        {[0,1,2].map(i => (
                            <span key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                                style={{ animationDelay: `${i*0.15}s` }} />
                        ))}
                    </span>
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
        content: `Hey ${displayName}! I'm Sylens 🧠 Ask me anything — I'll keep it short and useful.`,
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
            const res = await api.post("/api/sylens/chat", { message: userText, history, system: SYLENS_SYSTEM });
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
        <div className="flex flex-col h-screen bg-[#0f0f13]">

            {/* ── HEADER ───────────────────────────────────────────── */}
            <div className="px-4 pt-12 pb-4 bg-gradient-to-b from-[#0f0f13] to-[#151520]">
                {/* Avatar + title row */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-base font-black text-white leading-tight">Sylens</h1>
                        <p className="text-[11px] text-indigo-400 font-semibold">CogniTek AI • General Mode</p>
                    </div>
                    {/* Live pulse */}
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                </div>

                {/* Mode chips */}
                <div className="flex gap-2">
                    {MODES.map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => mode.route && navigate(mode.route)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                mode.id === "general"
                                    ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/30"
                                    : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/80"
                            }`}
                        >
                            <mode.icon className="w-3 h-3" />
                            {mode.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── MESSAGES ─────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-36 bg-[#f7f7f9]">
                {showSuggestions && (
                    <div className="space-y-2 mb-2">
                        <p className="text-[10px] text-center text-slate-400 font-semibold uppercase tracking-widest">Quick starts</p>
                        <div className="flex flex-col gap-2">
                            {SUGGESTIONS.map(s => (
                                <button key={s} onClick={() => sendMessage(s)}
                                    className="text-left text-sm px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
                <div ref={bottomRef} />
            </div>

            {/* ── INPUT BAR ────────────────────────────────────────── */}
            <div className="fixed bottom-16 left-0 right-0 px-4 pt-2 pb-4 bg-white border-t border-slate-100 z-40">
                <div className="flex items-end gap-2 bg-slate-100 rounded-2xl px-3 py-2.5">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        onChange={e => {
                            setInput(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                        }}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                        placeholder="Ask Sylens anything…"
                        className="flex-1 bg-transparent outline-none resize-none text-sm text-slate-800 placeholder-slate-400 leading-relaxed py-0.5 max-h-28"
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        className={`p-2 rounded-xl flex-shrink-0 transition-all ${
                            input.trim() && !loading
                                ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow hover:scale-105 active:scale-95"
                                : "text-slate-300"
                        }`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-1.5">Sylens may be wrong. Always verify critical info.</p>
            </div>
        </div>
    );
}
