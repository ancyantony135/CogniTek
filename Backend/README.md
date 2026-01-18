Project Structure


COGNITEK_SERVER/
├── Backend/            # FastAPI, AI Models (Whisper/Gemini)
│   ├── venv/           # Virtual Environment (Git Ignored)
│   ├── main.py         # Primary API Server
│   ├── api_key.txt     # Your Gemini Key (Git Ignored)
│   └── requirements.txt
├── Frontend/           # React + Vite (Elvin's Workspace)
└── Database/           # SQLite Storage
    └── database/
        └── cognitek.db # Shared persistent storage


🛠️ Backend Setup (Team Guide)
        
   1. Environment Activation
      We are using Python 3.14. To ensure high-speed processing on the RTX 3060, follow these steps:PowerShell
         cd Backend
         python -m venv venv
         .\venv\Scripts\activate
   2. Hardware-Optimized Installation
      Since we are using GPU acceleration, the standard pip install won't work for PyTorch. Run:PowerShell
         pip install -r requirements.txt
   3. API Key Configuration
      For security, 
         API keys are not pushed to GitHub.
         Create a file named api_key.txt in the /Backend folder.
         Paste your Google AI Studio key inside.
         Ensure api_key.txt is listed in your .gitignore.
🛰️ API Documentation (For Frontend Integration)
   The backend exposes several endpoints. You can view the full interactive documentation at http://127.0.0.1:8000/docs while the server is running.

   Method  Endpoint                Description
   POST    /api/process-audio       Accepts a .wav file, transcribes it, and saves a task.
   GET     /api/tasks               Returns all scheduled tasks for the dashboard.
   POST    /api/chat                Direct text interaction with the Cognitek AI.
   DELETE  /api/tasks/{id}          Removes a task from the database. 



Running the Project
   PowerShell
   # Inside /Backend with (venv) active
   uvicorn main:app --reload
      The server will start on http://127.0.0.1:8000. RTX 3060 will automatically handle the audio processing.