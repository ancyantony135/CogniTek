from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import whisper
import google.generativeai as genai
import shutil
import os
import json
import torch
from datetime import datetime

# --- CONFIGURATION ---
with open("api_key.txt", "r") as f:
    GEMINI_API_KEY = f.read().strip()

# --- DATABASE SETUP (The "Memory" for Benil) ---
DATABASE_URL = "sqlite:///./database/cognitek.db"
os.makedirs("database", exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 1. Table for Tasks (Benil's Scheduling Domain)
class TaskDB(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    subject = Column(String)
    due_date = Column(String)  # Benil will parse this later
    priority = Column(String)
    is_completed = Column(Boolean, default=False)
    created_at = Column(String, default=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

# 2. Table for Flashcards (Nikhil's Feature Domain)
class FlashcardDB(Base):
    __tablename__ = "flashcards"
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String)
    content = Column(JSON) # Stores the Q&A pairs as JSON
    created_at = Column(String, default=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

# Create the file
Base.metadata.create_all(bind=engine)

# --- APP SETUP ---
app = FastAPI()

# Allow Elvin's React Frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LOAD AI MODELS ---
print("------------------------------------------------")
print("🚀 COGNITEK ARCHITECT SERVER STARTING...")
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"✅ GPU Mode: {device.upper()}")

# Load Whisper (RTX 3060)
audio_model = whisper.load_model("small", device=device)

# Load Gemini (2.5 Flash for Speed)
genai.configure(api_key=GEMINI_API_KEY)
text_model = genai.GenerativeModel('gemini-2.5-flash') 
print("✅ Server Ready for Requests.")
print("------------------------------------------------")

# --- UTILS ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ENDPOINTS ---

@app.post("/process-audio")
async def process_audio(file: UploadFile = File(...)):
    # 1. Save Audio
    temp_filename = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 2. Transcribe
    print(f"🎤 Processing: {file.filename}...")
    result = audio_model.transcribe(temp_filename)
    transcribed_text = result["text"]
    
    # 3. Intelligent Sorting (Task vs Flashcard)
    prompt = f"""
    Analyze this student audio text: "{transcribed_text}"
    
    If it is a command/reminder (e.g., "Submit assignment"), return JSON with "type": "task".
    If it is a lecture/concept (e.g., "Explain Thermodynamics"), return JSON with "type": "flashcards".
    
    FORMAT FOR TASK:
    {{
        "type": "task",
        "title": "Brief title",
        "subject": "Subject or General",
        "due_date": "Date mentioned or 'None'",
        "priority": "High/Medium/Low"
    }}
    
    FORMAT FOR FLASHCARDS:
    {{
        "type": "flashcards",
        "topic": "Main Topic",
        "cards": [{{"front": "Question", "back": "Answer"}}]
    }}
    
    Return ONLY raw JSON.
    """
    
    try:
        response = text_model.generate_content(prompt)
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)
        
        # 4. Save to correct Table
        db = SessionLocal()
        
        if data["type"] == "task":
            new_entry = TaskDB(
                title=data.get("title"),
                subject=data.get("subject"),
                due_date=data.get("due_date"),
                priority=data.get("priority")
            )
            db.add(new_entry)
            print(f"💾 Task Saved: {new_entry.title}")
            
        elif data["type"] == "flashcards":
            new_entry = FlashcardDB(
                topic=data.get("topic"),
                content=data.get("cards")
            )
            db.add(new_entry)
            print(f"💾 Flashcards Saved: {new_entry.topic}")

        db.commit()
        db.close()

        return {"status": "success", "transcription": transcribed_text, "data": data}

    except Exception as e:
        print(f"❌ Error: {e}")
        return {"status": "error", "message": str(e)}

# Endpoint for Elvin (Frontend) to fetch tasks
@app.get("/tasks")
def get_tasks():
    db = SessionLocal()
    tasks = db.query(TaskDB).all()
    db.close()
    return tasks

   
@app.get("/flashcards")
def get_flashcards():
    db = SessionLocal()
    cards = db.query(FlashcardDB).all()
    db.close()
    return cards