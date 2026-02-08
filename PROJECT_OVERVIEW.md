# CogniTek Project Overview

## 📊 Project Status
**Status:** 🏗️ In Development / Beta
**Completion Estimate:** ~85%
**Architecture:** Monorepo (FastAPI Backend + React Frontend)

---

## 🏗️ Technical Architecture

### 🧠 Backend (The Brain)
- **Framework:** FastAPI (Python)
- **Database:** SQLite (`cognitek.db`) with SQLAlchemy ORM
- **AI Core:**
  - **Perception:** OpenAI Whisper (Local FFmpeg) for audio-to-text.
  - **Reasoning:** Google Gemini 2.5 Flash (`gemini-2.5-flash`) for task extraction and chat.
- **Key Modules:**
  - `main.py`: Central server entry point, API routes, and DB models.
  - `check_models.py`: Utility for model verification.

### 💻 Frontend (The Interface)
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS 4 + Custom "Tech Glass" Design System.
- **Routing:** React Router v7
- **State Management:** Context API (`AuthContext`, `AutoRecordContext`)
- **HTTP Client:** Axios

---

## ✨ Features Implemented

### 🔐 Authentication & User
- **Unified Auth Page:** Login, Register, and Password Recovery.
- **Protected Routes:** Context-aware routing functionality.
- **Profile:** User profile management (`Profile.jsx`).

### 🎯 Core Functionality
- **Dashboard (`Home.jsx`):**
  - "Hello, Student" Greeting.
  - **Task Board:** Visual feed of upcoming tasks with priority indicators.
  - **Real-time Status:** Optimistic UI updates for task completion.
- **Study Mode (`Study.jsx`):** Likely flashcard or focus mode interface.
- **Voice Command (`Record.jsx`):**
  - Audio recording interface.
  - Backend integration for processing audio commands.
- **Schedule (`Schedule.jsx`):** Calendar or timetable view.

### 🎨 Design & Aesthetics
- **Theme:** "Tech Glass" (Glassmorphism).
- **Color Palette:**
  - **Primary:** Violet/Purple (`#7B2CBF`)
  - **Background:** Deep Dark (`#050505`) with Radial Gradients.
- **Animations:**
  - `animate-float`: Floating elements.
  - `pulse-glow`: Interactive glow effects.
  - Custom scrollbars and transitions.
- **Responsive:** Mobile-first Tailwind implementation.

---

## 📂 Project Statistics

| Metric | Count | Details |
| :--- | :---: | :--- |
| **Frontend Pages** | **10** | Auth, Dashboard, Record, Profile, Schedule, etc. |
| **Backend Endpoints** | **6+** | `/process-audio`, `/tasks` (CRUD), `/chat`, `/flashcards` |
| **Database Tables** | **2** | `tasks`, `flashcards` |
| **Custom Components** | **12** | TaskBoard, AudioRecorder, Navbar, etc. |

---

## 🚀 Next Steps (Gap Analysis)
1.  **Feature Completion (Top Priority):** Add all required features to transform CogniTek into a fully fledged, comprehensive student-oriented application.
2.  **Testing:** No automated tests detected yet.
