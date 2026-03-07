import { Outlet } from "react-router-dom";
import BottomTabs from "../components/BottomTabs";

export default function AppLayout() {
    return (
        <div className="min-h-screen pb-24 relative overflow-hidden">
            {/* Background Layers */}
            <div className="fixed inset-0 bg-[var(--bg-primary)] -z-20"></div>
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--bg-gradient)_0%,transparent_70%)] -z-10 opacity-60"></div>
            <div className="fixed inset-0 bg-circuit opacity-[0.03] pointer-events-none -z-10"></div>

            <Outlet />
            <BottomTabs />
        </div>
    );
}
