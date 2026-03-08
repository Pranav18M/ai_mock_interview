# 🤖 InterviewAI — AI-Powered Mock Interview Platform

A full-stack web application that simulates real job interviews using AI. Candidates answer voice questions from an animated AI interviewer, receive instant scoring, and get detailed feedback reports.

---

## 📸 Features

- 🎙️ **Live Voice Interview** — Split-screen video call UI with webcam + AI robot avatar
- 🧠 **AI-Generated Questions** — Tailored to your resume, role, and experience level
- 📄 **Resume Analysis** — Upload PDF, AI extracts skills and projects automatically
- 📊 **Real-Time Scoring** — Technical knowledge, communication, and relevance scored per answer
- 📋 **Detailed Reports** — Strengths, improvements, skill suggestions, study topics
- 📈 **Progress Tracking** — Full history of all sessions and scores
- 🔐 **JWT Authentication** — Secure signup/login system
- 📱 **Fully Responsive** — Mobile, tablet, and desktop

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python FastAPI |
| Database | MongoDB Atlas |
| AI | Google Gemini 2.5 Flash |
| Speech | Web Speech API (browser-native) |
| Auth | JWT (python-jose) |
| PDF Parsing | pdfplumber |

---

## 📁 Project Structure

```
ai-mock-interview/
├── README.md
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env                     # ⚠️ Never commit this
│   ├── .gitignore
│   ├── config/
│   │   └── database.py          # MongoDB + settings
│   ├── models/
│   │   ├── user.py
│   │   ├── resume.py
│   │   └── interview.py
│   ├── routes/
│   │   ├── auth.py              # /auth/signup, /auth/login
│   │   ├── resume.py            # /resume/upload, /resume/
│   │   └── interview.py         # /interview/* endpoints
│   ├── services/
│   │   ├── ai_service.py        # Gemini API
│   │   ├── resume_parser.py     # PDF extraction
│   │   └── auth_service.py      # Password hashing
│   └── utils/
│       └── jwt_handler.py
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    ├── .env                     # ⚠️ Never commit this
    ├── .gitignore
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── context/
        │   └── AuthContext.jsx
        ├── services/
        │   └── api.js
        ├── hooks/
        │   ├── useSpeechSynthesis.js
        │   └── useSpeechRecognition.js
        ├── components/
        │   └── AppLayout.jsx
        └── pages/
            ├── Landing.jsx
            ├── Login.jsx
            ├── Signup.jsx
            ├── Explore.jsx
            ├── InterviewHub.jsx
            ├── Scores.jsx
            ├── ResumeUpload.jsx
            ├── LiveInterview.jsx
            └── InterviewReport.jsx
```

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB Atlas account (free tier)
- Google AI Studio account (free Gemini API key)

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/ai-mock-interview.git
cd ai-mock-interview
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate — Windows
venv\Scripts\Activate.ps1

# Activate — Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create `backend/.env`:

```env
MONGODB_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ai_mock_interview?retryWrites=true&w=majority
DATABASE_NAME=ai_mock_interview
JWT_SECRET=your_super_secret_key_change_this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

- API running at: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

App running at: `http://localhost:5173`

---

## 🔑 Getting API Keys

### MongoDB Atlas
1. Visit [mongodb.com/atlas](https://www.mongodb.com/atlas) → create free cluster
2. Database Access → add a user with password
3. Network Access → add IP `0.0.0.0/0` for development
4. Connect → copy connection string into `.env`

### Gemini API Key
1. Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API Key** → copy into `.env`

> ⚠️ **Warning:** If your Gemini key is pushed to a public GitHub repo, Google auto-revokes it. Always use `.env` and keep it in `.gitignore`.

---

## 🌐 API Reference

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| POST | `/auth/signup` | Register new user | ❌ |
| POST | `/auth/login` | Login, receive JWT | ❌ |
| POST | `/resume/upload` | Upload + parse PDF resume | ✅ |
| GET | `/resume/` | Get current resume data | ✅ |
| POST | `/interview/generate-questions` | AI generates 5 questions | ✅ |
| POST | `/interview/submit-answer` | Submit + score one answer | ✅ |
| POST | `/interview/complete/{id}` | Finalize + generate report | ✅ |
| GET | `/interview/history` | All past sessions | ✅ |
| GET | `/interview/report/{id}` | Full report for session | ✅ |

---

## 🎯 How It Works

```
User signs up / logs in
        ↓
Uploads PDF resume → Gemini extracts skills, projects, experience
        ↓
Selects job role (e.g. Frontend Developer) + difficulty (beginner/intermediate/advanced)
        ↓
Backend calls Gemini API → generates 5 tailored interview questions
        ↓
Live interview screen:
  ┌──────────────────┬──────────────────┐
  │  AI Robot Image  │  User Webcam     │
  │  (video call)    │  (live feed)     │
  └──────────────────┴──────────────────┘
  AI reads question aloud → User speaks answer → Transcript captured
        ↓
Each answer scored by Gemini (1–10):
  • Technical knowledge
  • Communication clarity
  • Relevance to question
        ↓
After 5 questions → Full report generated:
  • Overall score ring
  • Per-question breakdown (expandable)
  • Strengths / Areas to improve
  • Skill suggestions + study topics
```

---

## 📱 Responsive Design

| Breakpoint | Layout |
|------------|--------|
| Mobile `< 768px` | Hamburger nav, stacked video panels, single column |
| Tablet `768–900px` | Horizontal nav, no image panel, 2-col grids |
| Desktop `> 900px` | Full split layout, sticky image panel, 4-col grids |

---

## 🚀 Production Deployment

### Backend — Railway / Render / Fly.io

```bash
# Start command
uvicorn main:app --host 0.0.0.0 --port $PORT

# Set all .env variables in your platform dashboard
# Update CORS in main.py to allow only your frontend domain
```

### Frontend — Vercel / Netlify

```bash
npm run build
# Deploy the dist/ folder
# Set environment variable: VITE_API_URL=https://your-backend-url.com
```

---

## 🛠️ Development Notes

| Note | Detail |
|------|--------|
| Speech Recognition | Requires Chrome or Edge — Firefox not supported |
| Webcam | Browser permission prompt on first interview load |
| CORS | Set to `allow_origins=["*"]` in dev — restrict for production |
| LiveInterview routing | Requires `location.state` from setup page — direct URL access shows "No questions found" |
| Gemini model | Uses `gemini-2.5-flash` — free tier with generous limits |

---

## 📦 Backend Dependencies

```
fastapi==0.115.0
uvicorn
motor                  # Async MongoDB driver
pymongo
pydantic==2.10.6
python-jose            # JWT tokens
passlib                # Password hashing
bcrypt==4.0.1
pdfplumber             # PDF text extraction
httpx                  # Async HTTP client (Gemini calls)
python-multipart       # File upload
email-validator
python-dotenv
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Pranav** — Full Stack Developer

---

*Built with React, FastAPI, MongoDB Atlas, and Google Gemini AI*