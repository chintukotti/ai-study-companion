-- =====================================================
-- AI Study Companion — Complete Database Schema
-- Supabase PostgreSQL + pgvector
-- =====================================================

-- 1. Enable required extensions
create extension if not exists vector with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- User Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Spaces (top-level workspaces)
create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Space Memberships
create table if not exists public.space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now() not null,
  unique (space_id, user_id)
);

-- Projects (within spaces)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =====================================================
-- DOCUMENTS & CHUNKS
-- =====================================================

-- Documents (uploaded PDFs)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade,
  title text not null,
  file_path text not null,
  file_size integer not null default 0,
  file_type text not null default 'application/pdf',
  status text not null default 'uploading' check (status in ('uploading', 'processing', 'ready', 'failed')),
  page_count integer,
  error_message text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Document Chunks with embeddings
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade,
  chunk_index integer not null,
  page_number integer not null,
  content text not null,
  char_count integer not null default 0,
  extraction_method text default 'native',
  metadata jsonb default '{}'::jsonb not null,
  embedding extensions.vector(768) not null,
  created_at timestamptz default now() not null
);

-- Processing Jobs
create table if not exists public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  progress integer not null default 0,
  total_pages integer,
  total_chunks integer,
  error_message text,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  idempotency_key text unique,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

-- =====================================================
-- AI TUTOR & CHAT
-- =====================================================

-- Chat Sessions
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New Chat',
  message_count integer not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Chat Messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  citations jsonb default '[]'::jsonb,
  is_unsupported boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- Learning Context (persistent per project per user)
create table if not exists public.learning_context (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  summary text,
  weak_areas jsonb default '[]'::jsonb,
  strong_areas jsonb default '[]'::jsonb,
  preferences jsonb default '{}'::jsonb,
  recent_topics jsonb default '[]'::jsonb,
  updated_at timestamptz default now() not null,
  unique (project_id, user_id)
);

-- =====================================================
-- QUIZZES & ASSESSMENT
-- =====================================================

-- Quizzes
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  quiz_type text not null default 'mcq' check (quiz_type in ('mcq', 'open_ended', 'mixed')),
  difficulty text not null default 'intermediate' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  question_count integer not null default 5,
  topic text,
  created_at timestamptz default now() not null
);

-- Quiz Questions
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_type text not null check (question_type in ('mcq', 'open_ended')),
  question text not null,
  options jsonb default '[]'::jsonb,
  correct_answer text not null,
  correct_option_index integer,
  explanation text,
  blooms_level text check (blooms_level in ('Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create')),
  concept text,
  page_references jsonb default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz default now() not null
);

-- Quiz Attempts
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score numeric(5,2),
  total_questions integer not null,
  correct_count integer not null default 0,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  started_at timestamptz default now() not null,
  completed_at timestamptz
);

-- Quiz Answers
create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  user_answer text,
  selected_option_index integer,
  is_correct boolean,
  ai_evaluation jsonb default '{}'::jsonb,
  score numeric(5,2),
  created_at timestamptz default now() not null
);

-- =====================================================
-- MASTERY & GROWTH
-- =====================================================

-- Concepts
create table if not exists public.concepts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  related_pages jsonb default '[]'::jsonb,
  created_at timestamptz default now() not null,
  unique (project_id, name)
);

-- Concept Mastery (per user)
create table if not exists public.concept_mastery (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.concepts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  mastery_level numeric(5,2) not null default 0 check (mastery_level >= 0 and mastery_level <= 100),
  total_attempts integer not null default 0,
  correct_attempts integer not null default 0,
  last_assessed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (concept_id, user_id)
);

-- Growth Snapshots
create table if not exists public.growth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  overall_mastery numeric(5,2) not null default 0,
  concepts_mastered integer not null default 0,
  total_concepts integer not null default 0,
  quiz_count integer not null default 0,
  avg_score numeric(5,2),
  snapshot_data jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- Recommendations
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  rec_type text not null check (rec_type in ('review', 'quiz', 'read', 'practice', 'explore')),
  title text not null,
  description text not null,
  priority integer not null default 5 check (priority >= 1 and priority <= 10),
  metadata jsonb default '{}'::jsonb,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

-- =====================================================
-- ACTIVITY & ANALYTICS
-- =====================================================

-- Activity Events
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  space_id uuid references public.spaces(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  event_type text not null,
  event_data jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- AI Usage Logs
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  model text not null,
  operation text not null,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  latency_ms integer,
  cost_estimate numeric(10,6),
  success boolean not null default true,
  error_message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Vector search index (HNSW cosine)
create index if not exists idx_chunks_embedding_hnsw
on public.document_chunks
using hnsw (embedding extensions.vector_cosine_ops)
with (m = 16, ef_construction = 64);

-- Composite indexes for multi-tenant filtering
create index if not exists idx_space_members_user on public.space_members (user_id, space_id);
create index if not exists idx_space_members_space on public.space_members (space_id);
create index if not exists idx_projects_space on public.projects (space_id);
create index if not exists idx_documents_project on public.documents (project_id);
create index if not exists idx_documents_space on public.documents (space_id);
create index if not exists idx_chunks_project on public.document_chunks (project_id);
create index if not exists idx_chunks_document on public.document_chunks (document_id);
create index if not exists idx_chunks_space on public.document_chunks (space_id);
create index if not exists idx_chat_sessions_project on public.chat_sessions (project_id, user_id);
create index if not exists idx_chat_messages_session on public.chat_messages (session_id);
create index if not exists idx_quizzes_project on public.quizzes (project_id);
create index if not exists idx_quiz_attempts_quiz on public.quiz_attempts (quiz_id, user_id);
create index if not exists idx_concept_mastery_project on public.concept_mastery (project_id, user_id);
create index if not exists idx_activity_events_user on public.activity_events (user_id, created_at desc);
create index if not exists idx_activity_events_project on public.activity_events (project_id, created_at desc);
create index if not exists idx_ai_usage_created on public.ai_usage_logs (created_at desc);
create index if not exists idx_processing_jobs_document on public.processing_jobs (document_id);
create index if not exists idx_growth_snapshots_project on public.growth_snapshots (project_id, user_id, created_at desc);

-- =====================================================
-- SECURITY DEFINER HELPER FUNCTIONS (avoid RLS recursion)
-- =====================================================

create or replace function public.is_space_member(
  _space_id uuid,
  _user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.space_members
    where space_id = _space_id and user_id = _user_id
  );
$$;

create or replace function public.get_space_role(
  _space_id uuid,
  _user_id uuid default auth.uid()
)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.space_members
  where space_id = _space_id and user_id = _user_id
  limit 1;
$$;

create or replace function public.is_admin_user(
  _user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = _user_id and role = 'admin'
  );
$$;

-- =====================================================
-- VECTOR SEARCH RPC FUNCTION
-- =====================================================

create or replace function public.match_document_chunks(
  query_embedding extensions.vector(768),
  match_threshold float default 0.55,
  match_count int default 8,
  filter_project_id uuid default null,
  filter_document_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  project_id uuid,
  chunk_index int,
  page_number int,
  content text,
  char_count int,
  extraction_method text,
  metadata jsonb,
  similarity float
)
language plpgsql
stable
security invoker
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.project_id,
    dc.chunk_index,
    dc.page_number,
    dc.content,
    dc.char_count,
    dc.extraction_method,
    dc.metadata,
    (1 - (dc.embedding <=> query_embedding))::float as similarity
  from public.document_chunks dc
  where
    (filter_project_id is null or dc.project_id = filter_project_id)
    and (filter_document_id is null or dc.document_id = filter_document_id)
    and (1 - (dc.embedding <=> query_embedding)) >= match_threshold
  order by dc.embedding <=> query_embedding asc
  limit match_count;
end;
$$;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.projects enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.learning_context enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.concepts enable row level security;
alter table public.concept_mastery enable row level security;
alter table public.growth_snapshots enable row level security;
alter table public.recommendations enable row level security;
alter table public.activity_events enable row level security;
alter table public.ai_usage_logs enable row level security;

-- PROFILES
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update to authenticated using (auth.uid() = id);

-- SPACES
create policy "spaces_select" on public.spaces for select to authenticated
  using (public.is_space_member(id, auth.uid()));
create policy "spaces_insert" on public.spaces for insert to authenticated
  with check (auth.uid() = created_by);
create policy "spaces_update" on public.spaces for update to authenticated
  using (public.get_space_role(id, auth.uid()) in ('owner', 'admin'));
create policy "spaces_delete" on public.spaces for delete to authenticated
  using (public.get_space_role(id, auth.uid()) = 'owner');

-- SPACE MEMBERS
create policy "space_members_select" on public.space_members for select to authenticated
  using (public.is_space_member(space_id, auth.uid()));
create policy "space_members_insert" on public.space_members for insert to authenticated
  with check (
    public.get_space_role(space_id, auth.uid()) in ('owner', 'admin')
    or (auth.uid() = user_id and role = 'owner')
  );
create policy "space_members_update" on public.space_members for update to authenticated
  using (public.get_space_role(space_id, auth.uid()) in ('owner', 'admin'));
create policy "space_members_delete" on public.space_members for delete to authenticated
  using (
    public.get_space_role(space_id, auth.uid()) in ('owner', 'admin')
    or user_id = auth.uid()
  );

-- PROJECTS
create policy "projects_select" on public.projects for select to authenticated
  using (public.is_space_member(space_id, auth.uid()));
create policy "projects_insert" on public.projects for insert to authenticated
  with check (public.get_space_role(space_id, auth.uid()) in ('owner', 'admin', 'member'));
create policy "projects_update" on public.projects for update to authenticated
  using (public.get_space_role(space_id, auth.uid()) in ('owner', 'admin') or created_by = auth.uid());
create policy "projects_delete" on public.projects for delete to authenticated
  using (public.get_space_role(space_id, auth.uid()) in ('owner', 'admin') or created_by = auth.uid());

-- DOCUMENTS
create policy "documents_select" on public.documents for select to authenticated
  using (public.is_space_member(space_id, auth.uid()));
create policy "documents_insert" on public.documents for insert to authenticated
  with check (public.get_space_role(space_id, auth.uid()) in ('owner', 'admin', 'member'));
create policy "documents_update" on public.documents for update to authenticated
  using (public.is_space_member(space_id, auth.uid()));
create policy "documents_delete" on public.documents for delete to authenticated
  using (created_by = auth.uid() or public.get_space_role(space_id, auth.uid()) in ('owner', 'admin'));

-- DOCUMENT CHUNKS (service role handles insert; users read via space membership)
create policy "chunks_select" on public.document_chunks for select to authenticated
  using (public.is_space_member(space_id, auth.uid()));

-- PROCESSING JOBS
create policy "jobs_select" on public.processing_jobs for select to authenticated
  using (exists (
    select 1 from public.documents d
    where d.id = document_id and public.is_space_member(d.space_id, auth.uid())
  ));

-- CHAT SESSIONS
create policy "chat_sessions_select" on public.chat_sessions for select to authenticated
  using (user_id = auth.uid());
create policy "chat_sessions_insert" on public.chat_sessions for insert to authenticated
  with check (user_id = auth.uid());
create policy "chat_sessions_update" on public.chat_sessions for update to authenticated
  using (user_id = auth.uid());
create policy "chat_sessions_delete" on public.chat_sessions for delete to authenticated
  using (user_id = auth.uid());

-- CHAT MESSAGES
create policy "chat_messages_select" on public.chat_messages for select to authenticated
  using (exists (
    select 1 from public.chat_sessions cs
    where cs.id = session_id and cs.user_id = auth.uid()
  ));
create policy "chat_messages_insert" on public.chat_messages for insert to authenticated
  with check (exists (
    select 1 from public.chat_sessions cs
    where cs.id = session_id and cs.user_id = auth.uid()
  ));

-- LEARNING CONTEXT
create policy "learning_context_select" on public.learning_context for select to authenticated
  using (user_id = auth.uid());
create policy "learning_context_insert" on public.learning_context for insert to authenticated
  with check (user_id = auth.uid());
create policy "learning_context_update" on public.learning_context for update to authenticated
  using (user_id = auth.uid());

-- QUIZZES
create policy "quizzes_select" on public.quizzes for select to authenticated
  using (user_id = auth.uid());
create policy "quizzes_insert" on public.quizzes for insert to authenticated
  with check (user_id = auth.uid());

-- QUIZ QUESTIONS
create policy "quiz_questions_select" on public.quiz_questions for select to authenticated
  using (exists (
    select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid()
  ));

-- QUIZ ATTEMPTS
create policy "quiz_attempts_select" on public.quiz_attempts for select to authenticated
  using (user_id = auth.uid());
create policy "quiz_attempts_insert" on public.quiz_attempts for insert to authenticated
  with check (user_id = auth.uid());
create policy "quiz_attempts_update" on public.quiz_attempts for update to authenticated
  using (user_id = auth.uid());

-- QUIZ ANSWERS
create policy "quiz_answers_select" on public.quiz_answers for select to authenticated
  using (exists (
    select 1 from public.quiz_attempts qa where qa.id = attempt_id and qa.user_id = auth.uid()
  ));
create policy "quiz_answers_insert" on public.quiz_answers for insert to authenticated
  with check (exists (
    select 1 from public.quiz_attempts qa where qa.id = attempt_id and qa.user_id = auth.uid()
  ));

-- CONCEPTS
create policy "concepts_select" on public.concepts for select to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and public.is_space_member(p.space_id, auth.uid())
  ));

-- CONCEPT MASTERY
create policy "mastery_select" on public.concept_mastery for select to authenticated
  using (user_id = auth.uid());
create policy "mastery_insert" on public.concept_mastery for insert to authenticated
  with check (user_id = auth.uid());
create policy "mastery_update" on public.concept_mastery for update to authenticated
  using (user_id = auth.uid());

-- GROWTH SNAPSHOTS
create policy "growth_select" on public.growth_snapshots for select to authenticated
  using (user_id = auth.uid());
create policy "growth_insert" on public.growth_snapshots for insert to authenticated
  with check (user_id = auth.uid());

-- RECOMMENDATIONS
create policy "recs_select" on public.recommendations for select to authenticated
  using (user_id = auth.uid());
create policy "recs_insert" on public.recommendations for insert to authenticated
  with check (user_id = auth.uid());
create policy "recs_update" on public.recommendations for update to authenticated
  using (user_id = auth.uid());

-- ACTIVITY EVENTS
create policy "events_select" on public.activity_events for select to authenticated
  using (user_id = auth.uid());
create policy "events_insert" on public.activity_events for insert to authenticated
  with check (user_id = auth.uid());

-- AI USAGE LOGS (admin can see all, users see own)
create policy "ai_logs_select" on public.ai_usage_logs for select to authenticated
  using (user_id = auth.uid() or public.is_admin_user(auth.uid()));
create policy "ai_logs_insert" on public.ai_usage_logs for insert to authenticated
  with check (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Drop trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at timestamps
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger spaces_updated_at before update on public.spaces
  for each row execute function public.update_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute function public.update_updated_at();
create trigger documents_updated_at before update on public.documents
  for each row execute function public.update_updated_at();

-- =====================================================
-- STORAGE BUCKET
-- =====================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 26214400, array['application/pdf'])
on conflict (id) do nothing;

-- Storage policies
create policy "storage_select" on storage.objects for select to authenticated
  using (bucket_id = 'documents');
create policy "storage_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents');
create policy "storage_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documents');
