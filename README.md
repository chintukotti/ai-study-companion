# AI Study Companion

A full-stack AI-powered study companion that helps students learn from their PDF documents through intelligent tutoring, adaptive quizzes, and mastery tracking.

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   React Frontend │────▶│  Express Backend  │────▶│  Python Service   │
│  Vite + shadcn   │     │  Node.js + TS     │     │  FastAPI + OCR    │
│  Port: 5173      │     │  Port: 3001       │     │  Port: 8000       │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │                        │
         │                        ▼
         │               ┌──────────────────┐     ┌──────────────────┐
         └──────────────▶│  Supabase        │     │  Gemini API       │
                         │  Auth + DB + Store│     │  Embeddings + Gen │
                         └──────────────────┘     └──────────────────┘
```

## ✨ Features

- **📚 Spaces & Projects** — Organize study materials into workspaces
- **📄 PDF Processing** — Upload PDFs with automatic text extraction and OCR
- **🤖 AI Tutor** — Chat with an AI tutor grounded in your documents with page citations
- **📝 Adaptive Quizzes** — MCQ and open-ended quizzes that adapt to your mastery level
- **📊 Mastery Tracking** — Track concept mastery and learning growth over time
- **💡 Smart Recommendations** — AI-generated personalized next-action suggestions
- **📈 Analytics** — Comprehensive learning analytics and activity tracking
- **🔐 Admin Dashboard** — System monitoring and AI usage tracking

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query, Zustand, Recharts |
| Backend | Node.js, Express, TypeScript, Zod, @google/genai, @supabase/supabase-js |
| Document Processing | Python 3.11+, FastAPI, PyMuPDF, pytesseract, Pillow |
| Database | Supabase PostgreSQL + pgvector |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI | Gemini API (text-embedding-004 + gemini-2.0-flash) |

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Tesseract OCR** (optional, for scanned PDFs)
  - Windows: [UB-Mannheim installer](https://github.com/UB-Mannheim/tesseract/wiki)
  - Linux: `sudo apt install tesseract-ocr`
  - macOS: `brew install tesseract`
- **Supabase** account (free tier works)
- **Google Gemini API** key

## 🚀 Quick Start

### 1. Clone and install dependencies

```bash
# Install root dependencies
npm install

# Install all service dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd python-service && python -m venv venv
# Windows: .\venv\Scripts\activate
# Linux/Mac: source venv/bin/activate
pip install -r requirements.txt && cd ..
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file: `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL, anon key, and service role key

### 3. Configure environment variables

```bash
# Copy the example and fill in your values
cp .env.example .env

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase and Gemini credentials

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your Supabase URL and anon key
```

### 4. Start all services

```bash
# Start everything (backend + frontend + python service)
npm run dev
```

Or start individually:
```bash
# Terminal 1: Python service
cd python-service && uvicorn app.main:app --port 8000 --reload

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

### 5. Access the application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Python Service**: http://localhost:8000/health

## 📁 Project Structure

```
AI TUTOR/
├── frontend/                    # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/          # UI components (layout, auth, tutor, quiz, etc.)
│   │   ├── pages/               # Route-level pages
│   │   ├── hooks/               # TanStack Query hooks
│   │   ├── stores/              # Zustand stores
│   │   ├── lib/                 # API client, Supabase client, utils
│   │   └── types/               # TypeScript interfaces
│   └── ...
├── backend/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/              # Express route handlers
│   │   ├── middleware/          # Auth, validation, error handling
│   │   ├── services/            # Business logic
│   │   │   ├── ai/              # Gemini AI services
│   │   │   ├── rag/             # RAG pipeline
│   │   │   ├── documents/       # Document processing
│   │   │   ├── mastery/         # Mastery tracking
│   │   │   └── analytics/       # Analytics
│   │   ├── jobs/                # Background jobs
│   │   └── lib/                 # Config, clients
│   └── ...
├── python-service/              # FastAPI document processor
│   ├── app/
│   │   ├── main.py              # FastAPI endpoints
│   │   ├── extractor.py         # PyMuPDF + OCR
│   │   └── chunker.py           # Text chunking
│   └── requirements.txt
├── supabase/
│   └── migrations/              # Database schema
├── docs/                        # Documentation
└── package.json                 # Root orchestration
```

## 🔒 Security

- **Row Level Security (RLS)** on all database tables
- **JWT verification** on every API request
- **Prompt injection protection** in AI system prompts
- **File validation** (PDF only, 25MB max)
- **Multi-tenant data isolation** via space membership

## 📖 Documentation

- [Architecture Guide](docs/architecture.md)
- [API Reference](docs/api-reference.md)
- [AI Evaluation & Usage](docs/ai-evaluation.md)

## ⚠️ Known Limitations

- No real-time WebSocket updates (uses polling for processing status)
- English-only OCR by default
- In-process job queue (not distributed)
- Free-tier Supabase limits apply (500MB DB, 1GB storage)
- No collaborative real-time features

## 🔮 Future Improvements

- WebSocket/SSE for real-time streaming
- Multi-language OCR support
- Spaced repetition review scheduling
- Collaborative study spaces
- Mobile PWA support
- Export/import learning data
- LMS integration

## 📄 License

MIT
