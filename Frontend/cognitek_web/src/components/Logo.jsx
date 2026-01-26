import React from "react";

export default function Logo({ className = "w-16 h-16" }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Background Glow */}
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"></div>

            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full relative z-10 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]"
            >
                {/* The Student Stick Figure / Base */}
                {/* Shoulders */}
                <path
                    d="M20 90C20 75 35 75 35 75H65C65 75 80 75 80 90"
                    className="stroke-slate-300 stroke-[3] stroke-linecap-round"
                />
                {/* Neck/Collar V */}
                <path
                    d="M40 75L50 85L60 75"
                    className="stroke-indigo-400 stroke-[3] fill-indigo-950/50"
                />

                {/* Head (simplified geometry for glass refraction) */}
                <path
                    d="M35 45V60C35 68.2843 41.7157 75 50 75C58.2843 75 65 68.2843 65 60V45"
                    className="stroke-slate-200 stroke-[3] fill-indigo-900/20 backdrop-blur-sm"
                />

                {/* The Mortarboard (Hat) - Glass Prism Style */}
                <path
                    d="M50 10L90 30L50 50L10 30L50 10Z"
                    className="stroke-indigo-300 stroke-[2] fill-indigo-950/60 backdrop-blur-md"
                />

                {/* The Tassel (Arrow direction focus) */}
                {/* Instead of a traditional tassel, we use the requested 'Arrow' focus symbol */}
                {/* Arrow on the hat pointing forward/right */}
                <path
                    d="M50 20L70 30L50 40"
                    className="stroke-cyan-300 stroke-[3] animate-pulse"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* Refraction Beams emitting from the arrow/hat */}
                <path d="M90 30L98 25" className="stroke-indigo-500/50 stroke-[1]" />
                <path d="M90 30L100 30" className="stroke-blue-500/50 stroke-[1]" />
                <path d="M90 30L98 35" className="stroke-violet-500/50 stroke-[1]" />

                {/* Center Point - Focus */}
                <circle cx="50" cy="30" r="2" className="fill-white animate-ping" />
            </svg>
        </div>
    );
}
