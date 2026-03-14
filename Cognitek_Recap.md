# CogniTek - Project Context & Status Recap

**Target Audience:** Development Team & LLM Assistants (Use this document to establish immediate context on the CogniTek project).

---

## 1. Project Overview
**CogniTek** is an intelligent academic assistant / AI student companion designed specifically for B.Tech students at Kerala Technological University (KTU). 
It features a multimodal interface where students can upload/record audio (e.g., lecture recordings or personal notes), which the system transcribes and logically parses into actionable Tasks, upcoming Deadlines, and Flashcard study decks based on the KTU syllabus (using KTU course codes and terminology). It also features a conversational AI companion named **Sylens**.

## 2. Technical Stack

### Frontend (Web App)
- **Framework:** React 19 + Vite 7
- **Styling:** Tailwind CSS v4
- **State/Routing:** React Router v7
- **Key Libraries:** `axios` for API calls, `lucide-react` for icons, `@supabase/supabase-js`.
- **PWA Capabilities:** Configured with `vite-plugin-pwa` and `workbox-window`. (Currently exploring conversion to a standalone Android app using Flutter/WebView).

### Backend (Architect Server)
- **Framework:** Python 3.10+ with FastAPI. Server runs via `uvicorn`.
- **Database:** SQLAlchemy ORM supporting both SQLite (local fallback) and PostgreSQL (production).
- **AI / Machine Learning:**
  - **Google Gemini (gemini-2.5-flash):** Acts as the logical "Brain". Extracts structured JSON data (Tasks/Flashcards) from transcriptions and powers the Sylens chatbot.
  - **OpenAI Whisper (medium model):** Acts as "Perception". Runs on local GPU (PyTorch/CUDA) to transcribe uploaded lecture audio files. Requires FFmpeg.

## 3. Architecture & Core Workflows

- **Audio Processing Pipeline (`/api/process-audio`):**
  1. Frontend uploads an audio file along with academic context (e.g., the student's enrolled KTU subjects).
  2. Backend transcribes the audio using **Whisper**, generating plain text.
  3. The transcribed text is sent to **Gemini 2.5 Flash** with a strict system prompt.
  4. Gemini returns structured JSON containing matching `tasks` (due dates, subjects) and `flashcards` (exam-style Q&A).
  5. Backend saves these to the SQL Database and returns them to the frontend.
  
- **Sylens AI Chat (`/api/sylens/chat` & `/api/chat`):**
  Context-aware chatbot that keeps tracking of the student's pending tasks.

- **Onboarding:**
  Users configure their academic profile. We apply strict KTU curriculum filtering (e.g., EL Branch Semester 6 rules, allowing/disallowing electives, mandatory core subjects).

## 4. Current State & Recent Developments
*What have we been working on recently?*

1. **Android App Conversion:** Testing access from mobile devices. Currently running the Vite web app on local PC (`vite --host`) and tunneling the FastAPI backend via ngrok (e.g., `tripinnate-vagrantly-felipe.ngrok-free.dev`) so the Android device can connect without being on the same Wi-Fi.
2. **Onboarding & Subject Management:** Fine-tuned the KTU curriculum data in `ktu_courses.json` and `Onboarding.jsx`. Handled specific edge cases for Semester 6 where certain branches don't have standard electives, requiring manual/custom subject additions.
3. **Data Association Bugs:** Fixed an issue where Tasks and Flashcards generated from the AI pipeline were being orphaned (saving without a `user_id`). 
   - *Fix applied:* Ensured UUID/String mappings match gracefully in SQLAlchemy. 
   - *Recovery:* Implemented a one-shot `/api/repair-user-data` endpoint to retroactively assign orphaned data to specific user accounts.
4. **Environment Nuances:** On Windows, the backend strictly requires running with `py -3.10 main.py` to ensure dependency compatibility (especially regarding PyTorch/Whisper).
5. **Chatbot UI:** Fixed frontend layout bugs where the input bar would overlap with the scrollable message list.

## 5. Known Issues & Technical Workarounds
- **Postgres "PREPARE" Error:** The DB engine is instantiated with `options="-c prepare_threshold=0"` to bypass a connection pooling bug specific to our Postgres hosting.
- **SQLite Fallback:** When `DATABASE_URL` is omitted in `.env`, the system defaults to SQLite (`cognitek.db`) safely but treats `user_id` differently (String vs PG_UUID).
- **Model Loading:** The Whisper `medium` model can be heavy. Ensure `ffmpeg` is accessible in the system PATH and CUDA is cleanly installed for acceptable inference times.

## 6. How to Run Locally

**Backend:**
```bash
cd Backend
# Activate your local venv
# Ensure GEMINI_API_KEY is in .env or api_key.txt
py -3.10 main.py
# Server runs on http://0.0.0.0:8000
```

**Frontend:**
```bash
cd Frontend/cognitek_web
npm install
npm run dev
# Vite runs on http://localhost:5173
```
