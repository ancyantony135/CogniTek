import { useState } from "react";
import { ArrowRight, Mail, KeyRound, CheckCircle } from "lucide-react";
import Logo from "./Logo";

export default function RecoveryForm({ onFlip }) {
    const [email, setEmail] = useState("");
    const [step, setStep] = useState(1); // 1: Email, 2: OTP
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [message, setMessage] = useState("");

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
        <div className="flex flex-col items-center h-full w-full relative">
            {/* Header */}
            <div className="w-full mb-4 text-center relative flex flex-col items-center flex-shrink-0">
                <div className="mb-2">
                    <Logo className="w-16 h-16" />
                </div>
                <p className="text-indigo-400 text-sm tracking-widest font-mono font-semibold drop-shadow-sm uppercase">
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
                        <label className="text-xs font-mono text-slate-300 uppercase tracking-widest ml-1">Secure Email / ID</label>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="your_pretentious_email.com"
                                className="input-ghost text-sm tracking-wide !pl-12"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                        <label className="text-xs font-mono text-slate-300 uppercase tracking-widest">Enter 4-Digit Protocol Key</label>
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
                <button onClick={() => onFlip()} className="text-slate-400 hover:text-white transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                    <ArrowRight className="w-3 h-3 rotate-180" /> Return to Login
                </button>
            </div>
        </div>
    );
}
