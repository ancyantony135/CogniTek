import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, ArrowRight, UserPlus } from "lucide-react";
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
                <p className="text-indigo-500 text-sm tracking-widest font-mono mt-1 font-semibold drop-shadow-sm">
                    {greeting} / Sylens Online
                </p>
            </div>

            {error && (
                <div className="w-full p-3 mb-6 bg-red-50 border border-red-300 text-red-600 text-xs font-mono rounded flex items-center justify-center gap-2">
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
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer p-1"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>

                {/* Actions Row */}
                <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
                    <button type="button" onClick={() => onFlip('register')} className="hover:text-indigo-600 transition-colors flex items-center gap-1 group">
                        <UserPlus className="w-3 h-3 group-hover:scale-110 transition-transform" /> New User?
                    </button>
                    <button type="button" onClick={() => onFlip('recovery')} className="hover:text-indigo-600 transition-colors">
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


            {/* Micro-Feed */}
            <div className="w-full mt-auto py-2 border-t border-slate-200/60 overflow-hidden relative">
                <div className="whitespace-nowrap animate-scroll text-[10px] text-slate-400 font-mono flex gap-12 tracking-wider uppercase">
                    <span>✨ System Status: Optimal</span>
                    <span>🚀 Update 2.4: Installed</span>
                    <span>🔒 Secure Enclave: Active</span>
                    <span>📡 Network: Encrypted</span>
                </div>
                <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
                <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
}
