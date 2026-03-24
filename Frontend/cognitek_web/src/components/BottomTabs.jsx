import { Home, BookOpen, Sparkles, User, Mic } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const TABS = [
    { id: "home",    icon: Home,     label: "Home",    path: "/dashboard" },
    { id: "study",   icon: BookOpen, label: "Study",   path: "/study"     },
    { id: "record",  icon: Mic,      label: "Record",  path: "/record",   isMain: true },
    { id: "sylens",  icon: Sparkles, label: "Sylens",  path: "/sylens"    },
    { id: "profile", icon: User,     label: "Profile", path: "/profile"   },
];

export default function BottomTabs() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 pb-6"
            style={{
                background: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderTop: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 -8px 32px rgba(0,0,0,0.06)",
            }}
        >
            {TABS.map(tab => {
                const isActive = location.pathname === tab.path;

                if (tab.isMain) {
                    return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className="relative -mt-8 w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-slate-900/30 hover:scale-110 active:scale-95 transition-transform"
                            style={{
                                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                            }}
                        >
                            <tab.icon className="w-6 h-6 text-white" />
                            {/* Outer glow ring */}
                            <span className="absolute inset-0 rounded-full border-2 border-white/10" />
                        </button>
                    );
                }

                return (
                    <button
                        key={tab.id}
                        onClick={() => navigate(tab.path)}
                        className="relative flex flex-col items-center gap-1 pt-1 pb-0.5 px-3 rounded-2xl transition-all duration-200 active:scale-90"
                    >
                        {/* Active pill indicator */}
                        {isActive && (
                            <span className="absolute inset-0 rounded-2xl bg-slate-900/8" />
                        )}
                        <tab.icon
                            className={`w-5 h-5 relative z-10 transition-all duration-200 ${
                                isActive ? "text-slate-900 scale-110" : "text-slate-400"
                            }`}
                        />
                        <span
                            className={`text-[10px] font-semibold relative z-10 transition-colors ${
                                isActive ? "text-slate-900" : "text-slate-400"
                            }`}
                        >
                            {tab.label}
                        </span>
                        {/* Active dot */}
                        {isActive && (
                            <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-slate-900" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
