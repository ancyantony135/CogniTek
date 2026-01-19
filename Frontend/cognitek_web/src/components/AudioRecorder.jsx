import { useState } from "react";
import { uploadAudio } from "../api/api";

export default function AudioRecorder({ onSuccess }) {
  const [recording, setRecording] = useState(false);
  let mediaRecorder;
  let audioChunks = [];

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
    setRecording(true);

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("file", blob, "audio.wav");

      await uploadAudio(formData);
      onSuccess();
    };

    setTimeout(() => {
      mediaRecorder.stop();
      setRecording(false);
    }, 5000);
  };

  return (
    <button onClick={startRecording} className="record-btn">
      {recording ? "Recording..." : "🎤 Record Task"}
    </button>
  );
}

