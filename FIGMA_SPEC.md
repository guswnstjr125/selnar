# Selnar — Figma 화면 명세서

AI 음악 스트리밍 웹 서비스 `Selnar`의 UI/UX를 Figma 플러그인 스크립트(`manifest.json` + `code.js`)로 자동 생성하기 위한 명세서입니다.

- **문서 버전:** v1.2 · 2026-09-14
- **저장소 위치:** `github.com/guswnstjr125/selnar` → `/figma-plugin/`

**문서 관계**
이 문서는 **화면 표현만** 정의합니다. 기능 범위 · 데이터 모델 · 정책 · 화면 전환은 `PLAN.md`가 정하고, 충돌하면 `PLAN.md`가 이깁니다.
여기 없는 데이터를 화면에 그리지 않습니다. 그리고 싶으면 `PLAN.md` §8을 먼저 고칩니다.
버전 규칙은 `README.md`를 따릅니다.

---

## 1. 제작 방식

Figma 수작업 드로잉 대신 **Figma Plugin API를 활용한 코드 기반 자동 렌더링**으로 만듭니다.

1. **디자인 토큰 바인딩** — 색상 · 라운드 · 간격 · 타이포를 Figma Variables로 바인딩. 토큰 값 하나만 바꾸면 전 화면이 따라옴
2. **오토레이아웃 100% 준수** — 모든 프레임 · 카드 · 버튼은 반응형 AutoLayout
3. **실제 한국어 콘텐츠** — 플레이스홀더 대신 실제 AI 음원 메타데이터 및 프롬프트 표기
4. **AI 도구 협업** — 스크립트 생성 → Figma 데스크톱 실행 → 피드백 반영

**한계 인지**
플러그인 렌더링은 토큰 일관성과 대량 생성에는 강하지만, "이 간격 4px만 줄여보자" 류의 미세 조정은 코드 왕복이라 느립니다.
**구조와 치수는 플러그인으로, 최종 미세 조정은 Figma에서 직접** 하는 것을 전제로 합니다.

> **멈춤 조건:** 한 화면에서 플러그인 디버깅이 반나절을 넘기면 그 화면은 손으로 그립니다. 업로드 폼 3종 상태와 모바일 풀스크린 플레이어가 1순위 후보입니다.

---

## 2. 벤치마킹 — 국내 스트리밍 5개 서비스

| 서비스 | 현황 (2026) | 핵심 강점 | Selnar 반영 |
|---|---|---|---|
| **Spotify** | 국내 MAU 3위권, 점유율 14%대 | 글로벌 표준 3단 다크 레이아웃(사이드바 + 본문 + 하단 플레이어), 끊김 없는 SPA | **셸 레이아웃 전체를 채택.** 이 프로젝트 기술 목표와 정확히 일치 |
| **멜론** | 국내 토종 1위, 점유율 26%대 | TOP 100 테이블의 정보 밀도, 스캔 가능한 행 구조 | **차트 페이지 테이블 행 구조.** 단, 다중 선택 액션은 제외 |
| **지니뮤직** | 점유율 11%대 | 직관적 카테고리 · 태그 탐색 | **AI 툴별(Suno/Udio) 필터 칩** 및 장르 탐색 섹션 |
| **FLO** | 점유율 8%대 | 개인화 우선. 2026년 5월 아티스트 페이지를 팬덤 허브로 전면 개편 | **창작자 채널 페이지**의 방향성. 곡 목록만이 아니라 창작자 소개 · 대표곡 중심 |
| **VIBE** | **2026-12-31 서비스 종료** | 매거진형 카드 UI, 대형 앨범아트 | **곡 상세 비주얼 헤더**만 차용. 벤치마크 대상으로는 하차 |

### 여기서 가져올 교훈 두 가지

**1. 실시간 차트를 만들지 않는다**
FLO가 2020년 3월, 멜론이 그해 하반기에 실시간 차트를 걷어내고 24시간 누적 기준으로 갔습니다. 1시간 단위 집계가 반복 재생에 무방비였기 때문입니다. 멜론이 이후 TOP100으로 되돌리자 반복 재생이 즉시 되살아난 것도 같은 얘기를 반대편에서 증명합니다.
→ Selnar는 곡 수가 적어 **어뷰징 1건이 1위를 바꿉니다.** 처음부터 24시간 1인 1회로 시작합니다 (`PLAN.md` §8.1).

**2. 차트만으로는 안 되지만, 시작은 차트다**
FLO와 VIBE는 개인화 추천을 전면에 걸었고 둘 다 점유율에서 밀렸습니다. 추천은 데이터가 쌓인 뒤에 작동합니다.
→ Selnar 초기에는 **차트와 최신 업로드가 유일하게 작동하는 발견 경로**입니다. 추천 알고리즘은 6단계 이후.

---

## 3. 화면 명세 (PC 1920 / Mobile 390)

`PLAN.md` §5.1의 9개 라우트와 1:1 대응합니다. 각 화면은 `CONFIG` 플래그로 켜고 끕니다.
화면 간 이동 규칙은 `PLAN.md` §5.3을 따릅니다. 여기서 새로 만들지 않습니다.

### 0) 공통 셸

**좌측 사이드바 (240px)**
로고(`public/brand/logo.png` — 투명 배경 금색 모노그램 + `SELNAR`) / 메인 네비(홈 · 차트 · 보관함) / [곡 업로드] 주요 액션 버튼
텍스트 `Selnar`로 로고를 대체하지 않는다. 흰 배경본(`logo-on-light.png`)은 다크 셸에 쓰지 않는다. 사용 규칙은 `PLAN.md` §12.1.

**상단 헤더**
검색창 (placeholder: `곡명, 창작자, 프롬프트 키워드 검색`) / 로그인 · 프로필 버튼

**하단 고정 플레이어 (H 80px / Mobile 64px)**

| 영역 | 구성 |
|---|---|
| 좌 | 커버 56×56, 제목, 창작자명, 좋아요(하트) |
| 중앙 | 이전 / 재생 · 일시정지 / 다음 + 진행 슬라이더 (현재시각 / 총시간) |
| 우 | 반복, 셔플, 볼륨 슬라이더, 재생 대기열 토글 |

> 다운로드 버튼 없음. 우측은 반복 · 셔플 · 볼륨 · 대기열 4개입니다.

**모바일 플레이어** — 미니바(64px) 탭 시 풀스크린으로 확장. 미니바에는 커버 · 제목 · 재생 버튼만.

---

### 1) 홈 `/` — `buildHomePC`, `buildHomeMobile`

- **히어로 배너** — 이주의 추천 AI 트랙 (대형 배경 커버, [즉시 재생], [프롬프트 보기])
- **AI 툴별 인기 픽** — `Suno 핫트랙`, `Udio 핫트랙` 가로 스크롤 카드
- **주간 TOP 5** — 컴팩트 랭킹 리스트 (순위 숫자 + 커버 + 제목 + 창작자)
- **최신 업로드** — 그리드 카드. 7일 이내 곡에 `NEW` 뱃지

### 2) 차트 `/chart` — `buildChartPC`, `buildChartMobile`

- **필터 탭** — `종합 TOP 100` | `Suno TOP 50` | `Udio TOP 50` | `장르별`
- **헤더 액션** — [전체 재생] 버튼 하나. 체크박스 · 다중 선택 없음
- **갱신 표기** — 우상단에 `매일 00:00 갱신 · 기준 YYYY-MM-DD` 캡션
- **트랙 테이블 행 컬럼**

  | 순위 | 커버 40×40 | 제목 (+ `NEW`) | 창작자 | AI 툴 뱃지 | 장르 | 재생시간 | ♥ 수 | ⋯ |

- **모바일** — 테이블 대신 리스트 행. 순위 · 커버 · 제목/창작자 2줄 · 툴 뱃지만 남기고 나머지 생략

> 순위 변동 ▲▼ 컬럼 없음. 스냅샷 데이터가 없어 `-`만 나옵니다. 6단계에서 복원.

### 3) 곡 상세 `/track/:id` — `buildTrackDetailPC`, `buildTrackDetailMobile` ★ 차별화

- **비주얼 헤더** — 앨범아트 300×300, 제목, 창작자, 업로드일, AI 툴 뱃지 + 모델 버전 뱃지(`Suno v4.5`), [재생] [좋아요]
- **프롬프트 인스펙터** ← 이 서비스의 심장
  - 스타일 프롬프트 박스 (예: `80s synthpop, nostalgic, emotional female vocal, 120bpm`)
  - 네거티브 프롬프트 박스
  - [프롬프트 복사] 원클릭 버튼 (복사 성공 시 토스트)
  - **비공개 상태** — `is_prompt_public = false`일 때의 잠금 상태도 함께 렌더 (자물쇠 + "창작자가 프롬프트를 비공개했습니다")
- **가사** — 한글 가사 본문. 길면 접기/펼치기
- **창작자 카드** — 아바타, 이름, 곡 수, [채널 가기]

> 라이선스 · 다운로드 안내 섹션 없음.

### 4) 곡 업로드 `/upload` — `buildUploadPC`, `buildUploadMobile`

- **음원 업로더** — 드래그앤드롭 (`.mp3`, `.wav`). 드롭 즉시 `audio.duration`으로 재생시간 자동 표기
- **커버 등록** — 1:1 이미지 미리보기
- **메타데이터** — 제목, 설명, 장르 셀렉트, 언어
- **AI 생성 정보** — 툴 선택(`Suno` / `Udio` / `기타`), 모델 버전 입력, 프롬프트, 네거티브 프롬프트, **프롬프트 공개 스위치**
- **저작권 서약 체크박스** — "직접 생성한 음원이며 저작권 및 이용약관을 준수합니다". **미체크 시 [업로드] 비활성**
- **상태 3종 렌더** — 빈 상태 / 파일 선택 후 / 업로드 진행 중(프로그레스)
- **모바일** — 모달이 아니라 풀스크린 페이지. 섹션 세로 스택

> 다운로드 허용 스위치 없음. 요금제 선택 없음.

### 5) 내 보관함 `/me` — `buildLibraryPC`, `buildLibraryMobile`

- **탭** — `좋아요한 곡` | `내 플레이리스트` | `내가 업로드한 곡`
- 업로드한 곡 행에는 [수정] [비공개 전환] 액션
- 빈 상태 일러스트 + CTA 각 탭별 1종씩

> `최근 재생` · `다운로드 내역` 탭 없음.

### 6) 창작자 채널 `/artist/:username` — `buildArtistPC`

- **프로필 헤더** — 아바타, 표시명, `@username`, bio, 총 곡 수 / 총 재생수
- **대표곡 3곡** — 재생수 상위. 카드형
- **전체 곡 목록** — 차트 행 컴포넌트 재사용, 순위 컬럼만 제거
- 본인 채널일 때는 [프로필 편집] 버튼

### 7) 검색 결과 `/search?q=` — `buildSearchPC`

- 상단에 검색어 + 결과 수
- **결과 탭** — `곡` | `창작자` | `프롬프트`
- 무결과 상태 — "다른 키워드로 검색해 보세요" + 인기 검색어 칩

### 8) 플레이리스트 상세 `/playlist/:id` — `buildPlaylistPC`

- 헤더 — 커버(4분할 모자이크), 제목, 만든이, 곡 수 / 총 재생시간, [전체 재생] [좋아요]
- 곡 목록 — 순서 번호 + 드래그 핸들(본인 것일 때)

### 9) 로그인 · 회원가입 `/login` — `buildAuthPC`

- 중앙 정렬 카드 (최대 400px). 사이드바 · 플레이어 없는 **단독 레이아웃**
- 탭 전환: `로그인` / `회원가입`
- 필드 — 이메일, 비밀번호 (회원가입 시 + `username`, 표시명)
- 소셜 로그인 버튼 자리 1개 (Google) — 3단계에서 결정

> **관리자 화면(`/admin` 계열)은 그리지 않습니다.** MVP에서는 Supabase Table Editor로 대체합니다 (`PLAN.md` §4 · §10).

---

## 3.1 프레임 목록 — 캔버스에 올라가는 것 전부

Figma 파일은 페이지 3장으로 나눕니다. `00 · Foundation` / `01 · PC (1920)` / `02 · Mobile (390)`.

**00 · Foundation** — 프레임이 아니라 컴포넌트 12종

`Sidebar` `Header` `BottomPlayer` `MiniPlayer` `TrackRow` `TrackCard` `Badge` `Button` `EmptyState` `Input` `Switch` `Toast`

작은 것부터 만듭니다. `Badge` → `Button` → `Input` → `TrackRow` → `TrackCard` → 셸 3종 → `EmptyState`.

**01 · PC (1920)** — 15장

| 프레임 | 비고 |
|---|---|
| `PC/01-Home` | |
| `PC/02-Chart` | TOP 100 전부 그리지 말고 상위 12행 + 말줄임 |
| `PC/03-TrackDetail` | 프롬프트 공개 |
| `PC/03-TrackDetail-Locked` | `is_prompt_public = false` 잠금 |
| `PC/04-Search` / `PC/04-Search-Empty` | 결과 있음 / 무결과 |
| `PC/05-Auth-Login` / `PC/05-Auth-Signup` | 셸 없는 단독 레이아웃 |
| `PC/06-Upload-Empty` / `-Filled` / `-Progress` | 상태 3종 |
| `PC/07-Library` / `PC/07-Library-Empty` | 좋아요 탭 기준 / 빈 상태 대표 1장 |
| `PC/08-Playlist` | |
| `PC/09-Artist` | |

**02 · Mobile (390)** — 6장

`M/01-Home` `M/02-Chart` `M/03-TrackDetail` `M/06-Upload` `M/07-Library` `M/Player-Fullscreen`

검색 · 로그인 · 플레이리스트 · 창작자 채널은 PC 레이아웃을 세로 스택하면 되므로 모바일 프레임을 만들지 않습니다.

**렌더 순서** — 한 번에 21장을 켜지 않습니다. 죽으면 어디서 죽었는지 못 찾습니다.

1. Foundation (토큰 + 컴포넌트 12종) → 변수 바인딩이 실제로 붙었는지 검증
2. `PC/01` `PC/02` `PC/03` → 컴포넌트가 실전에서 검증되는 지점. **치수 변경은 여기서 전부** 끝냅니다
3. 나머지 PC 12장
4. Mobile 6장

세로 치수는 AutoLayout hug가 결정하므로 명세에 적지 않습니다.

---

## 4. 디자인 토큰

`code.js` 실행 시 Figma Variables 컬렉션으로 자동 생성 · 바인딩됩니다.
Tailwind 변환 규칙은 `PLAN.md` §6.2를 따릅니다.

```
[Color — Brand]
color/brand/primary      : #10B981   Emerald 500 · 메인 포인트
color/brand/secondary    : #06B6D4   Cyan 500
color/brand/logo         : #C09B4A   로고 금색. 마크를 다시 칠할 때만
color/text/on-brand      : #052E20   ★ primary 배경 위 텍스트 전용

[Color — Surface]
color/bg/base            : #0A0A0A   페이지 최하단 배경
color/bg/surface         : #141414   카드, 사이드바
color/bg/elevated        : #1F1F1F   하단 플레이어, 모달
color/bg/hover           : #262626   행 hover, 버튼 ghost hover

[Color — Text]
color/text/main          : #FFFFFF
color/text/muted         : #A3A3A3   보조 텍스트, 창작자명
color/text/disabled      : #525252

[Color — Line & Badge]
color/border/subtle      : #262626
color/badge/suno         : #FF5E3A
color/badge/udio         : #7C3AED
color/badge/other        : #525252   ai_tool = 'other'
color/badge/new          : #10B981   NEW 뱃지

[Radius]
radius/sm   : 6px     뱃지, 소형 인풋
radius/md   : 10px    카드, 앨범아트
radius/lg   : 16px    모달, 하단 플레이어 모서리
radius/full : 9999px  알약형 버튼, 태그 칩

[Spacing]
space/xs 4 · space/sm 8 · space/md 16 · space/lg 24 · space/xl 32 · space/2xl 48

[Typography]
font/family/base   : Pretendard → Noto Sans KR → Inter
text/display  : 32 / 40 / Bold      히어로 타이틀
text/h1       : 24 / 32 / Bold      페이지 제목
text/h2       : 20 / 28 / SemiBold  섹션 제목
text/body     : 14 / 20 / Regular   본문, 테이블 행
text/bodyB    : 14 / 20 / Medium    곡 제목
text/caption  : 12 / 16 / Regular   창작자명, 재생시간, 캡션
text/badge    : 11 / 14 / SemiBold  뱃지 라벨

[Component Size]
size/player/pc 80 · size/player/mobile 64
size/sidebar 240 · size/cover/player 56 · size/cover/row 40 · size/cover/hero 300
```

### 4.1 대비 검증 (WCAG AA 4.5:1 기준)

| 조합 | 대비 | 판정 |
|---|---|---|
| `text/main` on `bg/base` | 19.5:1 | 통과 |
| `text/muted` on `bg/surface` | 7.3:1 | 통과 |
| **`text/main` on `brand/primary`** | **2.6:1** | **미달 — 사용 금지** |
| `text/on-brand` on `brand/primary` | 8.9:1 | 통과 |

> Primary 버튼 라벨에 흰색을 쓰면 안 됩니다. 반드시 `color/text/on-brand`를 바인딩합니다.

---

## 5. 오디오 기술 사양

**재생** — HTML5 `<audio>` 네이티브 API + Zustand. 외부 라이브러리 없음. 페이지 이동 간 끊김 없는 재생을 위해 **단일 인스턴스**로 관리. 상세 설계는 `PLAN.md` §7.

**업로드** — 파일 드롭 시 브라우저에서 `audio.duration`으로 `duration_sec` 자동 추출. 3단계에서 Supabase Storage(`tracks/`, `covers/`) + Postgres `tracks` 테이블 연동.

**다운로드** — MVP 범위 밖 (`PLAN.md` §4 · §10). 관련 UI를 그리지 않습니다.

**파형 시각화** — `wavesurfer.js`, 6단계 후보. 곡 상세 한정.

---

## 6. 플러그인 스크립트 아키텍처

```
/figma-plugin/
├─ manifest.json
├─ code.js
└─ README.md      ← 실행 방법. 이 문서만 읽고 재현 가능해야 함
```

```
code.js 구성 계층:
1. CONFIG           화면별 on/off, rebuild 옵션
2. resolveFont()    Pretendard → Noto Sans KR → Inter 폴백
3. 저수준 헬퍼       AL(AutoLayout), hex, solid, thumbFill, pad
4. buildTokens()    토큰 생성 + 바인딩 컨텍스트 → K.C() K.R() K.T() K.S()
5. 공통 컴포넌트     Sidebar, Header, BottomPlayer, MiniPlayer, TrackRow,
                    TrackCard, Badge, Button, EmptyState, Input, Switch, Toast
6. 화면 빌더         buildHome / Chart / TrackDetail / Upload / Library /
                    Artist / Search / Playlist / Auth  (각 PC · Mobile)
7. main()           토큰 생성 → plan 배열 순회 → 그리드 자동 배치
```

**구현 시 주의 2가지**

- **폰트는 사용 전에 `loadFontAsync`가 끝나 있어야 합니다.** 텍스트 노드를 만든 뒤 로드하면 던집니다. Regular · Medium · SemiBold · Bold 네 개를 모두 로드합니다.
- **`rebuild: true`일 때 같은 이름의 기존 프레임을 지우고 다시 그립니다.** 안 그러면 실행할 때마다 캔버스에 프레임이 쌓입니다.

---

## 7. AI 도구 협업 규칙

1. **작성 시**
   - 이 문서 §3 화면 명세와 §4 토큰만 근거로 삼습니다. 없는 데이터를 상상해서 그리지 않습니다.
   - **하드코딩 금지** — 색상 `K.C()`, 라운드 `K.R()`, 타이포 `K.T()`, 간격 `K.S()` 필수 바인딩
   - 빈 상태 · 로딩 상태도 함께 렌더합니다. 정상 상태만 그린 디자인은 구현 단계에서 반드시 막힙니다.
2. **검증** — Figma 데스크톱 → `Plugins` → `Development` → 플러그인 실행 → 캔버스 확인
   - 첫 검증 게이트: 사각형 하나에 `color/brand/primary`를 바인딩하고, Figma에서 그 변수 값을 바꿔 사각형이 따라오는지 확인합니다. 안 따라오면 하드코딩된 것이고, 그 상태로 21장을 그리면 전부 다시 만들어야 합니다.
3. **구현 이관** — 확정된 토큰을 `src/index.css`의 `@theme`에 주입하고, 화면을 `src/features/` 아래 컴포넌트로 1:1 변환
   - 공통 컴포넌트는 Figma **Component Set**으로 만듭니다. Variant 구성이 그대로 S단계 Storybook stories가 되므로, "이게 story 하나가 된다"를 기준으로 쪼갭니다 (`PLAN.md` §6.3).
   - 타이포는 Figma Variables가 폰트 크기 · 웨이트를 직접 받지 못합니다. `K.T()`는 **Text Style을 만들어 적용**하는 방식으로 구현합니다. 색상 · 라운드 · 간격과 바인딩 방식이 다르다는 점을 전제로 짭니다.
4. **문서 갱신** — 기능 · 데이터가 바뀌면 `PLAN.md`를 먼저 고치고, 그다음 이 문서를 맞춥니다. 순서를 뒤집지 않습니다.

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|---|---|---|
| v1.2 | 2026-09-14 | 사이드바 로고를 투명 누끼본(`logo.png`)으로 고정 |
| v1.1 | 2026-09-14 | 로고 에셋·`color/brand/logo` 반영. 사이드바 로고를 이미지로 고정 |
| v1.0 | 2026-09-14 | 기준 문서로 재작성. 이전 판(v0.x) 전부 폐기. §3.1 프레임 목록 · §6 구현 주의사항 정리, 문서 내 이력 블록 제거 |
