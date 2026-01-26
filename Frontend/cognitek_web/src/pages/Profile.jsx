import { useAuth } from "../context/AuthContext";
import { LogOut, User as UserIcon, Settings, Bell, Shield } from "lucide-react";

export default function Profile() {
    const { user, logout } = useAuth();

    return (
        <div className="pt-8 px-4">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Profile</h1>

            <div className="glass-card p-6 flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <UserIcon className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{user?.name || "Student"}</h2>
                    <p className="text-slate-500 text-sm">Standard Account</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="glass-card overflow-hidden">
                    <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100">
                        <Settings className="w-5 h-5 text-slate-500" />
                        <span className="font-medium text-slate-700">Settings</span>
                    </button>
                    <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100">
                        <Bell className="w-5 h-5 text-slate-500" />
                        <span className="font-medium text-slate-700">Notifications</span>
                    </button>
                    <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                        <Shield className="w-5 h-5 text-slate-500" />
                        <span className="font-medium text-slate-700">Privacy</span>
                    </button>
                </div>

                <button
                    onClick={logout}
                    className="w-full glass-card p-4 flex items-center justify-center gap-2 text-red-500 font-medium hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
