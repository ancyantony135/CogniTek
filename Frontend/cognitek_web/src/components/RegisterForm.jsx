import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { UserPlus, ArrowRight, AlertCircle } from "lucide-react";
import Logo from "./Logo";

export default function RegisterForm({ onFlip }) {
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (formData.password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        const res = register(formData.username, formData.password);
        if (res.success) {
            navigate("/dashboard");
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="flex flex-col items-center h-full w-full">
            {/* Header */}
            <div className="w-full mb-6 text-center relative flex flex-col items-center">
                <div className="mb-4">
                    <Logo className="w-16 h-16" />
                </div>
                <h1 className="text-3xl font-bold tracking-wider mb-2 text-gradient-silver uppercase">
                    New Account
                </h1>
                <p className="text-indigo-300/60 text-xs tracking-[0.2em] uppercase font-mono mt-1">
                    Join Protocol
                </p>
            </div>

            {error && (
                <div className="w-full p-3 mb-6 bg-red-900/20 border border-red-500/30 text-red-300 text-xs font-mono rounded flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-5">
                <div className="space-y-4">
                    {/* Username */}
                    <input
                        type="text"
                        placeholder="USERNAME"
                        className="input-ghost text-sm tracking-wide"
                        required
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                    />
                    {/* Password */}
                    <input
                        type="password"
                        placeholder="PASSWORD"
                        className="input-ghost text-sm tracking-wide"
                        required
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    {/* Confirm Password */}
                    <input
                        type="password"
                        placeholder="CONFIRM PASSWORD"
                        className="input-ghost text-sm tracking-wide"
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    className="btn-tech flex items-center justify-center gap-2 group mt-6 animate-pulse-glow"
                >
                    <span>Create Profile</span>
                    <UserPlus className="w-4 h-4" />
                </button>
            </form>

            <div className="mt-8 text-center text-xs font-mono text-slate-500 flex items-center justify-center">
                <span className="tracking-wide">Existing ID? </span>
                <button onClick={() => onFlip()} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors ml-2 uppercase flex items-center gap-1">
                    Authenticate <ArrowRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
