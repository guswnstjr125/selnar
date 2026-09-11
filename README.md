# selnar

AI로 만든 노래를 모아 듣는 음악 스트리밍 웹 서비스.

기획, 기능 목록, 단계별 로드맵은 [PLAN.md](PLAN.md), AI 도구 작업 규칙은 [AGENTS.md](AGENTS.md)에 있다.

## 실행

```bash
npm install
npm run dev
```

| 명령             | 하는 일                    |
| ---------------- | -------------------------- |
| `npm run dev`    | 개발 서버 실행             |
| `npm run build`  | 타입 검사 후 프로덕션 빌드 |
| `npm run lint`   | oxlint 검사                |
| `npm run format` | Prettier로 코드 정리       |

## 스택

Vite, React, TypeScript, Tailwind CSS v4, React Router, Zustand
