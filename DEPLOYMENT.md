# Vercel 배포 가이드

## 📋 환경 변수 설정

### Vercel 대시보드에서 설정

1. Vercel 프로젝트 대시보드 접속
2. **Settings** → **Environment Variables** 메뉴 선택
3. 아래 환경 변수들을 추가:

### 필수 환경 변수

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI API 설정
OPENAI_API_KEY=sk-...
```

### 환경 변수별 설명

| 변수명 | 설명 | 공개 여부 | 예시 |
|--------|------|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ 공개 (클라이언트 노출) | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | ✅ 공개 (클라이언트 노출) | `eyJhbGc...` |
| `OPENAI_API_KEY` | OpenAI API 키 | ❌ 비공개 (서버 전용) | `sk-...` |

### 환경별 설정 (선택사항)

- **Production**: 프로덕션 환경 변수
- **Preview**: 프리뷰/브랜치별 환경 변수
- **Development**: 로컬 개발 환경 변수

> ⚠️ **중요**: `OPENAI_API_KEY`는 절대 클라이언트에 노출되면 안 됩니다. `NEXT_PUBLIC_` 접두사가 없으므로 서버 사이드에서만 사용됩니다.

---

## 🔒 보안 주의사항

### 1. API 키 보안

#### ✅ 올바른 사용
```typescript
// ✅ 서버 사이드에서만 사용 (app/api/ask/route.ts)
const apiKey = process.env.OPENAI_API_KEY; // NEXT_PUBLIC_ 없음
```

#### ❌ 잘못된 사용
```typescript
// ❌ 절대 하지 말 것!
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY; // 클라이언트 노출 위험!
```

### 2. Supabase 보안 설정

#### Row Level Security (RLS) 활성화

Supabase 대시보드에서 다음 테이블에 RLS 정책 설정:

**prompts 테이블:**
```sql
-- 읽기만 허용 (모든 사용자)
CREATE POLICY "Allow public read access"
ON prompts FOR SELECT
USING (true);
```

**logs 테이블:**
```sql
-- 삽입만 허용 (모든 사용자)
CREATE POLICY "Allow public insert access"
ON logs FOR INSERT
WITH CHECK (true);

-- 읽기는 비활성화 (선택사항)
-- 관리자만 읽을 수 있도록 설정 권장
```

### 3. Rate Limiting 고려사항

- Vercel의 기본 Rate Limit: 무료 플랜 기준 제한 있음
- OpenAI API Rate Limit: 플랜에 따라 다름
- 필요 시 Vercel Edge Middleware로 Rate Limiting 구현 고려

### 4. 환경 변수 노출 방지

#### ✅ 안전한 방법
- `.env.local` 파일은 `.gitignore`에 포함
- Vercel 대시보드에서만 환경 변수 관리
- `NEXT_PUBLIC_` 접두사는 클라이언트 노출되는 변수에만 사용

#### ❌ 위험한 방법
- 환경 변수를 코드에 하드코딩
- GitHub에 `.env` 파일 커밋
- 클라이언트 컴포넌트에서 서버 전용 변수 접근

### 5. CORS 설정

현재 설정: Next.js API Route는 같은 도메인에서만 접근 가능 (기본 설정)

외부 도메인 접근이 필요한 경우:
```typescript
// app/api/ask/route.ts
export async function POST(request: NextRequest) {
  // CORS 헤더 추가 (필요한 경우만)
  const response = NextResponse.json(...);
  response.headers.set('Access-Control-Allow-Origin', 'https://yourdomain.com');
  return response;
}
```

---

## ✅ 배포 전 체크리스트

### 1. 코드 준비

- [ ] 모든 의존성 패키지 설치 확인
- [ ] TypeScript 타입 에러 없음
- [ ] ESLint 경고 해결
- [ ] 빌드 테스트 성공 (`npm run build`)

### 2. 환경 변수 확인

- [ ] Supabase URL 및 Anon Key 설정
- [ ] OpenAI API Key 설정
- [ ] 환경 변수 이름 오타 없음
- [ ] Production 환경 변수 설정 확인

### 3. Supabase 설정

- [ ] `prompts` 테이블 생성 및 초기 데이터 입력
- [ ] `logs` 테이블 생성
- [ ] Row Level Security (RLS) 정책 설정
- [ ] 테이블 스키마 확인:
  ```sql
  -- prompts 테이블
  CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_prompt TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- logs 테이블
  CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_input TEXT NOT NULL,
    ai_output TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

### 4. API 테스트

- [ ] 로컬에서 `/api/ask` 엔드포인트 테스트
- [ ] System Prompt 조회 테스트
- [ ] OpenAI API 호출 테스트
- [ ] 로그 저장 테스트
- [ ] 에러 처리 테스트 (타임아웃, 토큰 초과 등)

### 5. 프론트엔드 테스트

- [ ] 입력 폼 정상 작동
- [ ] 로딩 상태 표시 확인
- [ ] 응답 출력 확인
- [ ] 에러 메시지 표시 확인
- [ ] 모바일 반응형 확인

### 6. 보안 점검

- [ ] `.env.local` 파일이 `.gitignore`에 포함
- [ ] API 키가 코드에 하드코딩되지 않음
- [ ] Supabase RLS 정책 설정
- [ ] 불필요한 로그 출력 제거 (프로덕션)

### 7. Vercel 배포 설정

- [ ] Vercel 프로젝트 생성
- [ ] GitHub 저장소 연결
- [ ] 빌드 명령어 확인: `npm run build`
- [ ] 출력 디렉토리 확인: `.next`
- [ ] Node.js 버전 확인 (18.x 이상 권장)

### 8. 배포 후 확인

- [ ] 배포 성공 확인
- [ ] 프로덕션 URL 접속 테스트
- [ ] API 엔드포인트 동작 확인
- [ ] 환경 변수 로드 확인
- [ ] Supabase 연결 확인
- [ ] OpenAI API 호출 확인
- [ ] 로그 저장 확인

---

## 🚀 배포 단계

### 1. Vercel 프로젝트 생성

```bash
# Vercel CLI 사용 (선택사항)
npm i -g vercel
vercel login
vercel
```

또는 Vercel 웹 대시보드에서:
1. **New Project** 클릭
2. GitHub 저장소 선택
3. 프로젝트 설정

### 2. 환경 변수 설정

Vercel 대시보드 → Settings → Environment Variables에서 추가

### 3. 배포

- GitHub에 푸시하면 자동 배포
- 또는 Vercel 대시보드에서 **Deploy** 버튼 클릭

### 4. 배포 확인

```bash
# 배포 로그 확인
vercel logs

# 또는 Vercel 대시보드에서 확인
```

---

## 📝 추가 권장 사항

### 1. 모니터링

- Vercel Analytics 활성화 (선택사항)
- Supabase 대시보드에서 로그 모니터링
- OpenAI 사용량 모니터링

### 2. 에러 추적

- Sentry 연동 고려 (선택사항)
- Vercel 함수 로그 확인

### 3. 성능 최적화

- 이미지 최적화 (필요 시)
- API 응답 캐싱 고려 (선택사항)

### 4. 비용 관리

- OpenAI API 사용량 모니터링
- Supabase 사용량 확인
- Vercel 대역폭 확인

---

## 🔧 문제 해결

### 환경 변수가 로드되지 않는 경우

1. Vercel 대시보드에서 환경 변수 확인
2. 재배포 실행 (환경 변수 변경 후)
3. `console.log(process.env.XXX)`로 확인 (개발 환경에서만)

### Supabase 연결 오류

1. Supabase URL 및 Anon Key 확인
2. RLS 정책 확인
3. 네트워크 연결 확인

### OpenAI API 오류

1. API 키 유효성 확인
2. 사용량 한도 확인
3. API 키 권한 확인

---

## 📚 참고 자료

- [Vercel 환경 변수 문서](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js 환경 변수 문서](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [OpenAI API 문서](https://platform.openai.com/docs/api-reference)

