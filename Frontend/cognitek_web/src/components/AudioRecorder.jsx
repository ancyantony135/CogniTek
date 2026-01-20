import { useState } from "react";
import api from "../api/api";

export default function AudioRecorder({ refresh }) {
  const [recording, setRecording] = useState(false);
  let mediaRecorder;
  let audioChunks = [];

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    audioChunks = [];

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("file", blob, "audio.wav");

      await api.post("/process-audio", formData);
      refresh();
    };

    window.mediaRecorder = mediaRecorder;
    setRecording(true);
  };

  const stopRecording = () => {
    window.mediaRecorder.stop();
    setRecording(false);
  };

  return (
    <button
      onClick={recording ? stopRecording : startRecording}
      className={`px-6 py-3 rounded-full text-white ${
        recording ? "bg-red-600" : "bg-green-600"
      }`}
    >
      {recording ? "Stop Recording" : "Start Recording"}
    </button>
  );
}
