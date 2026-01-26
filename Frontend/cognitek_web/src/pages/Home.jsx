import TaskBoard from "../components/TaskBoard";

export default function Home() {
    return (
        <div className="pt-8 px-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Hello, Student 👋</h1>
                    <p className="text-slate-500">Here's what's up next.</p>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800">Your Feed</h2>
                <TaskBoard />
            </div>
        </div>
    );
}
