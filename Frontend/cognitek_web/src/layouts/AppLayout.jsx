import { Outlet, useLocation } from "react-router-dom";
import BottomTabs from "../components/BottomTabs";
import SylensDrawer from "../components/SylensDrawer";

export default function AppLayout() {
    const location = useLocation();
    // Don't show FAB on Sylens page itself, or mode pages
    const hideFab = ["/sylens", "/exam-mode", "/research-mode"].includes(location.pathname);

    return (
        <div className="min-h-screen pb-24 relative">
            {/* Background Layers */}
            <div className="fixed inset-0 bg-[var(--bg-primary)] -z-20" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--bg-gradient)_0%,transparent_70%)] -z-10 opacity-60" />
            <div className="fixed inset-0 bg-circuit opacity-[0.03] pointer-events-none -z-10" />

            <Outlet />
            <BottomTabs />

            {/* Sylens floating drawer (shows on all pages except sylens itself) */}
            {!hideFab && <SylensDrawer />}
        </div>
    );
}
