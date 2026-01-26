# CogniTek - Personilized AI Assistant for Students

This project contains the source code for CogniTek, consisting of a React Frontend and a FastAPI Backend.

## 🚀 How to Run Locally

### Prerequisites
- Node.js & npm
- Python 3.10+
- Gemini API Key

---

### 1️⃣ Backend Setup (The Brain)
The backend handles AI processing, database, and voice recognition.

1.  **Navigate to Backend:**
    ```bash
    cd Backend
    ```
2.  **Install Python Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **⚠️ Important: Create API Key**
    - The `api_key.txt` file is NOT included in the code (for security).
    - Create a new file named `api_key.txt` inside the `Backend` folder.
    - Paste your **Gemini API Key** inside it (just the key, no extra spaces).
4.  **Run the Server:**
    ```bash
    python main.py
    ```
    *Server will start on `http://0.0.0.0:8000`*

---

### 2️⃣ Frontend Setup (The Interface)
The frontend is the visual interface for the student.

1.  **Navigate to Frontend:**
    ```bash
    cd ../Frontend/cognitek_web
    ```
2.  **Install Libraries:**
    ```bash
    npm install
    ```
3.  **Start the App:**
    ```bash
    npm run dev
    ```
    *App will open at `http://localhost:5173`*

---

## 📂 Project Structure
- **Backend/**: Python/FastAPI server, SQLite database, AI logic.
- **Frontend/cognitek_web/**: React application, UI components.

## 🛠 Troubleshooting
- **Missing API Key**: If the backend crashes immediately, ensure you created `Backend/api_key.txt`.
- **Database**: A `database/cognitek.db` file will be created automatically on first run.
- **Dependencies**: If `npm install` fails, try deleting `node_modules` and running it again.
