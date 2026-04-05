from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text, JSON, cast, text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from pydantic import BaseModel
import google.generativeai as genai
import shutil
import os
import uuid as uuid_lib
import json
import tempfile
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv
try:
    from groq import Groq as GroqClient
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("⚠️  groq package not installed — chat-fast endpoint will use Gemini fallback.")

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
text_model = genai.GenerativeModel('gemini-2.5-flash') # Labeled as 2.5 in UI

# ── Groq (Tier 2 — Lightweight, fast chat) ─────────────────────────────────
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    try:
        with open("groq_key.txt", "r") as f:
            GROQ_API_KEY = f.read().strip()
    except FileNotFoundError:
        pass

groq_client = None
if GROQ_AVAILABLE and GROQ_API_KEY:
    groq_client = GroqClient(api_key=GROQ_API_KEY)
    print("✅ Groq (Llama 3) initialized — chat-fast endpoint ready.")
else:
    print("⚠️  Groq not configured — /api/sylens/chat-fast will fall back to Gemini.")

# 2. DATABASE CONFIGURATION
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
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

class PlacementMilestoneDB(Base):
    __tablename__ = "placement_milestones"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True, index=True)
    title = Column(String)           # e.g. "Infosys Off-Campus Drive"
    company = Column(String, nullable=True)
    due_date = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    is_done = Column(Boolean, default=False)
    created_at = Column(String, default=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

class ExamSessionDB(Base):
    __tablename__ = "exam_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True, index=True)
    subject_name = Column(String, nullable=True)   # e.g. "Discrete Computational Structures"
    subject_code = Column(String, nullable=True)   # e.g. "CST201"
    exam_date = Column(String, nullable=True)       # e.g. "2025-04-10" or "April 10"
    exam_time = Column(String, nullable=True)       # e.g. "10:00 AM"
    venue = Column(String, nullable=True)           # e.g. "Main Hall"
    is_completed = Column(Boolean, default=False)
    created_at = Column(String, default=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

Base.metadata.create_all(bind=engine)

# --- SAFE SCHEMA MIGRATION ---
# create_all() won't modify existing tables, so we manually add any
# missing columns here. ADD COLUMN IF NOT EXISTS is a no-op if already present.
def run_migrations():
    """
    Guarded migration block. Only runs PostgreSQL-specific 
    syntax if connected to a Postgres database.
    """
    if engine.dialect.name == 'postgresql':
        print("🚀 Detected PostgreSQL: Running production migrations...")
        migration_statements = [
            "ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS user_id UUID;",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID;",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time VARCHAR;",
            "ALTER TABLE placement_milestones ADD COLUMN IF NOT EXISTS user_id UUID;",
            "ALTER TABLE placement_milestones ADD COLUMN IF NOT EXISTS company VARCHAR;",
            "ALTER TABLE placement_milestones ADD COLUMN IF NOT EXISTS due_date VARCHAR;",
            "ALTER TABLE placement_milestones ADD COLUMN IF NOT EXISTS notes TEXT;",
            "ALTER TABLE placement_milestones ADD COLUMN IF NOT EXISTS is_done BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS subject_name VARCHAR;",
            "ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS subject_code VARCHAR;",
            "ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS exam_date VARCHAR;",
            "ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS exam_time VARCHAR;",
            "ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS venue VARCHAR;",
            "ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS user_id UUID;",
        ]
        with engine.connect() as conn:
            for stmt in migration_statements:
                try:
                    conn.execute(text(stmt))
                    conn.commit()
                except Exception as e:
                    # Logs but doesn't crash if column already exists
                    print(f"⚠️  Migration detail: {e}")
    else:
        print("ℹ️  Detected SQLite/Other: Skipping Postgres-only migrations.")

try:
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
    is_completed: Optional[bool] = None
    title: Optional[str] = None
    subject: Optional[str] = None
    due_date: Optional[str] = None
    time: Optional[str] = None
    priority: Optional[str] = None
    description: Optional[str] = None

class PlacementUpdate(BaseModel):
    is_done: Optional[bool] = None
    title: Optional[str] = None
    company: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None

class ExamUpdate(BaseModel):
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    exam_date: Optional[str] = None
    exam_time: Optional[str] = None
    venue: Optional[str] = None
    is_completed: Optional[bool] = None

class ExamCreate(BaseModel):
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    exam_date: Optional[str] = None
    exam_time: Optional[str] = None
    venue: Optional[str] = None
    user_id: Optional[str] = None

class ChatRequest(BaseModel):
    message: str

class SylensChatRequest(BaseModel):
    message: str
    history: list = []
    system: str = ""

app = FastAPI()
@app.get("/")
def read_root(): return {"status": "active", "brain": "Gemini 2.5 Flash", "version": "2.1.4"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. HARDWARE VALIDATION & WHISPER LOAD
print("------------------------------------------------")
print("🚀 COGNITEK SERVER STARTING (Cloud Mode)...")
print("✅ Using Groq Whisper API for transcription")
print("✅ Using Gemini for AI analysis")
print("------------------------------------------------")

# 5. API ENDPOINTS



@app.post("/api/process-audio")
def process_audio(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None),
    subjects: Optional[str] = Form(None),
):
    # Use system temp dir instead of local uploads/
    # Cloud instances don't have persistent storage
    with tempfile.NamedTemporaryFile(
        suffix=f"_{file.filename}", 
        delete=False
    ) as tmp:
        shutil.copyfileobj(file.file, tmp)
        temp_filename = tmp.name
    
    print(f"🎤 Processing: {file.filename} | user_id received: '{user_id}'")
    
     # ── Groq Whisper Transcription (replaces local Whisper) ──
    transcribed_text = ""
    try:
        if not groq_client:
            raise Exception("Groq client not initialized. Check GROQ_API_KEY.")
        
        with open(temp_filename, "rb") as audio_file:
            transcription = groq_client.audio.transcriptions.create(
                file=(file.filename, audio_file.read()),
                model="whisper-large-v3",
                response_format="text",
                language="en",
            )
        transcribed_text = transcription
        print(f"📝 Transcribed: {transcribed_text[:80]}...")
    
    except Exception as e:
        print(f"❌ Transcription Error: {e}")
        return {"status": "error", "message": f"Transcription failed: {str(e)}"}
    
    finally:
        # Always clean up temp file
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
    
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
- "description": A quick tip or breakdown of what the task is and how to proceed (e.g., if the task is "Submit Tutorial assignment on mergesort", the description could be "Tutorial can be written in the tutorial book. Should include the working of mergesort with example.") Write it as actionable advice. Do NOT mention the audio.

=== EXAM SCHEDULE EXTRACTION (Class Test Only) ===
Your DEFAULT output for "exam_schedules" is ALWAYS an empty array: [].
Upgrade it ONLY if the audio explicitly mentions exam schedules/dates.
IMPORTANT: Only extract "Class Test" exams. Do NOT extract Semester Exams, Series Exams, or other types.
For each exam detected, extract:
- "subject": Subject name (map to enrolled subjects if possible)
- "subject_code": KTU course code if available
- "exam_type": MUST be "Class Test" (only this type)
- "exam_date": Date mentioned (e.g., "Monday", "April 15", "Next week Tuesday")
- "exam_time": Time mentioned (e.g., "2 PM", "10:30 AM"). Use null if not mentioned.
- "venue": Classroom/hall name mentioned. Use null if not mentioned.

=== FLASHCARD EXTRACTION (Concept-Oriented) ===
- Extract technical definitions, laws, formulas, theorems, or module-specific concepts from the audio.
- Ground each flashcard topic in the KTU B.Tech syllabus (e.g., "Module 2: Semiconductor Devices", "Unit 3: Graph Theory").
- Write "front" as a clear exam-style question and "back" as a precise, concise answer.
- Lecture audio (explanations, definitions) should produce ONLY flashcards, never tasks.

=== KTU ALIGNMENT ===
- Subject field must use KTU course code + name (e.g., "CST201: Discrete Computational Structures", "EST130: Basics of Electrical Engineering").
- If a subject is mentioned generally (e.g., "physics", "maths"), map it to the most likely KTU course.
- Use KTU-specific deadline terms where applicable: "Series Exam 1", "Series Exam 2", "Assignment 1", "Lab Internal", "Viva", "External Exam".

=== PLACEMENT EXCEPTION RULE ===
Your DEFAULT output for "placement_milestones" is ALWAYS an empty array: [].
Upgrade it ONLY if the audio explicitly mentions campus/off-campus placements, internships, company names
(e.g., Infosys, TCS, Wipro, Cognizant, Accenture, Google, etc.), recruitment drives, interview rounds,
apatitude tests, or placement preparation advice. If none of this is present, output [].
Fields for each placement milestone:
- "title": Short descriptive name (e.g., "Infosys Off-Campus Drive")
- "company": Company name, or null if not mentioned
- "due_date": Date or deadline mentioned, or "Upcoming" if vague
- "notes": 1–2 sentence context from the audio

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
  ],
  "exam_schedules": [
    {{ "subject": "Subject Name", "subject_code": "CST201", "exam_type": "Class Test", "exam_date": "Monday", "exam_time": "2 PM", "venue": "A101" }}
  ],
  "placement_milestones": [
    {{ "title": "Example Drive", "company": "Infosys", "due_date": "April 15", "notes": "Off-campus drive mentioned in recording." }}
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

        # Save Placement Milestones (exception case)
        placement_count = 0
        for pm in data.get("placement_milestones", []):
            parsed_id = parse_uid(user_id)
            new_pm = PlacementMilestoneDB(
                user_id=cast(parsed_id, PG_UUID) if parsed_id else None,
                title=pm.get("title"),
                company=pm.get("company"),
                due_date=pm.get("due_date"),
                notes=pm.get("notes"),
            )
            db.add(new_pm)
            placement_count += 1

        # Save Exam Schedules (from audio detection)
        exam_count = 0
        for exam in data.get("exam_schedules", []):
            parsed_id = parse_uid(user_id)
            new_exam = ExamSessionDB(
                user_id=cast(parsed_id, PG_UUID) if parsed_id else None,
                subject_name=exam.get("subject"),
                subject_code=exam.get("subject_code"),
                exam_date=exam.get("exam_date"),
                exam_time=exam.get("exam_time"),
                venue=exam.get("venue"),
            )
            db.add(new_exam)
            exam_count += 1
        
        db.commit()
        db.close()
        
        print(f"💾 Saved for user '{user_id}': {task_count} tasks, {card_count} flashcard decks, {exam_count} exam schedules, {placement_count} placement milestones.")
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
    
    if update.is_completed is not None:
        task.is_completed = update.is_completed
    if update.title is not None:
        task.title = update.title
    if update.subject is not None:
        task.subject = update.subject
    if update.due_date is not None:
        task.due_date = update.due_date
    if update.time is not None:
        task.time = update.time
    if update.priority is not None:
        task.priority = update.priority
    if update.description is not None:
        task.description = update.description
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

# 3a. SYLENS — Academic AI Companion (Gemini — heavy quality)
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

# 3b. SYLENS FAST CHAT — Groq / Llama 3 (Tier 2 — lightweight, fast)
@app.post("/api/sylens/chat-fast")
def sylens_chat_fast(req: SylensChatRequest):
    """Fast chat endpoint using Groq's Llama 3. Falls back to Gemini if Groq is unavailable."""
    # ── Groq path ──────────────────────────────────────────────────────────────
    if groq_client:
        try:
            messages = []
            if req.system:
                messages.append({"role": "system", "content": req.system})
            for turn in req.history[-10:]:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                messages.append({"role": role, "content": content})
            messages.append({"role": "user", "content": req.message})

            response = groq_client.chat.completions.create(
                model="llama3-8b-8192",
                messages=messages,
                max_tokens=768,
                temperature=0.7,
            )
            reply = response.choices[0].message.content.strip()
            return {"reply": reply, "model": "groq/llama3-8b"}
        except Exception as e:
            print(f"⚠️  Groq failed, falling back to Gemini: {e}")
    # ── Gemini fallback ──────────────────────────────────────────────────────
    try:
        parts = []
        if req.system:
            parts.append(req.system)
        for turn in req.history[-10:]:
            role_label = "Student" if turn.get("role") == "user" else "Sylens"
            parts.append(f"{role_label}: {turn.get('content', '')}")
        parts.append(f"Student: {req.message}")
        parts.append("Sylens:")
        response = text_model.generate_content("\n\n".join(parts))
        reply = response.text.strip()
        if reply.lower().startswith("sylens:"):
            reply = reply[7:].strip()
        return {"reply": reply, "model": "gemini-fallback"}
    except Exception as e:
        print(f"❌ Sylens Chat-Fast Gemini Fallback Error: {e}")
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

# 5. PLACEMENT MILESTONES
@app.get("/api/placement-milestones")
def get_placement_milestones(user_id: Optional[str] = None):
    db = SessionLocal()
    if user_id:
        milestones = db.query(PlacementMilestoneDB).filter(
            PlacementMilestoneDB.user_id == parse_uid(user_id)
        ).order_by(PlacementMilestoneDB.id.desc()).all()
    else:
        milestones = db.query(PlacementMilestoneDB).order_by(PlacementMilestoneDB.id.desc()).all()
    db.close()
    return milestones

@app.patch("/api/placement-milestones/{milestone_id}")
def update_placement_milestone(milestone_id: int, update: PlacementUpdate):
    db = SessionLocal()
    pm = db.query(PlacementMilestoneDB).filter(PlacementMilestoneDB.id == milestone_id).first()
    if not pm:
        db.close()
        raise HTTPException(status_code=404, detail="Milestone not found")
    if update.is_done is not None:
        pm.is_done = update.is_done
    if update.title is not None:
        pm.title = update.title
    if update.company is not None:
        pm.company = update.company
    if update.due_date is not None:
        pm.due_date = update.due_date
    if update.notes is not None:
        pm.notes = update.notes
    db.commit()
    db.close()
    return {"status": "updated", "id": milestone_id}

@app.delete("/api/placement-milestones/{milestone_id}")
def delete_placement_milestone(milestone_id: int):
    db = SessionLocal()
    pm = db.query(PlacementMilestoneDB).filter(PlacementMilestoneDB.id == milestone_id).first()
    if not pm:
        db.close()
        raise HTTPException(status_code=404, detail="Milestone not found")
    db.delete(pm)
    db.commit()
    db.close()
    return {"status": "deleted", "id": milestone_id}

# 6. EXAM SESSIONS
@app.get("/api/exam-sessions")
def get_exam_sessions(user_id: Optional[str] = None):
    db = SessionLocal()
    if user_id:
        sessions = db.query(ExamSessionDB).filter(
            ExamSessionDB.user_id == parse_uid(user_id)
        ).order_by(ExamSessionDB.exam_date).all()
    else:
        sessions = db.query(ExamSessionDB).order_by(ExamSessionDB.exam_date).all()
    db.close()
    return sessions

@app.post("/api/exam-sessions")
def create_exam_session(exam: ExamCreate):
    db = SessionLocal()
    uid = parse_uid(exam.user_id)
    new_exam = ExamSessionDB(
        user_id=uid,
        subject_name=exam.subject_name,
        subject_code=exam.subject_code,
        exam_date=exam.exam_date,
        exam_time=exam.exam_time,
        venue=exam.venue,
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)
    db.close()
    return new_exam

@app.patch("/api/exam-sessions/{exam_id}")
def update_exam_session(exam_id: int, update: ExamUpdate):
    db = SessionLocal()
    exam = db.query(ExamSessionDB).filter(ExamSessionDB.id == exam_id).first()
    if not exam:
        db.close()
        raise HTTPException(status_code=404, detail="Exam not found")
    for field, val in update.dict(exclude_none=True).items():
        setattr(exam, field, val)
    db.commit()
    db.close()
    return {"status": "updated", "id": exam_id}

@app.delete("/api/exam-sessions/{exam_id}")
def delete_exam_session(exam_id: int):
    db = SessionLocal()
    exam = db.query(ExamSessionDB).filter(ExamSessionDB.id == exam_id).first()
    if not exam:
        db.close()
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(exam)
    db.commit()
    db.close()
    return {"status": "deleted", "id": exam_id}

# 7. TIMETABLE IMAGE PARSING
@app.post("/api/parse-timetable-image")
async def parse_timetable_image(file: UploadFile = File(...)):
    """
    Accept an image of a class timetable, send it to Gemini Vision,
    and return structured JSON representing the weekly schedule.
    """
    import base64

    try:
        contents = await file.read()
        b64_image = base64.b64encode(contents).decode("utf-8")

        # Determine MIME type
        mime = file.content_type or "image/jpeg"

        vision_model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = """You are analyzing an image of a college class timetable.
Extract the schedule and return it as strict JSON.

The time slots span from 09:00 to 16:00 (9 AM to 4 PM), with 1-hour periods.
Use these exact slot keys: "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"
Days must use these exact keys: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"

For each slot, return an object: { "subject": "Subject Name", "type": "class" }
For break/lunch periods: { "type": "break" }
For free/empty periods: omit the key entirely.

Return ONLY a JSON object in this exact format, no extra text:
{
  "Monday": {
    "09:00": { "subject": "Digital Signal Processing", "type": "class" },
    "12:00": { "type": "break" }
  },
  "Tuesday": { ... }
}

If you cannot read the timetable clearly, return { "error": "Could not parse timetable" }
"""

        response = vision_model.generate_content([
            prompt,
            {"mime_type": mime, "data": b64_image}
        ])

        raw = response.text.strip()
        # Strip markdown code fences if present
        raw = raw.replace("```json", "").replace("```", "").strip()
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1:
            raw = raw[start:end + 1]

        parsed = json.loads(raw)
        if "error" in parsed:
            return {"status": "error", "message": parsed["error"]}

        print(f"✅ Timetable parsed: {list(parsed.keys())} days")
        return {"status": "success", "timetable": parsed}

    except Exception as e:
        print(f"❌ Timetable parse error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)