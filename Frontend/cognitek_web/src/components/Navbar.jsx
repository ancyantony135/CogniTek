import { BookOpen, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ServerStatus from './ServerStatus';

export default function Navbar() {
  const { user, logout, getDisplayName } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="glass-panel sticky top-4 z-50 mx-4 rounded-2xl px-6 py-4 flex items-center justify-between mb-8">
      {/* 1. Left Section: Branding */}
      <div className="flex items-center gap-3">
        <div className="bg-black p-2 rounded-lg text-white shadow-md">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#111] to-[#444]">
            CogniTek
          </h1>
          <p className="text-xs text-slate-500 font-medium">Student Assistant</p>
        </div>
      </div>

      {/* 2. Middle Section: System Status (The Pulse) */}
      <div className="hidden sm:block">
        <ServerStatus />
      </div>

      {/* 3. Right Section: User Actions */}
      <div className="flex items-center gap-4">
        {/* Mobile Status Indicator (Visible when main one is hidden) */}
        <div className="sm:hidden scale-75">
          <ServerStatus />
        </div>

        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/50 rounded-xl border border-white/50">
          <User className="w-4 h-4 text-slate-700" />
          <span className="text-sm font-medium text-slate-700">
            {getDisplayName()}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}