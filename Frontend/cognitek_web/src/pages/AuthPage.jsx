import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import RecoveryForm from "../components/RecoveryForm";

export default function AuthPage() {
    const [view, setView] = useState("login"); // 'login', 'register', 'recovery'
    const [orbPos, setOrbPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    const location = useLocation();

    // Set initial view based on URL
    useEffect(() => {
        if (location.pathname === "/register") setView("register");
        else if (location.pathname === "/forgot-password") setView("recovery");
        else setView("login");
    }, [location.pathname]);

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - left) / width;
        const y = (e.clientY - top) / height;
        setOrbPos({ x, y });
    };

    return (
        <div
            className="fixed inset-0 grid place-items-center bg-[var(--bg-dark)] font-sans text-slate-200 overflow-hidden"
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

            {/* Glass Card Container (No 3D) */}
            <div className="relative w-[440px] tech-glass-card p-10 flex flex-col items-center justify-center rounded-2xl transition-all duration-300">
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
        </div>
    );
}
