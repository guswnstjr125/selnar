# selnar 작업 규칙

작업 전에 반드시 [PLAN.md](PLAN.md)와 [FIGMA_SPEC.md](FIGMA_SPEC.md)를 읽는다.
로컬 경로(`D:\...`)나 이전 대화를 근거로 삼지 않는다. **저장소에 있는 문서만** 근거다.

## 문서 우선순위

- `PLAN.md`가 **상위 기준**이다. 기능 범위 · 데이터 모델 · 정책 · 화면 전환 · 로드맵은 여기서만 정한다.
- `FIGMA_SPEC.md`는 **화면 표현만** 정의한다. 충돌하면 `PLAN.md`가 이긴다.
- 기준 문서는 이 두 개뿐이다. `PLAN_v2.md` 같은 사본이나 세 번째 명세를 만들지 않는다.
- 기능·데이터가 바뀌면 `PLAN.md`를 먼저 고치고, 그다음 `FIGMA_SPEC.md`를 맞춘다. 순서를 뒤집지 않는다.
- 버전·이력 규칙은 `README.md`를 따른다.

## 현재 단계 — D (Figma 디자인 확정, 진행 중)

개발(1단계 구현)은 아직 하지 않는다. D단계가 끝날 때까지 아래를 지킨다.

- **앱 소스(`src/` 등)를 수정하거나 기능을 구현하지 않는다.**
- 작업 범위는 `PLAN.md` · `FIGMA_SPEC.md` · `README.md` · `figma-plugin/` · 이 파일 · `.cursor/rules/` 뿐이다.
- 문서에 없는 기능·데이터·화면을 임의로 추가하지 않는다. 필요하면 `PLAN.md`를 먼저 고친다.
- MVP에 없는 것을 그리거나 만들지 않는다: 음원 다운로드, 순위 변동 ▲▼, 관리자 화면, 실시간 차트, 라이트 테마, 다중 선택 액션 바, 파형 시각화.
- D단계 산출물은 `/figma-plugin/` (`manifest.json`, `code.js`)과 확정된 토큰·레이아웃 치수다.

## 코드 (D단계 확정 후에만)

- 스택: Vite + React 19 + TypeScript, Tailwind CSS v4, React Router, Zustand
- 스타일은 Tailwind 클래스와 `@theme` 토큰으로 작성한다. 별도 CSS 파일은 만들지 않는다
- 색상 하드코딩 금지 (`bg-[#141414]` 등). Figma 토큰 → Tailwind `@theme` 변환은 `PLAN.md` §6.2
- 기능 전용 코드는 `src/features/<기능>`, 공용 코드만 `src/components`, `src/lib`에 둔다
- 전역 상태는 `src/stores`의 Zustand 스토어로 관리한다
- `src` 안의 다른 폴더를 가져올 때는 `@/` 별칭을 쓴다
- 현재 단계 범위를 넘는 기능은 만들지 않는다
- 서비스명은 화면에 직접 쓰지 않고 `src/config/brand.ts`만 쓴다

## Figma 플러그인 (`figma-plugin/`)

- 화면 근거는 `FIGMA_SPEC.md` §3·§3.1, 토큰은 §4, 화면 전환은 `PLAN.md` §5.3만 사용한다
- 하드코딩 금지: 색상 `K.C()`, 라운드 `K.R()`, 타이포 `K.T()`, 간격 `K.S()`
- `PLAN.md` §5.1의 9개 라우트에 대응하는 화면만 만든다. `/admin`은 그리지 않는다
- 빈 상태 · 로딩 상태도 함께 렌더한다
- Primary 버튼 라벨에는 흰색 대신 `color/text/on-brand`를 쓴다

## 작업 마무리

- D단계: 앱 코드를 건드리지 않았으면 `format` / `build` / `lint`를 돌리지 않는다. 문서 버전 규칙은 `README.md`를 따른다
- 앱 코드를 수정한 뒤에만 `npm run format`, `npm run build`, `npm run lint`를 차례로 실행해 모두 통과시킨다
- 로드맵 항목을 끝내면 `PLAN.md`의 단계 상태를 갱신한다

## Git

- 작업 하나가 끝나면 커밋한다. 메시지는 `feat:`, `fix:`, `chore:`, `docs:` 접두어를 붙인다
- 폴더 이동·삭제, 브랜치나 원격 설정 같은 작업은 한 도구만 한다. 그동안 다른 도구는 이 폴더에서 작업하지 않는다
- `.git` 폴더를 직접 옮기거나 지우지 않는다
