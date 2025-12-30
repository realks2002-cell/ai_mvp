# AI MVP - 로컬 실행 가이드

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI API 설정
OPENAI_API_KEY=sk-your-openai-api-key-here
```

> ⚠️ **중요**: `.env.local` 파일은 Git에 커밋되지 않습니다 (`.gitignore`에 포함됨)

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 4. 빌드 및 프로덕션 실행

```bash
# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

---

## 📋 사전 준비사항

### Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. 다음 테이블 생성:

**prompts 테이블:**
```sql
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system_prompt TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초기 데이터 삽입
INSERT INTO prompts (system_prompt) 
VALUES ('You are a helpful AI assistant.');
```

**logs 테이블:**
```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_input TEXT NOT NULL,
  ai_output TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. Row Level Security (RLS) 정책 설정:

```sql
-- prompts 테이블: 읽기 허용
CREATE POLICY "Allow public read access"
ON prompts FOR SELECT
USING (true);

-- logs 테이블: 삽입 허용
CREATE POLICY "Allow public insert access"
ON logs FOR INSERT
WITH CHECK (true);
```

4. Supabase 프로젝트 설정에서 URL과 Anon Key 확인

### OpenAI API 키 발급

1. [OpenAI Platform](https://platform.openai.com) 접속
2. API Keys 메뉴에서 새 키 생성
3. 생성된 키를 `.env.local`에 추가

---

## 🛠️ 사용 가능한 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (포트 3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 실행 |

---

## 📁 프로젝트 구조

```
ai_mvp/
├── app/
│   ├── api/
│   │   └── ask/
│   │       └── route.ts      # AI 채팅 API
│   ├── layout.tsx            # 루트 레이아웃
│   ├── page.tsx              # 메인 페이지
│   └── globals.css           # 전역 스타일
├── lib/
│   ├── supabase.ts          # Supabase 클라이언트
│   ├── openai.ts            # OpenAI 클라이언트
│   └── types.ts             # TypeScript 타입
├── .env.local               # 환경 변수 (로컬)
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 🔧 문제 해결

### 포트 3000이 이미 사용 중인 경우

```bash
# 다른 포트로 실행
PORT=3001 npm run dev
```

### 환경 변수가 로드되지 않는 경우

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일 이름이 정확한지 확인 (`.env.local`)
3. 개발 서버 재시작

### 모듈을 찾을 수 없는 오류

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install
```

### TypeScript 오류

```bash
# 타입 정의 재생성
npm run build
```

---

## 📚 추가 문서

- [배포 가이드](./DEPLOYMENT.md) - Vercel 배포 방법
- [Next.js 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [OpenAI API 문서](https://platform.openai.com/docs)

