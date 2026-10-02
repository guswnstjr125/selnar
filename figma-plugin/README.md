# Selnar Figma 플러그인

D단계 산출물. `FIGMA_SPEC.md` §4 토큰과 §3 화면 명세를 Figma 캔버스에 자동 렌더링합니다. 기능 범위는 `PLAN.md`가 정합니다.

- **기준 문서:** [`../FIGMA_SPEC.md`](../FIGMA_SPEC.md) v1.4
- **현재 구현 범위:** Foundation (토큰 + 검증 게이트 + 컴포넌트 5종: Badge · Button · Input · TrackRow · TrackCard). 화면 빌더는 아직 없음

---

## 실행

1. **Figma 데스크톱 앱**을 엽니다 (브라우저에서는 개발 플러그인이 안 뜹니다)
2. 아무 디자인 파일이나 열고
3. `Plugins` → `Development` → `Import plugin from manifest...`
4. 이 폴더의 `manifest.json` 선택
5. `Plugins` → `Development` → `Selnar Design Renderer` 실행

실행하면 `00 · Foundation` 페이지가 만들어지고 그쪽으로 이동합니다.

---

## 실행 직후 할 일 — 바인딩 검증

**이걸 통과하기 전에는 화면을 그리지 마세요.**

캔버스 맨 위 `VERIFY` 프레임 안에 초록 사각형이 하나 있습니다.

1. 우측 패널에서 `Variables` 열기 → `Selnar Tokens` 컬렉션
2. `color/brand/primary` 값을 아무 빨강(`#FF0000`)으로 변경
3. **사각형이 빨개지면 통과.** 안 바뀌면 바인딩이 아니라 하드코딩된 겁니다

통과했으면 값을 `#10B981`로 되돌립니다.

이 게이트를 건너뛰고 23장을 그리면, 나중에 토큰 하나 바꿀 때 전부 다시 만들어야 합니다.

---

## 설정

`code.js` 맨 위 `CONFIG`를 고칩니다.

```js
const CONFIG = {
  rebuild: true,        // 같은 이름의 기존 노드를 지우고 다시 그림
  rebuildTokens: true,  // false면 기존 변수 재사용 (수동 조정값 보존)
  build: {
    verifyGate: true,
    components: true,
  },
};
```

**토큰을 Figma에서 직접 손봤다면 `rebuildTokens: false`로 두세요.** true면 컬렉션을 지우고 새로 만들어서 조정한 값이 날아갑니다.

---

## 폰트

`Pretendard` → `Noto Sans KR` → `Inter` 순으로 시도하고, 네 웨이트(Regular · Medium · SemiBold · Bold)가 전부 있는 첫 후보를 씁니다.

Pretendard가 없으면 [여기서](https://github.com/orioncactus/pretendard) 설치하세요. 없어도 Inter로 돌아가지만 한글 자간이 다르게 나옵니다.

---

## 타이포가 변수가 아닌 이유

Figma Variables는 색상 · 숫자 · 문자열 · boolean만 받습니다. **폰트 크기와 웨이트는 못 받습니다.**

그래서 `text/*` 토큰은 Variables가 아니라 **Text Style**로 만듭니다.

```js
node.fills = [K.C('color/bg/base')];              // 색 — 변수 바인딩
node.setBoundVariable('itemSpacing', K.S('space/md')); // 숫자 — 변수 바인딩
await K.T(textNode, 'text/body');                 // 타이포 — 스타일 적용
```

`K.T()`만 `await`가 필요하고 인자 순서도 다릅니다. 헷갈리기 쉬운 지점입니다.

---

## 다음에 붙일 것

`FIGMA_SPEC.md` §3.1 렌더 순서를 따릅니다.

| 순서 | 내용 | 상태 |
|---|---|---|
| 1 | Foundation — 토큰 + 컴포넌트 | **일부 구현** (5종 / 13종, 상태 Variant 미구현 — `FIGMA_SPEC.md` §3.2) |
| 2 | 컴포넌트 나머지 8종 — Toast, EmptyState(variant 3종), Switch, Sidebar, Header, BottomPlayer, MiniPlayer, QueuePanel | |
| 3 | `PC/01-Home` `PC/02-Chart` `PC/03-TrackDetail` — 치수 확정 지점 | |
| 4 | 나머지 PC 14장 | |
| 5 | Mobile 6장 | |

**3번에서 치수를 전부 끝내세요.** 23장 다 그린 뒤에 `TrackRow` 높이를 바꾸면 네 화면을 다시 그려야 합니다.

---

## 알려진 한계

- 간격은 `space/*` 변수에 바인딩됩니다(`AL()`의 `gap`·`pad`는 토큰 이름만 받고 0 외 숫자는 에러). 스케일(4·8·16·24·32·48)에 없던 값(2·3·6·10·12)은 가장 가까운 토큰으로 맞췄으므로 치수가 이전과 조금 다릅니다. 최종 치수는 `PC/01~03` 단계에서 확정합니다.
- 로고 토큰 `color/brand/logo`(#C09B4A)는 정의돼 있고, 로고 이미지는 Sidebar 컴포넌트에서 `public/brand/logo.png`를 씁니다.

---

## 막혔을 때

**한 화면에서 반나절 넘게 디버깅 중이면 그 화면은 손으로 그립니다.** 업로드 폼 3종 상태와 모바일 풀스크린 플레이어가 1순위 후보입니다 (`FIGMA_SPEC.md` §1).

플러그인은 토큰 일관성과 대량 생성에 쓰는 도구지, 모든 화면을 코드로 만들자는 게 아닙니다.
