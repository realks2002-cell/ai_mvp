import OpenAI from 'openai';

// 빌드 시점에는 체크하지 않고, 런타임에만 체크
const apiKey = process.env.OPENAI_API_KEY || '';

// 빈 문자열로 초기화하여 빌드 시점 오류 방지
export const openai = new OpenAI({
  apiKey: apiKey || 'placeholder-key',
  timeout: 25000, // 25초 타임아웃
  maxRetries: 2, // 최대 2번 재시도
});

// 환경 변수 검증 함수 (런타임에만 호출)
export function validateOpenAIConfig() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
  }
}

