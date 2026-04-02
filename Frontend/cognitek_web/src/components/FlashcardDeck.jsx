import { useEffect, useState, useCallback } from "react";
import { Brain, ChevronRight, ChevronLeft, Layers, Star, Shuffle, MessageCircle, BookOpen, RotateCcw } from "lucide-react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Helper: match topic to enrolled subjects
function matchSubject(topicText, enrolledSubjects) {
    if (!enrolledSubjects || enrolledSubjects.length === 0) return null;
    const topicLower = topicText.toLowerCase();
    // Try course_code match first
    for (const s of enrolledSubjects) {
        if (s.course_code && topicLower.includes(s.course_code.toLowerCase())) {
            return { code: s.course_code, name: s.course_name };
        }
    }
    // Try course_name fuzzy match (any word overlap ≥ 4 chars)
    for (const s of enrolledSubjects) {
        const words = (s.course_name || "").toLowerCase().split(/\s+/).filter(w => w.length >= 4);
        if (words.some(w => topicLower.includes(w))) {
            return { code: s.course_code, name: s.course_name };
        }
    }
    return null;
}

export default function FlashcardDeck({ onMarkHard, hardCards = [], selectedSubject = "All" }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [allDecks, setAllDecks] = useState([]); // Store all fetched decks
    const [decks, setDecks] = useState([]);       // Store filtered filtered decks
    const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [shuffled, setShuffled] = useState(false);
    const [cardOrder, setCardOrder] = useState([]);

    // Load enrolled subjects from localStorage
    const enrolledSubjects = (() => {
        try { return JSON.parse(localStorage.getItem("cognitek_profile") || "{}").subjects || []; } catch { return []; }
    })();

    // Fetch all decks
    useEffect(() => {
        const fetchFlashcards = async () => {
            try {
                const params = user?.id ? { user_id: user.id } : {};
                const res = await api.get("/api/flashcards", { params });
                const validDecks = res.data.filter(deck => deck.content && deck.content.length > 0);
                const sorted = validDecks.sort((a, b) => b.id - a.id);
                setAllDecks(sorted);
            } catch (err) {
                console.error("Failed to load flashcards", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFlashcards();
    }, [user?.id]);

    // Apply filter when selectedSubject or allDecks changes
    useEffect(() => {
        if (selectedSubject === "All") {
            setDecks(allDecks);
        } else {
            const filtered = allDecks.filter(deck => {
                const matched = matchSubject(deck.topic || "", enrolledSubjects);
                return matched && matched.code === selectedSubject;
            });
            setDecks(filtered);
        }
        setCurrentDeckIndex(0);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setShuffled(false);
    }, [selectedSubject, allDecks]);

    // Update card order when decks or currentDeckIndex changes
    useEffect(() => {
        if (decks[currentDeckIndex]) {
            setCardOrder(decks[currentDeckIndex].content.map((_, i) => i));
        }
    }, [decks, currentDeckIndex]);

    const currentDeck = decks[currentDeckIndex];

    const shuffleDeck = () => {
        if (!currentDeck) return;
        const indices = currentDeck.content.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        setCardOrder(indices);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setShuffled(true);
    };

    const resetOrder = () => {
        if (!currentDeck) return;
        setCardOrder(currentDeck.content.map((_, i) => i));
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setShuffled(false);
    };

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex(prev =>
                prev < cardOrder.length - 1 ? prev + 1 : 0
            );
        }, 200);
    };

    const prevCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex(prev => prev > 0 ? prev - 1 : cardOrder.length - 1);
        }, 200);
    };

    const nextDeck = () => {
        setIsFlipped(false);
        setCurrentCardIndex(0);
        setShuffled(false);
        const newIdx = currentDeckIndex < decks.length - 1 ? currentDeckIndex + 1 : 0;
        setCurrentDeckIndex(newIdx);
    };

    const prevDeck = () => {
        setIsFlipped(false);
        setCurrentCardIndex(0);
        setShuffled(false);
        const newIdx = currentDeckIndex > 0 ? currentDeckIndex - 1 : decks.length - 1;
        setCurrentDeckIndex(newIdx);
    };

    if (loading) return <div className="p-4 text-center text-slate-500 animate-pulse">Loading study materials...</div>;
    
    if (decks.length === 0) return (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center text-slate-400 min-h-[260px] rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm">
            <Brain className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-semibold">{selectedSubject === "All" ? "No flashcards generated yet." : `No flashcards for ${selectedSubject}.`}</p>
            <p className="text-sm mt-2">Record a lecture to start studying!</p>
        </div>
    );

    const currentCard = currentDeck.content[cardOrder[currentCardIndex]];
    const currentCardRealIdx = cardOrder[currentCardIndex];
    const hardKey = `${currentDeck.id}:${currentCardRealIdx}`;
    const isHard = hardCards.includes(hardKey);

    // Parse subject and module from topic
    const topicText = currentDeck.topic || "Study Material";
    const colonIdx = topicText.indexOf(":");
    let subjectLine = "";
    let moduleLine = topicText;
    if (colonIdx > 0 && colonIdx < 40) {
        subjectLine = topicText.slice(0, colonIdx).trim();
        moduleLine = topicText.slice(colonIdx + 1).trim();
    }

    // Try to match against enrolled subjects
    const matched = matchSubject(topicText, enrolledSubjects);
    const displaySubject = matched ? `${matched.code} · ${matched.name}` : subjectLine;

    const handleQuizMe = () => {
        const question = currentCard?.front || "";
        const topic = moduleLine;
        // Navigate to Sylens with a pre-filled message
        navigate(`/sylens?q=${encodeURIComponent(`Quiz me on this topic: "${topic}". Ask me a practice question based on: "${question}"`)}`);
    };

    const handleAddToNotes = () => {
        const topic = moduleLine;
        navigate(`/sylens?q=${encodeURIComponent(`Summarize key points about "${topic}" in a concise study note format.`)}`);
    };

    return (
        <div className="space-y-3 max-w-lg mx-auto mt-1 px-1">
            {/* ── Banner: Subject + Module ── */}
            <div
                className="relative overflow-hidden rounded-2xl px-4 py-4 border border-indigo-900/40"
                style={{ background: "linear-gradient(135deg, #0f0f16 0%, #16213e 60%, #1a1a2e 100%)" }}
            >
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-xl shadow-inner">
                            🧠
                        </div>
                        <div className="min-w-0 flex-1">
                            {(displaySubject || subjectLine) && (
                                <p className="text-[11px] font-black tracking-wider uppercase text-indigo-300 truncate leading-tight flex items-center gap-1.5 opacity-80">
                                    {matched && <span className="text-emerald-400">✓</span>}
                                    {matched ? `${matched.code}: ${matched.name}` : subjectLine}
                                </p>
                            )}
                            <h3 className="font-extrabold text-white text-sm sm:text-base leading-snug truncate mt-1">
                                {moduleLine || "Study Deck"}
                            </h3>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                            {currentCardIndex + 1} / {cardOrder.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Deck Navigation ── */}
            {decks.length > 1 && (
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
                    <button onClick={prevDeck} className="p-2 rounded-lg hover:bg-slate-100 transition-colors active:scale-90">
                        <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                        Deck {currentDeckIndex + 1} of {decks.length}
                    </span>
                    <button onClick={nextDeck} className="p-2 rounded-lg hover:bg-slate-100 transition-colors active:scale-90">
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                </div>
            )}

            {/* ── Flashcard ── */}
            <div
                className="group perspective-1000 h-[280px] sm:h-[320px] cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? "rotate-y-180 scale-[1.02]" : "hover:scale-[1.01]"}`}>
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-lg flex flex-col items-center justify-center p-5 border border-slate-100 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                        <span className="text-[9px] uppercase tracking-widest text-indigo-400 mb-4 font-black shrink-0 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" /> Question
                        </span>
                        <div className="overflow-y-auto flex-1 flex items-center justify-center w-full">
                            <p className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed text-center px-2">
                                {currentCard?.front}
                            </p>
                        </div>
                        <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-50 text-[10px] text-slate-400 font-semibold shrink-0 border border-slate-100">Tap to flip</div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-600 to-violet-800 rounded-2xl shadow-2xl flex flex-col items-center justify-center p-5 rotate-y-180 overflow-hidden">
                        <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-black/20 rounded-full blur-3xl" />
                        <span className="text-[9px] uppercase tracking-widest text-indigo-200 mb-4 font-black shrink-0 relative z-10 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Answer
                        </span>
                        <div className="overflow-y-auto flex-1 flex items-center justify-center w-full relative z-10">
                            <p className="text-sm sm:text-base font-medium text-white leading-relaxed text-center px-2">
                                {currentCard?.back}
                            </p>
                        </div>
                        <div className="mt-4 px-3 py-1.5 rounded-full bg-white/10 text-[10px] text-indigo-100 font-semibold shrink-0 border border-white/20 relative z-10 backdrop-blur-md">Tap to return</div>
                    </div>
                </div>
            </div>

            {/* ── Navigation Controls ── */}
            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={(e) => { e.stopPropagation(); prevCard(); }}
                    className="flex-1 flex justify-center items-center gap-1.5 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                    <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <button
                    onClick={(e) => { e.stopPropagation(); nextCard(); }}
                    className="flex-1 flex justify-center items-center gap-1.5 py-3 bg-slate-900 border border-slate-900 rounded-xl text-[13px] font-bold text-white hover:bg-slate-800 transition-all shadow-md active:scale-95"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* ── Post-Flashcard Action Strip ── */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 px-4 pt-3 pb-1">What do you want to do?</p>
                <div className="grid grid-cols-2 gap-px bg-slate-100 border-t border-slate-100">
                    {/* Quiz Me */}
                    <button
                        onClick={handleQuizMe}
                        className="flex flex-col items-center gap-1.5 py-4 bg-white hover:bg-indigo-50 transition-colors active:scale-95"
                    >
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <MessageCircle className="w-4.5 h-4.5 text-indigo-600 w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">Quiz Me</p>
                        <p className="text-[10px] text-slate-400 px-2 text-center leading-tight">Sylens asks you a practice Q</p>
                    </button>

                    {/* Shuffle */}
                    <button
                        onClick={shuffled ? resetOrder : shuffleDeck}
                        className="flex flex-col items-center gap-1.5 py-4 bg-white hover:bg-amber-50 transition-colors active:scale-95"
                    >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${shuffled ? "bg-amber-200" : "bg-amber-100"}`}>
                            {shuffled
                                ? <RotateCcw className="w-5 h-5 text-amber-700" />
                                : <Shuffle className="w-5 h-5 text-amber-600" />
                            }
                        </div>
                        <p className="text-xs font-bold text-slate-800">{shuffled ? "Reset Order" : "Shuffle"}</p>
                        <p className="text-[10px] text-slate-400 px-2 text-center leading-tight">{shuffled ? "Back to original order" : "Randomize card order"}</p>
                    </button>

                    {/* Mark Hard */}
                    <button
                        onClick={() => onMarkHard?.(currentDeck.id, currentCardRealIdx)}
                        className="flex flex-col items-center gap-1.5 py-4 bg-white hover:bg-yellow-50 transition-colors active:scale-95"
                    >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isHard ? "bg-yellow-300" : "bg-yellow-100"}`}>
                            <Star className={`w-5 h-5 ${isHard ? "text-yellow-700 fill-yellow-500" : "text-yellow-600"}`} />
                        </div>
                        <p className="text-xs font-bold text-slate-800">{isHard ? "Marked ⭐" : "Mark Hard"}</p>
                        <p className="text-[10px] text-slate-400 px-2 text-center leading-tight">Flag for extra review</p>
                    </button>

                    {/* Add to Notes */}
                    <button
                        onClick={handleAddToNotes}
                        className="flex flex-col items-center gap-1.5 py-4 bg-white hover:bg-emerald-50 transition-colors active:scale-95"
                    >
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">Add to Notes</p>
                        <p className="text-[10px] text-slate-400 px-2 text-center leading-tight">Ask Sylens to summarize</p>
                    </button>
                </div>
            </div>
        </div>
    );
}
