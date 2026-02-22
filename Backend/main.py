from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
import whisper
import google.generativeai as genai
import shutil
import os
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

# Engine setup
if "postgresql" in DATABASE_URL:
    # Port 6543 is for the pooler, which solves the IPv4 issue
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        connect_args={
            "prepare_threshold": 0 # This is CRITICAL for Supabase poolers
        }
    )
else:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TaskDB(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String)  # Add this to link tasks to Hansel!
    title = Column(String, index=True)
    subject = Column(String)
    due_date = Column(String)
    priority = Column(String)
    is_completed = Column(Boolean, default=False)
    created_at = Column(String, default=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

class FlashcardDB(Base):
    __tablename__ = "flashcards"
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String)
    content = Column(JSON)
    created_at = Column(String, default=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

Base.metadata.create_all(bind=engine)

# 3. MODELS & APP SETUP
class TaskUpdate(BaseModel):
    is_completed: bool

class ChatRequest(BaseModel):
    message: str

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
async def process_audio(file: UploadFile = File(...)):
    temp_filename = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    print(f"🎤 Processing: {file.filename}...")
    
    # Whisper Transcription
    result = audio_model.transcribe(temp_filename)
    transcribed_text = result["text"]
    print(f"📝 Transcribed: {transcribed_text[:50]}...")
    
    # AI Analysis (Uses the global text_model)
    prompt = f"""
    Analyze this student audio: "{transcribed_text}"
    Extract ALL actionable tasks and ALL study concepts found.
    FORMAT:
    {{
        "tasks": [ {{ "title": "...", "subject": "...", "due_date": "...", "priority": "High/Medium/Low" }} ],
        "flashcards": [ {{ "topic": "...", "cards": [{{ "front": "...", "back": "..." }}] }} ]
    }}
    Return ONLY raw JSON.
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
            new_task = TaskDB(
                title=task.get("title"), 
                subject=task.get("subject"), 
                due_date=task.get("due_date"), 
                priority=task.get("priority")
            )
            db.add(new_task)
            task_count += 1
            
        # Save Flashcards
        card_count = 0
        for deck in data.get("flashcards", []):
            new_deck = FlashcardDB(
                topic=deck.get("topic"), 
                content=deck.get("cards")
            )
            db.add(new_deck)
            card_count += 1
        
        db.commit()
        db.close()
        
        print(f"💾 Database Updated: {task_count} tasks, {card_count} flashcard decks added.")
        return {"status": "success", "text": transcribed_text, "data": data}

    except Exception as e:
        print(f"❌ AI Analysis Error: {e}")
        return {"status": "error", "message": str(e)}

# 2. TASK MANAGEMENT (For FrontEnd)
@app.get("/api/tasks")
def get_tasks():
    db = SessionLocal()
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

# 3. CHATBOT INTELLIGENCE (For Feature Lead)
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
def get_flashcards():
    db = SessionLocal()
    cards = db.query(FlashcardDB).all()
    db.close()
    return cards

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)