import { useState, useRef } from "react";
import { Mic, Loader2, CheckCircle2 } from "lucide-react";
import api from "../api/api";

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("Ready to listen");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
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
      setStatus("Microphone error");
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
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");

    try {
      const response = await api.post("/process-audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Processed:", response.data);
      setStatus("Done! Updating dashboard...");

      // Artificial delay to let user see "Done" state
      setTimeout(() => {
        setStatus("Ready to listen");
        setIsProcessing(false);
        // Reload page to refresh data (simple approach for now)
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error("Upload failed", error);
      setStatus("Error processing audio");
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
      {/* Animated Background Glow */}
      {isRecording && (
        <div className="absolute inset-0 bg-indigo-500/10 animate-pulse"></div>
      )}

      <div className="relative z-10">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`
            w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl
            ${isRecording
              ? "bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/50"
              : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-indigo-500/50"
            }
            ${isProcessing ? "opacity-80 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {isProcessing ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : isRecording ? (
            <div className="w-8 h-8 bg-white rounded-lg animate-pulse" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </button>

        <h2 className="mt-6 text-2xl font-bold text-slate-800">
          {isRecording ? "Listening..." : "Tap to Speak"}
        </h2>
        <p className={`mt-2 text-sm font-medium transition-colors duration-300 ${isRecording ? "text-indigo-600" : "text-slate-500"}`}>
          {status}
        </p>
      </div>
    </div>
  );
}
