import React from "react";

export default function Logo({ className = "w-16 h-16" }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Background Glow — stronger for light mode visibility */}
            <div className="absolute inset-0 bg-black/10 blur-xl rounded-full"></div>

            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
            >
                {/* Shoulders — visible in light mode */}
                <path
                    d="M20 90C20 75 35 75 35 75H65C65 75 80 75 80 90"
                    stroke="#111111"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                {/* Neck/Collar V */}
                <path
                    d="M40 75L50 85L60 75"
                    stroke="#333333"
                    strokeWidth="3"
                    fill="rgba(0,0,0,0.08)"
                />

                {/* Head */}
                <path
                    d="M35 45V60C35 68.2843 41.7157 75 50 75C58.2843 75 65 68.2843 65 60V45"
                    stroke="#555555"
                    strokeWidth="3"
                    fill="rgba(0,0,0,0.06)"
                />

                {/* Mortarboard Hat */}
                <path
                    d="M50 10L90 30L50 50L10 30L50 10Z"
                    stroke="#1a1a1a"
                    strokeWidth="2.5"
                    fill="rgba(0,0,0,0.14)"
                />

                {/* Arrow on hat — cyan accent */}
                <path
                    d="M50 20L70 30L50 40"
                    stroke="#444444"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-pulse"
                />

                {/* Refraction Beams */}
                <path d="M90 30L98 25" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
                <path d="M90 30L100 30" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
                <path d="M90 30L98 35" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />

                {/* Center Focus Point */}
                <circle cx="50" cy="30" r="2.5" fill="#333333" className="animate-ping" />
                <circle cx="50" cy="30" r="1.5" fill="white" />
            </svg>
        </div>
    );
}
