import { useState, useRef, useEffect } from "react";
import { Mic, Loader2, CheckCircle2 } from "lucide-react";
import api from "../api/api";
import { useWakeLock } from "../hooks/useWakeLock";
import { useAuth } from "../context/AuthContext";

export default function AudioRecorder({ onUploadSuccess }) {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("Ready to listen");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  useEffect(() => {
    if (isRecording) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
  }, [isRecording, requestWakeLock, releaseWakeLock]);

  const startRecording = async () => {
    if (window.AudioContext || window.webkitAudioContext) {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
    }
    setStatus("Listening...");
    setIsRecording(true);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = handleAudioUpload;
      mediaRecorderRef.current.start();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      // Use the status state instead of just an alert
      setStatus(`Permission Denied: ${error.name}`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      setStatus("Processing audio...");
    }
  };

  const handleAudioUpload = async () => {
    const audioChunks = audioChunksRef.current;
    // FIX 2: Set type to 'audio/webm' which is the standard browser output
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    if (user?.id) {
      formData.append("user_id", user.id);
    }

    try {
      const response = await api.post("/api/process-audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Processed:", response.data);

      // FIX 1: Remove artificial delay and reload. Trigger a success UI instead.
      setStatus("Data Synchronized");
      setIsSuccess(true);
      setIsProcessing(false);

      // Trigger parent refresh
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Reset the UI after 3 seconds without a full page reload
      setTimeout(() => {
        setIsSuccess(false);
        setStatus("Ready to listen");
      }, 3000);

    } catch (error) {
      console.error("Upload failed", error);
      setStatus("Connection Failed");
      setIsProcessing(false);
    }
  };

  return (
    <div className="tech-glass-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden rounded-2xl w-full max-w-sm mx-auto">
      {/* Animated Background Glows */}
      {isRecording && <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>}
      {isSuccess && <div className="absolute inset-0 bg-green-500/20 animate-in fade-in duration-500"></div>}

      <div className="relative z-10">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || isSuccess}
          className={`
          w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl
          ${isRecording ? "bg-red-500 scale-110 shadow-red-500/50" : "bg-[var(--primary)] shadow-[var(--primary)]/50"}
          ${isSuccess ? "bg-green-500 scale-100" : ""}
          ${isProcessing ? "opacity-80 cursor-not-allowed" : "cursor-pointer"}
        `}
        >
          {isProcessing ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-10 h-10 text-white animate-bounce" />
          ) : isRecording ? (
            <div className="w-8 h-8 bg-white rounded-lg animate-pulse" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </button>

        <h2 className="mt-6 text-2xl font-bold text-[var(--text-primary)]">
          {isSuccess ? "Sync Complete" : isRecording ? "Listening..." : "Tap to Speak"}
        </h2>
        <p className={`mt-2 text-sm font-medium transition-colors ${isRecording ? "text-red-400" : isSuccess ? "text-green-400" : "text-[var(--text-secondary)]"}`}>
          {status}
        </p>
      </div>
    </div>
  );
}
