import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import sylensAvatar from "../assets/sylens_avatar.png";

const MINI_SYSTEM = `You are Sylens, CogniTek's AI study companion. Answer student questions CONCISELY — 1-3 sentences max unless they ask for more detail.

Be direct, warm, and helpful. Use relevant emojis at the start of your reply for visual rhythm (💡 for tips, 📚 for study, ✅ for answers, 🎯 for goals). Plain text only — no markdown.`;

function formatReply(text) {
    if (!text) return text;
    return text.replace(/\. ([A-Z])/g, ".\n\n$1").trim();
}

export default function SylensDrawer() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 300);
    }, [open]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const send = async () => {
        const text = input.trim();
        if (!text || loading) return;
        setInput("");
        const userMsg = { id: Date.now(), role: "user", content: text };
        const typingMsg = { id: Date.now() + 1, role: "assistant", content: "", typing: true };
        setMessages(p => [...p, userMsg, typingMsg]);
        setLoading(true);
        try {
            const history = messages.filter(m => !m.typing).map(m => ({ role: m.role, content: m.content }));
            const res = await api.post("/api/sylens/chat-fast", { message: text, history, system: MINI_SYSTEM });
            setMessages(p => p.map(m => m.typing ? { ...m, content: res.data.reply || "…", typing: false } : m));
        } catch {
            setMessages(p => p.map(m => m.typing ? { ...m, content: "❌ Backend seems offline!", typing: false } : m));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* FAB */}
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-24 right-4 z-40 rounded-full shadow-xl shadow-indigo-500/30 hover:scale-110 active:scale-95 transition-transform overflow-hidden border-2 border-indigo-400/40"
                style={{ width: 52, height: 52 }}
                title="Ask Sylens"
            >
                <img src={sylensAvatar} alt="Sylens" className="w-full h-full object-cover" />
            </button>

            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"}`}
                style={{ maxHeight: "65vh" }}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-slate-200" />
                </div>

                {/* Header */}
                <div className="flex items-center gap-3 px-4 pb-3 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-indigo-200">
                        <img src={sylensAvatar} alt="Sylens" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">Sylens</p>
                        <p className="text-[10px] text-indigo-500 font-medium">Quick Q&A · I'm here to help ✨</p>
                    </div>
                    <button onClick={() => setOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages */}
                <div className="overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: "calc(65vh - 140px)" }}>
                    {messages.length === 0 && (
                        <p className="text-center text-sm text-slate-400 py-6">
                            🧠 Ask me anything academic!<br />
                            <span className="text-xs text-slate-300">Quick answers, no fluff.</span>
                        </p>
                    )}
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start items-end"}`}>
                            {msg.role === "assistant" && (
                                <div className="w-6 h-6 rounded-xl overflow-hidden flex-shrink-0">
                                    <img src={sylensAvatar} alt="Sylens" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                                msg.role === "user"
                                    ? "bg-slate-900 text-white rounded-br-sm"
                                    : "bg-slate-100 text-slate-800 rounded-bl-sm"
                            }`}>
                                {msg.typing ? (
                                    <span className="flex gap-1">
                                        {[0, 1, 2].map(i => (
                                            <span key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                                                style={{ animationDelay: `${i * 0.15}s` }} />
                                        ))}
                                    </span>
                                ) : (
                                    <span className="whitespace-pre-wrap">{formatReply(msg.content)}</span>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 pb-6 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-3 py-2">
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && send()}
                            placeholder="Ask Sylens…"
                            className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400"
                        />
                        <button
                            onClick={send}
                            disabled={!input.trim() || loading}
                            className={`p-1.5 rounded-xl flex-shrink-0 transition-all ${
                                input.trim() && !loading
                                    ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                                    : "text-slate-300"
                            }`}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
