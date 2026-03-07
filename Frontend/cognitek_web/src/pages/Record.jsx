import AudioRecorder from "../components/AudioRecorder";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Record() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col pt-8 px-4 relative">
            <button
                onClick={() => navigate(-1)}
                className="absolute top-8 left-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
            >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>

            <div className="flex-1 flex flex-col items-center justify-center -mt-20">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Record Class</h1>
                    <p className="text-[var(--text-secondary)]">Tap below to capture tasks & notes</p>
                </div>

                <div className="scale-125">
                    <AudioRecorder onUploadSuccess={() => navigate("/dashboard")} />
                </div>
            </div>
        </div>
    );
}
