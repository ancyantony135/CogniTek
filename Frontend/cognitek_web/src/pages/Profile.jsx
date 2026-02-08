import { useAuth } from "../context/AuthContext";
import { LogOut, User as UserIcon, Settings, Bell, Shield } from "lucide-react";

export default function Profile() {
    const { user, logout } = useAuth();

    return (
        <div className="pt-8 px-4">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Profile</h1>

            <div className="tech-glass-card p-6 flex items-center gap-4 mb-8 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/30">
                    <UserIcon className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{user?.name || "Student"}</h2>
                    <p className="text-[var(--text-secondary)] text-sm">Standard Account</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="tech-glass-card overflow-hidden rounded-xl">
                    <button className="w-full flex items-center gap-4 p-4 hover:bg-[var(--glass)] transition-colors border-b border-[var(--glass-border)]">
                        <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
                        <span className="font-medium text-[var(--text-primary)]">Settings</span>
                    </button>
                    <button className="w-full flex items-center gap-4 p-4 hover:bg-[var(--glass)] transition-colors border-b border-[var(--glass-border)]">
                        <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
                        <span className="font-medium text-[var(--text-primary)]">Notifications</span>
                    </button>
                    <button className="w-full flex items-center gap-4 p-4 hover:bg-[var(--glass)] transition-colors">
                        <Shield className="w-5 h-5 text-[var(--text-secondary)]" />
                        <span className="font-medium text-[var(--text-primary)]">Privacy</span>
                    </button>
                </div>

                <button
                    onClick={logout}
                    className="w-full tech-glass-card p-4 flex items-center justify-center gap-2 text-red-500 font-medium hover:bg-red-500/10 transition-colors rounded-xl border border-red-500/20"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
