# Selnar Figma 플러그인

D단계 산출물. 화면 근거는 `FIGMA_SPEC.md`, 기능 범위는 `PLAN.md`.

현재 `code.js`는 **Foundation**까지입니다. 검증 게이트 + Badge · Button · Input · TrackRow · TrackCard. 화면 빌더(홈·차트 등)는 아직 없습니다.

## 실행

1. Figma 데스크톱에서 파일을 연다
2. `Plugins` → `Development` → `Import plugin from manifest…`
3. 이 폴더의 `manifest.json`을 고른다
4. `Plugins` → `Development` → `Selnar Design Renderer` 실행
5. `00 · Foundation` 페이지에서 **VERIFY** 사각형을 확인한다
   - Variables에서 `color/brand/primary` 값을 바꾸면 사각형이 따라와야 한다
   - 안 따라오면 바인딩 실패. 그 상태로 화면을 더 그리지 않는다

폰트 폴백: Pretendard → Noto Sans KR → Inter. 셋 다 없으면 실패한다.
