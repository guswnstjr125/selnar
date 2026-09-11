# selnar Figma 자동화 디자인 빌더 & 화면 명세서

이 문서는 **AI 음악 스트리밍 웹 서비스 `selnar`**의 UI/UX 디자인을 Figma 플러그인 스크립트(`manifest.json` + `code.js`)로 자동 생성하기 위한 기준 명세서입니다.
사람과 AI(Claude Code, Antigravity, Cursor)가 공통으로 읽고 개발 및 디자인을 동기화하는 데 사용합니다.

---

## 1. 개요 및 제작 방식

- **프로젝트명**: selnar (AI 음악 스트리밍 웹 서비스)
- **방식**: Figma 수작업 드로잉 대신, **Figma Plugin API를 활용한 코드 기반 자동 렌더링 (`D:\files` 형식)**
- **핵심 가치**:
  1. **디자인 토큰 바인딩**: 색상·라운드·간격을 Figma 공식 Variables로 바인딩하여, 토큰 값 변경만으로 전 화면 테마 일괄 전환
  2. **오토레이아웃 100% 준수**: 모든 프레임, 카드, 버튼은 반응형 AutoLayout으로 생성
  3. **실제 한국어 콘텐츠**: 플레이스홀더 텍스트 대신 실제 AI 음원 메타데이터 및 프롬프트 표기
  4. **AI 도구 협업**: 스크립트 코드 생성 ➔ Figma 데스크톱에서 실행 ➔ 피드백 반영

---

## 2. 4대 스트리밍 서비스 벤치마킹 및 selnar 반영점

| 벤치마킹 서비스          | 장점 및 특징                                                    | selnar 반영 요소                                               |
| :----------------------- | :-------------------------------------------------------------- | :------------------------------------------------------------- |
| **스포티파이 (Spotify)** | 글로벌 표준 3단 다크 레이아웃 (사이드바 + 본문 + 하단 플레이어) | **전체 화면 프레임워크**로 채택 (끊김 없는 SPA 레이아웃)       |
| **멜론 (Melon)**         | 한국 사용자에게 익숙한 TOP 100 차트 테이블, 다중 선택 액션      | **차트 페이지**의 순위 변동(▲▼), 일괄 재생 및 다운로드 액션 바 |
| **네이버 바이브 (VIBE)** | 감각적인 매거진 카드 UI, 대형 앨범아트 강조                     | **곡 상세 페이지**의 비주얼 헤더 및 추천 플레이리스트 카드     |
| **지니뮤직 (Genie)**     | 직관적인 카테고리/태그 탐색                                     | **AI 툴별(Suno/Udio) 필터 칩** 및 장르 탐색 섹션               |

---

## 3. 화면 목록 및 세부 명세 (PC 1920 & Mobile 390)

각 화면은 `CONFIG` 플래그로 켜고 끌 수 있으며, 동일한 디자인 토큰을 공유합니다.

### 0) 공통 셸 레이아웃 (Layout Shell)

- **좌측 사이드바 (240px)**:
  - 로고 (`selnar`), 메인 네비게이션(홈, 차트, 보관함)
  - [곡 업로드] 주요 액션 버튼
- **상단 헤더**:
  - 검색창 ("곡명, 아티스트, 프롬프트 키워드 검색")
  - 로그인/프로필 버튼
- **하단 고정 플레이어 (H: 80px / Mobile H: 64px)**:
  - **좌측**: 현재 재생 곡 앨범 커버(56x56), 제목, 아티스트, 좋아요(하트)
  - **중앙**: 이전곡 / 재생(일시정지) / 다음곡 + 재생 진행 슬라이더바 (현재시각/총시간)
  - **우측**: 다운로드 버튼, 볼륨 조절 슬라이더, 재생 대기열 토글

### 1) 홈 / 둘러보기 (`buildHomePC`, `buildHomeMobile`)

- **히어로 배너**: 이주의 추천 AI 트랙 (대형 배경 커버, 즉시 재생, 프롬프트 미리보기 버튼)
- **AI 툴별 인기 픽**: `Suno 핫트랙`, `Udio 핫트랙` 가로 스크롤 카드 섹션
- **실시간 급상승 TOP 5**: 컴팩트 랭킹 리스트
- **최신 업로드**: 새로 등록된 AI 음원 그리드 카드

### 2) 차트 TOP 100 (`buildChartPC`, `buildChartMobile`)

- **차트 필터 탭**: `종합 TOP 100` | `Suno TOP 50` | `Udio TOP 50` | `장르별 차트`
- **일괄 액션 바**: [전체 선택] [전체 재생] [선택곡 다운로드]
- **트랙 테이블 행**:
  - 컬럼: 순위, 순위 변동(▲/▼/-), 커버 썸네일, 제목, 아티스트, **AI 툴 뱃지(Suno/Udio)**, 재생시간, 좋아요 수, 다운로드 버튼

### 3) 곡 상세 페이지 (`buildTrackDetailPC`, `buildTrackDetailMobile`) ★ 차별화

- **상단 헤더**: 대형 앨범아트(300x300), 곡 제목, 아티스트, 발매일, 사용 툴/요금제 뱃지, [재생] [좋아요] [다운로드]
- **프롬프트 인스펙터 (Prompt Inspector)**:
  - 스타일/장르 프롬프트 박스 (예: `80s synthpop, nostalgic, emotional female vocal, 120bpm`)
  - [프롬프트 복사] 원클릭 버튼
  - 네거티브 프롬프트, AI 모델 버전 태그
- **가사 (Lyrics)**: AI가 생성한 한글 가사 본문
- **라이선스 및 다운로드 안내**: 업로더가 지정한 이용 권리 및 다운로드 허용 상태 안내

### 4) 음원 업로드 모달/페이지 (`buildUploadModalPC`)

- **음원 파일 업로더**: 드래그앤드롭 영역 (`.mp3`, `.wav` 지원, 재생시간 자동 계산 안내)
- **앨범 커버 등록**: 1:1 이미지 업로드 미리보기
- **메타데이터 입력**: 제목, 장르 선택
- **AI 생성 정보**: 사용 AI 툴(`Suno`, `Udio`, `기타`), 요금제(무료/유료 플랜), 프롬프트 입력 및 공개 여부 스위치
- **다운로드 허용 스위치**: 다른 유저의 음원 다운로드 허용 ON/OFF
- **저작권 서약 체크박스**: "직접 생성한 음원이며 저작권 및 이용약관을 준수합니다" 동의

### 5) 내 보관함 (`buildLibraryPC`, `buildLibraryMobile`)

- **탭 메뉴**: `좋아요한 곡` | `내가 업로드한 곡` | `최근 재생한 곡` | `다운로드 내역`
- **콘텐츠 영역**: 선택한 탭에 따른 트랙 리스트 및 업로드 곡 관리(수정/삭제) 버튼

---

## 4. 디자인 토큰 시스템 (Dark Theme 기반)

`code.js` 실행 시 Figma Variables 컬렉션으로 자동 생성 및 바인딩되는 토큰 목록입니다.

```
[Color Tokens]
color/brand/primary      : #10B981 (Emerald 500 - 메인 포인트)
color/brand/secondary    : #06B6D4 (Cyan 500)
color/bg/base            : #0A0A0A (페이지 최하단 배경)
color/bg/surface         : #141414 (카드, 사이드바 배경)
color/bg/elevated        : #1F1F1F (하단 플레이어, 모달 배경)
color/text/main          : #FFFFFF (주요 텍스트)
color/text/muted         : #A3A3A3 (보조 텍스트, 아티스트명)
color/border/subtle      : #262626 (구분선, 카드 테두리)
color/badge/suno         : #FF5E3A (Suno 뱃지 컬러)
color/badge/udio         : #7C3AED (Udio 뱃지 컬러)

[Radius Tokens]
radius/sm                : 6px   (뱃지, 소형 인풋)
radius/md                : 10px  (카드, 앨범아트)
radius/lg                : 16px  (모달, 하단 플레이어 모서리)
radius/full              : 9999px (알약형 버튼, 태그 칩)

[Spacing Tokens]
space/xs (4px), space/sm (8px), space/md (16px), space/lg (24px), space/xl (32px), space/2xl (48px)
```

---

## 5. 오디오 엔진 및 업로드/다운로드 기술 사양

### 1) 오디오 라이브러리 검토 결과

- **기본 스트리밍**: **HTML5 `<audio>` 네이티브 API + Zustand**
  - 외부 라이브러리 의존성 없이 가볍고, 피그마 디자인을 100% 그대로 코드로 구현 가능.
  - 페이지 이동 간 끊김 없는 연속 재생을 위해 단일 인스턴스로 관리.
- **파형 시각화 (선택)**: **`wavesurfer.js` (무료 오픈소스)**
  - 곡 상세 화면에서 사운드 파형 탐색 UI가 필요할 경우 최우선 도입.

### 2) 업로드 & 다운로드 기술 요구사항

- **업로드 (Upload)**:
  - 파일 드롭 시 브라우저에서 `audio.duration`으로 재생시간(`durationSec`) 자동 추출
  - 3단계 Supabase 연동 시: Storage(`tracks/`, `covers/`) + Postgres(`tracks` 테이블)
  - 필수 정책: AI 툴/버전 명시, 프롬프트 공개 선택, 다운로드 허용 여부 설정, 저작권 동의
- **다운로드 (Download)**:
  - 업로더가 "다운로드 허용"으로 등록한 곡만 다운로드 버튼 활성화
  - `Blob` 변환 다운로드 방식으로 브라우저 새 창 열림 방지 및 파일명 통일 (`[selnar] 아티스트 - 제목.mp3`)
  - 다운로드 시 인기도 지표(`downloads`) 1 증가

---

## 6. Figma 플러그인 스크립트(`code.js`) 모듈 아키텍처

`D:\files`의 빌더 구조를 그대로 준수하여 작성합니다.

```
code.js 구성 계층:
1. CONFIG 플래그 (화면별 on/off, rebuild 옵션)
2. 폰트 자동 로더 (resolveFont: Pretendard -> Noto Sans KR -> Inter)
3. 저수준 그래픽/레이아웃 헬퍼 (AL: AutoLayout, hex, solid, thumbFill, pad)
4. 토큰 생성 및 바인딩 컨텍스트 (buildTokens -> K.C(), K.R(), K.T())
5. 공통 컴포넌트 빌더 (Sidebar, BottomPlayer, Header, TrackRow, PromptCard)
6. 화면 빌더 함수 (buildHomePC/Mobile, buildChartPC/Mobile, buildTrackDetailPC/Mobile 등)
7. 메인 실행기 (main: 토큰 생성 -> plan 배열 순회 -> 가로/세로 그리드 자동 배치)
```

---

## 7. AI 도구별 협업 가이드 (Claude Code / Antigravity / Cursor)

1. **Figma 플러그인 코드 작성/수정**:
   - 이 문서의 화면 명세와 토큰 규칙을 준수하여 `code.js`에 화면 생성 함수 추가
   - 하드코딩 색상 금지 (`K.C()` 토큰 변수 필수 바인딩)
2. **사람의 검증**:
   - Figma 데스크톱 앱 ➔ `Plugins` ➔ `Development` ➔ 플러그인 실행
   - 생성된 캔버스 화면 확인 및 피드백
3. **웹 프론트엔드 구현 단계 (피그마 완료 후)**:
   - 피그마에서 확정된 디자인 및 토큰을 `src/features/` 아래의 React 19 + Tailwind v4 컴포넌트로 일대일 변환
