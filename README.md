<div align="center">
  <h1>🎓 CogniTek</h1>
  <p><strong>Personalized AI Assistant & Academic Companion for Students</strong></p>

  <!-- Badges -->
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Gemini_2.5_Flash-8E75B2?style=for-the-badge&logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/OpenAI_Whisper-412991?style=for-the-badge&logo=openai" alt="Whisper" />
</div>

<br />

## 📖 Overview

**CogniTek** is an intelligent academic assistant and AI student companion designed specifically to streamline the learning process. Originally tailored for B.Tech students at Kerala Technological University (KTU), it features a multimodal interface that transforms raw study materials into actionable insights.

Students can upload or record audio (like lecture recordings or personal notes), which the system transcribes and logically parses into **Actionable Tasks**, **Upcoming Deadlines**, and **Flashcard Study Decks** based on their enrolled subjects. It also features a conversational AI companion named **Sylens** to help guide their academic journey.

---

## ✨ Key Features

- 🎙️ **Multimodal Audio Processing**: Upload or record lectures to be accurately transcribed locally using **OpenAI Whisper**.
- 🧠 **AI-Powered Insights**: Leverages **Google Gemini 2.5 Flash** to analyze transcripts and automatically extract actionable tasks, due dates, and study flashcards.
- 🤖 **Sylens AI Companion**: A context-aware chatbot that keeps track of the student's pending tasks and provides intelligent study assistance.
- 📚 **Smart Curriculum Integration**: Custom onboarding flow tailored to strict academic curriculums (e.g., KTU syllabus), handling core subjects and electives intelligently.
- 📱 **PWA Ready**: Configured as a Progressive Web App for cross-device accessibility, with active development towards a standalone Android application.

---

## 🛠️ Technology Stack

### 🎨 Frontend (The Interface)
- **Framework:** React 19 + Vite 7
- **Styling:** Tailwind CSS v4
- **State/Routing:** React Router v7
- **Key Libraries:** `axios`, `lucide-react`, `@supabase/supabase-js`

### ⚙️ Backend (The Brain)
- **Framework:** Python 3.10+ with FastAPI
- **Database:** SQLAlchemy ORM (SQLite for local, PostgreSQL for production)
- **AI Models:** Google Gemini (gemini-2.5-flash) for logic/chat, OpenAI Whisper (medium) for perception/transcription

---

## 🚀 How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) & npm
- [Python 3.10+](https://www.python.org/) (ensure `py -3.10` works on Windows)
- **FFmpeg** (needs to be in system PATH for Whisper)
- **Gemini API Key**

### 1️⃣ Backend Setup (The Brain)
The backend handles AI processing, database management, and voice recognition.

```bash
# 1. Navigate to the Backend directory
cd Backend

# 2. Install Python Dependencies
pip install -r requirements.txt

# 3. Create the API Key file
# Create a new file named `api_key.txt` inside the `Backend` folder.
# Paste your Gemini API Key inside it (just the key, no extra spaces).

# 4. Run the Server
py -3.10 main.py
```
> **Note:** The server will start on `http://0.0.0.0:8000`. A `database/cognitek.db` file will be created automatically on the first run.

### 2️⃣ Frontend Setup (The Interface)
The frontend is the visual interface for the student.

```bash
# 1. Navigate to the Frontend directory
cd Frontend/cognitek_web

# 2. Install Libraries
npm install

# 3. Start the App
npm run dev
```
> **Note:** The app will open at `http://localhost:5173`.

---

## 📂 Project Structure

```text
CogniTek_Server/
├── Backend/                 # Python/FastAPI server, SQLite DB, AI processing (Whisper/Gemini)
├── Frontend/cognitek_web/   # React 19 application, Vite, Tailwind CSS, PWA config
├── Cognitek_Recap.md        # Detailed project context and developer recap
├── README.md                # Project documentation
└── DEPLOYMENT.md            # Guidelines for production deployment
```

---

## 🛠️ Troubleshooting

- **Missing API Key**: If the backend crashes immediately, ensure you created `Backend/api_key.txt`.
- **Whisper Model Loading**: The Whisper `medium` model can be heavy. Ensure `ffmpeg` is accessible in the system PATH and CUDA is cleanly installed for acceptable inference times.
- **Python Version Issues**: On Windows, the backend strictly requires running with `py -3.10 main.py` to ensure dependency compatibility (especially regarding PyTorch/Whisper).
