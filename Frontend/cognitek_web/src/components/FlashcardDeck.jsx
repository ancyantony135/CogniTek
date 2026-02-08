import { useEffect, useState } from "react";
import { Brain, ChevronRight, ChevronLeft } from "lucide-react";
import api from "../api/api";

export default function FlashcardDeck() {
    const [decks, setDecks] = useState([]);
    const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFlashcards = async () => {
            try {
                const res = await api.get("/api/flashcards");
                setDecks(res.data);
            } catch (err) {
                console.error("Failed to load flashcards", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFlashcards();
    }, []);

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            if (currentCardIndex < decks[currentDeckIndex].content.length - 1) {
                setCurrentCardIndex((prev) => prev + 1);
            } else {
                setCurrentCardIndex(0); // Loop back
            }
        }, 200);
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
            {/* Deck Selector (Simple for now) */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-700">{currentDeck.topic}</h3>
                <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">
                    {currentCardIndex + 1} / {currentDeck.content.length}
                </span>
            </div>

            {/* Flashcard Area */}
            <div
                className="group perspective-1000 h-[300px] cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}>
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden glass-card p-8 flex flex-col items-center justify-center text-center border-b-4 border-indigo-500">
                        <span className="text-xs uppercase tracking-widest text-slate-400 mb-4 font-bold">Question</span>
                        <p className="text-lg font-medium text-slate-800 leading-relaxed">
                            {currentCard.front}
                        </p>
                        <div className="mt-8 text-xs text-indigo-400 font-medium">Click to flip</div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden glass-card p-8 flex flex-col items-center justify-center text-center border-b-4 border-pink-500 rotate-y-180 bg-slate-50">
                        <span className="text-xs uppercase tracking-widest text-slate-400 mb-4 font-bold">Answer</span>
                        <p className="text-lg font-medium text-slate-800 leading-relaxed">
                            {currentCard.back}
                        </p>
                        <div className="mt-8 text-xs text-pink-400 font-medium">Click to flip back</div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-end mt-4">
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
