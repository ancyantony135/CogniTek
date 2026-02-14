import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, ScanFace, ArrowRight, UserPlus } from "lucide-react";
import Logo from "./Logo";

export default function LoginForm({ onFlip }) {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [greeting, setGreeting] = useState("Sylens is ready");
    const [error, setError] = useState("");
    const [validation, setValidation] = useState({ email: null, password: null });
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const updateGreeting = () => {
            const hour = new Date().getHours();
            if (hour < 12) setGreeting("Good Morning");
            else if (hour < 18) setGreeting("Good Afternoon");
            else setGreeting("Good Evening");
        };

        updateGreeting();
        const interval = setInterval(updateGreeting, 60000);
        return () => clearInterval(interval);
    }, []);

    const validateField = (name, value) => {
        if (name === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (name === "password") return value.length >= 6;
        return false;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setValidation({ ...validation, [name]: validateField(name, value) });
        if (error) setError("");
    };

    const handleSubmit = async (e) => { // 1. Added async
        e.preventDefault();
        setError(""); // Clear old errors

        if (!validation.email || !validation.password) {
            setError("Please check your inputs.");
            return;
        }

        // 2. Added await here to wait for Supabase to reply
        const res = await login(formData.email, formData.password);

        if (res.success) {
            navigate("/dashboard");
        } else {
            // This will now show the real error from Supabase
            setError(res.message || "Invalid credentials. Ensure you used your full email.");
        }
    };

    return (
        <div className="flex flex-col items-center h-full w-full">
            {/* Header Section */}
            <div className="w-full mb-8 text-center relative flex flex-col items-center">
                <div className="mb-5 animate-breathe">
                    <Logo className="w-20 h-20" />
                </div>
                <h1 className="text-4xl font-bold tracking-wider mb-2 text-gradient-silver uppercase">
                    CogniTek
                </h1>
                <p className="text-indigo-200 text-sm tracking-widest font-mono mt-1 font-semibold drop-shadow-md">
                    {greeting} / Sylens Online
                </p>
            </div>

            {error && (
                <div className="w-full p-3 mb-6 bg-red-900/20 border border-red-500/30 text-red-300 text-xs font-mono rounded flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-6">
                {/* Email Input */}
                <div className="relative group">
                    <input
                        type="email"
                        name="email"
                        placeholder="EMAIL"
                        className={`input-ghost text-sm tracking-wide ${validation.email === false ? 'border-red-500/50' : ''
                            }`}
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300">
                        {validation.email === true && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>}
                    </div>
                </div>

                {/* Password Input */}
                <div className="relative group">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="PASSWORD"
                        className={`input-ghost text-sm tracking-wide ${validation.password === false ? 'border-red-500/50' : ''
                            }`}
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer p-1"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>

                {/* Actions Row */}
                <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                    <button type="button" onClick={() => onFlip('register')} className="hover:text-indigo-300 transition-colors flex items-center gap-1 group">
                        <UserPlus className="w-3 h-3 group-hover:scale-110 transition-transform" /> New User?
                    </button>
                    <button type="button" onClick={() => onFlip('recovery')} className="hover:text-indigo-300 transition-colors">
                        Recover Access
                    </button>
                </div>

                {/* Primary Action */}
                <button
                    type="submit"
                    className="btn-tech flex items-center justify-center gap-2 group mt-4 animate-pulse-glow"
                >
                    <span>Initialize Session</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </form>

            {/* Divider */}
            <div className="relative w-full my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-[9px] uppercase tracking-[0.2em]">
                    <span className="px-2 text-slate-500 bg-[var(--bg-dark)] font-bold">Alternative Protocol</span>
                </div>
            </div>

            {/* Social Icons */}
            <div className="flex justify-center gap-6 w-full mb-6 relative z-20">
                <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-indigo-500/50 transition-all hover:shadow-[0_0_15px_rgba(123,44,191,0.3)] group cursor-pointer z-30">
                    <svg className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                </button>
                <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-indigo-500/50 transition-all hover:shadow-[0_0_15px_rgba(123,44,191,0.3)] group cursor-pointer z-30">
                    <ScanFace className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                </button>
                <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-indigo-500/50 transition-all hover:shadow-[0_0_15px_rgba(123,44,191,0.3)] group cursor-pointer z-30">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.64 3.57-1.64.91 0 2.39.37 3.37 1.8-3.27 1.6-2.58 6.51.57 8.01-.73 1.4-1.84 2.88-2.59 4.06zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                </button>
            </div>

            {/* Micro-Feed */}
            <div className="w-full mt-auto py-2 border-t border-white/5 overflow-hidden relative">
                <div className="whitespace-nowrap animate-scroll text-[10px] text-slate-500 font-mono flex gap-12 tracking-wider uppercase">
                    <span>✨ System Status: Optimal</span>
                    <span>🚀 Update 2.4: Installed</span>
                    <span>🔒 Secure Enclave: Active</span>
                    <span>📡 Network: Encrypted</span>
                </div>
                <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-[rgba(15,15,20,0.8)] to-transparent pointer-events-none"></div>
                <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[rgba(15,15,20,0.8)] to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
}
