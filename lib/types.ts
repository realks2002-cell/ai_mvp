// Supabase 테이블 타입 정의
export interface Prompt {
  id: string;
  system_prompt: string;
  updated_at: string;
}

export interface Log {
  id?: string;
  user_input: string;
  ai_output: string;
  created_at?: string;
}

// API 요청/응답 타입
export interface AskRequest {
  userInput: string;
}

export interface AskResponse {
  success: boolean;
  message?: string;
  error?: string;
}

