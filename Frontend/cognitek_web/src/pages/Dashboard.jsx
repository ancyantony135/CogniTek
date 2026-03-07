import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import AudioRecorder from "../components/AudioRecorder";
import TaskBoard from "../components/TaskBoard";
import FlashcardDeck from "../components/FlashcardDeck";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { DatabaseZap, CheckCircle2, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [repairState, setRepairState] = useState("idle"); // idle | loading | done | hidden
  const hasAutoRepaired = useRef(false);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Auto-repair once when user becomes available — silently backfills orphaned records
  useEffect(() => {
    if (!user?.id || hasAutoRepaired.current) return;
    hasAutoRepaired.current = true;
    handleRepair();
  }, [user?.id]);

  const handleRepair = async () => {
    if (!user?.id) return;
    setRepairState("loading");
    try {
      const res = await api.get("/api/repair-user-data", { params: { user_id: user.id } });
      console.log("✅ Auto-repair:", res.data);
      setRepairState("done");
      setRefreshKey(prev => prev + 1);
      // Hide the banner after a short success flash
      setTimeout(() => setRepairState("hidden"), 3000);
    } catch (err) {
      console.error("Repair failed:", err);
      setRepairState("idle"); // fall back to manual button
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-7xl mx-auto relative">
        <Navbar />

        {/* Hero Section */}
        <div className="mx-4 mb-8">
          <AudioRecorder onUploadSuccess={handleRefresh} />
        </div>

        {/* Recover orphaned data banner */}
        <div className="mx-4 mb-6">
          <button
            onClick={handleRepair}
            disabled={repairState === "loading" || repairState === "done"}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all border
              ${repairState === "done"
                ? "bg-green-50 border-green-300 text-green-600"
                : repairState === "error"
                  ? "bg-red-50 border-red-300 text-red-600"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
          >
            {repairState === "loading" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Recovering data...</>
            ) : repairState === "done" ? (
              <><CheckCircle2 className="w-4 h-4" /> Data recovered! Boards refreshed.</>
            ) : repairState === "error" ? (
              <>⚠️ Recovery failed — check backend is running</>
            ) : (
              <><DatabaseZap className="w-4 h-4" /> Recover previously recorded data</>
            )}
          </button>
        </div>

        {/* Content Grid */}
        <div className="mx-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-8 rounded-full bg-slate-800"></span>
              Upcoming Tasks
            </h2>
            <TaskBoard key={`tasks-${refreshKey}`} />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-8 rounded-full bg-pink-500"></span>
              Study Deck
            </h2>
            <FlashcardDeck key={`deck-${refreshKey}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
