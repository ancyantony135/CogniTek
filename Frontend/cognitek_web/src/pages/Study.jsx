import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FlashcardDeck from "../components/FlashcardDeck";
import { Brain, BookOpen, Shuffle, Star, MessageCircle } from "lucide-react";

export default function Study() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [hardCards, setHardCards] = useState(() => {
        try { return JSON.parse(localStorage.getItem("cognitek_hard_cards") || "[]"); } catch { return []; }
    });

    const markHard = (deckId, cardIdx) => {
        const key = `${deckId}:${cardIdx}`;
        const updated = hardCards.includes(key)
            ? hardCards.filter(k => k !== key)
            : [...hardCards, key];
        setHardCards(updated);
        localStorage.setItem("cognitek_hard_cards", JSON.stringify(updated));
    };

    // Load enrolled subjects from localStorage
    const enrolledSubjects = (() => {
        try { return JSON.parse(localStorage.getItem("cognitek_profile") || "{}").subjects || []; } catch { return []; }
    })();

    const [selectedSubject, setSelectedSubject] = useState("All");

    return (
        <div className="pb-32">
            {/* ── HEADER ── */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 pt-16 pb-12 relative overflow-hidden rounded-b-[40px] shadow-2xl mb-8">
                {/* Decorative blobs */}
                <div className="absolute -top-24 -right-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 -left-12 w-48 h-48 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-end justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] leading-none mb-2">Smart Revision Desk</p>
                        <h1 className="text-3xl font-black text-white leading-tight flex items-center gap-3">
                            Flashcards <span className="text-2xl">🧠</span>
                        </h1>
                        <p className="text-white/40 text-xs mt-2 font-medium">Master your lectures, one card at a time.</p>
                    </div>
                    {hardCards.length > 0 && (
                        <div className="flex flex-col items-end gap-2">
                             <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span className="text-[11px] font-black text-white">{hardCards.length} Hard</span>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-5">

            {/* ── Subject Filter Chips ── */}
            {enrolledSubjects.length > 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-2">
                    <button
                        onClick={() => setSelectedSubject("All")}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border ${
                            selectedSubject === "All"
                                ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-200"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                        All Subjects
                    </button>
                    {enrolledSubjects.map(sub => (
                        <button
                            key={sub.course_code}
                            onClick={() => setSelectedSubject(sub.course_code)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border ${
                                selectedSubject === sub.course_code
                                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-200"
                                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            {sub.course_code}
                        </button>
                    ))}
                </div>
            )}

            <FlashcardDeck onMarkHard={markHard} hardCards={hardCards} selectedSubject={selectedSubject} />
            </div>
        </div>
    );
}
