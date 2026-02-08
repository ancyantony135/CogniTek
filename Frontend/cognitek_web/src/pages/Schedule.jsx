import { useState } from "react";
import { Plus, Trash2, Clock, Mic } from "lucide-react";
import { useAutoRecord } from "../context/AutoRecordContext";

export default function Schedule() {
    const { schedule, addClass, removeClass, isAutoRecording } = useAutoRecord();
    const [newClass, setNewClass] = useState({ name: "", start: "", end: "" });

    const handleAdd = (e) => {
        e.preventDefault();
        if (newClass.name && newClass.start && newClass.end) {
            addClass({ ...newClass, id: Date.now() });
            setNewClass({ name: "", start: "", end: "" });
        }
    };

    return (
        <div className="pt-8 px-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Class Schedule 📅</h1>
                    <p className="text-[var(--text-secondary)]">Auto-record during these times.</p>
                </div>
                {isAutoRecording && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 rounded-full animate-pulse">
                        <Mic className="w-4 h-4" />
                        <span className="text-xs font-bold">LIVE</span>
                    </div>
                )}
            </div>

            {/* Add Form */}
            <div className="tech-glass-card p-6 mb-6 rounded-xl">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Add New Class</h3>
                <form onSubmit={handleAdd} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Subject Name (e.g. Physics)"
                        className="w-full px-4 py-2 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--primary)] transition-colors"
                        value={newClass.name}
                        onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                    />
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs text-[var(--text-secondary)] ml-1">Start</label>
                            <input
                                type="time"
                                className="w-full px-4 py-2 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                                value={newClass.start}
                                onChange={e => setNewClass({ ...newClass, start: e.target.value })}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-[var(--text-secondary)] ml-1">End</label>
                            <input
                                type="time"
                                className="w-full px-4 py-2 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                                value={newClass.end}
                                onChange={e => setNewClass({ ...newClass, end: e.target.value })}
                            />
                        </div>
                    </div>
                    <button className="w-full btn-tech flex items-center justify-center gap-2 font-bold shadow-lg">
                        <Plus className="w-4 h-4" /> Add to Schedule
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="space-y-3">
                {schedule.map(cls => (
                    <div key={cls.id} className="tech-glass-card p-4 flex items-center justify-between rounded-xl">
                        <div>
                            <h4 className="font-bold text-[var(--text-primary)]">{cls.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-1">
                                <Clock className="w-3 h-3" />
                                {cls.start} - {cls.end}
                            </div>
                        </div>
                        <button
                            onClick={() => removeClass(cls.id)}
                            className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
