import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ServerStatus = () => {
    const [isOnline, setIsOnline] = useState(null); // null = checking, true = green, false = red
    const API_URL = import.meta.env.VITE_API_URL;

    const checkPulse = async () => {
        try {
            // Pinging the root route we added to main.py
            const response = await axios.get(`${API_URL}/`, { timeout: 5000 });
            console.log("✅ Backend health check passed:", response.data);
            setIsOnline(true);
        } catch (err) {
            console.warn("⚠️ Backend health check failed:", {
                message: err.message,
                endpoint: `${API_URL}/`,
                code: err.code,
                status: err.response?.status
            });
            setIsOnline(false);
        }
    };

    useEffect(() => {
        checkPulse(); // Initial check
        const interval = setInterval(checkPulse, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full w-fit">
            <span className={`relative flex h-3 w-3`}>
                {isOnline && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline === null ? 'bg-gray-500' : isOnline ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
            </span>
            <span className="text-xs font-medium text-white/70">
                {isOnline === null ? 'Verifying Brain...' : isOnline ? 'System Online' : 'Brain Offline'}
            </span>
        </div>
    );
};

export default ServerStatus;