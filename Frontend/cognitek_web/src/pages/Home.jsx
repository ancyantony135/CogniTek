import TaskBoard from "../components/TaskBoard";
import { useAuth } from "../context/AuthContext";

export default function Home() {
    const { getDisplayName } = useAuth();
    return (
        <div className="pt-8 px-4 max-w-2xl mx-auto">
            {/* Greeting Card */}
            <div className="tech-glass-card p-6 rounded-2xl mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--primary-glow)]">
                        Hello, {getDisplayName()} 👋
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1 font-mono text-sm">
                        Here's what's up next.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-bold text-[var(--text-primary)] px-2 uppercase tracking-wider text-xs opacity-70">
                    Your Feed
                </h2>
                <TaskBoard />
            </div>
        </div>
    );
}
