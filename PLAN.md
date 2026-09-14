# Selnar — 기획서

> 사람과 AI 도구(Claude Code · Cursor · Antigravity)가 **함께 읽는 기준 문서**입니다.
> 결정이 바뀌면 코드보다 이 문서를 먼저 고칩니다.

- **서비스명:** Selnar (셀나르)
- **한 줄 정의:** AI로 만든 음악을 올리고, 듣고, 차트로 확인하는 곳
- **문서 버전:** v1.2 · 2026-09-14
- **저장소:** github.com/guswnstjr125/selnar

**문서 관계**
이 문서가 **상위 기준**입니다. 기능 범위 · 데이터 모델 · 정책 · 화면 전환은 여기서만 정합니다.
`FIGMA_SPEC.md`는 **화면 표현만** 정의하고, 충돌하면 이 문서가 이깁니다.
버전 규칙은 `README.md`를 따릅니다.

---

## 1. 왜 만드는가

**문제**
Suno, Udio로 곡을 만드는 사람은 빠르게 늘고 있는데, 그 곡들이 **모여서 소비되는 공간**은 아직 얇습니다. 만든 사람은 SNS에 링크를 뿌리고 끝나고, 듣는 사람은 좋은 AI 곡을 찾을 경로가 없습니다.

**해결**
AI 곡 전용 스트리밍 사이트. 멜론처럼 **차트와 하단 고정 플레이어**로 소비 경험을 만들고, 그 위에 **프롬프트 공개**를 얹어 창작자끼리 배우는 흐름을 만듭니다.

**목표**

| 우선순위 | 목표 |
|---|---|
| 1 | React 실무 역량 (전역 상태 · 라우팅 · 인증 · 파일 업로드) 체득 |
| 2 | 시연 가능한 포트폴리오 결과물 확보 |
| 3 | 실제 서비스로의 확장 가능성 (선택) |

> 1번이 최우선입니다. **기능을 늘리는 것보다 한 단계를 끝까지 굴러가게 만드는 게 중요합니다.**

---

## 2. 차별점

1. **프롬프트 공개** — 곡 상세에 "이 곡은 이렇게 만들었어요"(AI 툴 · 모델 버전 · 프롬프트 · 네거티브 프롬프트 · 가사) 노출. 창작자가 선택적으로 비공개 가능.
2. **AI 툴별 / 장르별 차트** — Suno 차트, Udio 차트, K-pop 차트로 쪼개 신규 창작자도 상위에 노출될 기회를 줌.
3. **한국어 AI 곡 특화** — 초기 타깃을 한국어 가사 곡으로 좁힘. 글로벌에서 경쟁하지 않고 틈새를 먼저 채움.

---

## 3. 사용자

| 페르소나 | 원하는 것 | 핵심 화면 |
|---|---|---|
| **창작자** — Suno로 곡 만드는 사람 | 내 곡이 들려지는 것, 반응 확인 | 업로드, 곡 상세, 내 채널 |
| **청취자** — AI 음악이 궁금한 사람 | 좋은 곡을 쉽게 발견 | 홈, 차트, 플레이어 |
| **학습자** — 나도 만들어보고 싶은 사람 | 어떻게 만들었는지 | 프롬프트 공개 영역 |

**핵심 시나리오** — MVP에서 반드시 동작합니다.

1. 홈에서 차트 1위 곡 클릭 → 하단 플레이어에서 재생 시작
2. 다른 페이지로 이동해도 **음악이 끊기지 않음** ← 이 프로젝트의 기술적 심장
3. 좋아요 → 내 라이브러리에 쌓임
4. 창작자가 곡 + 커버 + 프롬프트를 업로드 → 즉시 차트 후보에 올라감

---

## 4. 기능 범위

### MVP — 4단계까지

곡 목록 · 상세 / 하단 고정 플레이어(재생 · 정지 · 이전 · 다음 · 탐색 · 볼륨 · 반복 · 셔플) / 차트(전체 TOP 100, AI 툴별, 장르별) / 로그인 · 회원가입 / 곡 업로드(오디오 · 커버 · 메타데이터 · 프롬프트) / 좋아요 / 내 라이브러리 / 플레이리스트 / 검색(곡명 · 창작자 · 장르) / 모바일 대응

### 나중에 — 지금은 만들지 않음

| 항목 | 이유 |
|---|---|
| **음원 다운로드** | 파일이 사용자 손에 남아 권리 리스크가 스트리밍과 질적으로 다름. Supabase 대역폭도 빠르게 소진. **6단계 후보** |
| **관리자 화면 · 신고 기능** | Supabase Table Editor로 대체 가능. `reports` 테이블 + `profiles.role` + 라우트 가드가 선행돼야 함. 학습 목표에 새로 걸리는 게 없음. **6단계** |
| **순위 변동 ▲▼** | 일별 랭킹 스냅샷 테이블이 선행돼야 함. **6단계** |
| **다중 선택 액션 바** | 체크박스 선택 상태 관리 비용이 학습 목표 대비 큼 |
| **파형 시각화**(wavesurfer.js) | 6단계 후보. 곡 상세 전용 |
| 팔로우 · 댓글 · 알림 | |
| 정산 · 수익화 · 가사 싱크 · 추천 알고리즘 | |
| 다크모드 토글 | **다크 고정.** 라이트 테마는 만들지 않음 |

> **원칙:** "있으면 좋은 것"은 전부 나중입니다. 위 목록에서 빼내오고 싶으면 이 문서에서 먼저 논의합니다.

---

## 5. 화면 구조

### 5.1 라우트

```
/                    홈 — 신곡, 인기곡, 장르별 큐레이션
/chart               차트 — 전체 / AI 툴별 / 장르별 탭
/track/:id           곡 상세 — 재생, 좋아요, 프롬프트 공개 영역
/artist/:username    창작자 채널 — 올린 곡 목록
/search?q=           검색 결과
/upload              곡 업로드 (로그인 필요)
/playlist/:id        플레이리스트 상세
/me                  내 라이브러리 — 좋아요한 곡, 플레이리스트, 내가 올린 곡
/login               로그인 / 회원가입
```

**9개 라우트 전부** `FIGMA_SPEC.md` §3에 대응 화면이 있어야 합니다. 빠진 화면이 있으면 그쪽을 고칩니다.
**`/admin` 계열 라우트는 MVP에 없습니다.** 6단계에서 추가할 때 이 목록을 먼저 고칩니다.

### 5.2 셸 구조

```
┌──────────┬──────────────────────────┐
│ 사이드바  │   <Outlet /> (페이지)     │
├──────────┴──────────────────────────┤
│  하단 고정 플레이어 (항상 살아있음)     │  ← Router 바깥
└─────────────────────────────────────┘
```

`<audio>`와 플레이어 UI는 **Outlet 바깥**에 둡니다. 페이지가 언마운트돼도 오디오는 유지됩니다.
`/login`만 셸이 없는 단독 레이아웃입니다.

### 5.3 화면 전환 맵

디자인과 구현이 같은 동선을 그리게 하려고 명시합니다. 여기 없는 전환은 만들지 않습니다.

| 출발 | 동작 | 결과 |
|---|---|---|
| 홈 히어로 [즉시 재생] | 재생 시작 | **페이지 유지** |
| 홈 카드 · 차트 행 — 커버 클릭 | 재생 시작 | **페이지 유지** |
| 홈 카드 · 차트 행 — 제목 클릭 | 이동 | `/track/:id` |
| 곡 상세 [재생] | 재생 시작 | 페이지 유지 |
| 곡 상세 창작자 카드 [채널 가기] | 이동 | `/artist/:username` |
| 검색 결과 · 창작자 탭 항목 | 이동 | `/artist/:username` |
| 보관함 · 플레이리스트 탭 항목 | 이동 | `/playlist/:id` |
| 사이드바 로고 | 이동 | `/` |
| 헤더 검색창 제출 | 이동 | `/search?q=...` |
| 모바일 미니바 탭 | 오버레이 | **라우트 변경 없음** |

**로그인이 필요한 지점** — 좋아요 · 업로드 · 플레이리스트 생성/담기. 비로그인 상태로 누르면 `/login?returnTo=<현재경로>`로 보내고, 로그인 성공 시 `returnTo`로 되돌립니다. 없으면 `/`.

**업로드 완료** — 토스트를 띄운 뒤 방금 올린 곡의 `/track/:id`로 이동합니다. 업로드 폼에 머무르지 않습니다.

**재생은 이동을 유발하지 않습니다.** 커버를 눌러 재생한 사용자는 보던 목록에 그대로 남습니다. 이게 성공 기준 1번과 직결됩니다.

---

## 6. 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **React 19** + Vite + TypeScript | `npm create vite@latest` 기본값. 18로 내리면 수동 다운그레이드 작업이 생김 |
| 스타일 | Tailwind CSS v4 | `@theme` 블록으로 토큰 일괄 관리 |
| 라우팅 | React Router v6 | 표준 |
| 전역 상태 | Zustand | 플레이어 상태 전용. Redux는 과함 |
| 서버 상태 | TanStack Query (3단계부터) | 캐싱 · 로딩 직접 처리 안 해도 됨 |
| 백엔드 | Supabase | 인증 + DB + 스토리지 한 번에 |
| 재생 | HTML5 `<audio>` | 라이브러리 불필요 |
| 컴포넌트 문서화 | Storybook 8 (S단계) | UI 컴포넌트 상태 격리 확인 + 포트폴리오 |
| 배포 | Vercel | Vite 프로젝트 그대로 올라감 |

### 6.1 폴더 구조

```
src/
├─ app/              router.tsx, providers
├─ components/
│  ├─ ui/            Button, Slider, Icons — 순수 UI
│  └─ layout/        Sidebar, AppLayout
├─ features/
│  ├─ player/        PlayerBar, AudioEngine
│  ├─ track/         TrackCard, TrackRow
│  ├─ chart/  auth/  upload/  playlist/
├─ stores/           playerStore.ts
├─ data/             mockTracks.ts — 3단계에서 Supabase 조회로 교체
├─ lib/              supabase.ts, format.ts
├─ types/            track.ts, user.ts
└─ config/           brand.ts
```

**브랜드 상수** — 서비스명은 화면에 직접 쓰지 않고 여기 한 곳에만 둡니다.

```ts
// src/config/brand.ts
export const BRAND = {
  name: 'Selnar',
  nameKo: '셀나르',
  wordmark: 'SELNAR',
  tagline: 'AI가 만든 음악을 듣는 곳',
  logoUrl: '/brand/logo.png',
} as const;
```

### 6.2 테마 토큰 — 단일 출처

Figma Variables와 Tailwind `@theme`은 **같은 값의 두 표현**입니다. 토큰 이름과 값의 원본은 `FIGMA_SPEC.md` §4이고, 코드 쪽은 아래 규칙으로 기계적으로 변환합니다.

```
Figma Variable          →  Tailwind @theme
color/bg/base           →  --color-bg-base
color/text/on-brand     →  --color-text-on-brand
radius/md               →  --radius-md
space/lg                →  --spacing-lg
text/body               →  --text-body
```

규칙: `/` → `-`, 접두사 유지, `@theme` 안에 `--color-*` · `--radius-*` · `--spacing-*` · `--text-*`로 선언.
**색상 하드코딩 금지** — `bg-[#141414]` 같은 임의값은 리뷰에서 반려합니다.

### 6.3 Storybook 범위 — 여기까지만

| 대상 | 포함 | 이유 |
|---|---|---|
| `components/ui/` — Button, Badge, Input, Select, Switch, Slider, Checkbox, Toast, EmptyState | ○ | props 조합이 유한하고 상태별 확인이 실제로 필요 |
| `features/track/` — TrackRow, TrackCard | ○ | 네 화면에서 재사용. 여기가 가장 이득 |
| `features/player/PlayerBar` | 시각만 | 오디오 없이 껍데기만. 재생 동작은 앱에서 확인 |
| `components/layout/` — Sidebar, Header | △ | Router 데코레이터 필요. 여유 있을 때만 |
| 페이지 컴포넌트 | ✕ | 라우터 · 스토어 · 데이터를 전부 목킹해야 함 |

**선 하나:** 오디오 인스턴스와 라우터에 의존하는 것은 Storybook에 넣지 않습니다. 이 프로젝트의 핵심 버그(페이지 이동 시 재생 끊김)는 거기서 잡히지 않고, 목킹 비용만 커집니다.

**세팅 시 주의 2가지**

```ts
// .storybook/preview.ts
import '../src/index.css';          // Tailwind v4는 별도 빌드라 직접 import 필요

export const parameters = {
  backgrounds: {                     // 다크 고정이라 캔버스 배경도 맞춰야 함
    default: 'base',
    values: [{ name: 'base', value: '#0A0A0A' }],
  },
};
```

Figma Component Set의 Variant 구성이 그대로 stories가 됩니다. D단계에서 Variant를 나눌 때 "이게 story 하나가 된다"를 기준으로 쪼갭니다.

---

## 7. 플레이어 상태 설계

이 프로젝트에서 가장 중요한 코드입니다.

```ts
interface PlayerState {
  queue: Track[];
  currentIndex: number;        // -1이면 재생 중인 곡 없음
  isPlaying: boolean;
  progress: number;            // 초
  duration: number;
  volume: number;              // 0 ~ 1
  repeat: 'off' | 'all' | 'one';
  shuffle: boolean;

  playTrack: (track: Track, queue?: Track[]) => void;
  toggle: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;            // 3초 넘게 재생됐으면 곡 처음으로
  seek: (sec: number) => void;
  setVolume: (v: number) => void;
}
```

**설계 규칙**

- `<audio>`는 React state가 아니라 **모듈 스코프 변수 하나**로 두고, 스토어는 조종만 합니다. 소유하지 않습니다.
- `timeupdate`로 `progress`를 갱신하되 **250ms throttle**. 안 그러면 렌더가 튑니다.
- 탐색바를 드래그하는 동안은 `timeupdate` 반영을 멈춥니다. 안 그러면 손잡이가 튑니다.
- `volume`은 localStorage에 저장해 새로고침해도 유지합니다.
- 이미 재생 중인 곡을 다시 누르면 새로 로드하지 않고 토글로 동작합니다.
- **재생 30초 경과 시점에 `plays` 1건 기록** (§8 차트 규칙). 타이머는 스토어가 아니라 AudioEngine에 둡니다.

---

## 8. 데이터 모델 (Supabase / PostgreSQL)

```sql
profiles (
  id           uuid primary key references auth.users,
  username     text unique not null,      -- /artist/:username
  display_name text not null,
  avatar_url   text,
  bio          text,
  created_at   timestamptz default now()
)

tracks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade,
  title         text not null,
  description   text,
  audio_url     text not null,
  cover_url     text,
  duration_sec  int not null,
  genre         text,                      -- 'kpop' | 'ballad' | 'hiphop' | ...
  ai_tool       text,                      -- 'suno' | 'udio' | 'other'
  ai_model      text,                      -- 'v4.5', 'udio-1.5' 등 자유 입력
  prompt        text,
  negative_prompt text,
  lyrics        text,
  is_prompt_public boolean default true,
  language      text default 'ko',
  rights_confirmed boolean not null,       -- 업로드 시 권리 확인 체크
  status        text default 'public',     -- 'public' | 'private' | 'removed'
  play_count    int default 0,
  like_count    int default 0,
  created_at    timestamptz default now()
)

likes (user_id, track_id, created_at, primary key (user_id, track_id))

plays (                                    -- 차트 집계용 원장
  id bigserial primary key,
  track_id uuid references tracks(id) on delete cascade,
  user_id  uuid references profiles(id),   -- 비로그인 재생은 null
  played_at timestamptz default now()
)

playlists       (id, user_id, title, description, cover_url, is_public, created_at)
playlist_tracks (playlist_id, track_id, position, added_at, primary key (playlist_id, track_id))
```

> **6단계 전까지 만들지 않는 것:** `allow_download`, `download_count`, `chart_snapshots`, `reports`, `profiles.role`.
> 다운로드 · 순위 변동 · 관리자 기능을 살릴 때 함께 마이그레이션합니다. 미리 넣어두지 않습니다.

### 8.1 차트 계산 규칙

국내 플랫폼들이 실시간 차트를 걷어낸 이유(반복 재생으로 순위가 왜곡됨)를 그대로 받습니다. 곡 수가 적은 초기에는 어뷰징 1건이 1위를 바꿀 수 있어 더 중요합니다.

- **30초 이상 재생**된 경우에만 `plays`에 기록합니다.
- **24시간 안에 같은 사용자(또는 IP)의 같은 곡은 1회만** 집계합니다. 반복 재생으로 순위를 올릴 수 없습니다.
- 순위는 **최근 7일 누적 집계수** 기준.
- **갱신 주기: 매일 1회(KST 00:00).** 곡이 늘면 매시간으로 조정합니다.
- **실시간 차트는 만들지 않습니다.**
- 초기에는 그냥 쿼리로 시작하고, 느려지면 materialized view로 옮깁니다.
- **`NEW` 뱃지** — 업로드 7일 이내 곡에 표시. 순위 변동 ▲▼의 MVP 대체재입니다.

### 8.2 RLS 원칙

`tracks`는 `status = 'public'`만 누구나 읽기, 쓰기는 `user_id = auth.uid()`만. `likes`와 `playlists`는 본인 것만 쓰기.

---

## 9. 단계별 로드맵

| 단계 | 내용 | 상태 |
|---|---|---|
| 0 | Vite + React + TS + Tailwind 세팅, 폴더 구조, 첫 커밋 | **로컬 완료 · 원격 push 확인 필요** |
| **D** | **Figma 디자인 확정** — 토큰 생성, 9개 화면 PC/Mobile 렌더, 검수 | **진행 중** |
| 1 | 더미 데이터 6곡, 레이아웃, 홈 · 차트 · 곡 상세, **끊기지 않는 플레이어** | 코드 존재 (D단계 확정 후 토큰 교체) |
| 2 | 장르 필터, 검색, 좋아요(로컬) | |
| **S** | **Storybook 도입** — `ui/` 9종 + TrackRow · TrackCard stories | 2단계 직후 |
| 3 | Supabase 연결 — 인증, 곡 조회, 업로드, 좋아요 서버 저장 | |
| 4 | 플레이리스트, 내 라이브러리, 창작자 채널, 모바일 대응 | |
| 5 | 배포(Vercel), 실제 곡으로 시드 채우기 | |
| 6 | (선택) 다운로드, 순위 변동, 파형 시각화, 관리자 화면 · 신고 | |

**0단계 미확인 사항** — 저장소에 커밋이 확인되지 않았습니다. 로컬에만 있고 push가 안 된 상태로 추정됩니다. D단계 산출물(`/figma-plugin/`)을 올릴 곳이 필요하므로 **먼저 해결합니다.** 확인 후 이 문단과 위 상태 칸을 정리합니다.

**D단계 위치** — 1단계 코드는 이미 존재합니다. Figma를 처음부터 다시 그리느라 1단계를 멈추지 않습니다. D단계 산출물은 **토큰 값과 레이아웃 치수**이고, 그것만 기존 코드에 주입합니다.

**S단계 위치** — 1단계에 넣으면 컴포넌트가 아직 흔들려 stories를 계속 고치게 됩니다. 2단계까지 가면 `TrackRow` · `Badge` · `Button`의 변형이 실사용으로 검증되고, 3단계에서 비동기 로딩 상태가 붙기 전이라 목킹할 것이 없습니다.

각 단계는 **배포 가능한 상태**로 끝냅니다. 반쯤 된 기능을 여러 개 들고 다음 단계로 넘어가지 않습니다.

---

## 10. 정책

- **권리 확인** — 업로드 시 "내가 만든 곡이고 배포 권리가 있다"를 체크해야 제출됩니다(`rights_confirmed`). 체크 없이는 업로드 불가.
- **AI 생성 표기** — 모든 곡에 AI 툴을 표기합니다. 미표기 업로드는 받지 않습니다.
- **신고 · 내림** — MVP에는 관리자 화면과 앱 내 신고 버튼이 **없습니다.** 신고는 별도 경로(이메일 / 구글폼)로 받고, 내림 처리는 **Supabase Table Editor에서 `status`를 `removed`로 직접 변경**합니다. 물리 삭제는 하지 않습니다. 곡이 수백 개를 넘거나 신고가 주 1건 이상 들어오면 6단계로 승격합니다.
- **비공개 프롬프트** — 창작자가 원하면 프롬프트만 가립니다. 곡 자체는 공개됩니다.
- **비로그인 재생** — **전곡 허용.** 미리듣기 제한은 라이선스 계약이 있는 상업 음원용 장치이고, 창작자가 직접 올린 자작곡에는 걸 이유가 없습니다. 로그인은 좋아요 · 업로드 · 플레이리스트에서만 요구합니다.
- **다운로드 없음** — MVP에서 음원 파일은 내려받을 수 없습니다. UI에 다운로드 버튼을 그리지 않습니다.
- **개발용 샘플 음원** — `public/samples/*.wav`는 합성한 톤입니다. 실제 음악이 아니고 저작권도 없습니다.

---

## 11. 성공 기준

이 프로젝트가 잘 됐는지 판단하는 기준입니다. 사용자 수가 아닙니다.

1. 페이지를 아무리 옮겨 다녀도 음악이 한 번도 안 끊긴다
2. 처음 보는 사람이 설명 없이 곡을 재생하고 좋아요까지 누른다
3. 내가 만든 곡을 3분 안에 업로드해서 차트에 올릴 수 있다
4. 모바일에서 플레이어가 깨지지 않는다
5. `PLAN.md`와 `FIGMA_SPEC.md`만 읽고도 다른 사람(또는 다른 AI 도구)이 이어서 작업할 수 있다 — **로컬 경로나 이전 대화 참조 없이**

> 5번은 저장소에 코드가 올라가 있어야 성립합니다. 0단계 push 미완이 이 기준에 직접 걸립니다.

---

## 12. 아직 안 정한 것

| 항목 | 언제까지 |
|---|---|
| **AI 툴 뱃지 컬러** — Suno/Udio 실제 브랜드 컬러를 쓰고 있음. 상표 이슈 소지가 있어 자체 팔레트로 교체할지 | D단계 중 |
| **`ai_tool = 'other'` 처리** — 회색 중립 뱃지로 갈지, 툴 목록을 더 열지 | D단계 중 |
| **신고 접수 경로** — 이메일 / 구글폼 | 5단계 배포 전 |
| **도메인** — `selnar.com` / `.io` / `.app` / `.kr` 확보 여부 미확인. KIPRIS 상표 조회도 아직 | 미정 |

### 12.1 로고 — 확정

금색 라인 모노그램 + 워드마크 `SELNAR`. 화면의 로고 자리에는 이 파일을 쓴다. 텍스트 `Selnar`로 대체하지 않는다.

| 파일 | 용도 |
|---|---|
| `public/brand/logo.png` | **공식.** 투명 배경(누끼). 사이드바 · 스플래시 · 파비콘 등 다크 셸 |
| `public/brand/logo-on-light.png` | 흰 배경 원본. 밝은 지면 · 인쇄용 |

- 워드마크 표기는 `SELNAR`다.
- 로고 금색은 `FIGMA_SPEC.md` §4 `color/brand/logo` (#C09B4A). primary(에메랄드)로 다시 칠하지 않는다.
- 다크 셸에는 투명본만 쓴다. 흰 배경 원본을 그대로 올리지 않는다.

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|---|---|---|
| v1.2 | 2026-09-14 | 로고 누끼본을 공식 에셋으로 지정 (`logo.png` 투명, `logo-on-light.png` 흰 배경) |
| v1.1 | 2026-09-14 | 로고 확정 (`public/brand/logo.png`). §12 미정 항목에서 제외 |
| v1.0 | 2026-09-14 | 기준 문서로 재작성. 이전 판(v0.x) 전부 폐기. §5.3 화면 전환 맵 신규. 문서 내 이력 블록 제거 |
