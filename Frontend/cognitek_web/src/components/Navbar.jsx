import { BookOpen, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="glass-panel sticky top-4 z-50 mx-4 rounded-2xl px-6 py-4 flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg text-white">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
            CogniTek
          </h1>
          <p className="text-xs text-slate-500 font-medium">Student Assistant</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/50 rounded-xl border border-white/50">
          <User className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-slate-700">
            {user?.name || "Student"}
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
