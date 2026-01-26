import { Outlet } from "react-router-dom";
import BottomTabs from "../components/BottomTabs";

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <Outlet />
            <BottomTabs />
        </div>
    );
}
