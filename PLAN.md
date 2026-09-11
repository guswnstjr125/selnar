# selnar 기획서

AI로 만든 노래를 모아 듣는 음악 스트리밍 웹 서비스. 멜론처럼 차트, 곡 상세, 플레이리스트를 제공하되 **AI 곡 전용**이라는 점이 다르다.

> 이 문서는 사람과 AI 도구(Claude Code, Antigravity, Cursor)가 함께 읽는 기준 문서다. 기능이나 구조가 바뀌면 이 문서부터 고친다.

## 1. 목표

- React를 제대로 익히기 위한 학습 겸 포트폴리오 프로젝트
- 1단계만 끝나도 "곡을 고르면 하단 플레이어에서 재생되는 사이트"가 동작해야 한다

## 2. 차별점

- **프롬프트 공개**: 곡마다 어떤 프롬프트로 만들었는지 보여준다
- **AI 툴별·장르별 차트**: Suno 차트, Udio 차트, 장르 차트
- **한국어 AI 곡 특화**: 한국어 가사 곡을 우선 큐레이션

## 3. 콘텐츠·저작권 원칙

- 다른 곳의 곡을 퍼오지 않는다. **만든 사람이 직접 업로드**한다
- 업로드 시 "이 곡의 권리가 본인에게 있음"을 확인받는다
- 곡마다 사용한 AI 툴과 요금제를 기록한다 (툴·요금제에 따라 상업적 이용 가능 여부가 다르고, 약관이 자주 바뀐다)
- 멜론의 로고·이름·디자인은 베끼지 않는다. 화면 구성만 참고한다

## 4. 기술 스택

| 영역            | 선택                                  |
| --------------- | ------------------------------------- |
| 빌드            | Vite + React + TypeScript             |
| 스타일          | Tailwind CSS v4 (`@tailwindcss/vite`) |
| 라우팅          | React Router (`react-router-dom`)     |
| 전역 상태       | Zustand (플레이어 상태)               |
| 재생            | HTML5 `<audio>`                       |
| 백엔드 (3단계~) | Supabase — Auth, Postgres, Storage    |

## 5. 폴더 구조

```
src/
  app/                 라우터, 앱 진입 구성
  components/
    ui/                버튼, 아이콘 등 범용 UI
    layout/            사이드바, 본문, 하단 플레이어 틀
  features/
    player/            재생 컨트롤, 진행바, 볼륨
    track/             곡 목록, 곡 상세
    chart/             차트 페이지
  stores/              Zustand 스토어 (playerStore.ts 등)
  lib/                 유틸 함수, Supabase 클라이언트
  types/               공용 타입 (Track 등)
  config/              상수, 환경 설정
public/
  samples/             1단계 테스트용 mp3
```

규칙: 특정 기능에만 쓰이는 코드는 `features/<기능>`에, 여러 곳에서 쓰이는 코드만 `components/`, `lib/`로 올린다.

## 6. 단계별 로드맵

### 0단계 — 세팅

- [x] Vite + React + TS 프로젝트 생성
- [x] Tailwind, React Router, Zustand 설치
- [x] 폴더 구조, 기획서, 첫 커밋

### 1단계 — 레이아웃과 플레이어 (DB 없음)

- [ ] 레이아웃: 사이드바 + 본문 + 하단 고정 플레이어
- [ ] `types/track.ts`: Track 타입
- [ ] `public/samples`의 mp3로 만든 샘플 곡 데이터
- [ ] `stores/playerStore.ts`: 현재 곡, 재생/일시정지, 재생 목록, 다음/이전 곡
- [ ] 곡 목록 페이지, 곡 상세 페이지
- [ ] 페이지를 이동해도 재생이 끊기지 않는지 확인

### 2단계 — 차트

- [ ] 차트 TOP 100 (좋아요·재생 수 기준)
- [ ] 좋아요
- [ ] 장르·AI 툴 필터

### 3단계 — 회원과 업로드 (Supabase)

- [ ] 로그인
- [ ] 곡 업로드 (음원 + 커버 + 권리 확인)
- [ ] 내 플레이리스트

### 4단계 — 차별화와 마무리

- [ ] 프롬프트 공개
- [ ] 검색
- [ ] 모바일 대응

## 7. 데이터 모델 (초안)

```ts
type Track = {
  id: string
  title: string
  artist: string // 업로더 닉네임
  coverUrl: string
  audioUrl: string
  durationSec: number
  genre: string
  aiTool: 'suno' | 'udio' | 'other'
  prompt?: string // 공개한 경우만
  likes: number
  plays: number
  createdAt: string
}
```

## 8. AI 도구 역할 분담

| 도구        | 맡는 일                                                          |
| ----------- | ---------------------------------------------------------------- |
| Claude Code | 설계, 상태 관리·백엔드 연동 등 어려운 로직, 버그 분석, 코드 리뷰 |
| Antigravity | 화면·컴포넌트 대량 구현, 브라우저로 확인하는 작업                |
| Cursor      | 자잘한 수정, 자동완성                                            |

작업 규칙:

- 한 기능은 한 도구가 끝까지 맡는다. 같은 파일을 두 도구가 동시에 고치지 않는다
- 작업 하나가 끝나면 커밋한다
- 요청은 작게 쪼갠다 ("플레이어 만들어줘" ✕ → "playerStore에 다음 곡 기능 추가" ○)
