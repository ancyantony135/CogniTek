import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API = "http://127.0.0.1:8000/api";

function App() {
  const [tasks, setTasks] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [status, setStatus] = useState("Ready");
  const [loading, setLoading] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  // ---------------- FETCH DATA ----------------
  const fetchData = async () => {
    try {
      const taskRes = await axios.get(`${API}/tasks`);
      const cardRes = await axios.get(`${API}/flashcards`);
      setTasks(taskRes.data);
      setFlashcards(cardRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------------- AUDIO UPLOAD ----------------
  const uploadAudio = async (file) => {
    setLoading(true);
    setStatus("🧠 Cognitek is thinking...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API}/process-audio`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus("✅ Task successfully added!");
      fetchData();
    } catch (err) {
      setStatus("❌ Error processing audio");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RECORDING ----------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        const file = new File([blob], "recording.wav");
        uploadAudio(file);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setStatus("🎤 Listening...");
    } catch {
      setStatus("❌ Microphone permission denied");
    }
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    setIsRecording(false);
  };

  // ---------------- TASK COMPLETE ----------------
  const completeTask = async (id) => {
    await axios.patch(`${API}/tasks/${id}`, { is_completed: true });
    fetchData();
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎓 Cognitek</h1>
        <p>Your Personalized AI Student Assistant</p>
      </header>

      <div className="record-section">
        <button
          className={`record-btn ${isRecording ? "recording" : ""}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
        >
          {isRecording ? "🛑 Stop Recording" : "🎤 Speak"}
        </button>
        <p className="status">{status}</p>
      </div>

      <div className="grid">
        {/* TASKS */}
        <section>
          <h2>📅 Tasks</h2>
          {tasks.length === 0 && <p>No tasks yet</p>}
          {tasks.map((task) => (
            <div className="card" key={task.id}>
              <div className="card-top">
                <span className="subject">{task.subject}</span>
                <span className={`priority ${task.priority}`}>
                  {task.priority}
                </span>
              </div>
              <h3>{task.title}</h3>
              <p>📆 {task.due_date}</p>
              {!task.is_completed && (
                <button
                  className="complete-btn"
                  onClick={() => completeTask(task.id)}
                >
                  ✔ Mark Complete
                </button>
              )}
            </div>
          ))}
        </section>

        {/* FLASHCARDS */}
        <section>
          <h2>🧠 Flashcards</h2>
          {flashcards.map((set) => (
            <div className="card" key={set.id}>
              <h3>{set.topic}</h3>
              {set.content.map((card, i) => (
                <div key={i} className="flashcard">
                  <p><b>Q:</b> {card.front}</p>
                  <p><b>A:</b> {card.back}</p>
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default App;
