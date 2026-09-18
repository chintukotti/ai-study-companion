# AI Study Companion — Architecture Guide

## System Architecture

The AI Study Companion follows a microservices architecture with three main services communicating via HTTP REST APIs, backed by Supabase for data persistence and Gemini API for AI capabilities.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  React Frontend (Vite + TypeScript + Tailwind + shadcn/ui)    │  │
│  │  - Auth UI (Supabase Auth direct)                             │  │
│  │  - API calls via Axios with JWT interceptor                   │  │
│  │  - State: Zustand + TanStack Query                            │  │
│  └───────────────────────┬───────────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────────┘
                           │ HTTP + JWT Bearer Token
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    EXPRESS BACKEND (Port 3001)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────────────┐  │
│  │ Auth MW   │  │ Validate │  │ Error Handler                    │  │
│  │ (JWT)     │  │ (Zod)    │  │ (Structured errors)              │  │
│  └──────────┘  └──────────┘  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     ROUTE HANDLERS                            │   │
│  │  /auth  /spaces  /projects  /documents  /tutor  /quizzes     │   │
│  │  /mastery  /analytics  /admin                                 │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│  ┌──────────────────────────▼───────────────────────────────────┐   │
│  │                    SERVICE LAYER                               │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐  │   │
│  │  │ AI Services │  │ RAG Pipeline│  │ Document Processor     │  │   │
│  │  │ - Tutor     │  │ - Retriever │  │ - Upload to Storage    │  │   │
│  │  │ - Quiz      │  │ - Context   │  │ - Call Python Service  │  │   │
│  │  │ - Evaluate  │  │ - Pipeline  │  │ - Store Embeddings     │  │   │
│  │  │ - Recommend │  │             │  │                        │  │   │
│  │  │ - Embed     │  │             │  │                        │  │   │
│  │  └──────┬─────┘  └──────┬─────┘  └────────┬───────────────┘  │   │
│  │  ┌──────┴─────┐  ┌──────┴─────┐  ┌────────┴───────────────┐  │   │
│  │  │ Mastery    │  │ Learning   │  │ Analytics              │  │   │
│  │  │ Tracker    │  │ Context    │  │ Events + Aggregation   │  │   │
│  │  └────────────┘  └────────────┘  └────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└───────────┬───────────────────┬──────────────────────┬─────────────┘
            │                   │                      │
            ▼                   ▼                      ▼
┌───────────────────┐  ┌────────────────┐  ┌──────────────────────┐
│  PYTHON SERVICE   │  │   SUPABASE     │  │    GEMINI API        │
│  (Port 8000)      │  │                │  │                      │
│  ┌─────────────┐  │  │  ┌──────────┐  │  │  text-embedding-004  │
│  │ PyMuPDF     │  │  │  │ PostgreSQL│  │  │  (768-dim embeddings)│
│  │ Text Extract│  │  │  │ + pgvector│  │  │                      │
│  ├─────────────┤  │  │  ├──────────┤  │  │  gemini-2.0-flash    │
│  │ Tesseract   │  │  │  │ Auth     │  │  │  (generation)        │
│  │ OCR Fallback│  │  │  ├──────────┤  │  │                      │
│  ├─────────────┤  │  │  │ Storage  │  │  │  Structured JSON     │
│  │ Recursive   │  │  │  │ (PDFs)   │  │  │  output via schema   │
│  │ Chunker     │  │  │  ├──────────┤  │  │                      │
│  └─────────────┘  │  │  │ RLS      │  │  └──────────────────────┘
└───────────────────┘  │  │ Policies │  │
                       │  └──────────┘  │
                       └────────────────┘
```

## Data Flow

### Document Processing Pipeline

```
User uploads PDF
       │
       ▼
[Express Backend]
  1. Validate file (PDF, <25MB)
  2. Upload to Supabase Storage
  3. Create document record (status: uploading)
  4. Create processing job
       │
       ▼
[Background Job]
  5. Download PDF from Storage
  6. Send to Python Service
       │
       ▼
[Python Service]
  7. Open PDF with PyMuPDF
  8. For each page:
     - Extract native text
     - If text < 50 chars → OCR fallback (Tesseract @ 300 DPI)
  9. Chunk text (1000 chars, 150 overlap)
  10. Return pages + chunks
       │
       ▼
[Express Backend - continued]
  11. Generate embeddings via Gemini (text-embedding-004)
      - Batch embed chunks (up to 100 per request)
      - Task type: RETRIEVAL_DOCUMENT
  12. Store chunks + embeddings in document_chunks table
  13. Update document status → 'ready'
  14. Update processing job → 'completed'
```

### RAG Query Pipeline

```
User asks question
       │
       ▼
[Express Backend]
  1. Embed query via Gemini (text-embedding-004, RETRIEVAL_QUERY)
  2. Vector similarity search via Supabase RPC
     - match_document_chunks(embedding, threshold=0.55, limit=8)
     - Filtered by project_id
  3. Build context from top-K chunks
     - Include page numbers for citation
  4. Load learning context (user's weak areas, recent topics)
  5. Load recent chat history
       │
       ▼
[Gemini API - gemini-2.0-flash]
  6. System prompt with:
     - Tutor role definition
     - RAG context with page numbers
     - Citation instructions
     - Prompt injection protection
     - Unsupported question detection
  7. Generate structured JSON response:
     - answer (with [Page X] citations inline)
     - citations array
     - is_unsupported flag
     - topics_discussed
       │
       ▼
[Express Backend - continued]
  8. Save messages to chat_messages
  9. Update learning context
  10. Track AI usage (model, tokens, latency, cost)
  11. Return response to frontend
```

### Quiz & Mastery Pipeline

```
User requests quiz
       │
       ▼
[Express Backend]
  1. Retrieve relevant chunks for topic
  2. Load current mastery data
       │
       ▼
[Gemini API]
  3. Generate quiz (structured JSON):
     - Questions adapted to mastery level
     - Bloom's taxonomy levels
     - Page references
       │
       ▼
User takes quiz and submits answers
       │
       ▼
[Express Backend]
  4. For MCQ: direct comparison
  5. For open-ended: AI evaluation via Gemini
     - Score, strengths, misconceptions, feedback
  6. Update concept_mastery table
     - Weighted scoring (recent attempts weighted more)
  7. Create growth snapshot
  8. Generate new recommendations
  9. Track activity event
```

## Security Model

### Authentication
- Supabase Auth handles user registration, login, JWT issuance
- Frontend gets JWT from Supabase Auth client
- Backend verifies JWT on every request via supabaseAdmin.auth.getUser()
- User-scoped Supabase client created per request for RLS enforcement

### Row Level Security (RLS)
- Every table has RLS enabled
- Security definer helper functions prevent infinite recursion:
  - `is_space_member(space_id, user_id)` 
  - `get_space_role(space_id, user_id)`
  - `is_admin_user(user_id)`
- Data isolation: users can only see data in spaces they belong to
- Personal data (chats, quizzes, mastery) isolated by user_id

### Prompt Injection Protection
- System prompts include explicit boundary instructions
- User input wrapped in `<user_query>` delimiters
- Content filtering before sending to Gemini
- Structured JSON output prevents free-form manipulation

## Database Design

### Entity Relationships
- **User** → has many **Spaces** (via space_members)
- **Space** → has many **Projects**
- **Project** → has many **Documents** → has many **Chunks** (with embeddings)
- **Project** → has many **Chat Sessions** → has many **Messages**
- **Project** → has many **Quizzes** → has many **Questions**
- **Project** → has many **Concepts** → has many **Mastery** records

### Key Design Decisions
1. **pgvector HNSW index** for fast cosine similarity search (no pre-training needed)
2. **Page-bounded chunking** ensures 100% accurate page citations
3. **Space-based multi-tenancy** with membership roles (owner/admin/member)
4. **Idempotent processing** prevents duplicate chunk generation on retries
