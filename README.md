# 🎓 Cognitek: Personalized AI Assistant for Students

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/react-%2320232b.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![NVIDIA](https://img.shields.io/badge/cuda-76B900?style=for-the-badge&logo=nvidia&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini%202.5%20Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)

**Cognitek** is an intelligent, hands-free scheduling and study assistant. It captures daily spoken interactions, processes them locally using GPU-accelerated AI, and automatically organizes a student's academic life.

---

## 🚀 System Architecture

Cognitek utilizes a decoupled architecture to balance heavy AI processing with a responsive user experience.



1. **Speech-to-Text**: Local **OpenAI Whisper** (Small) utilizes the RTX 3060 CUDA cores for private, low-latency transcription.
2. **NLU Engine**: **Gemini 2.5 Flash** performs intent classification and entity extraction.
3. **Database**: **SQLite** with SQLAlchemy provides persistent storage for all extracted tasks and study materials.
4. **Dashboard**: A **React.js** frontend provides real-time visualization and direct voice recording.

---

## ✨ Core Features (MVP)

- [x] **Smart Task Extraction**: Automatically identifies subjects, deadlines, and priorities from speech.
- [x] **Flashcard Generation**: Converts lecture snippets into study-ready Q&A pairs.
- [x] **Voice Recording**: Direct browser-based recording and upload.
- [ ] **KTU Notifications**: Automatic scraping of university announcements (In Development).
- [ ] **Conflict Detection**: Logic to prevent scheduling overlaps (In Development).

---

## 👥 The Team

| Member | Role | Primary Responsibility |
| :--- | :--- | :--- |
| **Hansel Sabu** | Team Lead | Backend, AI Integration, & Database |
| **Elvin Alias** | Frontend Lead | Dashboard UI & Task Components |
| **Benil** | Data Manager | Scheduling Logic & KTU Scraping |
| **Nikhil** | Feature Lead | Study Mode & Flashcard UI |

---

## 🛠️ Setup Instructions

### 1. Backend (Python)
- Navigate to `/cognitive_server`
- Create a virtual environment: `python -m venv venv`
- Install dependencies: `pip install -r requirements.txt`
- Add your Gemini API Key to `api_key.txt`
- Run the server: `uvicorn main:app --reload`

### 2. Frontend (React)
- Navigate to `/cognitek_web`
- Install dependencies: `npm install`
- Start the app: `npm run dev`

---

## 📅 Roadmap to Jan 15th
- **Phase 1 (Done)**: Core AI pipeline and basic dashboard.
- **Phase 2 (Current)**: Data validation, scheduling logic, and UI refinement.
- **Phase 3**: KTU scraping integration and Chatbot deployment.
