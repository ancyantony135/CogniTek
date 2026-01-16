import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready");
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const fetchData = async () => {
    try {
      const taskRes = await axios.get('http://127.0.0.1:8000/tasks'); 
      setTasks(taskRes.data);
      const cardRes = await axios.get('http://127.0.0.1:8000/flashcards');
      setFlashcards(cardRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Updated Upload Logic to handle both Files and Recorded Blobs
  const uploadFile = async (file) => {
    setLoading(true);
    setStatus("AI is thinking...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post('http://127.0.0.1:8000/process-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus("Success! Saved to Database.");
      fetchData(); 
    } catch (error) {
      setStatus("Error processing audio.");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], "recorded_audio.wav");
        uploadFile(file);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setStatus("Listening...");
    } catch (err) {
      setStatus("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>🎓 Cognitek</h1>
        <p>Personalized AI Assistant for Students</p>
      </header>
      
      <div className="input-section">
        <button 
          className={`record-btn ${isRecording ? 'recording' : ''}`} 
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
        >
          {isRecording ? "🛑 Stop Recording" : "🎤 Tap to Speak"}
        </button>
        <p className="status-text">{status}</p>
      </div>

      <div className="dashboard-grid">
        <section className="column">
          <h2>📅 Upcoming Tasks</h2>
          <div className="list">
            {tasks.map((task) => (
              <div key={task.id} className="task-card">
                <div className="card-header">
                  <span className="subject-tag">{task.subject}</span>
                  <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                </div>
                <h3>{task.title}</h3>
                <div className="card-footer">
                  <span>📅 {task.due_date}</span>
                  <span>🕒 {task.created_at.split(' ')[1]}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="column">
          <h2>🧠 Study Deck</h2>
          <div className="list">
            {flashcards.map((set) => (
              <div key={set.id} className="flashcard-set">
                <h4>Topic: {set.topic}</h4>
                {set.content.map((card, i) => (
                  <div key={i} className="mini-card">
                    <p><strong>Q:</strong> {card.front}</p>
                    <p><strong>A:</strong> {card.back}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;