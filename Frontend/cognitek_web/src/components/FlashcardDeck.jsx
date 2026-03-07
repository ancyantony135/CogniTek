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
        <div className="space-y-4">
            {/* Deck Selector Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="w-4 h-4 text-slate-600 shrink-0" />
                    <h3 className="font-semibold text-slate-700 truncate">{currentDeck.topic}</h3>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full shrink-0 ml-2">
                    Card {currentCardIndex + 1}/{currentDeck.content.length}
                </span>
            </div>

            {/* Deck Navigation (only shown when there are multiple decks) */}
            {decks.length > 1 && (
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                    <button onClick={prevDeck} className="p-1 rounded-lg hover:bg-slate-200 transition-colors">
                        <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>
                    <span className="text-xs text-slate-400 font-medium">
                        Deck {currentDeckIndex + 1} of {decks.length}
                        {currentDeckIndex === 0 && <span className="ml-1 text-slate-400">(Latest)</span>}
                    </span>
                    <button onClick={nextDeck} className="p-1 rounded-lg hover:bg-slate-200 transition-colors">
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                </div>
            )}

            {/* Flashcard Area */}
            <div
                className="group perspective-1000 h-[380px] sm:h-[300px] cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}>
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden glass-card p-4 sm:p-8 flex flex-col items-center justify-center text-center border-b-4 border-slate-800">
                        <span className="text-xs uppercase tracking-widest text-slate-400 mb-3 font-bold shrink-0">Question</span>
                        <div className="overflow-y-auto flex-1 flex items-center justify-center w-full">
                          <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed">
                              {currentCard.front}
                          </p>
                        </div>
                        <div className="mt-3 text-xs text-slate-400 font-medium shrink-0">Click to flip</div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden glass-card p-4 sm:p-8 flex flex-col items-center justify-center text-center border-b-4 border-pink-500 rotate-y-180 bg-slate-50">
                        <span className="text-xs uppercase tracking-widest text-slate-400 mb-3 font-bold shrink-0">Answer</span>
                        <div className="overflow-y-auto flex-1 flex items-center justify-center w-full">
                          <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed">
                              {currentCard.back}
                          </p>
                        </div>
                        <div className="mt-3 text-xs text-pink-400 font-medium shrink-0">Click to flip back</div>
                    </div>
                </div>
            </div>

            {/* Card Controls */}
            <div className="flex justify-between mt-4">
                <button
                    onClick={prevCard}
                    className="btn-secondary flex items-center gap-2 text-sm"
                >
                    <ChevronLeft className="w-4 h-4" /> Prev Card
                </button>
                <button
                    onClick={nextCard}
                    className="btn-secondary flex items-center gap-2 text-sm"
                >
                    Next Card <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
