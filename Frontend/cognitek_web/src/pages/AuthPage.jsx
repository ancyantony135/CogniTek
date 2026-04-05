import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import RecoveryForm from "../components/RecoveryForm";
import Logo from "../components/Logo";
import SplashScreen from "../components/SplashScreen";

export default function AuthPage() {
    const [view, setView] = useState("landing"); // 'landing' | 'login' | 'register' | 'recovery'
    const [showSplash, setShowSplash] = useState(false);
    const location = useLocation();

    // Show splash screen if user just logged out (flag set by Navbar)
    useEffect(() => {
        const wasLoggedOut = sessionStorage.getItem("cognitek_logged_out");
        if (wasLoggedOut) {
            setShowSplash(true);
            sessionStorage.removeItem("cognitek_logged_out");
        }
    }, []);

    // Set initial view based on URL
    useEffect(() => {
        if (location.pathname === "/register") setView("register");
        else if (location.pathname === "/forgot-password") setView("recovery");
        else setView("landing");
    }, [location.pathname]);

    const showForm = view !== "landing";

    if (showSplash) {
        return <SplashScreen onDone={() => setShowSplash(false)} />;
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 bg-circuit opacity-[0.04] pointer-events-none" />
            {/* Ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-indigo-700/15 blur-[100px] pointer-events-none" />

            {/* ── HERO CONTENT ─────────────────────────────────────────── */}
            <div className="relative z-10 flex flex-col items-center w-full px-6 max-w-sm">

                {/* Logo */}
                <div className={`transition-all duration-500 ${showForm ? "mb-4 scale-75 opacity-70" : "mb-8"}`}>
                    <Logo className="w-20 h-20" />
                </div>

                {/* App name */}
                <h1 className={`font-black text-white tracking-[0.12em] uppercase transition-all duration-500 ${showForm ? "text-lg mb-1" : "text-3xl mb-2"}`}>
                    CogniTek
                </h1>

                {!showForm && (
                    <p className="text-white/40 text-sm tracking-widest text-center mb-12">
                        Your AI Academic Companion
                    </p>
                )}

                {/* ── FORM (slide-up when active) ──────────────────────── */}
                {showForm && (
                    <div className="animate-slide-up w-full mt-4">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                            {view === "login" && (
                                <LoginForm onFlip={(target) => setView(target)} />
                            )}
                            {view === "register" && (
                                <RegisterForm onFlip={() => setView("login")} />
                            )}
                            {view === "recovery" && (
                                <RecoveryForm onFlip={() => setView("login")} />
                            )}
                        </div>
                        <button
                            onClick={() => setView("landing")}
                            className="mt-4 w-full text-white/30 text-xs text-center hover:text-white/60 transition-colors"
                        >
                            ← Back
                        </button>
                    </div>
                )}

                {/* ── CTA BUTTONS (only on landing) ───────────────────── */}
                {!showForm && (
                    <div className="w-full space-y-4">
                        {/* Login — glowing rotating border */}
                        <GlowButton
                            label="Sign In"
                            color="#6366f1"
                            color2="#a855f7"
                            onClick={() => setView("login")}
                        />
                        {/* Register — secondary glow */}
                        <GlowButton
                            label="Create Account"
                            color="#0ea5e9"
                            color2="#6366f1"
                            onClick={() => setView("register")}
                            secondary
                        />
                        <button
                            onClick={() => setView("recovery")}
                            className="w-full text-white/30 text-xs text-center pt-2 hover:text-white/60 transition-colors"
                        >
                            Forgot password?
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom branding */}
            <p className="absolute bottom-6 text-white/15 text-[10px] tracking-widest uppercase">
                Built by Cogni • KTU aligned
            </p>
        </div>
    );
}

/* ── Rotating conic-border glow button ──────────────────────────────────────── */
function GlowButton({ label, color, color2, onClick, secondary = false }) {
    return (
        <button
            onClick={onClick}
            className="glow-cta-wrapper"
            style={{ "--c1": color, "--c2": color2 }}
        >
            {/* Spinning conic-gradient layer */}
            <span className="glow-cta-ring" />
            {/* Body */}
            <span className={`glow-cta-body ${secondary ? "bg-[#111]" : "bg-[#0f0f0f]"}`}>
                {label}
            </span>
        </button>
    );
}
