# Frontend Integration Guide (for Elvin)

## Backend Status: 🟢 Running | Acceleration: 🚀 NVIDIA RTX 3060 (CUDA) API 
Base URL: http://localhost:8000

### 1. Prerequisites for Frontend
Elvin, before you start, ensure you install Axios (it handles file uploads and JSON much better than the standard fetch):
    
    npm install axios

### 2. Shared Data Models
To keep our UI consistent with the database, all tasks will follow this structure:
    
    {
    "id": 1,
    "task": "Study for DSP Exam",
    "time": "2026-01-20T14:00:00",
    "priority": "High",
    "status": "pending"
    }
 

### 3. The "Voice-to-Task" Service
This is the most important part of Cognitek. When you record audio on the phone or watch, send the .wav or .mp3 file here.   
    
Endpoint: POST /api/process-audio    
Function Snippet (Place in a services/api.js file):

    import axios from 'axios';

    const API_BASE = "http://localhost:8000";

    export const processVoiceTask = async (audioBlob) => {
    const formData = new FormData();
    // 'file' must match the parameter name in the Python backend
    formData.append('file', audioBlob, 'instruction.wav');

    try {
        const response = await axios.post(`${API_BASE}/api/process-audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data; // Returns the newly created task object
        } catch (error) {
        console.error("Audio processing failed:", error);
    }
    };

### 4. Dashboard Synchronization
Use these two functions to keep the student dashboard updated with the SQLite database.
 Fetch All Tasks
        
        export const getTasks = async () => {
          const response = await axios.get(`${API_BASE}/api/tasks`);
      return response.data; // Array of tasks
        };

### 5. Update Task Status (Checkmark)

    export const toggleTaskStatus = async (taskId, currentStatus) => {
      const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
      const response = await axios.patch(`${API_BASE}/api/tasks/${taskId}`, {
    status: newStatus
      });
      return response.data;
    };

### 5. Pro-Tips for You 
Interactive Docs: While my backend is running, 
    
    go to http://localhost:8000/docs. 
You can test every endpoint there without writing any code.

GPU Latency: Because I am running an RTX 3060, the /process-audio request will take about 1-2 seconds. Please show a "Processing..." spinner in the UI while waiting.

CORS: I have already enabled CORS for localhost:5173. 
## If you change your port, let me know!
