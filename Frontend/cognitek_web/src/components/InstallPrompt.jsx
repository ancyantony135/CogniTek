import React from 'react';
import { usePWA } from '../hooks/usePWA';

const InstallPrompt = () => {
    const { isInstallable, promptInstall } = usePWA();

    if (!isInstallable) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in-up">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between max-w-md mx-auto">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-violet-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-white font-medium text-sm">Install Cognitek</h3>
                        <p className="text-white/60 text-xs">Add to home screen for native experience</p>
                    </div>
                </div>
                <button
                    onClick={promptInstall}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-violet-900/20"
                >
                    Install
                </button>
            </div>
        </div>
    );
};

export default InstallPrompt;
