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

# --- CONFIGURATION ---
# Ensure your api_key.txt is in the same folder as main.py
with open("api_key.txt", "r") as f:
    GEMINI_API_KEY = f.read().strip()

# --- DATABASE SETUP ---
# ".." tells it to look in the parallel Database folder if you moved it
# If you kept it inside Backend, use "sqlite:///./database/cognitek.db"
DATABASE_URL = "sqlite:///./database/cognitek.db"
os.makedirs("database", exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- DB MODELS ---
class TaskDB(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
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

# --- PYDANTIC MODELS (For Frontend Inputs) ---
class TaskUpdate(BaseModel):
    is_completed: bool

class ChatRequest(BaseModel):
    message: str

# --- APP SETUP ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows Elvin's React app (localhost:5173) to connect
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LOAD AI MODELS ---
print("------------------------------------------------")
print("🚀 COGNITEK ARCHITECT SERVER STARTING...")
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"✅ GPU Mode: {device.upper()}")

# Load Whisper
audio_model = whisper.load_model("small", device=device)

# Load Gemini
genai.configure(api_key=GEMINI_API_KEY)
# Note: Use 'gemini-1.5-flash' or 'gemini-pro' if 2.5 is not yet available in your region
text_model = genai.GenerativeModel('gemini-1.5-flash') 
print("✅ Server Ready.")
print("------------------------------------------------")

# --- UTILS ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- API ENDPOINTS ---

# 1. AUDIO PROCESSING (The "Ears")
@app.post("/api/process-audio")
async def process_audio(file: UploadFile = File(...)):
    # Save Temp File
    temp_filename = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Transcribe
    print(f"🎤 Processing: {file.filename}...")
    result = audio_model.transcribe(temp_filename)
    transcribed_text = result["text"]
    
    # Intelligent Analysis
    prompt = f"""
    Analyze this student audio: "{transcribed_text}"
    
    If it's a task/reminder, return JSON type "task".
    If it's a concept/lecture, return JSON type "flashcards".
    
    FORMAT FOR TASK:
    {{ "type": "task", "title": "...", "subject": "...", "due_date": "...", "priority": "High/Medium/Low" }}
    
    FORMAT FOR FLASHCARDS:
    {{ "type": "flashcards", "topic": "...", "cards": [{{"front": "...", "back": "..."}}] }}
    
    Return ONLY raw JSON.
    """
    
    try:
        response = text_model.generate_content(prompt)
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)
        
        db = SessionLocal()
        saved_id = None
        
        if data["type"] == "task":
            new_entry = TaskDB(
                title=data.get("title"),
                subject=data.get("subject"),
                due_date=data.get("due_date"),
                priority=data.get("priority")
            )
            db.add(new_entry)
            db.commit()
            db.refresh(new_entry)
            saved_id = new_entry.id
            print(f"💾 Task Saved: {new_entry.title}")
            
        elif data["type"] == "flashcards":
            new_entry = FlashcardDB(
                topic=data.get("topic"),
                content=data.get("cards")
            )
            db.add(new_entry)
            db.commit()
            db.refresh(new_entry)
            saved_id = new_entry.id
            print(f"💾 Flashcards Saved: {new_entry.topic}")

        db.close()
        return {"status": "success", "text": transcribed_text, "type": data["type"], "id": saved_id}

    except Exception as e:
        print(f"❌ Error: {e}")
        return {"status": "error", "message": str(e)}

# 2. TASK MANAGEMENT (For Elvin)
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

# 3. CHATBOT INTELLIGENCE (For Nikhil)
@app.post("/api/chat")
def chat_with_ai(request: ChatRequest):
    # 1. Fetch Context from DB (The "Brain")
    db = SessionLocal()
    tasks = db.query(TaskDB).filter(TaskDB.is_completed == False).all()
    db.close()
    
    # 2. Format Context
    task_list = "\n".join([f"- {t.title} ({t.subject}) due {t.due_date}, Priority: {t.priority}" for t in tasks])
    
    # 3. Ask Gemini
    prompt = f"""
    You are Cognitek, an AI student assistant.
    Here is the student's current incomplete task list:
    {task_list}
    
    Student Question: "{request.message}"
    
    Answer the student based on their list. If they ask "What do I have to do?", summarize the high priority items first. Keep it friendly and concise.
    """
    
    response = text_model.generate_content(prompt)
    return {"response": response.text}

# 4. FLASHCARDS (For Nikhil)
@app.get("/api/flashcards")
def get_flashcards():
    db = SessionLocal()
    cards = db.query(FlashcardDB).all()
    db.close()
    return cards

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)