import { useEffect, useState, useRef } from "react";
import Logo from "./Logo";

const SPLASH_KEY = "cognitek_splash_shown";

export default function SplashScreen({ onDone }) {
    const [phase, setPhase] = useState("in"); // 'in' | 'out' | 'done'
    const calledDone = useRef(false);

    const finish = () => {
        if (calledDone.current) return;
        calledDone.current = true;
        setPhase("done");
        onDone();
    };

    useEffect(() => {
        // After logo + text animate in, start fade-out
        const outTimer = setTimeout(() => setPhase("out"), 2000);
        // After fade-out completes, unmount
        const doneTimer = setTimeout(finish, 2700);
        // Hard safety: always finish within 3s even if callbacks fail
        const safeTimer = setTimeout(finish, 3000);

        return () => {
            clearTimeout(outTimer);
            clearTimeout(doneTimer);
            clearTimeout(safeTimer);
        };
    }, []);

    if (phase === "done") return null;

    return (
        <div
            className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#0a0a0a]"
            style={{
                transition: "opacity 0.7s ease",
                opacity: phase === "out" ? 0 : 1,
            }}
        >
            {/* Radial glow behind logo */}
            <div className="absolute w-72 h-72 rounded-full bg-indigo-600/10 blur-[80px] pointer-events-none" />

            {/* Animated Logo */}
            <div className="animate-splash-logo mb-6">
                <Logo className="w-24 h-24" />
            </div>

            {/* App name */}
            <p
                className="animate-splash-text text-white font-black text-2xl tracking-[0.15em] uppercase"
                style={{ fontFamily: "'Inter', sans-serif" }}
            >
                CogniTek
            </p>

            {/* Tagline */}
            <p
                className="animate-splash-text mt-2 text-white/40 text-sm tracking-widest font-medium"
                style={{ animationDelay: "0.9s" }}
            >
                Your AI Academic Companion
            </p>

            {/* Bottom loader bar */}
            <div className="absolute bottom-12 w-24 h-0.5 bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-400 rounded-full"
                    style={{
                        width: "100%",
                        transform: "translateX(-100%)",
                        animation: "loader-bar 2s ease forwards",
                    }}
                />
            </div>
        </div>
    );
}
