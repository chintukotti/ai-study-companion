export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: "user" | "admin"
  created_at: string
  updated_at: string
}

export interface Space {
  id: string
  name: string
  description?: string
  created_by: string
  created_at: string
  updated_at: string
  member_count?: number
  project_count?: number
}

export interface SpaceMember {
  id: string
  space_id: string
  user_id: string
  role: "owner" | "admin" | "member"
  created_at: string
  profiles?: Profile
}

export interface Project {
  id: string
  space_id: string
  name: string
  description?: string
  status: "active" | "archived"
  created_by: string
  created_at: string
  updated_at: string
  document_count?: number
}

export interface Document {
  id: string
  project_id: string
  space_id: string
  title: string
  file_path: string
  file_size: number
  file_type: string
  status: "uploading" | "processing" | "ready" | "failed"
  page_count?: number
  error_message?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProcessingJob {
  id: string
  document_id: string
  status: "queued" | "processing" | "completed" | "failed"
  progress: number
  total_pages?: number
  total_chunks?: number
  error_message?: string
  attempts: number
  started_at?: string
  completed_at?: string
}

export interface ChatSession {
  id: string
  project_id: string
  user_id: string
  title: string
  message_count: number
  created_at: string
  updated_at: string
}

export interface Citation {
  document_id: string
  page_number: number
  quote: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: "user" | "assistant" | "system"
  content: string
  citations?: Citation[]
  is_unsupported?: boolean
  metadata?: Record<string, any>
  created_at: string
}

export interface TutorResponse {
  sessionId: string
  message: ChatMessage
  isUnsupported: boolean
  unsupportedReason?: string
  topicsDiscussed: string[]
}

export interface Quiz {
  id: string
  project_id: string
  user_id: string
  title: string
  quiz_type: "mcq" | "open_ended" | "mixed"
  difficulty: "beginner" | "intermediate" | "advanced"
  question_count: number
  topic?: string
  created_at: string
  quiz_questions?: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question_type: "mcq" | "open_ended"
  question: string
  options?: string[]
  correct_answer: string
  correct_option_index?: number
  explanation?: string
  blooms_level?: string
  concept?: string
  page_references?: number[]
  sort_order: number
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  score?: number
  total_questions: number
  correct_count: number
  status: "in_progress" | "completed"
  started_at: string
  completed_at?: string
  quiz_answers?: QuizAnswer[]
}

export interface QuizAnswer {
  id: string
  attempt_id: string
  question_id: string
  user_answer?: string
  selected_option_index?: number
  is_correct?: boolean
  ai_evaluation?: {
    score?: number
    is_correct?: boolean
    strengths?: string[]
    misconceptions?: string[]
    feedback?: string
    explanation?: string
  }
  score?: number
}

export interface Concept {
  id: string
  project_id: string
  name: string
  description?: string
  related_pages?: number[]
}

export interface ConceptMastery {
  id: string
  concept_id: string
  user_id: string
  project_id: string
  mastery_level: number
  total_attempts: number
  correct_attempts: number
  last_assessed_at?: string
  concept?: Concept
}

export interface GrowthSnapshot {
  id: string
  user_id: string
  project_id: string
  overall_mastery: number
  concepts_mastered: number
  total_concepts: number
  quiz_count: number
  avg_score?: number
  snapshot_data?: Record<string, any>
  created_at: string
}

export interface Recommendation {
  id: string
  user_id: string
  project_id: string
  rec_type: "review" | "quiz" | "read" | "practice" | "explore"
  title: string
  description: string
  priority: number
  metadata?: Record<string, any>
  is_completed: boolean
  completed_at?: string
  created_at: string
}

export interface ActivityEvent {
  id: string
  user_id: string
  space_id?: string
  project_id?: string
  event_type: string
  event_data?: Record<string, any>
  created_at: string
}

export interface AIUsageLog {
  id: string
  user_id?: string
  model: string
  operation: string
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  latency_ms?: number
  cost_estimate?: number
  success: boolean
  error_message?: string
  created_at: string
}

export interface ProjectAnalytics {
  documentCount: number
  chatCount: number
  quizCount: number
  avgScore: number
  overallMastery: number
  recentActivity: ActivityEvent[]
}

export interface AdminStats {
  totalUsers: number
  totalSpaces: number
  totalDocuments: number
  totalChats: number
  totalQuizzes: number
  totalAICalls: number
  successRate: number
}
