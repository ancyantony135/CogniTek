import { Home, BookOpen, Calendar, User, Mic } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function BottomTabs() {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: "home", icon: Home, label: "Home", path: "/dashboard" },
        { id: "study", icon: BookOpen, label: "Study", path: "/study" },
        { id: "record", icon: Mic, label: "Record", path: "/record", isMain: true },
        { id: "schedule", icon: Calendar, label: "Schedule", path: "/schedule" },
        { id: "profile", icon: User, label: "Profile", path: "/profile" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-2 pb-6 z-50 flex items-center justify-between shadow-2xl">
            {tabs.map((tab) => {
                const isActive = location.pathname === tab.path;

                if (tab.isMain) {
                    return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-4 rounded-full -mt-8 shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform"
                        >
                            <tab.icon className="w-6 h-6" />
                        </button>
                    );
                }

                return (
                    <button
                        key={tab.id}
                        onClick={() => navigate(tab.path)}
                        className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                            }`}
                    >
                        <tab.icon className={`w-6 h-6 ${isActive ? "fill-indigo-100" : ""}`} />
                        <span className="text-[10px] font-medium">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
