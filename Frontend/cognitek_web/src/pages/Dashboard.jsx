import Navbar from "../components/Navbar";
import AudioRecorder from "../components/AudioRecorder";
import TaskBoard from "../components/TaskBoard";
import FlashcardDeck from "../components/FlashcardDeck";

export default function Dashboard() {
  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-7xl mx-auto relative">
        <Navbar />

        {/* Hero Section */}
        <div className="mx-4 mb-8">
          <AudioRecorder />
        </div>

        {/* Content Grid */}
        <div className="mx-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-8 rounded-full bg-indigo-500"></span>
              Upcoming Tasks
            </h2>
            <TaskBoard />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-8 rounded-full bg-pink-500"></span>
              Study Deck
            </h2>
            <FlashcardDeck />
          </div>
        </div>
      </div>
    </div>
  );
}
