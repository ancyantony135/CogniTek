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
| **Benil Cherian** | Data Manager | Scheduling Logic & KTU Scraping |
| **Nikhil CN** | Feature Lead | Study Mode & Flashcard UI |

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


## 🛠️ Setup & Collaboration Guide

Follow these steps to get the project running on your local machine.

### **1. Getting the Code**
1. Open **VS Code**.
2. Open the terminal (**Ctrl + `**) and run:
   ```bash
   git clone [https://github.com/Hansel-Sabu/CogniTek.git](https://github.com/Hansel-Sabu/CogniTek.git)




# Developer Action Plan Choices (Kickoff Tasks)

### 📊 Benil: Data & Logic Lead
Primary File: cognitive_server/main.py

KTU Scraper: Create a new script ktu_scraper.py using BeautifulSoup or requests to fetch notification headers from the KTU website.

Conflict Logic: In main.py, write a function to compare a new task's due_date against existing entries in cognitek.db to alert the user of overlaps.

Schema Update: Modify the Task class in the backend to include a status (String) field for tracking completed tasks.

### 🎨 Elvin Alias: Frontend Lead
Primary Folder: cognitek_web/src/

Glassmorphism UI: Update App.css to implement a modern, semi-transparent "Glass" effect for the dashboard cards.

Priority Components: Refactor the task list in App.jsx so that cards dynamically change color or glow based on the task.priority value (High/Medium/Low).

Countdown Timer: Implement a JavaScript function to display a "Time Remaining" countdown on each task card.

### 🧠 Nikhil: Feature Lead
Primary Folder: cognitek_web/src/

Study Mode Component: Create a new StudyMode.jsx file. Use React state to toggle between the "Task Dashboard" and a "Flashcard Study" view.

Flashcard Flip: Add a CSS transition to the flashcard cards so they "flip" over to reveal the answer when clicked.

Subject Filter: Add a search bar or dropdown to the Flashcard section to filter cards by topic.
