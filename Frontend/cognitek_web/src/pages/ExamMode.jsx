import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { Send, ArrowLeft, GraduationCap, Timer, CheckSquare, Loader2, User as UserIcon } from "lucide-react";
import sylensAvatar from "../assets/sylens_avatar.png";

const EXAM_SYSTEM = `You are Sylens in Exam Mode — ultra-focused, ultra-concise. Rules:
- Answer in 1-2 sentences MAX for factual questions.
- For MCQ explanations: state the answer, then one-sentence why.
- For definitions: one sentence only.
- For "explain X": 3 bullet points max, each 1 sentence.
- NEVER use markdown. No asterisks, no bolding. Plain text only.
- If asked a PYQ (previous year question), answer it directly then say "likely exam pattern".`;

function formatReply(text) {
    if (!text) return text;
    return text.replace(/\. ([A-Z])/g, ".\n\n$1").trim();
}

function Bubble({ msg, userAvatar }) {
    const isUser = msg.role === "user";
    return (
        <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>
            <div className={`w-7 h-7 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-md overflow-hidden ${
                isUser ? "bg-red-900/50" : ""
            }`}>
                {isUser
                    ? (userAvatar ? <img src={userAvatar} alt="User" className="w-full h-full object-cover" /> : <UserIcon className="w-3.5 h-3.5 text-red-200" />)
                    : <img src={sylensAvatar} alt="Sylens" className="w-full h-full object-cover" />
                }
            </div>
            <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                isUser
                    ? "bg-red-600/80 text-white rounded-br-sm"
                    : "bg-white/10 text-white/90 border border-white/10 rounded-bl-sm"
            }`}>
                {msg.typing ? (
                    <span className="flex items-center gap-1 py-0.5">
                        {[0, 1, 2].map(i => (
                            <span key={i} className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </span>
                ) : (
                    <span className="whitespace-pre-wrap">{formatReply(msg.content)}</span>
                )}
            </div>
        </div>
    );
}

export default function ExamMode() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState([{
        id: 0, role: "assistant",
        content: "Exam Mode activated 🔴 I'll keep answers razor-sharp. Ask me PYQs, definitions, or quick concept checks.",
    }]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [countdownDate, setCountdownDate] = useState("");
    const [timeLeft, setTimeLeft] = useState(null);
    const [checklist, setChecklist] = useState([
        { id: 1, text: "Review Module 1 notes", done: false },
        { id: 2, text: "Practice PYQ paper", done: false },
        { id: 3, text: "Check KTU formula sheet", done: false },
    ]);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    // Countdown timer
    useEffect(() => {
        if (!countdownDate) { setTimeLeft(null); return; }
        const tick = () => {
            const diff = new Date(countdownDate) - Date.now();
            if (diff <= 0) { setTimeLeft("Exam time!"); clearInterval(iv); return; }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            setTimeLeft(`${d}d ${h}h ${m}m`);
        };
        tick();
        const iv = setInterval(tick, 60000);
        return () => clearInterval(iv);
    }, [countdownDate]);

    const send = async (text) => {
        const t = (text || input).trim();
        if (!t || loading) return;
        setInput("");
        const userMsg = { id: Date.now(), role: "user", content: t };
        const typingMsg = { id: Date.now() + 1, role: "assistant", content: "", typing: true };
        setMessages(p => [...p, userMsg, typingMsg]);
        setLoading(true);
        try {
            const history = messages.filter(m => !m.typing).map(m => ({ role: m.role, content: m.content }));
            const res = await api.post("/api/sylens/chat-fast", { message: t, history, system: EXAM_SYSTEM });
            setMessages(p => p.map(m => m.typing ? { ...m, content: res.data.reply || "…", typing: false } : m));
        } catch {
            setMessages(p => p.map(m => m.typing ? { ...m, content: "Backend offline!", typing: false } : m));
        } finally { setLoading(false); inputRef.current?.focus(); }
    };

    const toggleCheck = (id) => setChecklist(c => c.map(i => i.id === id ? { ...i, done: !i.done } : i));

    return (
        <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg,#1a0005 0%,#2d0010 40%,#1a0000 100%)" }}>

            {/* ── HEADER ── */}
            <div className="px-4 pt-12 pb-4 flex items-center gap-3 border-b border-red-900/30">
                <button onClick={() => navigate("/sylens")} className="p-2 rounded-xl hover:bg-white/10 text-white/60 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-red-400" />
                </div>
                <div>
                    <h1 className="text-base font-black text-white">Exam Mode</h1>
                    <p className="text-[11px] text-red-400 font-semibold">Laser-focused • PYQ Ready</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-[11px] text-red-400 font-bold">EXAM</span>
                </div>
            </div>

            {/* ── TOOLS ROW (countdown + checklist toggle) ── */}
            <div className="px-4 py-3 border-b border-red-900/20 space-y-3">
                {/* Countdown */}
                <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                    <Timer className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <input
                        type="date"
                        value={countdownDate}
                        onChange={e => setCountdownDate(e.target.value)}
                        className="flex-1 bg-transparent text-white/70 text-xs outline-none"
                    />
                    {timeLeft && (
                        <span className="text-sm font-black text-red-300">{timeLeft}</span>
                    )}
                </div>
                {/* Topic checklist */}
                <div className="space-y-1.5">
                    {checklist.map(item => (
                        <button key={item.id} onClick={() => toggleCheck(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm transition-all border ${
                                item.done
                                    ? "bg-red-500/10 border-red-500/20 text-red-300 line-through"
                                    : "bg-white/5 border-white/10 text-white/70"
                            }`}>
                            <CheckSquare className={`w-4 h-4 flex-shrink-0 ${item.done ? "text-red-400" : "text-white/30"}`} />
                            {item.text}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── CHAT ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-48">
                {messages.map(msg => <Bubble key={msg.id} msg={msg} userAvatar={user?.user_metadata?.avatar_url} />)}
                <div ref={bottomRef} />
            </div>

            {/* ── INPUT ── */}
            <div className="fixed bottom-0 left-0 right-0 px-4 pb-24 pt-3 border-t border-red-900/30" style={{background:"rgba(26,0,5,0.9)", backdropFilter:"blur(12px)",marginBottom:0}}>
                <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-3 py-2.5 border border-white/10">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        onChange={e => {
                            setInput(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                        }}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                        placeholder="Ask a PYQ or concept…"
                        className="flex-1 bg-transparent outline-none resize-none text-sm text-white placeholder-white/30 leading-relaxed py-0.5 max-h-28"
                    />
                    <button onClick={() => send()} disabled={!input.trim() || loading}
                        className={`p-2 rounded-xl flex-shrink-0 transition-all ${input.trim() && !loading ? "bg-red-500 text-white shadow-lg shadow-red-500/30 hover:scale-105" : "text-white/20"}`}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                    </button>
                </div>
            </div>
        </div>
    );
}
