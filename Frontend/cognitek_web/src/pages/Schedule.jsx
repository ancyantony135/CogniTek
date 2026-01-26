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
                    <h1 className="text-2xl font-bold text-slate-900">Class Schedule 📅</h1>
                    <p className="text-slate-500">Auto-record during these times.</p>
                </div>
                {isAutoRecording && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 rounded-full animate-pulse">
                        <Mic className="w-4 h-4" />
                        <span className="text-xs font-bold">LIVE</span>
                    </div>
                )}
            </div>

            {/* Add Form */}
            <div className="glass-card p-6 mb-6">
                <h3 className="font-semibold text-slate-800 mb-4">Add New Class</h3>
                <form onSubmit={handleAdd} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Subject Name (e.g. Physics)"
                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200"
                        value={newClass.name}
                        onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                    />
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs text-slate-500 ml-1">Start</label>
                            <input
                                type="time"
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200"
                                value={newClass.start}
                                onChange={e => setNewClass({ ...newClass, start: e.target.value })}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-slate-500 ml-1">End</label>
                            <input
                                type="time"
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200"
                                value={newClass.end}
                                onChange={e => setNewClass({ ...newClass, end: e.target.value })}
                            />
                        </div>
                    </div>
                    <button className="w-full btn-primary flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Add to Schedule
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="space-y-3">
                {schedule.map(cls => (
                    <div key={cls.id} className="glass-card p-4 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-800">{cls.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                <Clock className="w-3 h-3" />
                                {cls.start} - {cls.end}
                            </div>
                        </div>
                        <button
                            onClick={() => removeClass(cls.id)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
