# Deployment Guide 🚀

Follow these steps to make your website **publicly accessible** to everyone.

## 1. Push Code to GitHub
Ensure your latest code is on GitHub.
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

---

## 2. Deploy Backend (The Brain) on Render.com
Render provides free hosting for Python/FastAPI.

1.  **Sign Up/Login** to [Render.com](https://render.com).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository (`CogniTek`).
4.  **Configure Settings:**
    - **Root Directory**: `Backend`
    - **Runtime**: `Python 3`
    - **Build Command**: `pip install -r requirements.txt`
    - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
5.  **Environment Variables (Important!)**:
    - Scroll down to "Environment Variables".
    - Add Key: `GEMINI_API_KEY`
    - Add Value: *(Paste your actual Gemini API Key here)*
    - Add Key: `PYTHON_VERSION` -> `3.10.0`
6.  Click **Create Web Service**.
7.  **Wait**: Render will build your app. Once done, it will give you a public URL (e.g., `https://cognitek-backend.onrender.com`). **Copy this URL.**

---

## 3. Deploy Frontend (The Interface) on Vercel
Vercel is great for React apps.

1.  **Sign Up/Login** to [Vercel.com](https://vercel.com).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository (`CogniTek`).
4.  **Configure Settings:**
    - **Framework Preset**: Vite
    - **Root Directory**: Click "Edit" and select `Frontend/cognitek_web`.
5.  **Environment Variables**:
    - Click "Environment Variables".
    - Add Key: `VITE_API_URL`
    - Add Value: `https://cognitek-backend.onrender.com/api` (Paste the Render URL you copied earlier, add `/api` at the end).
6.  Click **Deploy**.

## 🎉 Done!
Vercel will give you a public link (e.g., `https://cognitek.vercel.app`).
You can now send this link to anyone, and they can access your app!
