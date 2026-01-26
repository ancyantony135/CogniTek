import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, KeyRound, CheckCircle, AlertCircle } from "lucide-react";
import Logo from "../components/Logo";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [step, setStep] = useState(1); // 1: Email, 2: OTP
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [message, setMessage] = useState("");
    const [orbPos, setOrbPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - left) / width;
        const y = (e.clientY - top) / height;
        setOrbPos({ x, y });
    };

    const handleSendCode = (e) => {
        e.preventDefault();
        // Simulate backend call
        setMessage("Recovery code sent to secure terminal.");
        setTimeout(() => {
            setStep(2);
            setMessage("");
        }, 1500);
    };

    const handleVerify = (e) => {
        e.preventDefault();
        setMessage("Invalid OTP Protocol (Backend disconnected)");
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next
        if (value && index < 3) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-dark)] font-sans text-slate-200"
            onMouseMove={handleMouseMove}
            ref={containerRef}
        >
            {/* Background Layer */}
            <div className="absolute inset-0 bg-circuit opacity-30 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(26,11,46,0.5)_0%,var(--bg-dark)_80%)] pointer-events-none"></div>

            {/* Interactive Glowing Orb */}
            <div
                className="pointer-events-none absolute w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[80px] transition-transform duration-100 ease-out mix-blend-screen"
                style={{
                    transform: `translate(${orbPos.x * 30 - 15}px, ${orbPos.y * 30 - 15}px)`,
                    left: '50%',
                    top: '50%',
                    marginLeft: '-200px',
                    marginTop: '-200px'
                }}
            />

            <div className="tech-glass-card p-10 w-full max-w-[440px] relative z-10 mx-4 flex flex-col items-center">

                <div className="w-full mb-6 text-center relative flex flex-col items-center">
                    <div className="mb-4">
                        <Logo className="w-16 h-16" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-wider mb-2 text-gradient-silver uppercase">
                        Recovery
                    </h1>
                    <p className="text-indigo-300/60 text-xs tracking-[0.2em] uppercase font-mono mt-1">
                        Access Restoration
                    </p>
                </div>

                {message && (
                    <div className="w-full p-3 mb-6 bg-indigo-900/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono rounded flex items-center justify-center gap-2 animate-pulse">
                        <CheckCircle className="w-4 h-4" /> {message}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSendCode} className="w-full space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-slate-500 uppercase tracking-widest ml-1">Secure Email / ID</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="your.pretentious.email@protocol.com"
                                    className="input-ghost text-sm tracking-wide pl-10"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-tech flex items-center justify-center gap-2 group mt-4 hover:shadow-[0_0_20px_rgba(123,44,191,0.5)]"
                        >
                            <span>Transmit Code</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerify} className="w-full space-y-6">
                        <div className="space-y-4 text-center">
                            <label className="text-xs font-mono text-slate-500 uppercase tracking-widest">Enter 4-Digit Protocol Key</label>
                            <div className="flex justify-center gap-3">
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        id={`otp-${idx}`}
                                        type="text"
                                        maxLength="1"
                                        className="w-12 h-14 bg-white/5 border border-white/10 rounded-lg text-center text-xl font-bold text-white focus:border-indigo-500 focus:shadow-[0_0_10px_rgba(99,102,241,0.5)] outline-none transition-all"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-tech flex items-center justify-center gap-2 group mt-4"
                        >
                            <span>Verify Access</span>
                            <KeyRound className="w-4 h-4" />
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center text-xs font-mono text-slate-500">
                    <Link to="/" className="text-slate-400 hover:text-white transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                        <ArrowRight className="w-3 h-3 rotate-180" /> Return to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
