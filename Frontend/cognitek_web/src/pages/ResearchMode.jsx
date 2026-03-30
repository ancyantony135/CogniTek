import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { Send, ArrowLeft, Brain, Tag, X, Loader2, StickyNote } from "lucide-react";

const RESEARCH_SYSTEM = `You are Sylens in Research Mode — a knowledgeable research companion. Rules:
- You may give longer, well-structured answers when the topic warrants it.
- Cite sources informally (e.g., "per IEEE standard", "per KTU syllabus", "commonly attributed to Feynman").
- Break answers into clear sections using plain-text headings like "Overview:" or "Key concepts:".
- Still avoid markdown symbols (no asterisks, no #). Use plain text with line breaks.
- Encourage the student to explore further: end answers with one follow-up question they might want to investigate.
- Be scholarly but accessible.`;

export default function ResearchMode() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState([{
        id: 0, role: "assistant",
        content: "Research Mode active 🔵 I'll give you thorough, citation-aware answers. What are we exploring today?",
    }]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState(() => {
        try { return localStorage.getItem("cognitek_research_notes") || ""; } catch { return ""; }
    });
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [activePanel, setActivePanel] = useState("chat"); // 'chat' | 'notes'
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const saveNotes = (val) => {
        setNotes(val);
        try { localStorage.setItem("cognitek_research_notes", val); } catch {}
    };

    const addTag = () => {
        const t = tagInput.trim();
        if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
        setTagInput("");
    };

    const send = async (text) => {
        const t = (text || input).trim();
        if (!t || loading) return;
        setInput("");
        setActivePanel("chat");
        const userMsg = { id: Date.now(), role: "user", content: t };
        const typingMsg = { id: Date.now() + 1, role: "assistant", content: "", typing: true };
        setMessages(p => [...p, userMsg, typingMsg]);
        setLoading(true);
        try {
            const history = messages.filter(m => !m.typing).map(m => ({ role: m.role, content: m.content }));
            const res = await api.post("/api/sylens/chat-fast", { message: t, history, system: RESEARCH_SYSTEM });
            setMessages(p => p.map(m => m.typing ? { ...m, content: res.data.reply || "…", typing: false } : m));
        } catch {
            setMessages(p => p.map(m => m.typing ? { ...m, content: "Backend offline!", typing: false } : m));
        } finally { setLoading(false); inputRef.current?.focus(); }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg,#020b18 0%,#05122b 40%,#030d1c 100%)" }}>

            {/* ── HEADER ── */}
            <div className="px-4 pt-12 pb-4 flex items-center gap-3 border-b border-blue-900/30">
                <button onClick={() => navigate("/sylens")} className="p-2 rounded-xl hover:bg-white/10 text-white/60 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-base font-black text-white">Research Mode</h1>
                    <p className="text-[11px] text-blue-400 font-semibold">Deep Dive • Citation-Aware</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full px-3 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-[11px] text-blue-400 font-bold">RESEARCH</span>
                </div>
            </div>

            {/* ── PANEL TOGGLE ── */}
            <div className="flex gap-2 px-4 py-3 border-b border-blue-900/20">
                {[{ id: "chat", label: "Chat" }, { id: "notes", label: "📝 Notes" }].map(p => (
                    <button key={p.id} onClick={() => setActivePanel(p.id)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                            activePanel === p.id
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                : "bg-white/5 text-white/50 hover:bg-white/10"
                        }`}>
                        {p.label}
                    </button>
                ))}
            </div>

            {/* ── TAG CLOUD ── */}
            <div className="px-4 py-2 border-b border-blue-900/20">
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map(t => (
                        <span key={t} className="flex items-center gap-1 text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/20 px-2.5 py-1 rounded-full">
                            {t}
                            <button onClick={() => setTags(ts => ts.filter(x => x !== t))}>
                                <X className="w-2.5 h-2.5" />
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addTag()}
                        placeholder="Add topic tag…"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-blue-500/40"
                    />
                    <button onClick={addTag} className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-bold hover:bg-blue-500/30 transition-colors">
                        + Tag
                    </button>
                </div>
            </div>

            {/* ── CHAT PANEL ── */}
            {activePanel === "chat" && (
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-48">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                msg.role === "user"
                                    ? "bg-blue-600/80 text-white rounded-br-sm"
                                    : "bg-white/8 text-white/90 border border-white/10 rounded-bl-sm"
                            }`}>
                                {msg.typing ? (
                                    <span className="flex gap-1">{[0,1,2].map(i =>
                                        <span key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>
                                    )}</span>
                                ) : msg.content}
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
            )}

            {/* ── NOTES PANEL ── */}
            {activePanel === "notes" && (
                <div className="flex-1 px-4 py-4 pb-36">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-semibold">Research Scratchpad — auto-saved</p>
                    <textarea
                        value={notes}
                        onChange={e => saveNotes(e.target.value)}
                        placeholder="Write your notes here… ideas, summaries, links, anything."
                        className="w-full h-full min-h-[60vh] bg-white/5 border border-white/8 rounded-2xl px-4 py-3 text-sm text-white/80 placeholder-white/20 outline-none resize-none focus:border-blue-500/30 leading-relaxed"
                    />
                </div>
            )}

            {/* ── INPUT ── */}
            <div className="fixed bottom-0 left-0 right-0 px-4 pb-24 pt-3 border-t border-blue-900/30" style={{background:"rgba(2,11,24,0.92)", backdropFilter:"blur(12px)",marginBottom:0}}>
                <div className="flex items-center gap-2 bg-white/8 rounded-2xl px-3 py-2.5 border border-white/10">
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && send()}
                        placeholder="Deep dive into any topic…"
                        className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/30"
                    />
                    <button onClick={() => send()} disabled={!input.trim() || loading}
                        className={`p-2 rounded-xl flex-shrink-0 transition-all ${input.trim() && !loading ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:scale-105" : "text-white/20"}`}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                    </button>
                </div>
            </div>
        </div>
    );
}
