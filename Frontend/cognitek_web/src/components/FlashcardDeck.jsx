import { useEffect, useState } from "react";
import { Brain, ChevronRight, ChevronLeft, BookOpen } from "lucide-react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function FlashcardDeck() {
    const { user } = useAuth();
    const [decks, setDecks] = useState([]);
    const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFlashcards = async () => {
            try {
                const params = user?.id ? { user_id: user.id } : {};
                const res = await api.get("/api/flashcards", { params });
                // Filter out empty decks (AI might generate topics with no actual cards)
                const validDecks = res.data.filter(deck => deck.content && deck.content.length > 0);
                // Sort newest first: highest id = most recently created
                const sorted = validDecks.sort((a, b) => b.id - a.id);
                setDecks(sorted);
            } catch (err) {
                console.error("Failed to load flashcards", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFlashcards();
    }, [user?.id]);

    // --- Card navigation ---
    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex((prev) =>
                prev < decks[currentDeckIndex].content.length - 1 ? prev + 1 : 0
            );
        }, 200);
    };

    const prevCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex((prev) =>
                prev > 0 ? prev - 1 : decks[currentDeckIndex].content.length - 1
            );
        }, 200);
    };

    // --- Deck navigation ---
    const nextDeck = () => {
        setIsFlipped(false);
        setCurrentCardIndex(0);
        setCurrentDeckIndex((prev) => (prev < decks.length - 1 ? prev + 1 : 0));
    };

    const prevDeck = () => {
        setIsFlipped(false);
        setCurrentCardIndex(0);
        setCurrentDeckIndex((prev) => (prev > 0 ? prev - 1 : decks.length - 1));
    };

    if (loading) return <div className="p-4 text-center text-slate-500">Loading study materials...</div>;
    if (decks.length === 0) return (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
            <Brain className="w-12 h-12 mb-4 opacity-50" />
            <p>No flashcards generated yet.</p>
            <p className="text-sm mt-2">Record a lecture to start studying!</p>
        </div>
    );

    const currentDeck = decks[currentDeckIndex];
    const currentCard = currentDeck.content[currentCardIndex];

    return (
        <div className="space-y-6 max-w-lg mx-auto mt-2">
            {/* Deck Selector Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-black text-slate-800 truncate text-lg leading-tight">{currentDeck.topic}</h3>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Study Deck</p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full shrink-0 shadow-sm">
                        {currentCardIndex + 1} / {currentDeck.content.length}
                    </span>
                </div>
            </div>

            {/* Flashcard Area */}
            <div
                className="group perspective-1000 h-[380px] sm:h-[400px] cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? "rotate-y-180 scale-105" : "hover:scale-[1.02]"}`}>
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 border border-slate-100 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
                        <span className="text-[10px] uppercase tracking-widest text-indigo-400 mb-6 font-black shrink-0 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" /> Question
                        </span>
                        <div className="overflow-y-auto flex-1 flex items-center justify-center w-full">
                          <p className="text-xl sm:text-2xl font-bold text-slate-800 leading-relaxed text-center">
                              {currentCard.front}
                          </p>
                        </div>
                        <div className="mt-6 px-4 py-2 rounded-full bg-slate-50 text-xs text-slate-400 font-semibold shrink-0 border border-slate-100">Tap card to flip</div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-600 to-violet-800 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 rotate-y-180 overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-black/20 rounded-full blur-3xl" />
                        <span className="text-[10px] uppercase tracking-widest text-indigo-200 mb-6 font-black shrink-0 relative z-10 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Answer
                        </span>
                        <div className="overflow-y-auto flex-1 flex items-center justify-center w-full relative z-10">
                          <p className="text-lg sm:text-xl font-medium text-white leading-relaxed text-center">
                              {currentCard.back}
                          </p>
                        </div>
                        <div className="mt-6 px-4 py-2 rounded-full bg-white/10 text-xs text-indigo-100 font-semibold shrink-0 border border-white/20 relative z-10 backdrop-blur-md">Tap to return</div>
                    </div>
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between gap-4 mt-2">
                <button
                    onClick={(e) => { e.stopPropagation(); prevCard(); }}
                    className="flex-1 flex justify-center items-center gap-2 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                    <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <button
                    onClick={(e) => { e.stopPropagation(); nextCard(); }}
                    className="flex-1 flex justify-center items-center gap-2 py-3.5 bg-slate-900 border border-slate-900 rounded-2xl text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-md active:scale-95"
                >
                    Next Card <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Deck Navigation (only shown when there are multiple decks) */}
            {decks.length > 1 && (
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-2 mt-4 shadow-sm">
                    <button onClick={prevDeck} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors">
                        <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                        Deck {currentDeckIndex + 1} of {decks.length}
                    </span>
                    <button onClick={nextDeck} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors">
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                </div>
            )}
        </div>
    );
}
