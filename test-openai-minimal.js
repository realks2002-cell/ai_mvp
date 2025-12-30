// 최소 테스트 코드 - OpenAI Responses API
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function test() {
  try {
    console.log('🔍 환경 변수 확인:', {
      hasApiKey: !!process.env.OPENAI_API_KEY,
      apiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'UNDEFINED',
    });
    
    console.log('🔍 OpenAI 클라이언트 확인:', {
      hasClient: !!client,
      hasResponses: !!client.responses,
      hasResponsesCreate: typeof client.responses?.create === 'function',
    });
    
    console.log('🚀 API 호출 시작...');
    const res = await client.responses.create({
      model: "gpt-4o-mini",
      input: "ping",
    });
    
    console.log('✅ 성공!');
    console.log('응답:', res.output_text);
  } catch (error) {
    console.error('❌ 오류 발생:');
    console.error('메시지:', error.message);
    console.error('타입:', error.constructor?.name);
    console.error('스택:', error.stack);
    console.error('전체 에러:', error);
  }
}

test();

