# 문제 해결 가이드

## 🔍 "AI 응답 생성 중 문제가 발생했습니다" 오류 해결

이 오류는 OpenAI API 호출 중 문제가 발생했을 때 나타납니다.

### 1단계: Vercel 함수 로그 확인

1. [Vercel 대시보드](https://vercel.com/kenny-project/ai_mvp) 접속
2. **Deployments** 탭 클릭
3. 최신 배포 클릭
4. **Functions** 탭 클릭
5. `/api/ask` 함수 클릭
6. **Logs** 섹션에서 에러 메시지 확인

또는 터미널에서:

```bash
vercel logs ai_mvp --follow
```

### 2단계: 일반적인 원인 및 해결 방법

#### 원인 1: OpenAI API 키 문제

**증상:**
- 로그에 "authentication" 또는 "API key" 관련 오류

**해결:**
1. [OpenAI Platform](https://platform.openai.com/api-keys)에서 API 키 확인
2. Vercel 환경 변수 확인:
   ```bash
   vercel env ls
   ```
3. API 키 재설정:
   ```bash
   vercel env rm OPENAI_API_KEY production
   vercel env add OPENAI_API_KEY production
   ```
4. 재배포:
   ```bash
   vercel --prod
   ```

#### 원인 2: OpenAI API 사용량 한도 초과

**증상:**
- 로그에 "rate limit" 또는 "quota" 관련 오류

**해결:**
1. [OpenAI Usage](https://platform.openai.com/usage)에서 사용량 확인
2. 결제 정보 확인
3. 잠시 후 재시도

#### 원인 3: 네트워크 타임아웃

**증상:**
- 로그에 "TIMEOUT" 또는 "ETIMEDOUT" 오류

**해결:**
1. 잠시 후 재시도
2. 입력 텍스트 길이 줄이기
3. Vercel 함수 타임아웃 설정 확인 (기본 10초)

#### 원인 4: API 응답 형식 오류

**증상:**
- 로그에 "choices" 또는 "message" 관련 오류

**해결:**
1. OpenAI API 모델 확인 (`gpt-4o-mini` 사용 중)
2. API 응답 구조 확인

### 3단계: 로컬에서 테스트

로컬에서 테스트하여 문제를 재현:

```bash
# 환경 변수 설정 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://xhtypwekfsxiqguissln.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key

# 개발 서버 실행
npm run dev
```

### 4단계: API 직접 테스트

Postman 또는 curl로 API 직접 테스트:

```bash
curl -X POST https://aimvp-five.vercel.app/api/ask \
  -H "Content-Type: application/json" \
  -d '{"userInput": "안녕하세요"}'
```

### 5단계: OpenAI API 키 유효성 확인

터미널에서 직접 테스트:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

정상 응답이 오면 API 키는 유효합니다.

## 📋 체크리스트

- [ ] Vercel 함수 로그 확인
- [ ] OpenAI API 키 유효성 확인
- [ ] OpenAI 사용량 한도 확인
- [ ] 환경 변수 설정 확인
- [ ] Supabase 테이블 생성 확인
- [ ] 네트워크 연결 확인

## 🔧 추가 디버깅

### 상세 로그 활성화

코드에 더 자세한 로그를 추가하려면 `app/api/ask/route.ts`를 수정:

```typescript
console.error('OpenAI API 호출 상세:', {
  model: 'gpt-4o-mini',
  messages: messages,
  error: openaiError,
});
```

### 환경 변수 확인

Vercel에서 환경 변수가 제대로 로드되는지 확인:

```typescript
console.log('Environment check:', {
  hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  hasOpenAIKey: !!process.env.OPENAI_API_KEY,
});
```

## 💡 빠른 해결 방법

1. **Vercel 재배포**
   ```bash
   vercel --prod
   ```

2. **환경 변수 재확인**
   ```bash
   vercel env ls
   ```

3. **OpenAI API 키 재설정**
   - Vercel 대시보드에서 환경 변수 삭제 후 재추가
   - 재배포

4. **짧은 텍스트로 테스트**
   - 긴 입력 대신 짧은 텍스트로 테스트

## 📞 추가 지원

문제가 계속되면:
1. Vercel 함수 로그 전체 내용 확인
2. OpenAI API 상태 확인: https://status.openai.com/
3. 에러 메시지 전체 내용 공유

