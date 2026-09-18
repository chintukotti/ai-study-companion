export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Space {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface SpaceMember {
  space_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface Project {
  id: string;
  space_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  title: string;
  file_path: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  page_number: number;
  embedding: number[];
  created_at: string;
}

export interface ProcessingJob {
  id: string;
  document_id: string;
  status: string;
  progress: number;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  created_at: string;
}

export interface Quiz {
  id: string;
  project_id: string;
  topic: string;
  difficulty: string;
  type: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  type: string;
  options?: string[];
  correct_answer: string;
  correct_option_index?: number;
  explanation: string;
  blooms_level: string;
  concept: string;
  page_references: number[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  completed_at: string;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  user_answer: string;
  selected_option_index?: number;
  is_correct: boolean;
  score: number;
  feedback: string;
}

export interface Concept {
  id: string;
  project_id: string;
  name: string;
  description: string;
}

export interface ConceptMastery {
  id: string;
  user_id: string;
  concept_id: string;
  mastery_level: number;
  last_tested_at: string;
}

export interface GrowthSnapshot {
  id: string;
  user_id: string;
  project_id: string;
  snapshot_date: string;
  mastery_data: any;
}

export interface Recommendation {
  id: string;
  user_id: string;
  project_id: string;
  type: string;
  title: string;
  description: string;
  priority: number;
  metadata: any;
  status: string;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  user_id: string;
  event_type: string;
  space_id?: string;
  project_id?: string;
  event_data: any;
  created_at: string;
}

export interface AIUsageLog {
  id: string;
  user_id: string;
  model: string;
  operation: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  success: boolean;
  error?: string;
  created_at: string;
}

export interface Citation {
  document_id: string;
  page_number: number;
  quote: string;
}
