import { createContext, useState, useContext, useEffect, useRef } from "react";
import api from "../api/api"; // Reuse our API client

const AutoRecordContext = createContext();

export const AutoRecordProvider = ({ children }) => {
    const [schedule, setSchedule] = useState(() => {
        const saved = localStorage.getItem("cognitek_schedule");
        return saved ? JSON.parse(saved) : [];
    });

    const [isAutoRecording, setIsAutoRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Save schedule changes
    useEffect(() => {
        localStorage.setItem("cognitek_schedule", JSON.stringify(schedule));
    }, [schedule]);

    // Background Timer Check
    useEffect(() => {
        const checkInterval = setInterval(() => {
            checkSchedule();
        }, 10000); // Check every 10 seconds

        return () => clearInterval(checkInterval);
    }, [schedule, isAutoRecording]);

    const checkSchedule = () => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const activeClass = schedule.find(period => {
            const start = parseTime(period.start);
            const end = parseTime(period.end);
            return currentMinutes >= start && currentMinutes < end;
        });

        if (activeClass && !isAutoRecording) {
            console.log("⏰ Auto-Starting Class:", activeClass.name);
            startRecording();
        } else if (!activeClass && isAutoRecording) {
            console.log("⏰ Class Ended. Stopping.");
            stopRecording();
        }
    };

    const parseTime = (timeStr) => {
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = handleUpload;

            mediaRecorderRef.current.start();
            setIsAutoRecording(true);
        } catch (err) {
            console.error("Auto-Record Permission Error:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isAutoRecording) {
            mediaRecorderRef.current.stop();
            setIsAutoRecording(false);
        }
    };

    const handleUpload = async () => {
        console.log("📤 Uploading Auto-Recording...");
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("file", audioBlob, "auto_class.wav");

        try {
            await api.post("/process-audio", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            console.log("✅ Auto-Recording Processed!");
            // Optional: Trigger a refresh or notification
        } catch (err) {
            console.error("Auto-Upload Failed", err);
        }
    };

    const addClass = (cls) => setSchedule([...schedule, cls]);
    const removeClass = (id) => setSchedule(schedule.filter(s => s.id !== id));

    return (
        <AutoRecordContext.Provider value={{ schedule, addClass, removeClass, isAutoRecording }}>
            {children}
        </AutoRecordContext.Provider>
    );
};

export const useAutoRecord = () => useContext(AutoRecordContext);
