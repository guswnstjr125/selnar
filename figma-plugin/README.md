# Selnar Figma 플러그인

D단계 산출물. `FIGMA_SPEC.md` §4 토큰과 §3 화면 명세를 Figma 캔버스에 자동 렌더링합니다. 기능 범위는 `PLAN.md`가 정합니다.

- **기준 문서:** [`../FIGMA_SPEC.md`](../FIGMA_SPEC.md) v1.6
- **현재 구현 범위:** Foundation 전체 + `PC/01-Home` · `PC/02-Chart` · `PC/03-TrackDetail` · `PC/03-TrackDetail-Locked`. **Foundation은 Figma 실행으로 확인됨**(컴포넌트 13종 · Variant 배치 · 변수 바인딩 · 폰트 폴백). **PC 화면 4장은 코드만 작성됐고 Figma에서 실행해 확인하기 전 상태입니다**

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

이 게이트를 건너뛰고 화면을 그리면, 나중에 토큰 하나 바꿀 때 전부 다시 만들어야 합니다.

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
    homePC: false,
    chartPC: false,
    trackDetailPC: false,
    trackDetailLockedPC: false,
  },
};
```

**토큰을 Figma에서 직접 손봤다면 `rebuildTokens: false`로 두세요.** true면 컬렉션을 지우고 새로 만들어서 조정한 값이 날아갑니다.

Foundation 검증 뒤 화면을 그릴 때는 `verifyGate` · `components`를 `false`, `rebuildTokens`를 `false`로 바꾸고 화면 플래그를 **한 번에 하나씩** 켭니다. `rebuild: true`면 `01 · PC (1920)` 페이지에서 같은 이름의 기존 프레임만 지우고 다시 그립니다.

---

## 폰트

`Pretendard` → `Noto Sans KR` → `Inter` 순으로 시도합니다. 설치된 폰트 목록에서 웨이트별 실제 스타일 이름을 찾아 씁니다(Inter는 `Semi Bold`, Pretendard는 `SemiBold`처럼 이름이 달라서). 해당 웨이트가 없으면 가까운 웨이트로 대체하며(예: Noto Sans KR의 SemiBold → Bold), 실패하면 후보별 사유를 에러 메시지에 보여 줍니다.

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

## 진행 상태

`FIGMA_SPEC.md` §3.1 렌더 순서를 따릅니다.

| 순서 | 내용 | 상태 |
|---|---|---|
| 1 | Foundation — 토큰 + 컴포넌트 13종 + 상태 Variant | **확인됨** (Figma 실행 · 변수 바인딩 · 상태별 높이 · 아이콘 · 사이드바 버튼) |
| 2 | `PC/01-Home` `PC/02-Chart` `PC/03-TrackDetail`(+`-Locked`) — 치수 확정 지점 | **코드 작성됨 · Figma 실행 검증 필요** |
| 3 | 끝. 나머지 PC 13장과 Mobile 6장은 Figma로 그리지 않고 코드로 구현 (`PLAN.md` §9) | **범위 확정** |

**2번에서 치수를 전부 끝내세요.** 4장을 그린 뒤에 `TrackRow` 높이를 바꾸면 화면을 다시 그려야 합니다.

- 네 화면은 Foundation의 `Sidebar` · `Header(signed-in)` · `BottomPlayer` · `TrackRow` · `TrackCard` · `Badge` · `Button` · `Toast` 인스턴스로 조립합니다. 새 컴포넌트는 만들지 않습니다.
- 차트는 상위 12행과 말줄임만 렌더합니다.
- 곡 상세 공개 화면의 [프롬프트 복사]는 `Button(kind=ghost, state=default)`이며 복사 성공 피드백은 `Toast(variant=success)` 인스턴스로 함께 표시합니다. 잠금 화면에는 복사 버튼을 표시하지 않습니다.

---

## 알려진 한계

- 간격은 `space/*` 변수에 바인딩됩니다(`AL()`의 `gap`·`pad`는 토큰 이름만 받고 0 외 숫자는 에러). 스케일(4·8·16·24·32·48)에 없던 값(2·3·6·10·12)은 가장 가까운 토큰으로 맞췄으므로 치수가 이전과 조금 다릅니다. 최종 치수는 `PC/01~03` 단계에서 확정합니다.
- 로고 토큰 `color/brand/logo`(#C09B4A)는 정의돼 있고, 로고 이미지는 Sidebar 컴포넌트에서 `public/brand/logo.png`를 씁니다.

---

## Foundation 구현 메모

- Plugin API 사용법은 Figma MCP의 `figma-use` 레퍼런스(gotchas · component-patterns)와 대조해 맞췄습니다. Variant 배치는 `combineAsVariants` 뒤 직접 배치하고, `layoutGrow`는 `appendChild` 뒤에, 변수 scope는 용도별로 지정합니다.
- 컴포넌트는 Component Set으로 만들어집니다(Variant 이름 `kind=primary, state=hover` 형식). 단일 컴포넌트는 Sidebar · BottomPlayer · MiniPlayer · QueuePanel입니다.
- **로고는 자리표시입니다.** 플러그인은 네트워크가 없어 `public/brand/logo.png`를 불러오지 못합니다. Sidebar의 `logo (public/brand/logo.png 로 교체)` 프레임에 이미지를 수동으로 채우세요.
- 아이콘(♥ ▶ |◀ ▶| ⟲ ⤮ ☰ ⋯)은 유니코드 글리프 자리표시입니다. 1단계 코드에서 아이콘 컴포넌트로 교체합니다.
- focus 링은 2px 외곽선(`OUTSIDE`)이고 2px 오프셋은 적용하지 않았습니다. 필요하면 Figma에서 손으로 조정합니다.
- `Toast.error`는 에러 색 토큰이 없어 글리프(`!`)로만 구분합니다.
- 크기 변수(`size/*`) 바인딩이 불가능한 필드면 콘솔에 경고를 남기고 현재 값을 유지합니다. 경고가 보이면 알려 주세요.

---

## 막혔을 때

**한 화면에서 반나절 넘게 디버깅 중이면 그 화면은 손으로 그립니다.** 업로드 폼 3종 상태와 모바일 풀스크린 플레이어가 1순위 후보입니다 (`FIGMA_SPEC.md` §1). 이제 업로드 폼과 모바일 플레이어는 처음부터 코드로 구현합니다.

플러그인은 토큰 일관성과 대량 생성에 쓰는 도구지, 모든 화면을 코드로 만들자는 게 아닙니다.
