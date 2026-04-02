import { Outlet, useLocation } from "react-router-dom";
import BottomTabs from "../components/BottomTabs";
import SylensDrawer from "../components/SylensDrawer";

export default function AppLayout() {
    const location = useLocation();
    // Only show Sylens FAB on the home/dashboard page
    const showFab = location.pathname === "/dashboard";

    return (
        <div className="min-h-screen pb-24 relative">
            {/* Background Layers */}
            <div className="fixed inset-0 bg-[var(--bg-primary)] -z-20" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--bg-gradient)_0%,transparent_70%)] -z-10 opacity-60" />
            <div className="fixed inset-0 bg-circuit opacity-[0.03] pointer-events-none -z-10" />

            <Outlet />
            <BottomTabs />

            {/* Sylens floating drawer (home page only) */}
            {showFab && <SylensDrawer />}
        </div>
    );
}
