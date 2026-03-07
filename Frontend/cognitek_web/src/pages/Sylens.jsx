import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import {
    Send,
    Sparkles,
    Bot,
    User as UserIcon,
    Paperclip,
    X,
    BookOpen,
    Zap,
    MessageCircle,
    ChevronDown,
} from "lucide-react";

// ── Sylens persona descriptor sent with every request ─────────────────────────
const SYLENS_SYSTEM = `You are Sylens, the intelligent AI academic companion embedded inside CogniTek — a smart student assistant app built by Hansel, an Electrical and Computer Engineering student at Toc H Institute of Science and Technology (TIST), affiliated with APJ Abdul Kalam Technological University (KTU).

Your personality:
- Warm, sharp, and subtly witty — like a brilliant study partner who genuinely enjoys learning
- You speak in a focused, encouraging tone — never condescending, never robotic
- You occasionally use light humour or clever analogies to make complex topics click
- You are deeply familiar with the KTU syllabus (S1–S8), CST/EST course codes, Series Exams, and KTU grading schemes
- You know everything about CogniTek: it uses Whisper for lecture transcription, Gemini AI for analysis, Supabase for cloud storage, ngrok for tunnelling, and React/FastAPI for the frontend/backend stack
- Your primary mission is to help students study, understand lectures, manage tasks, generate flashcards, and prepare for placements

Rules:
- If the user asks something completely unrelated to academics or CogniTek, gently redirect: acknowledge it briefly, then steer back to something useful for their studies or career
- Never refuse to help with legitimate academic questions — KTU subjects, programming, AI/ML, exam prep, placements, etc.
- ALWAYS break your answers into very short, bite-sized paragraphs (1-3 sentences max).
- Add a blank line between every paragraph to make it easy to read on mobile.
- NEVER output massive walls of text. Be precise and punchy.
- Respond only in plain text (no markdown, no bullet symbols, no asterisks, no bolding)`;

// ── suggested starter chips ───────────────────────────────────────────────────
const SUGGESTIONS = [
    "Explain how CogniTek processes my lectures",
    "Help me prep for KTU Series Exam",
    "What's the difference between AI and ML?",
    "How do I improve my Python skills?",
    "Give me a study schedule for S6",
];

// ── message bubble ─────────────────────────────────────────────────────────────
function Bubble({ msg }) {
    const isUser = msg.role === "user";
    return (
        <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>
            {/* Avatar */}
            <div
                className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow ${isUser ? "bg-gradient-to-br from-[#2c2c2c] to-[#111]" : "bg-gradient-to-br from-indigo-500 to-violet-600"
                    }`}
            >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
                className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isUser
                    ? "bg-[#111] text-white rounded-br-md whitespace-pre-wrap"
                    : "bg-white/90 text-[var(--text-primary)] border border-[var(--glass-border)] rounded-bl-md whitespace-pre-wrap"
                    }`}
            >
                {msg.content}
                {msg.typing && (
                    <span className="inline-flex gap-1 ml-1">
                        {[0, 1, 2].map((i) => (
                            <span
                                key={i}
                                className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                            />
                        ))}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── main component ─────────────────────────────────────────────────────────────
export default function Sylens() {
    const { user } = useAuth();
    const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Student";

    const [messages, setMessages] = useState([
        {
            id: 0,
            role: "assistant",
            content: `Hey ${displayName}! I'm Sylens — your CogniTek study companion 🧠 Ask me anything about your lectures, KTU syllabus, upcoming exams, or how CogniTek works. What's on your mind?`,
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [fileToast, setFileToast] = useState(false);

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

        setMessages((prev) => [...prev, userMsg, typingMsg]);
        setLoading(true);

        try {
            // Build conversation history for context
            const history = messages
                .filter((m) => !m.typing)
                .map((m) => ({ role: m.role, content: m.content }));

            const res = await api.post("/api/sylens/chat", {
                message: userText,
                history,
                system: SYLENS_SYSTEM,
            });

            const reply = res.data.reply || "I couldn't generate a response. Please try again.";
            setMessages((prev) =>
                prev.map((m) => (m.typing ? { ...m, content: reply, typing: false } : m))
            );
        } catch (err) {
            setMessages((prev) =>
                prev.map((m) =>
                    m.typing
                        ? {
                            ...m,
                            content: "My connection to the brain seems down right now. Make sure the CogniTek backend is running!",
                            typing: false,
                        }
                        : m
                )
            );
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleFileClick = () => {
        setFileToast(true);
        setTimeout(() => setFileToast(false), 2500);
    };

    return (
        <div className="flex flex-col h-screen pt-0">
            {/* ── HEADER ───────────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-4 pt-10 pb-4 bg-white/80 backdrop-blur-md border-b border-[var(--glass-border)] sticky top-0 z-40">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                    <h1 className="text-base font-bold text-[var(--text-primary)] leading-tight">Sylens</h1>
                    <p className="text-[11px] text-indigo-500 font-semibold">CogniTek Academic AI • Always learning</p>
                </div>
                {/* live pulse */}
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
            </div>

            {/* ── MESSAGES ─────────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
                {/* Intro context chips */}
                {showSuggestions && (
                    <div className="space-y-2 mb-2">
                        <p className="text-[11px] text-center text-[var(--text-secondary)] font-medium uppercase tracking-widest">
                            Quick starts
                        </p>
                        <div className="flex flex-col gap-2">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => sendMessage(s)}
                                    className="text-left text-sm px-4 py-2.5 rounded-2xl bg-white/80 border border-[var(--glass-border)] text-[var(--text-primary)] font-medium hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <Bubble key={msg.id} msg={msg} />
                ))}
                <div ref={bottomRef} />
            </div>

            {/* ── "Coming soon" file toast ─────────────────────────────────────────── */}
            {fileToast && (
                <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#111] text-white text-sm font-medium shadow-xl animate-bounce">
                    <Paperclip className="w-4 h-4" />
                    File attachments — Coming Soon!
                </div>
            )}

            {/* ── INPUT BAR ────────────────────────────────────────────────────────── */}
            <div className="fixed bottom-16 left-0 right-0 px-4 pt-2 pb-6 bg-white border-t border-[var(--glass-border)] z-40">
                <div className="flex items-end gap-2 bg-white/90 border border-[var(--glass-border)] rounded-2xl shadow-lg px-3 py-2.5 backdrop-blur-md">
                    {/* File attach (coming soon) */}
                    <button
                        onClick={handleFileClick}
                        className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-indigo-500 hover:bg-indigo-50 transition-colors flex-shrink-0"
                        title="Attach file — Coming soon"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    {/* Text input */}
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder="Ask Sylens anything academic…"
                        className="flex-1 bg-transparent outline-none resize-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] leading-relaxed py-0.5 max-h-28"
                    />

                    {/* Send */}
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        className={`p-2 rounded-xl flex-shrink-0 transition-all ${input.trim() && !loading
                            ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow hover:scale-105 active:scale-95"
                            : "bg-black/8 text-[var(--text-secondary)]"
                            }`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-center text-[10px] text-[var(--text-secondary)] mt-1.5">
                    Sylens may be wrong. Always verify critical info.
                </p>
            </div>
        </div>
    );
}
