from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text, JSON, cast
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from pydantic import BaseModel
import whisper
import google.generativeai as genai
import shutil
import os
import uuid as uuid_lib
import json
import torch
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv

# 1. API KEY & GEMINI INITIALIZATION (GLOBAL SCOPE)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    try:
        with open("api_key.txt", "r") as f:
            GEMINI_API_KEY = f.read().strip()
    except FileNotFoundError:
        print("❌ Error: GEMINI_API_KEY not found. Set it in Env Vars or api_key.txt")

# Configure Gemini globally
genai.configure(api_key=GEMINI_API_KEY)
text_model = genai.GenerativeModel('gemini-2.5-flash') # This is the "Brain"

# 2. DATABASE CONFIGURATION
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Fallback for safety during local testing
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./database/cognitek.db"

if "postgresql" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,       # Recycle connections every 5 min
        pool_timeout=10,        # Fail fast instead of hanging forever
        connect_args={
            # This is the magic fix for "Does not support PREPARE statements"
            "options": "-c prepare_threshold=0" 
        }
    )
else:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TaskDB(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True)  # Keep as String for SQLite compatibility
    title = Column(String, index=True)
    subject = Column(String)
    due_date = Column(String)
    time = Column(String, nullable=True)        # e.g. "3:00 PM" or "2 hours"
    priority = Column(String)
    description = Column(Text, nullable=True)   # brief description of what the task involves
    is_completed = Column(Boolean, default=False)
    created_at = Column(String, default=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

class FlashcardDB(Base):
    __tablename__ = "flashcards"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True, index=True)
    topic = Column(String)
    content = Column(JSON)
    created_at = Column(String, default=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

Base.metadata.create_all(bind=engine)

# --- SAFE SCHEMA MIGRATION ---
# create_all() won't modify existing tables, so we manually add any
# missing columns here. ADD COLUMN IF NOT EXISTS is a no-op if already present.
def run_migrations():
    migration_statements = [
        "ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS user_id UUID;",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID;",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time VARCHAR;",
    ]
    with engine.connect() as conn:
        for stmt in migration_statements:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception as e:
                print(f"⚠️  Migration skipped (may already exist): {e}")

try:
    from sqlalchemy import text
    run_migrations()
    print("✅ Schema migrations applied.")
except Exception as e:
    print(f"⚠️  Migration error (non-fatal): {e}")


# 3. MODELS & APP SETUP

def parse_uid(user_id_str):
    """Return user_id as a plain string."""
    if not user_id_str:
        return None
    try:
        # Validate it's a real UUID, then return as string
        return str(uuid_lib.UUID(str(user_id_str)))
    except (ValueError, AttributeError):
        return None

class TaskUpdate(BaseModel):
    is_completed: bool

class ChatRequest(BaseModel):
    message: str

class SylensChatRequest(BaseModel):
    message: str
    history: list = []
    system: str = ""

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. HARDWARE VALIDATION & WHISPER LOAD
print("------------------------------------------------")
print("🚀 COGNITEK ARCHITECT SERVER STARTING...")

FFMPEG_PATH = shutil.which("ffmpeg")
if not FFMPEG_PATH:
    print("❌ CRITICAL: FFmpeg is NOT installed or not in PATH.")
else:
    print(f"✅ FFmpeg detected at: {FFMPEG_PATH}")

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"✅ GPU Mode: {device.upper()}")

try:
    print("⏳ Loading Whisper (Perception) model...")
    audio_model = whisper.load_model("medium", device=device)
    print("✅ Whisper Loaded. Ready for Perception.")
except Exception as e:
    print(f"❌ MODEL LOAD FAILURE: {str(e)}")
    audio_model = None 

print("✅ Server Ready.")
print("------------------------------------------------")

# 5. API ENDPOINTS
@app.get("/")
def read_root():
    return {"status": "online", "message": "Cognitek System Ready"}



@app.post("/api/process-audio")
async def process_audio(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None),
    subjects: Optional[str] = Form(None),   # JSON string: [{"code":"CST301","name":"..."},...]
):
    temp_filename = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    print(f"🎤 Processing: {file.filename} | user_id received: '{user_id}'")
    
    # Whisper Transcription
    result = audio_model.transcribe(temp_filename)
    transcribed_text = result["text"]
    print(f"📝 Transcribed: {transcribed_text[:50]}...")
    
    # AI Analysis (Uses the global text_model)
    # Build subject constraint block if the user has enrolled subjects
    subject_constraint = ""
    if subjects:
        try:
            subject_list = json.loads(subjects)
            if subject_list:
                allowed = ", ".join(f'"{s["code"]}: {s["name"]}"' for s in subject_list)
                subject_constraint = f"""
=== SUBJECT CONSTRAINT (MANDATORY) ===
You MUST use ONLY the following subjects for the "subject" field in tasks.
Do NOT create a task for any subject not in this list.
If no subject in the audio matches this list, set subject to the closest match or omit the task if completely unrelated.
Allowed subjects: [{allowed}]
"""
        except Exception:
            pass

    prompt = f"""
You are an intelligent academic assistant for a B.Tech student at Kerala Technological University (KTU), India.
Analyze the following transcribed student audio and extract structured data.

--- TRANSCRIBED AUDIO ---
"{transcribed_text}"
--- END OF AUDIO ---

=== PRIMARY RULE — READ THIS FIRST ===
Your DEFAULT output for "tasks" is ALWAYS an empty array: [].
You must upgrade it from [] to generate a task if the following conditions are met:
  1. The audio mentions an actionable item, assignment, or submission (e.g., "submit the assignment", "complete the project", "I need to upload"). It does NOT need to be explicitly directed at themselves.
  2. The content describes something that needs to be DONE — not merely a concept being TAUGHT or EXPLAINED.
  3. If there is a deadline mentioned, include it. If no deadline is explicitly spoken, set due_date to "Upcoming" or guess based on context.
If it is an actionable task or assignment, add it! Do not be overly strict about phrasing.

{subject_constraint}
=== TASK FIELDS ===
For each task, extract ALL of the following fields:
- "title": Short, action-oriented title (e.g., "Submit Assignment 1")
- "subject": KTU course code + name (e.g., "CST201: Discrete Computational Structures")
- "due_date": Specific date/deadline or KTU term (e.g., "Friday", "Series Exam 1", "Upcoming")
- "time": Specific time of day OR estimated duration (e.g., "3:00 PM", "2 hours", "Before 5 PM"). Use null if not mentioned.
- "priority": "High", "Medium", or "Low" — infer from urgency/importance
- "description": 1–2 sentence plain-English summary of what the task involves and any relevant context from the audio. Be specific and helpful.

=== FLASHCARD EXTRACTION (Concept-Oriented) ===
- Extract technical definitions, laws, formulas, theorems, or module-specific concepts from the audio.
- Ground each flashcard topic in the KTU B.Tech syllabus (e.g., "Module 2: Semiconductor Devices", "Unit 3: Graph Theory").
- Write "front" as a clear exam-style question and "back" as a precise, concise answer.
- Lecture audio (explanations, definitions) should produce ONLY flashcards, never tasks.

=== KTU ALIGNMENT ===
- Subject field must use KTU course code + name (e.g., "CST201: Discrete Computational Structures", "EST130: Basics of Electrical Engineering").
- If a subject is mentioned generally (e.g., "physics", "maths"), map it to the most likely KTU course.
- Use KTU-specific deadline terms where applicable: "Series Exam 1", "Series Exam 2", "Assignment 1", "Lab Internal", "Viva", "External Exam".

=== OUTPUT FORMAT (Strict JSON only — no extra text, no markdown, no explanation) ===
{{
  "tasks": [
    {{
      "title": "Task title",
      "subject": "CST201: Example Subject",
      "due_date": "Friday",
      "time": "3:00 PM",
      "priority": "High",
      "description": "Brief description of what the task involves."
    }}
  ],
  "flashcards": [
    {{ "topic": "Module Concept", "cards": [{{ "front": "Question", "back": "Answer" }}] }}
  ]
}}
"""
    
    try:
        response = text_model.generate_content(prompt)
        print(f"🤖 Gemini Raw Response: {response.text}") # LOGGING
        
        # Robust JSON Extraction
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        
        # If Gemini adds conversational text, find the first '{' and last '}'
        start_idx = clean_json.find("{")
        end_idx = clean_json.rfind("}")
        
        if start_idx != -1 and end_idx != -1:
            clean_json = clean_json[start_idx : end_idx + 1]
            
        data = json.loads(clean_json)
        print(f"✅ Parsed Data: {json.dumps(data, indent=2)}")

        db = SessionLocal()
        
        # Save Tasks
        task_count = 0
        for task in data.get("tasks", []):
            parsed_id = parse_uid(user_id)
            new_task = TaskDB(
                user_id=cast(parsed_id, PG_UUID) if parsed_id else None,
                title=task.get("title"),
                subject=task.get("subject"),
                due_date=task.get("due_date"),
                time=task.get("time"),
                priority=task.get("priority"),
                description=task.get("description"),
            )
            db.add(new_task)
            task_count += 1
            
        # Save Flashcards
        card_count = 0
        for deck in data.get("flashcards", []):
            parsed_id = parse_uid(user_id)
            new_deck = FlashcardDB(
                user_id=cast(parsed_id, PG_UUID) if parsed_id else None,
                topic=deck.get("topic"),
                content=deck.get("cards")
            )
            db.add(new_deck)
            card_count += 1
        
        db.commit()
        db.close()
        
        print(f"💾 Saved for user '{user_id}': {task_count} tasks, {card_count} flashcard decks.")
        return {"status": "success", "text": transcribed_text, "data": data}

    except Exception as e:
        print(f"❌ AI Analysis Error: {e}")
        return {"status": "error", "message": str(e)}


# ────────────────────────────────────────────────────────────────
# ONE-SHOT REPAIR: backfill user_id on all orphaned records
# Call once from the browser: GET /api/repair-user-data?user_id=XXX
# ────────────────────────────────────────────────────────────────
@app.get("/api/repair-user-data")
def repair_user_data(user_id: str):
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    db = SessionLocal()
    try:
        uid = parse_uid(user_id)
        orphan_tasks = db.query(TaskDB).filter(TaskDB.user_id == None).all()
        orphan_cards = db.query(FlashcardDB).filter(FlashcardDB.user_id == None).all()
        for t in orphan_tasks:
            t.user_id = uid
        for c in orphan_cards:
            c.user_id = uid
        db.commit()
        msg = f"✅ Repaired {len(orphan_tasks)} tasks, {len(orphan_cards)} flashcard decks → assigned to user '{user_id}'"
        print(msg)
        return {"status": "ok", "repaired_tasks": len(orphan_tasks), "repaired_flashcards": len(orphan_cards)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# 2. TASK MANAGEMENT (For FrontEnd)
@app.get("/api/tasks")
def get_tasks(user_id: Optional[str] = None):
    db = SessionLocal()
    if user_id:
        tasks = db.query(TaskDB).filter(TaskDB.user_id == parse_uid(user_id)).all()
    else:
        tasks = db.query(TaskDB).all()
    db.close()
    return tasks

@app.patch("/api/tasks/{task_id}")
def update_task_status(task_id: int, update: TaskUpdate):
    db = SessionLocal()
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        db.close()
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.is_completed = update.is_completed
    db.commit()
    db.close()
    return {"status": "updated", "id": task_id}

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int):
    db = SessionLocal()
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        db.close()
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    db.close()
    return {"status": "deleted", "id": task_id}

# 3a. SYLENS — Academic AI Companion
@app.post("/api/sylens/chat")
def sylens_chat(req: SylensChatRequest):
    try:
        # Build the full prompt with system instruction + history + new message
        parts = []
        if req.system:
            parts.append(req.system)
        for turn in req.history[-10:]:  # keep last 10 turns for context window efficiency
            role_label = "Student" if turn.get("role") == "user" else "Sylens"
            parts.append(f"{role_label}: {turn.get('content', '')}")
        parts.append(f"Student: {req.message}")
        parts.append("Sylens:")  # prompt Gemini to complete as Sylens

        full_prompt = "\n\n".join(parts)
        response = text_model.generate_content(full_prompt)
        reply = response.text.strip()
        # Strip any residual "Sylens:" prefix Gemini may prepend
        if reply.lower().startswith("sylens:"):
            reply = reply[7:].strip()
        return {"reply": reply}
    except Exception as e:
        print(f"❌ Sylens Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 3b. CHATBOT INTELLIGENCE (legacy endpoint — kept for compatibility)

@app.post("/api/chat")
def chat_with_ai(request: ChatRequest):
    # 1. Fetch Context from DB (The "Brain")
    db = SessionLocal()
    tasks = db.query(TaskDB).filter(TaskDB.is_completed == False).all()
    db.close()
    
    # 2. Format Context
    task_list = "\n".join([f"- {t.title} ({t.subject}) due {t.due_date}, Priority: {t.priority}" for t in tasks])
    
    # 3. Ask Gemini
    try:
        prompt = f"""
        You are Cognitek, an AI student assistant.
        Here is the student's current incomplete task list:
        {task_list}
        
        Student Question: "{request.message}"
        
        Answer the student based on their list. If they ask "What do I have to do?", summarize the high priority items first. Keep it friendly and concise.
        """
        
        response = text_model.generate_content(prompt)
        return {"response": response.text}
    except Exception as e:
        print(f"❌ Chat Error: {e}")
        return {"response": "I'm having trouble thinking right now. Please try again."}

# 4. FLASHCARDS (For Feature Lead)
@app.get("/api/flashcards")
def get_flashcards(user_id: Optional[str] = None):
    db = SessionLocal()
    if user_id:
        cards = db.query(FlashcardDB).filter(FlashcardDB.user_id == parse_uid(user_id)).all()
    else:
        cards = db.query(FlashcardDB).all()
    db.close()
    return cards

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)