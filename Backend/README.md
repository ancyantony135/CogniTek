# 🚀 COGNITEK: Personilized AI Assistant for Students
 ## Electrical and Computer Engineering

Cognitek is a personalized, hands-free AI assistant designed to help students manage their academic life. It captures spoken instructions via a wearable device, processes them using **Whisper (STT)** and **Gemini 1.5 Flash (NLU)**, and automatically schedules tasks and creates study materials.

---

## 🏗️ Project Structure
The repository is organized into three specialized modules to allow the team to work in parallel:

```text
COGNITEK_SERVER/
├── Backend/                # FastAPI Server & AI Logic (Whisper, Gemini)
│   ├── automationmodule.md # Benil's Scraper workspace
│   ├── main.py             # Primary API Gateway
│   └── requirements.txt
├── Frontend/           # React Dashboard (Elvin's Workspace)
│   └── cognitek_web/   # Frontend Integration Guide inside
    └── FRONTEND_INTEGRATION.md
└── Database/           # Centralized Storage
    └── database/       # Shared SQLite (cognitek.db)
```


## ⚡ Current Technical Status
### Hardware: Backend is optimized for NVIDIA CUDA using an RTX 3060 Laptop GPU.

### Environment: Running on Python 3.14 (Nightly builds for CUDA compatibility).

### AI Engine: Whisper: Local GPU-accelerated transcription.

### Gemini: Context-aware task extraction and chat.

### Handshake: CORS is enabled for local frontend development on port 5173.


## 🤝 Team Handover & Roadmap

### Member            Focus Area                    Resource
#### Hans:                 
Lead Architect / Backend      Managing GPU Server & AI logic.
#### Elvin:                
Frontend (React)              See FRONTEND_INTEGRATION.md for API calls.
#### Benil:                
Automation (Scraping)         See Automation module.md in Database folder.
#### Nikhil:               
IoT (Wearable Band)           Handshake logic for ESP32 audio streaming.


