import FlashcardDeck from "../components/FlashcardDeck";

export default function Study() {
    return (
        <div className="pt-8 px-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Study Deck 🧠</h1>
                    <p className="text-slate-500">Master your lectures.</p>
                </div>
            </div>

            <FlashcardDeck />
        </div>
    );
}
