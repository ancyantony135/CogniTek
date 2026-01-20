import { useState } from "react";
import TaskBoard from "./TaskBoard";

export default function Tabs() {
  const [tab, setTab] = useState("tasks");

  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6">
        {["tasks", "ktu", "flashcards", "chatbot"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded ${
              tab === t ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "tasks" && <TaskBoard />}
      {tab !== "tasks" && <div className="text-gray-500">Coming Soon</div>}
    </div>
  );
}
