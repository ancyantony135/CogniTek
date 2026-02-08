import { Outlet } from "react-router-dom";
import BottomTabs from "../components/BottomTabs";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

function LayoutContent() {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen pb-24 relative overflow-hidden transition-colors duration-300">
            {/* Dynamic Background Layers */}
            <div className="fixed inset-0 bg-[var(--bg-primary)] -z-20 transition-colors duration-300"></div>
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--bg-gradient)_0%,transparent_70%)] -z-10 opacity-60"></div>
            <div className="fixed inset-0 bg-circuit opacity-[0.03] dark:opacity-30 pointer-events-none -z-10"></div>

            {/* Header / Toggle (Temporary Placement) */}
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-full bg-[var(--glass)] border border-[var(--glass-border)] shadow-lg backdrop-blur-md hover:scale-110 transition-transform text-[var(--primary)]"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>

            <Outlet />
            <BottomTabs />
        </div>
    );
}

export default function AppLayout() {
    return (
        <ThemeProvider>
            <LayoutContent />
        </ThemeProvider>
    );
}
