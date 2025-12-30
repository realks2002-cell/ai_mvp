import { NextRequest, NextResponse } from 'next/server';
import { supabase, validateSupabaseConfig } from '@/lib/supabase';
import { openai, validateOpenAIConfig } from '@/lib/openai';
import { AskRequest, AskResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 검증 (런타임에만 실행)
    validateSupabaseConfig();
    validateOpenAIConfig();

    // 요청 본문 파싱
    const body: AskRequest = await request.json();
    const { userInput } = body;

    // 입력 검증
    if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
      return NextResponse.json<AskResponse>(
        {
          success: false,
          error: '사용자 입력이 필요합니다.',
        },
        { status: 400 }
      );
    }

    // 1. Supabase에서 System Prompt 조회 (최신 순으로 정렬하여 가장 최근 것 가져오기)
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('system_prompt')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (promptError) {
      console.error('System Prompt 조회 실패:', promptError);
      return NextResponse.json<AskResponse>(
        {
          success: false,
          error: `System Prompt 조회 중 오류가 발생했습니다: ${promptError.message}`,
        },
        { status: 500 }
      );
    }

    if (!promptData || !promptData.system_prompt) {
      console.error('System Prompt가 존재하지 않습니다.');
      return NextResponse.json<AskResponse>(
        {
          success: false,
          error: 'System Prompt가 설정되지 않았습니다. 관리자에게 문의하세요.',
        },
        { status: 500 }
      );
    }

    const systemPrompt = promptData.system_prompt.trim();

    // 2. OpenAI API 호출 (타임아웃 설정 포함)
    let aiOutput: string;
    try {
      // API 키 확인
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey === 'placeholder-key') {
        console.error('OpenAI API 키가 설정되지 않았습니다.');
        throw new Error('OPENAI_API_KEY_NOT_SET');
      }

      console.log('OpenAI API 호출 시작:', {
        model: 'gpt-3.5-turbo',
        hasApiKey: !!apiKey,
        apiKeyPrefix: apiKey.substring(0, 7) + '...',
      });

      const completion = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-3.5-turbo', // gpt-4o-mini 대신 gpt-3.5-turbo 사용
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userInput.trim(),
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 30000) // 30초 타임아웃
        ),
      ]) as any;

      console.log('OpenAI API 응답 받음:', {
        hasChoices: !!completion?.choices,
        choicesLength: completion?.choices?.length,
        hasContent: !!completion?.choices?.[0]?.message?.content,
      });

      if (!completion.choices || !completion.choices[0]?.message?.content) {
        console.error('AI 응답이 비어있습니다:', completion);
        throw new Error('AI 응답이 비어있습니다.');
      }

      aiOutput = completion.choices[0].message.content;
    } catch (openaiError: any) {
      // 상세한 에러 로깅
      console.error('OpenAI API 호출 실패:', {
        message: openaiError?.message,
        status: openaiError?.status,
        code: openaiError?.code,
        response: openaiError?.response,
        stack: openaiError?.stack,
        fullError: openaiError,
      });

      // 타임아웃 에러 처리
      if (openaiError.message === 'TIMEOUT' || openaiError.code === 'ETIMEDOUT') {
        return NextResponse.json<AskResponse>(
          {
            success: false,
            error: 'AI 응답 생성 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
          },
          { status: 504 }
        );
      }

      // OpenAI API 에러 객체 확인
      const errorStatus = openaiError?.status || openaiError?.response?.status;
      const errorCode = openaiError?.code;
      const errorMessage = openaiError?.message || '';

      // 토큰 초과 에러 처리
      if (
        errorCode === 'context_length_exceeded' ||
        errorMessage.includes('context_length_exceeded') ||
        errorMessage.includes('maximum context length') ||
        errorMessage.includes('token')
      ) {
        return NextResponse.json<AskResponse>(
          {
            success: false,
            error: '입력 내용이 너무 깁니다. 더 짧은 텍스트로 다시 시도해주세요.',
          },
          { status: 400 }
        );
      }

      // Rate Limit 에러 처리
      if (errorStatus === 429 || errorCode === 'rate_limit_exceeded' || errorMessage.includes('rate limit')) {
        return NextResponse.json<AskResponse>(
          {
            success: false,
            error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          },
          { status: 429 }
        );
      }

      // API 키 미설정 오류
      if (openaiError.message === 'OPENAI_API_KEY_NOT_SET') {
        console.error('OpenAI API 키가 설정되지 않았습니다.');
        return NextResponse.json<AskResponse>(
          {
            success: false,
            error: 'AI 서비스 설정에 문제가 있습니다. 관리자에게 문의하세요.',
          },
          { status: 500 }
        );
      }

      // 인증 오류 (API 키 문제)
      if (errorStatus === 401 || errorMessage.includes('authentication') || errorMessage.includes('API key') || errorMessage.includes('Invalid API key')) {
        console.error('OpenAI API 인증 오류 - API 키를 확인하세요:', {
          status: errorStatus,
          message: errorMessage,
        });
        return NextResponse.json<AskResponse>(
          {
            success: false,
            error: 'AI 서비스 인증에 실패했습니다. API 키를 확인해주세요.',
          },
          { status: 401 }
        );
      }

      // 서버 오류 (OpenAI 서버 문제)
      if (errorStatus === 500 || errorStatus === 502 || errorStatus === 503) {
        return NextResponse.json<AskResponse>(
          {
            success: false,
            error: 'AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
          },
          { status: 503 }
        );
      }

      // 기타 OpenAI API 에러
      if (errorStatus || errorCode) {
        return NextResponse.json<AskResponse>(
          {
            success: false,
            error: 'AI 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          },
          { status: 500 }
        );
      }

      // 알 수 없는 에러 - 더 상세한 정보 반환 (개발용)
      const errorDetails = {
        message: errorMessage,
        status: errorStatus,
        code: errorCode,
        type: openaiError?.constructor?.name,
        hasResponse: !!openaiError?.response,
      };
      
      console.error('알 수 없는 OpenAI API 오류:', errorDetails);
      
      // 개발 환경에서는 상세 오류 반환
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return NextResponse.json<AskResponse>(
        {
          success: false,
          error: isDevelopment 
            ? `AI 응답 생성 중 문제가 발생했습니다: ${errorMessage || '알 수 없는 오류'} (Status: ${errorStatus || 'N/A'}, Code: ${errorCode || 'N/A'})`
            : 'AI 응답 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        },
        { status: 500 }
      );
    }

    // 3. 로그를 Supabase에 저장 (created_at은 DB에서 자동 생성되므로 제외)
    const trimmedInput = userInput.trim();
    const { error: logError } = await supabase
      .from('logs')
      .insert({
        user_input: trimmedInput,
        ai_output: aiOutput,
      });

    if (logError) {
      // 로그 저장 실패는 치명적이지 않으므로 경고만 출력하고 응답은 정상 반환
      console.error('로그 저장 실패 (응답은 정상 반환):', logError);
      console.error('로그 저장 실패 상세:', {
        message: logError.message,
        details: logError.details,
        hint: logError.hint,
      });
    } else {
      console.log('로그 저장 성공');
    }

    // 4. 성공 응답 반환
    return NextResponse.json<AskResponse>({
      success: true,
      message: aiOutput,
    });
  } catch (error: any) {
    console.error('API 처리 중 예상치 못한 오류:', error);
    return NextResponse.json<AskResponse>(
      {
        success: false,
        error: `서버 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`,
      },
      { status: 500 }
    );
  }
}

