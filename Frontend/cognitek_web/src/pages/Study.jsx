import FlashcardDeck from "../components/FlashcardDeck";

export default function Study() {
    return (
        <div className="pt-8 px-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Study Deck 🧠</h1>
                    <p className="text-[var(--text-secondary)]">Master your lectures.</p>
                </div>
            </div>

            <FlashcardDeck />
        </div>
    );
}
