import { createClient } from '@supabase/supabase-js';

// 빌드 시점에는 체크하지 않고, 런타임에만 체크
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 빈 문자열로 초기화하여 빌드 시점 오류 방지
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key');

// 환경 변수 검증 함수 (런타임에만 호출)
export function validateSupabaseConfig() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }
}

