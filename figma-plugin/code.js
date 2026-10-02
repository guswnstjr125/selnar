// Selnar Design Renderer
// 기준 문서: FIGMA_SPEC.md v1.5 §4(토큰) · §3.1(프레임) · §6(아키텍처)
//
// 이 파일은 Foundation 단계(토큰 + 컴포넌트 13종 + 상태 Variant)까지 구현합니다.
// 화면 빌더(PC/01·02·03)는 §7-2 검증 게이트를 통과한 뒤 얹습니다.
// Figma로 그리는 화면은 PC 3화면(+TrackDetail-Locked)뿐입니다 (PLAN.md §9).

// ─────────────────────────────────────────────────────────────
// 1. CONFIG
// ─────────────────────────────────────────────────────────────

const CONFIG = {
  // true면 같은 이름의 기존 노드를 지우고 다시 그립니다.
  // false로 두면 실행할 때마다 캔버스에 프레임이 쌓입니다.
  rebuild: true,

  // 토큰 컬렉션을 다시 만들지 여부.
  // false면 기존 변수를 재사용합니다(수동으로 조정한 값 보존).
  rebuildTokens: true,

  build: {
    verifyGate: true,   // §7-2 바인딩 검증 게이트
    components: true,   // Foundation 컴포넌트 13종 (FIGMA_SPEC §3.1)
  },
};

const COLLECTION_NAME = 'Selnar Tokens';
const PAGE_FOUNDATION = '00 · Foundation';

// ─────────────────────────────────────────────────────────────
// 2. 토큰 정의 — FIGMA_SPEC.md §4 그대로
// ─────────────────────────────────────────────────────────────

const COLORS = {
  'color/brand/primary': '#10B981',
  'color/brand/secondary': '#06B6D4',
  'color/brand/logo': '#C09B4A',
  'color/text/on-brand': '#052E20',

  'color/bg/base': '#0A0A0A',
  'color/bg/surface': '#141414',
  'color/bg/elevated': '#1F1F1F',
  'color/bg/hover': '#262626',

  'color/text/main': '#FFFFFF',
  'color/text/muted': '#A3A3A3',
  'color/text/disabled': '#525252',

  'color/border/subtle': '#262626',
  'color/badge/suno': '#FF5E3A',
  'color/badge/udio': '#7C3AED',
  'color/badge/other': '#525252',
  'color/badge/new': '#10B981',
};

const RADII = {
  'radius/sm': 6,
  'radius/md': 10,
  'radius/lg': 16,
  'radius/full': 9999,
};

const SPACES = {
  'space/xs': 4,
  'space/sm': 8,
  'space/md': 16,
  'space/lg': 24,
  'space/xl': 32,
  'space/2xl': 48,
};

const SIZES = {
  'size/player/pc': 80,
  'size/player/mobile': 64,
  'size/sidebar': 240,
  'size/cover/player': 56,
  'size/cover/row': 40,
  'size/cover/hero': 300,
};

// 타이포는 Figma Variables가 폰트 크기·웨이트를 직접 받지 못합니다.
// Text Style을 만들어 적용하는 방식으로 갑니다 (FIGMA_SPEC §7-3).
const TEXTS = {
  'text/display': { size: 32, line: 40, weight: 'Bold' },
  'text/h1': { size: 24, line: 32, weight: 'Bold' },
  'text/h2': { size: 20, line: 28, weight: 'SemiBold' },
  'text/body': { size: 14, line: 20, weight: 'Regular' },
  'text/bodyB': { size: 14, line: 20, weight: 'Medium' },
  'text/caption': { size: 12, line: 16, weight: 'Regular' },
  'text/badge': { size: 11, line: 14, weight: 'SemiBold' },
};

const WEIGHTS = ['Regular', 'Medium', 'SemiBold', 'Bold'];

// ─────────────────────────────────────────────────────────────
// 3. 폰트 — 사용 전에 로드가 끝나 있어야 합니다
// ─────────────────────────────────────────────────────────────

let FONT_FAMILY = 'Inter';

async function resolveFont() {
  const candidates = ['Pretendard', 'Noto Sans KR', 'Inter'];

  for (const family of candidates) {
    try {
      // 네 웨이트를 전부 로드합니다. 하나라도 없으면 다음 후보로.
      for (const style of WEIGHTS) {
        await figma.loadFontAsync({ family, style });
      }
      FONT_FAMILY = family;
      console.log(`[font] ${family} 로드 완료`);
      return family;
    } catch (e) {
      console.log(`[font] ${family} 사용 불가 → 다음 후보`);
    }
  }

  throw new Error('사용 가능한 폰트가 없습니다. Inter를 설치하세요.');
}

// ─────────────────────────────────────────────────────────────
// 4. 저수준 헬퍼
// ─────────────────────────────────────────────────────────────

function hex(h) {
  const s = h.replace('#', '');
  return {
    r: parseInt(s.slice(0, 2), 16) / 255,
    g: parseInt(s.slice(2, 4), 16) / 255,
    b: parseInt(s.slice(4, 6), 16) / 255,
  };
}

function solid(h) {
  return { type: 'SOLID', color: hex(h) };
}

/**
 * AutoLayout 프레임 생성
 * @param {object} o - name, dir('H'|'V'), gap, pad, w, h, align
 * gap / pad는 토큰 이름('space/md')만 받습니다. 0은 허용, 그 외 숫자는 에러.
 */
function AL(o = {}) {
  const f = figma.createFrame();
  f.name = o.name || 'Frame';
  f.layoutMode = o.dir === 'V' ? 'VERTICAL' : 'HORIZONTAL';
  bindSpace(f, 'itemSpacing', o.gap);
  f.counterAxisAlignItems = o.align || 'CENTER';
  f.clipsContent = false;

  const p = pad(o.pad);
  bindSpace(f, 'paddingTop', p[0]);
  bindSpace(f, 'paddingRight', p[1]);
  bindSpace(f, 'paddingBottom', p[2]);
  bindSpace(f, 'paddingLeft', p[3]);

  // resize()는 두 축을 모두 FIXED로 바꾸므로, 지정한 축만 FIXED로 두고 나머지는 HUG로 되돌립니다
  f.resize(o.w || 1, o.h || 1);
  f.layoutSizingHorizontal = o.w ? 'FIXED' : 'HUG';
  f.layoutSizingVertical = o.h ? 'FIXED' : 'HUG';
  f.fills = []; // 색은 호출부에서 K.C()로 바인딩합니다. 헥스 직접 지정 금지

  return f;
}

/** 간격 토큰 컨텍스트 — main()에서 buildTokens() 직후 주입 */
let TOKENS = null;

/** 간격 값을 변수에 바인딩합니다. 하드코딩 금지(AGENTS.md) — 숫자는 0만 허용 */
function bindSpace(node, field, v) {
  if (v == null || v === 0) {
    node[field] = 0;
    return;
  }
  if (typeof v !== 'string') {
    throw new Error(`간격은 space/* 토큰 이름으로 지정하세요: ${field}=${v}`);
  }
  node.setBoundVariable(field, TOKENS.S(v));
}

/** pad('space/md') / pad(['space/sm','space/md']) / pad([T,R,B,L]) → [T,R,B,L] */
function pad(v) {
  if (v == null) return [0, 0, 0, 0];
  if (typeof v === 'string') return [v, v, v, v];
  if (v.length === 2) return [v[0], v[1], v[0], v[1]];
  if (v.length === 4) return v;
  return [0, 0, 0, 0];
}

/** 커버 자리표시용 채움 */
function thumbFill(node, h) {
  node.fills = [{
    type: 'GRADIENT_LINEAR',
    gradientTransform: [[1, 0, 0], [0, 1, 0]],
    gradientStops: [
      { position: 0, color: Object.assign({}, hex(h), { a: 1 }) },
      { position: 1, color: Object.assign({}, hex('#0A0A0A'), { a: 1 }) },
    ],
  }];
}

// ─────────────────────────────────────────────────────────────
// 5. buildTokens() — Variables 생성 + 바인딩 컨텍스트 반환
// ─────────────────────────────────────────────────────────────

async function buildTokens() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let collection = collections.find((c) => c.name === COLLECTION_NAME);

  if (collection && CONFIG.rebuildTokens) {
    collection.remove();
    collection = null;
  }
  if (!collection) {
    collection = figma.variables.createVariableCollection(COLLECTION_NAME);
  }

  const modeId = collection.modes[0].modeId;
  const existing = await figma.variables.getLocalVariablesAsync();
  const map = {};

  function ensure(name, type, value) {
    let v = existing.find(
      (x) => x.name === name && x.variableCollectionId === collection.id
    );
    if (!v) v = figma.variables.createVariable(name, collection, type);
    v.setValueForMode(modeId, value);
    map[name] = v;
    return v;
  }

  for (const [name, value] of Object.entries(COLORS)) {
    ensure(name, 'COLOR', hex(value));
  }
  for (const group of [RADII, SPACES, SIZES]) {
    for (const [name, value] of Object.entries(group)) {
      ensure(name, 'FLOAT', value);
    }
  }

  // Text Style 생성 — 타이포는 변수가 아니라 스타일로 갑니다
  const styleMap = {};
  const localStyles = await figma.getLocalTextStylesAsync();

  for (const [name, t] of Object.entries(TEXTS)) {
    let st = localStyles.find((s) => s.name === name);
    if (!st) {
      st = figma.createTextStyle();
      st.name = name;
    }
    st.fontName = { family: FONT_FAMILY, style: t.weight };
    st.fontSize = t.size;
    st.lineHeight = { unit: 'PIXELS', value: t.line };
    styleMap[name] = st;
  }

  console.log(
    `[tokens] 변수 ${Object.keys(map).length}개, 텍스트 스타일 ${Object.keys(styleMap).length}개`
  );

  return {
    /** 색상 바인딩된 SolidPaint 반환 → node.fills = [K.C('color/bg/base')] */
    C(name) {
      const v = map[name];
      if (!v) throw new Error(`토큰 없음: ${name}`);
      return figma.variables.setBoundVariableForPaint(
        solid('#000000'), 'color', v
      );
    },
    /** FLOAT 변수 객체 반환 → node.setBoundVariable('topLeftRadius', K.R('radius/md')) */
    R(name) { return req(map, name); },
    S(name) { return req(map, name); },
    Z(name) { return req(map, name); },
    /** 텍스트 스타일 적용 → await K.T(node, 'text/body') */
    async T(node, name) {
      const st = styleMap[name];
      if (!st) throw new Error(`텍스트 스타일 없음: ${name}`);
      await node.setTextStyleIdAsync(st.id);
    },
    raw: map,
  };
}

function req(map, name) {
  const v = map[name];
  if (!v) throw new Error(`토큰 없음: ${name}`);
  return v;
}

/** 라운드 4모서리 일괄 바인딩 */
function bindRadius(node, variable) {
  for (const f of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) {
    node.setBoundVariable(f, variable);
  }
}

/** 텍스트 노드 생성 + 스타일/색 바인딩 */
async function txt(K, content, styleName, colorName) {
  const t = figma.createText();
  t.fontName = { family: FONT_FAMILY, style: TEXTS[styleName].weight };
  t.characters = content;
  await K.T(t, styleName);
  t.fills = [K.C(colorName)];
  return t;
}

// ─────────────────────────────────────────────────────────────
// 6. 검증 게이트 — FIGMA_SPEC §7-2
// ─────────────────────────────────────────────────────────────
// 사각형 하나에 color/brand/primary를 바인딩합니다.
// Figma에서 그 변수 값을 바꿔 사각형이 따라오면 바인딩이 실제로 붙은 겁니다.
// 안 따라오면 하드코딩된 것이고, 그 상태로 21장을 그리면 전부 다시 만들어야 합니다.

async function buildVerifyGate(K) {
  const wrap = AL({
    name: 'VERIFY — 변수 값을 바꿔 따라오는지 확인',
    dir: 'V', gap: 'space/md', pad: 'space/lg', align: 'MIN',
  });
  wrap.fills = [K.C('color/bg/surface')];
  bindRadius(wrap, K.R('radius/md'));

  const label = await txt(K, '아래 사각형에 color/brand/primary 바인딩됨', 'text/body', 'color/text/muted');
  wrap.appendChild(label);

  const rect = figma.createRectangle();
  rect.name = 'bound-to-brand-primary';
  rect.resize(240, 80);
  rect.fills = [K.C('color/brand/primary')];
  bindRadius(rect, K.R('radius/md'));
  wrap.appendChild(rect);

  const hint = await txt(
    K,
    'Variables 패널에서 값을 빨강으로 바꿔보세요. 안 따라오면 바인딩 실패입니다.',
    'text/caption',
    'color/text/disabled'
  );
  wrap.appendChild(hint);

  return wrap;
}

// ─────────────────────────────────────────────────────────────
// 7. 공통 컴포넌트 — 작은 것부터
// ─────────────────────────────────────────────────────────────
// 상태 정의는 PLAN.md §5.4, Variant 구성은 FIGMA_SPEC.md §3.2.
// 아이콘은 유니코드 글리프 자리표시입니다. 최종 아이콘은 1단계 코드에서 교체합니다.

const SET_WIDTH = 960;

/** 크기 변수(size/*) 바인딩. 바인딩 불가 필드면 경고만 남기고 넘어갑니다 */
function bindSize(K, node, field, token) {
  try {
    node.setBoundVariable(field, K.Z(token));
  } catch (e) {
    console.warn(`[size] ${node.name}.${field} 바인딩 실패 → 현재 값 유지: ${e.message}`);
  }
}

/** focus 링 — color/brand/primary 2px 외곽선 (PLAN.md §5.4, 새 토큰 없음) */
function ring(K, node) {
  node.strokes = [K.C('color/brand/primary')];
  node.strokeWeight = 2;
  node.strokeAlign = 'OUTSIDE';
}

function box(K, name, w, h, fillToken, radiusToken) {
  const r = figma.createRectangle();
  r.name = name;
  r.resize(w, h);
  r.fills = [K.C(fillToken)];
  if (radiusToken) bindRadius(r, K.R(radiusToken));
  return r;
}

async function glyph(K, ch, colorToken = 'color/text/muted', style = 'text/body') {
  return txt(K, ch, style, colorToken);
}

/** 슬라이더(진행/볼륨) — 트랙 bg/hover, 채움 primary */
function slider(K, w, pct) {
  const f = AL({ name: 'Slider', dir: 'H', gap: 0, w, h: 4 });
  f.fills = [K.C('color/bg/hover')];
  bindRadius(f, K.R('radius/full'));
  f.clipsContent = true;
  f.appendChild(box(K, 'fill', Math.round(w * pct), 4, 'color/brand/primary'));
  return f;
}

function cartesian(axes) {
  let out = [{}];
  for (const [k, vals] of Object.entries(axes)) {
    out = out.flatMap((o) => vals.map((v) => Object.assign({}, o, { [k]: v })));
  }
  return out;
}

/** Variant 조합마다 컴포넌트를 만들어 Component Set으로 묶습니다 */
async function buildSet(K, name, axes, make, width = SET_WIDTH) {
  const comps = [];
  for (const combo of cartesian(axes)) {
    const node = await make(combo);
    const comp = figma.createComponentFromNode(node);
    comp.name = Object.entries(combo).map(([k, v]) => `${k}=${v}`).join(', ');
    comps.push(comp);
  }
  const set = figma.combineAsVariants(comps, figma.currentPage);
  set.name = name;
  set.layoutMode = 'HORIZONTAL';
  set.layoutWrap = 'WRAP';
  set.primaryAxisSizingMode = 'FIXED';
  set.counterAxisSizingMode = 'AUTO';
  set.counterAxisAlignItems = 'MIN';
  set.resize(width, set.height);
  bindSpace(set, 'itemSpacing', 'space/md');
  bindSpace(set, 'counterAxisSpacing', 'space/md');
  for (const f of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']) bindSpace(set, f, 'space/lg');
  set.fills = [K.C('color/bg/base')];
  bindRadius(set, K.R('radius/md'));
  return set;
}

/** 단일 컴포넌트(Variant 없음) */
function asComponent(node, name) {
  const comp = figma.createComponentFromNode(node);
  comp.name = name;
  return comp;
}

/** Badge — kind: suno / udio / other / new / model */
async function buildBadge(K, label, colorToken) {
  const f = AL({ name: `Badge/${label}`, dir: 'H', gap: 0, pad: ['space/xs', 'space/sm'] });
  f.fills = [K.C(colorToken)];
  bindRadius(f, K.R('radius/sm'));

  // NEW 뱃지는 primary 배경이라 on-brand 텍스트를 씁니다 (FIGMA_SPEC §4.1)
  const onBrand = colorToken === 'color/badge/new';
  f.appendChild(await txt(K, label, 'text/badge', onBrand ? 'color/text/on-brand' : 'color/text/main'));
  return f;
}

const BADGE_KINDS = {
  suno: ['Suno', 'color/badge/suno'],
  udio: ['Udio', 'color/badge/udio'],
  other: ['기타', 'color/badge/other'],
  new: ['NEW', 'color/badge/new'],
  model: ['v4.5', 'color/badge/other'],
};

/** Button — kind(primary/ghost/pill) × state(default/hover/focus/disabled) */
async function buildButton(K, label, kind = 'primary', state = 'default') {
  const f = AL({ name: 'Button', dir: 'H', gap: 'space/sm', pad: ['space/sm', 'space/md'] });
  bindRadius(f, K.R(kind === 'pill' ? 'radius/full' : 'radius/sm'));

  let bg = null;
  if (kind === 'primary') bg = 'color/brand/primary';
  if (kind === 'pill') bg = 'color/bg/elevated';
  if (state === 'hover' && kind !== 'primary') bg = 'color/bg/hover';
  if (state === 'disabled') bg = kind === 'ghost' ? null : 'color/bg/elevated';
  f.fills = bg ? [K.C(bg)] : [];
  if (state === 'focus') ring(K, f);

  // primary 위에는 흰색 금지 (FIGMA_SPEC §4.1)
  let textToken = kind === 'primary' ? 'color/text/on-brand' : 'color/text/main';
  if (state === 'disabled') textToken = 'color/text/disabled';
  f.appendChild(await txt(K, label, 'text/bodyB', textToken));
  return f;
}

/** Input — state(default/hover/focus/disabled/error). error는 하단 캡션으로만 표시 */
async function buildInput(K, placeholder, width = 320, state = 'default') {
  const f = AL({ name: 'Input', dir: 'H', gap: 'space/sm', pad: ['space/sm', 'space/md'], w: width });
  f.fills = [K.C(state === 'hover' ? 'color/bg/hover' : state === 'disabled' ? 'color/bg/elevated' : 'color/bg/surface')];
  bindRadius(f, K.R('radius/sm'));
  if (state === 'focus') ring(K, f);
  else {
    f.strokes = [K.C('color/border/subtle')];
    f.strokeWeight = 1;
  }

  const t = await txt(K, placeholder, 'text/body', 'color/text/disabled');
  f.appendChild(t);
  t.layoutGrow = 1;

  if (state !== 'error') return f;

  const wrap = AL({ name: 'Input', dir: 'V', gap: 'space/xs', w: width, align: 'MIN' });
  wrap.appendChild(f);
  f.layoutAlign = 'STRETCH';
  wrap.appendChild(await txt(K, '이메일 형식이 올바르지 않습니다', 'text/caption', 'color/text/muted'));
  return wrap;
}

/** Switch — value(on/off) × state(default/focus/disabled) */
async function buildSwitch(K, value = 'off', state = 'default') {
  const f = AL({ name: 'Switch', dir: 'H', gap: 0, pad: 'space/xs', w: 40, h: 24 });
  f.primaryAxisAlignItems = value === 'on' ? 'MAX' : 'MIN';
  f.counterAxisAlignItems = 'CENTER';
  bindRadius(f, K.R('radius/full'));
  const disabled = state === 'disabled';
  f.fills = [K.C(disabled ? 'color/bg/elevated' : value === 'on' ? 'color/brand/primary' : 'color/bg/hover')];
  if (state === 'focus') ring(K, f);

  const knob = figma.createEllipse();
  knob.name = 'knob';
  knob.resize(16, 16);
  knob.fills = [K.C(disabled ? 'color/text/disabled' : 'color/text/main')];
  f.appendChild(knob);
  return f;
}

/** TrackRow — state(default/hover/playing/loading). 차트 / 플레이리스트 / 창작자 채널 / 보관함 공용 */
async function buildTrackRow(K, o = {}, state = 'default') {
  const row = AL({
    name: 'TrackRow',
    dir: 'H', gap: 'space/md', pad: ['space/sm', 'space/md'], w: o.width || 880,
  });
  bindRadius(row, K.R('radius/sm'));
  row.fills = state === 'hover' || state === 'playing' ? [K.C('color/bg/hover')] : [];

  if (state === 'loading') {
    row.appendChild(box(K, 'rank', 28, 14, 'color/bg/hover', 'radius/sm'));
    row.appendChild(box(K, 'cover', 40, 40, 'color/bg/hover', 'radius/sm'));
    const meta = AL({ name: 'meta', dir: 'V', gap: 'space/xs', align: 'MIN' });
    meta.appendChild(box(K, 'title', 200, 14, 'color/bg/hover', 'radius/sm'));
    meta.appendChild(box(K, 'artist', 100, 12, 'color/bg/hover', 'radius/sm'));
    row.appendChild(meta);
    meta.layoutGrow = 1;
    row.appendChild(box(K, 'tail', 160, 14, 'color/bg/hover', 'radius/sm'));
    return row;
  }

  const playing = state === 'playing';
  if (o.rank != null) {
    const rank = await txt(K, playing ? '♪' : String(o.rank), 'text/bodyB', playing ? 'color/brand/primary' : 'color/text/muted');
    rank.textAlignHorizontal = 'CENTER';
    rank.resize(28, rank.height);
    row.appendChild(rank);
  }

  const cover = figma.createRectangle();
  cover.name = 'cover';
  cover.resize(40, 40);
  thumbFill(cover, o.coverHex || '#10B981');
  bindRadius(cover, K.R('radius/sm'));
  bindSize(K, cover, 'width', 'size/cover/row');
  bindSize(K, cover, 'height', 'size/cover/row');
  row.appendChild(cover);

  const meta = AL({ name: 'meta', dir: 'V', gap: 'space/xs', align: 'MIN' });
  const titleLine = AL({ name: 'titleLine', dir: 'H', gap: 'space/sm' });
  titleLine.appendChild(await txt(K, o.title || '무제', 'text/bodyB', playing ? 'color/brand/primary' : 'color/text/main'));
  if (o.isNew) titleLine.appendChild(await buildBadge(K, 'NEW', 'color/badge/new'));
  meta.appendChild(titleLine);
  meta.appendChild(await txt(K, o.artist || '창작자', 'text/caption', 'color/text/muted'));
  row.appendChild(meta);
  meta.layoutGrow = 1;

  if (o.tool) {
    const toolToken =
      o.tool === 'Suno' ? 'color/badge/suno' :
      o.tool === 'Udio' ? 'color/badge/udio' : 'color/badge/other';
    row.appendChild(await buildBadge(K, o.tool, toolToken));
  }

  row.appendChild(await txt(K, o.genre || '—', 'text/caption', 'color/text/muted'));
  row.appendChild(await txt(K, o.duration || '0:00', 'text/caption', 'color/text/muted'));
  row.appendChild(await txt(K, `♥ ${o.likes != null ? o.likes : '0'}`, 'text/caption', 'color/text/muted'));
  row.appendChild(await glyph(K, '⋯'));
  return row;
}

/** TrackCard — state(default/hover/loading). 홈 가로 스크롤 / 그리드 / 창작자 대표곡 */
async function buildTrackCard(K, o = {}, state = 'default') {
  const card = AL({ name: 'TrackCard', dir: 'V', gap: 'space/sm', pad: 'space/md', w: 180, align: 'MIN' });
  card.fills = [K.C(state === 'hover' ? 'color/bg/hover' : 'color/bg/surface')];
  bindRadius(card, K.R('radius/md'));

  if (state === 'loading') {
    card.appendChild(box(K, 'cover', 148, 148, 'color/bg/hover', 'radius/md'));
    card.appendChild(box(K, 'title', 110, 14, 'color/bg/hover', 'radius/sm'));
    card.appendChild(box(K, 'artist', 70, 12, 'color/bg/hover', 'radius/sm'));
    return card;
  }

  const cover = figma.createRectangle();
  cover.name = 'cover';
  cover.resize(148, 148);
  thumbFill(cover, o.coverHex || '#7C3AED');
  bindRadius(cover, K.R('radius/md'));
  card.appendChild(cover);

  const titleLine = AL({ name: 'titleLine', dir: 'H', gap: 'space/sm' });
  titleLine.appendChild(await txt(K, o.title || '무제', 'text/bodyB', 'color/text/main'));
  if (o.isNew) titleLine.appendChild(await buildBadge(K, 'NEW', 'color/badge/new'));
  card.appendChild(titleLine);
  card.appendChild(await txt(K, o.artist || '창작자', 'text/caption', 'color/text/muted'));
  return card;
}

/** Toast — variant(success/error). 에러 전용 색 토큰이 없어 글리프로만 구분합니다 */
async function buildToast(K, variant, message) {
  const f = AL({ name: 'Toast', dir: 'H', gap: 'space/sm', pad: ['space/md', 'space/md'] });
  f.fills = [K.C('color/bg/elevated')];
  bindRadius(f, K.R('radius/md'));
  f.strokes = [K.C('color/border/subtle')];
  f.strokeWeight = 1;
  const ok = variant === 'success';
  f.appendChild(await glyph(K, ok ? '✓' : '!', ok ? 'color/brand/primary' : 'color/text/main', 'text/bodyB'));
  f.appendChild(await txt(K, message, 'text/body', 'color/text/main'));
  return f;
}

/** EmptyState — variant(default/not-found/removed). 에러 상태도 이 컴포넌트로 처리 */
async function buildEmptyState(K, variant) {
  const copy = {
    default: ['♪', '아직 곡이 없어요', '마음에 드는 곡에 하트를 눌러 보세요', '곡 둘러보기'],
    'not-found': ['404', '페이지를 찾을 수 없어요', '주소가 바뀌었거나 존재하지 않는 페이지입니다', '홈으로'],
    removed: ['∅', '삭제된 곡입니다', '창작자 또는 운영 정책에 따라 내려간 곡입니다', '차트 보기'],
  }[variant];

  const f = AL({ name: 'EmptyState', dir: 'V', gap: 'space/md', pad: 'space/2xl', w: 480 });
  f.fills = [K.C('color/bg/surface')];
  bindRadius(f, K.R('radius/md'));
  f.counterAxisAlignItems = 'CENTER';

  const icon = AL({ name: 'icon', dir: 'H', gap: 0, pad: 'space/lg' });
  icon.fills = [K.C('color/bg/elevated')];
  bindRadius(icon, K.R('radius/full'));
  icon.appendChild(await txt(K, copy[0], 'text/h2', 'color/text/muted'));
  f.appendChild(icon);

  f.appendChild(await txt(K, copy[1], 'text/h2', 'color/text/main'));
  f.appendChild(await txt(K, copy[2], 'text/body', 'color/text/muted'));
  f.appendChild(await buildButton(K, copy[3], 'primary'));
  return f;
}

/** Header — account(signed-out/signed-in). 폭은 1920 - 사이드바 240 = 1680 */
async function buildHeader(K, account) {
  const f = AL({ name: 'Header', dir: 'H', gap: 'space/md', pad: ['space/md', 'space/lg'], w: 1680 });
  f.fills = [K.C('color/bg/base')];

  f.appendChild(await buildInput(K, '곡명, 창작자, 프롬프트 키워드 검색', 420));
  const spacer = figma.createFrame();
  spacer.name = 'spacer';
  spacer.fills = [];
  spacer.resize(1, 1);
  f.appendChild(spacer);
  spacer.layoutGrow = 1;

  if (account === 'signed-in') {
    const avatar = AL({ name: 'avatar', dir: 'H', gap: 0, pad: 'space/sm' });
    avatar.fills = [K.C('color/bg/hover')];
    bindRadius(avatar, K.R('radius/full'));
    avatar.appendChild(await txt(K, '김', 'text/bodyB', 'color/text/main'));
    f.appendChild(avatar);
  } else {
    f.appendChild(await buildButton(K, '로그인', 'ghost'));
  }
  return f;
}

/** 로고 자리표시 — 이미지는 public/brand/logo.png(투명). 네트워크 없이 불러올 수 없어 수동 교체 */
async function logoPlaceholder(K) {
  const f = AL({ name: 'logo (public/brand/logo.png 로 교체)', dir: 'H', gap: 'space/sm', pad: 'space/sm' });
  f.appendChild(await txt(K, 'SELNAR', 'text/h2', 'color/brand/logo'));
  return f;
}

/** Sidebar — 240 × 1080 */
async function buildSidebar(K) {
  const f = AL({ name: 'Sidebar', dir: 'V', gap: 'space/lg', pad: 'space/lg', w: 240, h: 1080, align: 'MIN' });
  f.fills = [K.C('color/bg/surface')];
  bindSize(K, f, 'width', 'size/sidebar');

  f.appendChild(await logoPlaceholder(K));

  const nav = AL({ name: 'nav', dir: 'V', gap: 'space/xs', align: 'MIN' });
  for (const [i, label] of ['홈', '차트', '보관함'].entries()) {
    const item = AL({ name: `nav/${label}`, dir: 'H', gap: 'space/sm', pad: ['space/sm', 'space/md'], w: 192 });
    bindRadius(item, K.R('radius/sm'));
    item.fills = i === 0 ? [K.C('color/bg/hover')] : [];
    item.appendChild(await txt(K, label, 'text/bodyB', i === 0 ? 'color/text/main' : 'color/text/muted'));
    nav.appendChild(item);
  }
  f.appendChild(nav);

  const up = await buildButton(K, '곡 업로드', 'primary');
  f.appendChild(up);
  up.layoutAlign = 'STRETCH';
  return f;
}

/** BottomPlayer — 1920 × 80. 좌: 곡 정보 / 중: 컨트롤 + 진행 / 우: 반복·셔플·볼륨·대기열 */
async function buildBottomPlayer(K) {
  const f = AL({ name: 'BottomPlayer', dir: 'H', gap: 'space/md', pad: ['space/sm', 'space/lg'], w: 1920, h: 80 });
  f.fills = [K.C('color/bg/elevated')];
  bindSize(K, f, 'height', 'size/player/pc');

  const left = AL({ name: 'left', dir: 'H', gap: 'space/md' });
  const cover = figma.createRectangle();
  cover.name = 'cover';
  cover.resize(56, 56);
  thumbFill(cover, '#10B981');
  bindRadius(cover, K.R('radius/sm'));
  bindSize(K, cover, 'width', 'size/cover/player');
  bindSize(K, cover, 'height', 'size/cover/player');
  left.appendChild(cover);
  const meta = AL({ name: 'meta', dir: 'V', gap: 'space/xs', align: 'MIN' });
  meta.appendChild(await txt(K, '새벽 세 시의 네온', 'text/bodyB', 'color/text/main'));
  meta.appendChild(await txt(K, '김하늘', 'text/caption', 'color/text/muted'));
  left.appendChild(meta);
  left.appendChild(await glyph(K, '♥'));
  f.appendChild(left);
  left.layoutGrow = 1;

  const center = AL({ name: 'center', dir: 'V', gap: 'space/sm' });
  const controls = AL({ name: 'controls', dir: 'H', gap: 'space/lg' });
  for (const g of ['⏮', '▶', '⏭']) {
    controls.appendChild(await glyph(K, g, 'color/text/main', 'text/h2'));
  }
  center.appendChild(controls);
  const prog = AL({ name: 'progress', dir: 'H', gap: 'space/sm' });
  prog.appendChild(await txt(K, '1:12', 'text/caption', 'color/text/muted'));
  prog.appendChild(slider(K, 480, 0.35));
  prog.appendChild(await txt(K, '3:24', 'text/caption', 'color/text/muted'));
  center.appendChild(prog);
  f.appendChild(center);
  center.layoutGrow = 1;

  const right = AL({ name: 'right', dir: 'H', gap: 'space/md' });
  right.primaryAxisAlignItems = 'MAX';
  for (const g of ['⟲', '⤮']) right.appendChild(await glyph(K, g));
  right.appendChild(slider(K, 96, 0.7));
  right.appendChild(await glyph(K, '☰'));
  f.appendChild(right);
  right.layoutGrow = 1;
  return f;
}

/** MiniPlayer — 모바일 390 × 64. 커버 · 제목 · 재생 버튼만 */
async function buildMiniPlayer(K) {
  const f = AL({ name: 'MiniPlayer', dir: 'H', gap: 'space/md', pad: ['space/sm', 'space/md'], w: 390, h: 64 });
  f.fills = [K.C('color/bg/elevated')];
  bindSize(K, f, 'height', 'size/player/mobile');

  const cover = figma.createRectangle();
  cover.name = 'cover';
  cover.resize(40, 40);
  thumbFill(cover, '#10B981');
  bindRadius(cover, K.R('radius/sm'));
  bindSize(K, cover, 'width', 'size/cover/row');
  bindSize(K, cover, 'height', 'size/cover/row');
  f.appendChild(cover);

  const t = await txt(K, '새벽 세 시의 네온', 'text/bodyB', 'color/text/main');
  f.appendChild(t);
  t.layoutGrow = 1;
  f.appendChild(await glyph(K, '▶', 'color/text/main', 'text/h2'));
  return f;
}

/** QueuePanel — 대기열 오버레이 드롭다운. 트랙 목록만, 드래그 핸들 없음, 현재 곡 하이라이트 */
async function buildQueuePanel(K) {
  const f = AL({ name: 'QueuePanel', dir: 'V', gap: 'space/xs', pad: 'space/md', w: 360, align: 'MIN' });
  f.fills = [K.C('color/bg/elevated')];
  bindRadius(f, K.R('radius/lg'));
  f.strokes = [K.C('color/border/subtle')];
  f.strokeWeight = 1;

  const head = await txt(K, '재생 대기열', 'text/h2', 'color/text/main');
  f.appendChild(head);

  const items = [
    ['새벽 세 시의 네온', '김하늘', '3:24', true],
    ['비 오는 날의 발라드', '이준서', '4:02', false],
    ['한강 야경', '박서연', '2:58', false],
  ];
  for (const [title, artist, dur, current] of items) {
    const row = AL({ name: 'queueItem', dir: 'H', gap: 'space/md', pad: 'space/sm', w: 328 });
    bindRadius(row, K.R('radius/sm'));
    row.fills = current ? [K.C('color/bg/hover')] : [];
    const cover = figma.createRectangle();
    cover.name = 'cover';
    cover.resize(40, 40);
    thumbFill(cover, current ? '#10B981' : '#7C3AED');
    bindRadius(cover, K.R('radius/sm'));
    bindSize(K, cover, 'width', 'size/cover/row');
    bindSize(K, cover, 'height', 'size/cover/row');
    row.appendChild(cover);
    const meta = AL({ name: 'meta', dir: 'V', gap: 'space/xs', align: 'MIN' });
    meta.appendChild(await txt(K, title, 'text/bodyB', current ? 'color/brand/primary' : 'color/text/main'));
    meta.appendChild(await txt(K, artist, 'text/caption', 'color/text/muted'));
    row.appendChild(meta);
    meta.layoutGrow = 1;
    row.appendChild(await txt(K, dur, 'text/caption', 'color/text/muted'));
    f.appendChild(row);
  }
  return f;
}

// ─────────────────────────────────────────────────────────────
// 8. main()
// ─────────────────────────────────────────────────────────────

async function ensurePage(name) {
  await figma.loadAllPagesAsync();
  let page = figma.root.children.find((p) => p.name === name);
  if (!page) {
    page = figma.createPage();
    page.name = name;
  }
  return page;
}

function clearByName(page, names) {
  for (const node of [...page.children]) {
    if (names.includes(node.name)) node.remove();
  }
}

const GATE_NAME = 'VERIFY — 변수 값을 바꿔 따라오는지 확인';
const COMPONENT_NAMES = [
  'Badge', 'Button', 'Input', 'Switch', 'TrackRow', 'TrackCard',
  'Toast', 'EmptyState', 'Header', 'Sidebar', 'BottomPlayer', 'MiniPlayer', 'QueuePanel',
];

const SAMPLE_ROW = {
  rank: 1, title: '새벽 세 시의 네온', artist: '김하늘',
  tool: 'Suno', genre: '일렉트로닉', duration: '3:24', likes: '1.2K', isNew: true,
};
const SAMPLE_CARD = { title: '새벽 세 시의 네온', artist: '김하늘', isNew: true, coverHex: '#10B981' };

async function main() {
  await resolveFont();
  const K = await buildTokens();
  TOKENS = K;

  const page = await ensurePage(PAGE_FOUNDATION);
  await figma.setCurrentPageAsync(page);

  if (CONFIG.rebuild) {
    clearByName(page, [GATE_NAME, ...COMPONENT_NAMES]);
  }

  let cursorY = 0;
  const place = (node) => {
    node.x = 0;
    node.y = cursorY;
    page.appendChild(node);
    cursorY += node.height + 80;
  };

  if (CONFIG.build.verifyGate) place(await buildVerifyGate(K));

  if (CONFIG.build.components) {
    // FIGMA_SPEC §3.1 순서: Badge → Button → Input → Toast → EmptyState → TrackRow → TrackCard → 셸 → QueuePanel
    place(await buildSet(K, 'Badge', { kind: Object.keys(BADGE_KINDS) }, (c) =>
      buildBadge(K, BADGE_KINDS[c.kind][0], BADGE_KINDS[c.kind][1])));

    place(await buildSet(K, 'Button',
      { kind: ['primary', 'ghost', 'pill'], state: ['default', 'hover', 'focus', 'disabled'] },
      (c) => buildButton(K, c.kind === 'pill' ? '종합 TOP 100' : c.kind === 'ghost' ? '프롬프트 복사' : '곡 업로드', c.kind, c.state)));

    place(await buildSet(K, 'Input',
      { state: ['default', 'hover', 'focus', 'disabled', 'error'] },
      (c) => buildInput(K, '이메일', 320, c.state)));

    place(await buildSet(K, 'Switch',
      { value: ['on', 'off'], state: ['default', 'focus', 'disabled'] },
      (c) => buildSwitch(K, c.value, c.state)));

    place(await buildSet(K, 'Toast', { variant: ['success', 'error'] },
      (c) => buildToast(K, c.variant, c.variant === 'success' ? '프롬프트를 복사했습니다' : '업로드에 실패했습니다')));

    place(await buildSet(K, 'EmptyState', { variant: ['default', 'not-found', 'removed'] },
      (c) => buildEmptyState(K, c.variant)));

    place(await buildSet(K, 'TrackRow', { state: ['default', 'hover', 'playing', 'loading'] },
      (c) => buildTrackRow(K, SAMPLE_ROW, c.state), 1000));

    place(await buildSet(K, 'TrackCard', { state: ['default', 'hover', 'loading'] },
      (c) => buildTrackCard(K, SAMPLE_CARD, c.state)));

    place(await buildSet(K, 'Header', { account: ['signed-out', 'signed-in'] },
      (c) => buildHeader(K, c.account), 1900));

    place(asComponent(await buildSidebar(K), 'Sidebar'));
    place(asComponent(await buildBottomPlayer(K), 'BottomPlayer'));
    place(asComponent(await buildMiniPlayer(K), 'MiniPlayer'));
    place(asComponent(await buildQueuePanel(K), 'QueuePanel'));
  }

  figma.viewport.scrollAndZoomIntoView(page.children);
  figma.closePlugin('Foundation 렌더 완료 — VERIFY 사각형으로 바인딩을 확인하세요.');
}

main().catch((e) => {
  console.error(e);
  figma.closePlugin(`실패: ${e.message}`);
});
