// Selnar Design Renderer
// 기준 문서: FIGMA_SPEC.md v1.6 §4(토큰) · §3.1(프레임) · §6(아키텍처)
//
// Foundation(토큰 + 컴포넌트 13종)과 PC/01·02·03(+Locked) 화면을 구현합니다.
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
    homePC: false,      // PC/01-Home
    chartPC: false,     // PC/02-Chart
    trackDetailPC: false, // PC/03-TrackDetail
    trackDetailLockedPC: false, // PC/03-TrackDetail-Locked
    searchPC: false,            // PC/04-Search
    searchEmptyPC: false,       // PC/04-Search-Empty
    authLoginPC: false,         // PC/05-Auth-Login
    authSignupPC: false,        // PC/05-Auth-Signup
    uploadEmptyPC: false,       // PC/06-Upload-Empty
    uploadFilledPC: false,      // PC/06-Upload-Filled
    uploadProgressPC: false,    // PC/06-Upload-Progress
    libraryPC: false,           // PC/07-Library
    libraryEmptyPC: false,      // PC/07-Library-Empty
    playlistPC: false,          // PC/08-Playlist
    playlistEditPC: false,      // PC/08-Playlist-TitleEdit
    artistPC: false,            // PC/09-Artist
    queuePanelPC: false,        // PC/QueuePanel
    homeMobile: false,          // M/01-Home
    chartMobile: false,         // M/02-Chart
    trackDetailMobile: false,   // M/03-TrackDetail
    uploadMobile: false,        // M/06-Upload
    libraryMobile: false,       // M/07-Library
    playerFullscreenMobile: false, // M/Player-Fullscreen
  },
};

const COLLECTION_NAME = 'Selnar Tokens';
const PAGE_FOUNDATION = '00 · Foundation';
const PAGE_PC = '01 · PC (1920)';
const PC_WIDTH = 1920;
const SIDEBAR_WIDTH = 240;
const PAGE_CONTENT_WIDTH = PC_WIDTH - SIDEBAR_WIDTH;

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

// 웨이트 → 실제 폰트 스타일 이름. 폰트마다 이름이 달라서(Inter는 'Semi Bold', Pretendard는 'SemiBold')
// 설치된 목록에서 찾아 채웁니다. resolveFont()가 값을 채웁니다.
let FONT_STYLES = {};

const STYLE_ALIASES = {
  Regular: ['Regular', 'Normal', 'Book'],
  Medium: ['Medium'],
  SemiBold: ['SemiBold', 'Semi Bold', 'Semibold', 'DemiBold', 'Demi Bold'],
  Bold: ['Bold'],
};

// 해당 웨이트가 폰트에 없을 때 가까운 웨이트로 대체하는 순서 (예: Noto Sans KR에는 SemiBold가 없음)
const STYLE_FALLBACK = {
  Regular: ['Regular'],
  Medium: ['Medium', 'Regular'],
  SemiBold: ['SemiBold', 'Bold', 'Medium'],
  Bold: ['Bold', 'SemiBold'],
};

/** 웨이트 이름 → 실제 스타일 이름 */
function fontStyle(weight) {
  return FONT_STYLES[weight] || weight;
}

async function resolveFont() {
  const candidates = ['Pretendard', 'Noto Sans KR', 'Inter'];
  const available = await figma.listAvailableFontsAsync();

  const tried = [];
  for (const family of candidates) {
    const styles = available.filter((f) => f.fontName.family === family).map((f) => f.fontName.style);
    if (styles.length === 0) {
      tried.push(`${family}(미설치)`);
      continue;
    }

    // 웨이트별 실제 스타일 이름 찾기 (별칭 → 대체 웨이트 순)
    const map = {};
    for (const weight of WEIGHTS) {
      for (const w of STYLE_FALLBACK[weight]) {
        const hit = STYLE_ALIASES[w].find((name) => styles.includes(name));
        if (hit) {
          map[weight] = hit;
          break;
        }
      }
    }
    if (WEIGHTS.some((w) => !map[w])) {
      tried.push(`${family}(웨이트 부족: ${styles.join(', ')})`);
      continue;
    }

    try {
      for (const style of new Set(Object.values(map))) {
        await figma.loadFontAsync({ family, style });
      }
      FONT_FAMILY = family;
      FONT_STYLES = map;
      console.log(`[font] ${family} 로드 완료`, map);
      return family;
    } catch (e) {
      tried.push(`${family}(로드 실패: ${e.message})`);
    }
  }

  throw new Error(`사용 가능한 폰트가 없습니다. 시도한 결과: ${tried.join(' / ')}. Inter 또는 Pretendard를 설치하세요.`);
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

/** 커버 자리표시용 채움 — 실제 이미지를 넣기 전까지 색상 토큰에 바인딩 */
function thumbFill(K, node, colorToken = 'color/bg/elevated') {
  node.fills = [K.C(colorToken)];
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
  collection.renameMode(modeId, 'Default');
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

  // 기본값 ALL_SCOPES는 모든 속성 선택창에 변수가 뜨므로 용도별로 제한합니다
  const colorScopes = (name) =>
    name.startsWith('color/text/') ? ['TEXT_FILL'] :
    name.startsWith('color/border/') ? ['STROKE_COLOR'] :
    name === 'color/brand/primary' ? ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR'] :
    ['FRAME_FILL', 'SHAPE_FILL'];

  for (const [name, value] of Object.entries(COLORS)) {
    ensure(name, 'COLOR', hex(value)).scopes = colorScopes(name);
  }
  const floatScopes = [
    [RADII, ['CORNER_RADIUS']],
    [SPACES, ['GAP']],
    [SIZES, ['WIDTH_HEIGHT']],
  ];
  for (const [group, scopes] of floatScopes) {
    for (const [name, value] of Object.entries(group)) {
      ensure(name, 'FLOAT', value).scopes = scopes;
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
    st.fontName = { family: FONT_FAMILY, style: fontStyle(t.weight) };
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
        solid(COLORS['color/bg/base']), 'color', v
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
  t.fontName = { family: FONT_FAMILY, style: fontStyle(TEXTS[styleName].weight) };
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

  // combineAsVariants는 자동 배치를 하지 않아 모든 Variant가 (0,0)에 겹칩니다.
  // 줄바꿈 흐름으로 직접 배치하고, Set 크기는 자식 경계에서 다시 계산합니다.
  const gap = SPACES['space/md'];
  const inset = SPACES['space/lg'];
  let x = inset;
  let y = inset;
  let rowH = 0;
  let maxX = 0;
  for (const child of set.children) {
    if (x > inset && x + child.width > width - inset) {
      x = inset;
      y += rowH + gap;
      rowH = 0;
    }
    child.x = x;
    child.y = y;
    x += child.width + gap;
    rowH = Math.max(rowH, child.height);
    maxX = Math.max(maxX, child.x + child.width);
  }
  set.resizeWithoutConstraints(Math.max(width, maxX + inset), y + rowH + inset);
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
    f.strokeAlign = 'OUTSIDE'; // focus 링과 같은 방식이어야 상태별 높이가 같습니다
  }

  const t = await txt(K, placeholder, 'text/body', 'color/text/disabled');
  t.textAutoResize = 'HEIGHT'; // 기본값(WIDTH_AND_HEIGHT)이면 layoutGrow가 무시됩니다
  f.appendChild(t);
  t.layoutGrow = 1;

  if (state !== 'error') return f;

  const wrap = AL({ name: 'Input', dir: 'V', gap: 'space/xs', w: width, align: 'MIN' });
  wrap.appendChild(f);
  fillCross(wrap, f);
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
  thumbFill(K, cover, o.coverToken || 'color/brand/primary');
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
  thumbFill(K, cover, o.coverToken || 'color/brand/secondary');
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
  fillCross(f, up);
  up.primaryAxisAlignItems = 'CENTER'; // 폭이 늘어나도 라벨은 가운데
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
  thumbFill(K, cover, 'color/brand/primary');
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
  for (const g of ['|◀', '▶', '▶|']) {
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
  thumbFill(K, cover, 'color/brand/primary');
  bindRadius(cover, K.R('radius/sm'));
  bindSize(K, cover, 'width', 'size/cover/row');
  bindSize(K, cover, 'height', 'size/cover/row');
  f.appendChild(cover);

  const t = await txt(K, '새벽 세 시의 네온', 'text/bodyB', 'color/text/main');
  t.textAutoResize = 'HEIGHT';
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
    thumbFill(K, cover, current ? 'color/brand/primary' : 'color/badge/udio');
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
// 8. PC 화면 빌더 — Foundation 컴포넌트 인스턴스만 사용
// ─────────────────────────────────────────────────────────────

const SCREEN_TRACKS = [
  { title: '새벽 세 시의 네온', artist: '김하늘', duration: '3:24' },
  { title: '비 오는 날의 발라드', artist: '이준서', duration: '4:02' },
  { title: '한강 야경', artist: '박서연', duration: '2:58' },
];

async function foundationSource(name, variants = {}) {
  await figma.loadAllPagesAsync();
  const page = figma.root.children.find((p) => p.name === PAGE_FOUNDATION);
  if (!page) {
    throw new Error('Foundation 페이지가 없습니다. 먼저 components 플래그를 켜서 렌더하세요.');
  }

  const source = page.findOne((node) =>
    (node.type === 'COMPONENT_SET' || node.type === 'COMPONENT') &&
    node.name === name
  );
  if (!source) {
    throw new Error(`Foundation 컴포넌트가 없습니다: ${name}`);
  }

  if (source.type === 'COMPONENT') return source;
  const component = source.children.find((child) => {
    if (child.type !== 'COMPONENT') return false;
    return Object.entries(variants).every(([key, value]) =>
      child.variantProperties && child.variantProperties[key] === value
    );
  });
  if (!component) {
    throw new Error(`${name} Variant를 찾을 수 없습니다: ${JSON.stringify(variants)}`);
  }
  return component;
}

async function foundationInstance(name, variants = {}) {
  const source = await foundationSource(name, variants);
  const instance = source.createInstance();
  instance.name = `${name} instance`;
  return instance;
}

function instanceTexts(instance) {
  return instance.findAll((node) => node.type === 'TEXT');
}

function replaceInstanceText(instance, replacements) {
  for (const node of instanceTexts(instance)) {
    if (Object.prototype.hasOwnProperty.call(replacements, node.characters)) {
      node.characters = replacements[node.characters];
    }
  }
}

function hideInstanceLabel(instance, label) {
  const textNode = instanceTexts(instance).find((node) => node.characters === label);
  if (textNode && textNode.parent && textNode.parent !== instance) {
    textNode.parent.visible = false;
  }
}

async function buttonInstance(label, kind = 'primary', state = 'default') {
  const instance = await foundationInstance('Button', { kind, state });
  const labelNode = instanceTexts(instance)[0];
  if (labelNode) labelNode.characters = label;
  return instance;
}

async function badgeInstance(kind, label) {
  const instance = await foundationInstance('Badge', { kind });
  const labelNode = instanceTexts(instance)[0];
  if (labelNode && label) labelNode.characters = label;
  return instance;
}

async function trackCardInstance(o = {}, state = 'default') {
  const instance = await foundationInstance('TrackCard', { state });
  if (state === 'loading') return instance;
  replaceInstanceText(instance, {
    '새벽 세 시의 네온': o.title || '새벽 세 시의 네온',
    '김하늘': o.artist || '김하늘',
  });
  if (!o.isNew) hideInstanceLabel(instance, 'NEW');
  return instance;
}

async function trackRowInstance(K, o = {}, state = 'default') {
  const instance = await foundationInstance('TrackRow', { state });
  if (state === 'loading') return instance;

  replaceInstanceText(instance, {
    '1': String(o.rank == null ? 1 : o.rank),
    '새벽 세 시의 네온': o.title || '새벽 세 시의 네온',
    '김하늘': o.artist || '김하늘',
    'Suno': o.tool || 'Suno',
    '일렉트로닉': o.genre || '일렉트로닉',
    '3:24': o.duration || '3:24',
    '♥ 1.2K': `♥ ${o.likes || '1.2K'}`,
  });
  if (!o.isNew) hideInstanceLabel(instance, 'NEW');
  if (o.noRank) {
    const rankNode = instanceTexts(instance)[0];
    if (rankNode) rankNode.visible = false;
  }

  const toolNode = instanceTexts(instance).find((node) => node.characters === (o.tool || 'Suno'));
  if (toolNode && toolNode.parent) {
    const token = o.tool === 'Udio' ? 'color/badge/udio' : 'color/badge/suno';
    toolNode.parent.fills = [K.C(token)];
  }
  if (o.compact || o.mobile) {
    const hiddenLabels = [
      o.genre || '일렉트로닉',
      o.duration || '3:24',
      `♥ ${o.likes || '1.2K'}`,
      '⋯',
    ];
    for (const node of instanceTexts(instance)) {
      if (hiddenLabels.includes(node.characters)) node.visible = false;
    }
    if (o.compact && toolNode && toolNode.parent) toolNode.parent.visible = false;
  }
  return instance;
}

/** 교차축을 가득 채웁니다. AL()이 HUG를 명시해 두므로 layoutAlign 대신 layoutSizing으로 지정합니다 */
function fillCross(parent, child) {
  if (parent.layoutMode === 'HORIZONTAL') child.layoutSizingVertical = 'FILL';
  else child.layoutSizingHorizontal = 'FILL';
  return child;
}

function appendStretch(parent, child) {
  parent.appendChild(child);
  return fillCross(parent, child);
}

function innerContentWidth() {
  return PAGE_CONTENT_WIDTH - SPACES['space/lg'] * 2;
}

async function sectionHeading(K, title, caption) {
  const row = AL({
    name: `${title}/heading`, dir: 'H', gap: 'space/md',
    w: innerContentWidth(), align: 'MAX',
  });
  row.appendChild(await txt(K, title, 'text/h2', 'color/text/main'));
  if (caption) {
    const spacer = figma.createFrame();
    spacer.name = 'spacer';
    spacer.resize(1, 1);
    spacer.fills = [];
    row.appendChild(spacer);
    spacer.layoutGrow = 1;
    row.appendChild(await txt(K, caption, 'text/caption', 'color/text/muted'));
  }
  return row;
}

async function buildCardStrip(K, name, count, tool, showNew = false) {
  const viewport = AL({ name, dir: 'H', gap: 0, w: innerContentWidth(), align: 'MIN' });
  viewport.clipsContent = true;

  const strip = AL({ name: `${name}/scroll-content`, dir: 'H', gap: 'space/md', align: 'MIN' });
  for (let i = 0; i < count; i += 1) {
    const sample = SCREEN_TRACKS[i % SCREEN_TRACKS.length];
    strip.appendChild(await trackCardInstance({
      title: sample.title,
      artist: sample.artist,
      isNew: showNew && i < SCREEN_TRACKS.length,
      tool,
    }));
  }
  viewport.appendChild(strip);
  return viewport;
}

async function buildPCShell(K, frameName, content) {
  const screen = AL({ name: frameName, dir: 'V', gap: 0, w: PC_WIDTH, align: 'MIN' });
  screen.fills = [K.C('color/bg/base')];

  const body = AL({ name: 'AppShell/body', dir: 'H', gap: 0, w: PC_WIDTH, align: 'MIN' });
  const sidebar = await foundationInstance('Sidebar');
  body.appendChild(sidebar);

  const main = AL({ name: 'AppShell/main', dir: 'V', gap: 0, w: PAGE_CONTENT_WIDTH, align: 'MIN' });
  const header = await foundationInstance('Header', { account: 'signed-in' });
  main.appendChild(header);
  appendStretch(main, content);
  body.appendChild(main);

  screen.appendChild(body);
  const player = await foundationInstance('BottomPlayer');
  screen.appendChild(player);
  return screen;
}

/** PC/01-Home — PLAN.md §5.4 선정 기준과 FIGMA_SPEC.md §3-1 구성 */
async function buildHomePC(K) {
  const content = AL({
    name: 'Home/content', dir: 'V', gap: 'space/2xl', pad: 'space/lg',
    w: PAGE_CONTENT_WIDTH, align: 'MIN',
  });

  const hero = AL({
    name: 'Hero/이주의 추천', dir: 'H', gap: 'space/2xl', pad: 'space/xl',
    w: innerContentWidth(), align: 'CENTER',
  });
  hero.fills = [K.C('color/bg/surface')];
  bindRadius(hero, K.R('radius/lg'));
  const art = box(K, 'cover', 300, 300, 'color/bg/elevated', 'radius/md');
  bindSize(K, art, 'width', 'size/cover/hero');
  bindSize(K, art, 'height', 'size/cover/hero');
  hero.appendChild(art);

  const heroCopy = AL({ name: 'Hero/copy', dir: 'V', gap: 'space/md', align: 'MIN' });
  heroCopy.appendChild(await txt(K, '이주의 추천 AI 트랙', 'text/bodyB', 'color/brand/primary'));
  heroCopy.appendChild(await txt(K, '새벽 세 시의 네온', 'text/display', 'color/text/main'));
  heroCopy.appendChild(await txt(K, '최근 7일 종합 차트 1위', 'text/body', 'color/text/muted'));
  const heroActions = AL({ name: 'Hero/actions', dir: 'H', gap: 'space/sm' });
  heroActions.appendChild(await buttonInstance('즉시 재생', 'primary'));
  heroActions.appendChild(await buttonInstance('프롬프트 보기', 'ghost'));
  heroCopy.appendChild(heroActions);
  hero.appendChild(heroCopy);
  heroCopy.layoutGrow = 1;
  content.appendChild(hero);

  for (const [title, tool] of [['Suno 핫트랙', 'Suno'], ['Udio 핫트랙', 'Udio']]) {
    const section = AL({
      name: title, dir: 'V', gap: 'space/md', w: innerContentWidth(), align: 'MIN',
    });
    appendStretch(section, await sectionHeading(K, title, '상위 10곡'));
    appendStretch(section, await buildCardStrip(K, `${tool}/cards`, 10, tool));
    content.appendChild(section);
  }

  const weekly = AL({
    name: '주간 TOP 5', dir: 'V', gap: 'space/md', w: innerContentWidth(), align: 'MIN',
  });
  appendStretch(weekly, await sectionHeading(K, '주간 TOP 5'));
  for (let i = 0; i < 5; i += 1) {
    const sample = SCREEN_TRACKS[i % SCREEN_TRACKS.length];
    const row = await trackRowInstance(K, {
      rank: i + 1,
      title: sample.title,
      artist: sample.artist,
      duration: sample.duration,
      tool: i % 2 === 0 ? 'Suno' : 'Udio',
      isNew: i < SCREEN_TRACKS.length,
      compact: true,
    });
    appendStretch(weekly, row);
  }
  content.appendChild(weekly);

  const latest = AL({
    name: '최신 업로드', dir: 'V', gap: 'space/md', w: innerContentWidth(), align: 'MIN',
  });
  appendStretch(latest, await sectionHeading(K, '최신 업로드', 'created_at 내림차순 · 7일 이내 NEW'));
  appendStretch(latest, await buildCardStrip(K, 'Latest/cards', 10, null, true));
  content.appendChild(latest);

  return buildPCShell(K, 'PC/01-Home', content);
}

/** PC/02-Chart — 상위 12행과 말줄임만 렌더 */
async function buildChartPC(K) {
  const content = AL({
    name: 'Chart/content', dir: 'V', gap: 'space/lg', pad: 'space/lg',
    w: PAGE_CONTENT_WIDTH, align: 'MIN',
  });

  const titleRow = AL({
    name: 'Chart/title', dir: 'H', gap: 'space/md', w: innerContentWidth(),
  });
  titleRow.appendChild(await txt(K, '차트', 'text/h1', 'color/text/main'));
  const spacer = figma.createFrame();
  spacer.name = 'spacer';
  spacer.resize(1, 1);
  spacer.fills = [];
  titleRow.appendChild(spacer);
  spacer.layoutGrow = 1;
  titleRow.appendChild(await txt(K, '매일 00:00 갱신 · 기준 YYYY-MM-DD', 'text/caption', 'color/text/muted'));
  titleRow.appendChild(await buttonInstance('전체 재생', 'primary'));
  appendStretch(content, titleRow);

  const tabs = AL({ name: 'Chart/filters', dir: 'H', gap: 'space/sm', align: 'MIN' });
  for (const [label, kind] of [
    ['종합 TOP 100', 'primary'],
    ['Suno TOP 50', 'pill'],
    ['Udio TOP 50', 'pill'],
    ['장르별', 'pill'],
  ]) {
    tabs.appendChild(await buttonInstance(label, kind));
  }
  content.appendChild(tabs);

  const genres = AL({ name: 'Chart/genre-filters', dir: 'H', gap: 'space/sm', align: 'MIN' });
  for (const genre of ['케이팝', '발라드', '힙합', 'R&B', '팝(POP)', 'J-POP', '인디', '일렉트로닉', '기타']) {
    genres.appendChild(await buttonInstance(genre, 'pill'));
  }
  content.appendChild(genres);

  const columns = AL({
    name: 'Chart/columns', dir: 'H', gap: 'space/md', pad: ['space/sm', 'space/md'],
  });
  columns.appendChild(await txt(
    K,
    '순위    커버    제목 / 창작자                                      AI 툴    장르    재생시간    ♥ 수    더보기',
    'text/caption',
    'color/text/muted'
  ));
  appendStretch(content, columns);

  const rows = AL({
    name: 'Chart/top-12', dir: 'V', gap: 'space/xs', w: innerContentWidth(), align: 'MIN',
  });
  for (let i = 0; i < 12; i += 1) {
    const sample = SCREEN_TRACKS[i % SCREEN_TRACKS.length];
    const row = await trackRowInstance(K, {
      rank: i + 1,
      title: sample.title,
      artist: sample.artist,
      duration: sample.duration,
      tool: i % 2 === 0 ? 'Suno' : 'Udio',
      genre: i % 2 === 0 ? '일렉트로닉' : '발라드',
      likes: i < 3 ? '1.2K' : '999',
      isNew: i < SCREEN_TRACKS.length,
    });
    appendStretch(rows, row);
  }
  const more = await txt(K, '…', 'text/h2', 'color/text/muted');
  more.textAlignHorizontal = 'CENTER';
  more.resize(innerContentWidth(), more.height);
  rows.appendChild(more);
  appendStretch(content, rows);

  return buildPCShell(K, 'PC/02-Chart', content);
}

async function promptField(K, label, value) {
  const field = AL({ name: label, dir: 'V', gap: 'space/sm', pad: 'space/md', align: 'MIN' });
  field.fills = [K.C('color/bg/elevated')];
  bindRadius(field, K.R('radius/md'));
  field.appendChild(await txt(K, label, 'text/bodyB', 'color/text/main'));
  field.appendChild(await txt(K, value, 'text/body', 'color/text/muted'));
  return field;
}

/** PC/03-TrackDetail — locked=true일 때 비공개 프롬프트 변형 */
async function buildTrackDetailPC(K, locked = false) {
  const content = AL({
    name: 'TrackDetail/content', dir: 'V', gap: 'space/2xl', pad: 'space/lg',
    w: PAGE_CONTENT_WIDTH, align: 'MIN',
  });

  const visual = AL({
    name: 'TrackDetail/visual-header', dir: 'H', gap: 'space/2xl',
    pad: 'space/xl', w: innerContentWidth(), align: 'CENTER',
  });
  visual.fills = [K.C('color/bg/surface')];
  bindRadius(visual, K.R('radius/lg'));
  const art = box(K, 'cover', 300, 300, 'color/bg/elevated', 'radius/md');
  bindSize(K, art, 'width', 'size/cover/hero');
  bindSize(K, art, 'height', 'size/cover/hero');
  visual.appendChild(art);

  const meta = AL({ name: 'TrackDetail/meta', dir: 'V', gap: 'space/md', align: 'MIN' });
  meta.appendChild(await txt(K, '곡', 'text/caption', 'color/text/muted'));
  meta.appendChild(await txt(K, '새벽 세 시의 네온', 'text/display', 'color/text/main'));
  meta.appendChild(await txt(K, '김하늘 · 업로드일 YYYY-MM-DD', 'text/body', 'color/text/muted'));
  const badges = AL({ name: 'TrackDetail/badges', dir: 'H', gap: 'space/sm' });
  badges.appendChild(await badgeInstance('suno', 'Suno'));
  badges.appendChild(await badgeInstance('model', 'v4.5'));
  meta.appendChild(badges);
  const actions = AL({ name: 'TrackDetail/actions', dir: 'H', gap: 'space/sm' });
  actions.appendChild(await buttonInstance('재생', 'primary'));
  actions.appendChild(await buttonInstance('좋아요', 'ghost'));
  meta.appendChild(actions);
  visual.appendChild(meta);
  meta.layoutGrow = 1;
  appendStretch(content, visual);

  const inspector = AL({
    name: locked ? 'PromptInspector/locked' : 'PromptInspector/public',
    dir: 'V', gap: 'space/md', pad: 'space/lg',
    w: innerContentWidth(), align: 'MIN',
  });
  inspector.fills = [K.C('color/bg/surface')];
  bindRadius(inspector, K.R('radius/lg'));
  inspector.appendChild(await txt(K, '이 곡은 이렇게 만들었어요', 'text/h2', 'color/text/main'));
  if (locked) {
    const lockedBox = AL({
      name: 'PromptInspector/message', dir: 'V', gap: 'space/sm',
      pad: 'space/2xl', align: 'CENTER',
    });
    lockedBox.fills = [K.C('color/bg/elevated')];
    bindRadius(lockedBox, K.R('radius/md'));
    lockedBox.appendChild(await txt(K, '🔒', 'text/h1', 'color/text/muted'));
    lockedBox.appendChild(await txt(
      K,
      '창작자가 프롬프트를 비공개했습니다',
      'text/bodyB',
      'color/text/main'
    ));
    appendStretch(inspector, lockedBox);
  } else {
    appendStretch(inspector, await promptField(
      K,
      '스타일 프롬프트',
      '80s synthpop, nostalgic, emotional female vocal, 120bpm'
    ));
    appendStretch(inspector, await promptField(K, '네거티브 프롬프트', '없음'));
    const copyFeedback = AL({
      name: 'PromptInspector/copy-feedback', dir: 'H', gap: 'space/md', align: 'CENTER',
    });
    copyFeedback.appendChild(await buttonInstance('프롬프트 복사', 'ghost'));
    copyFeedback.appendChild(await foundationInstance('Toast', { variant: 'success' }));
    inspector.appendChild(copyFeedback);
  }
  appendStretch(content, inspector);

  const lyrics = AL({
    name: '가사', dir: 'V', gap: 'space/md', pad: 'space/lg',
    w: innerContentWidth(), align: 'MIN',
  });
  lyrics.fills = [K.C('color/bg/surface')];
  bindRadius(lyrics, K.R('radius/lg'));
  lyrics.appendChild(await txt(K, '가사', 'text/h2', 'color/text/main'));
  lyrics.appendChild(await txt(K, '한글 가사 본문', 'text/body', 'color/text/muted'));
  lyrics.appendChild(await buttonInstance('가사 펼치기', 'ghost'));
  appendStretch(content, lyrics);

  const artist = AL({
    name: '창작자 카드', dir: 'H', gap: 'space/md', pad: 'space/lg',
    w: innerContentWidth(), align: 'CENTER',
  });
  artist.fills = [K.C('color/bg/surface')];
  bindRadius(artist, K.R('radius/lg'));
  const avatar = AL({ name: 'avatar', dir: 'H', gap: 0, pad: 'space/md' });
  avatar.fills = [K.C('color/bg/elevated')];
  bindRadius(avatar, K.R('radius/full'));
  avatar.appendChild(await txt(K, '김', 'text/bodyB', 'color/text/main'));
  artist.appendChild(avatar);
  const artistMeta = AL({ name: 'artist/meta', dir: 'V', gap: 'space/xs', align: 'MIN' });
  artistMeta.appendChild(await txt(K, '김하늘', 'text/bodyB', 'color/text/main'));
  artistMeta.appendChild(await txt(K, '곡 수', 'text/caption', 'color/text/muted'));
  artist.appendChild(artistMeta);
  artistMeta.layoutGrow = 1;
  artist.appendChild(await buttonInstance('채널 가기', 'ghost'));
  appendStretch(content, artist);

  return buildPCShell(
    K,
    locked ? 'PC/03-TrackDetail-Locked' : 'PC/03-TrackDetail',
    content
  );
}

async function buildTrackDetailLockedPC(K) {
  return buildTrackDetailPC(K, true);
}

// ─────────────────────────────────────────────────────────────
// 8-B. 나머지 PC 화면 · Mobile 화면 (FIGMA_SPEC.md §3.1)
// ─────────────────────────────────────────────────────────────

const PAGE_MOBILE = '02 · Mobile (390)';
const MOBILE_WIDTH = 390;

function mobileInnerWidth() {
  return MOBILE_WIDTH - SPACES['space/md'] * 2;
}

async function inputInstance(text, filled = false, K = null) {
  const inst = await foundationInstance('Input', { state: 'default' });
  const t = instanceTexts(inst)[0];
  if (t) {
    t.characters = text;
    if (filled && K) t.fills = [K.C('color/text/main')];
  }
  return inst;
}

/** 카드형 패널. w를 주면 고정 폭 */
function panel(K, name, w = null, padToken = 'space/lg') {
  const f = AL({ name, dir: 'V', gap: 'space/md', pad: padToken, w: w || undefined, align: 'MIN' });
  f.fills = [K.C('color/bg/surface')];
  bindRadius(f, K.R('radius/lg'));
  return f;
}

async function tabRow(K, name, labels, active = 0) {
  const row = AL({ name, dir: 'H', gap: 'space/sm', align: 'MIN' });
  for (const [i, label] of labels.entries()) {
    row.appendChild(await buttonInstance(label, i === active ? 'primary' : 'pill'));
  }
  return row;
}

/** 가로 스크롤 영역(넘치는 부분은 잘림) */
function scrollViewport(name, child) {
  const viewport = AL({ name, dir: 'H', gap: 0, align: 'MIN' });
  viewport.clipsContent = true;
  viewport.appendChild(child);
  return viewport;
}

async function labeledField(K, label, text, filled = false) {
  const f = AL({ name: label, dir: 'V', gap: 'space/xs', align: 'MIN' });
  f.appendChild(await txt(K, label, 'text/caption', 'color/text/muted'));
  const inp = await inputInstance(text, filled, K);
  f.appendChild(inp);
  fillCross(f, inp);
  return f;
}

async function checkbox(K, label, checked) {
  const row = AL({ name: `Checkbox/${checked ? 'checked' : 'unchecked'}`, dir: 'H', gap: 'space/sm' });
  const mark = AL({ name: 'box', dir: 'H', gap: 0, pad: 'space/xs' });
  mark.fills = [K.C(checked ? 'color/brand/primary' : 'color/bg/elevated')];
  mark.strokes = [K.C('color/border/subtle')];
  mark.strokeWeight = 1;
  bindRadius(mark, K.R('radius/sm'));
  mark.appendChild(await txt(K, checked ? '✓' : ' ', 'text/caption', checked ? 'color/text/on-brand' : 'color/text/muted'));
  row.appendChild(mark);
  row.appendChild(await txt(K, label, 'text/body', 'color/text/main'));
  return row;
}

async function pageTitle(K, title, caption) {
  const row = AL({ name: `${title}/title`, dir: 'H', gap: 'space/md', align: 'MAX' });
  row.appendChild(await txt(K, title, 'text/h1', 'color/text/main'));
  if (caption) {
    const spacer = figma.createFrame();
    spacer.name = 'spacer';
    spacer.resize(1, 1);
    spacer.fills = [];
    row.appendChild(spacer);
    spacer.layoutGrow = 1;
    row.appendChild(await txt(K, caption, 'text/caption', 'color/text/muted'));
  }
  return row;
}

function pcContent(name) {
  return AL({ name, dir: 'V', gap: 'space/lg', pad: 'space/lg', w: PAGE_CONTENT_WIDTH, align: 'MIN' });
}

async function sampleRows(K, parent, count, o = {}) {
  for (let i = 0; i < count; i += 1) {
    const sample = SCREEN_TRACKS[i % SCREEN_TRACKS.length];
    const row = await trackRowInstance(K, Object.assign({
      rank: i + 1,
      title: sample.title,
      artist: sample.artist,
      duration: sample.duration,
      tool: i % 2 === 0 ? 'Suno' : 'Udio',
      genre: i % 2 === 0 ? '일렉트로닉' : '발라드',
      likes: '1.2K',
      isNew: i < SCREEN_TRACKS.length,
    }, o));
    appendStretch(parent, row);
  }
}

async function emptyStateInstance(K, texts = {}, hideCta = false) {
  const inst = await foundationInstance('EmptyState', { variant: 'default' });
  replaceInstanceText(inst, texts);
  if (hideCta) hideInstanceLabel(inst, '곡 둘러보기');
  return inst;
}

// ── PC ──────────────────────────────────────────────────────

/** PC/04-Search, PC/04-Search-Empty */
async function buildSearchPC(K, empty = false) {
  const content = pcContent('Search/content');
  appendStretch(content, await pageTitle(K, empty ? '"zzz" 검색 결과' : '"새벽" 검색 결과', empty ? '결과 0개' : '결과 12개'));
  content.appendChild(await tabRow(K, 'Search/tabs', ['곡', '창작자', '프롬프트'], 0));

  if (!empty) {
    const rows = AL({ name: 'Search/results', dir: 'V', gap: 'space/xs', align: 'MIN' });
    await sampleRows(K, rows, 6, { noRank: true });
    appendStretch(content, rows);
  } else {
    const box = AL({ name: 'Search/empty', dir: 'V', gap: 'space/lg', pad: 'space/xl', align: 'CENTER' });
    box.appendChild(await emptyStateInstance(K, {
      '아직 곡이 없어요': '검색 결과가 없어요',
      '마음에 드는 곡에 하트를 눌러 보세요': '다른 키워드로 검색해 보세요',
    }, true));
    box.appendChild(await txt(K, '인기 검색어', 'text/caption', 'color/text/muted'));
    const chips = AL({ name: 'Search/popular-chips', dir: 'H', gap: 'space/sm', align: 'MIN' });
    for (const label of ['신스팝', '발라드', '시티팝', '로파이', '케이팝']) {
      chips.appendChild(await buttonInstance(label, 'pill'));
    }
    box.appendChild(chips);
    appendStretch(content, box);
  }
  return buildPCShell(K, empty ? 'PC/04-Search-Empty' : 'PC/04-Search', content);
}

/** PC/05-Auth-Login, PC/05-Auth-Signup — 사이드바 · 플레이어 없는 단독 레이아웃 */
async function buildAuthPC(K, signup = false) {
  const screen = AL({
    name: signup ? 'PC/05-Auth-Signup' : 'PC/05-Auth-Login',
    dir: 'V', gap: 'space/lg', w: PC_WIDTH, h: 1080, align: 'CENTER',
  });
  screen.fills = [K.C('color/bg/base')];
  screen.primaryAxisAlignItems = 'CENTER';
  screen.appendChild(await logoPlaceholder(K));

  const card = panel(K, 'Auth/card', 400);
  card.appendChild(await tabRow(K, 'Auth/tabs', ['로그인', '회원가입'], signup ? 1 : 0));
  const fields = AL({ name: 'Auth/fields', dir: 'V', gap: 'space/md', align: 'MIN' });
  if (signup) {
    appendStretch(fields, await labeledField(K, '사용자명 (username)', '@username'));
    appendStretch(fields, await labeledField(K, '표시명', '표시될 이름'));
  }
  appendStretch(fields, await labeledField(K, '이메일', '이메일'));
  appendStretch(fields, await labeledField(K, '비밀번호', '비밀번호'));
  appendStretch(card, fields);

  const submit = await buttonInstance(signup ? '회원가입' : '로그인', 'primary');
  appendStretch(card, submit);
  try { submit.primaryAxisAlignItems = 'CENTER'; } catch (e) { console.warn('[auth] 버튼 라벨 정렬 실패', e.message); }

  const divider = await txt(K, '또는', 'text/caption', 'color/text/muted');
  divider.textAlignHorizontal = 'CENTER';
  card.appendChild(divider);
  fillCross(card, divider);

  const google = await buttonInstance('Google로 계속하기', 'ghost', 'disabled');
  appendStretch(card, google);
  try { google.primaryAxisAlignItems = 'CENTER'; } catch (e) { console.warn('[auth] 버튼 라벨 정렬 실패', e.message); }

  screen.appendChild(card);
  return screen;
}

/** 업로드 폼 — PC · Mobile 공용. state: empty | filled | progress */
async function buildUploadForm(K, state, width, padToken = 'space/lg') {
  const inner = width - SPACES[padToken] * 2;
  const filled = state !== 'empty';
  const form = AL({ name: 'Upload/form', dir: 'V', gap: 'space/lg', w: width, align: 'MIN' });

  // 1) 음원 업로더
  const audio = panel(K, '음원 업로더', null, padToken);
  audio.appendChild(await txt(K, '음원 업로더', 'text/h2', 'color/text/main'));
  const drop = AL({ name: `dropzone/${state}`, dir: 'V', gap: 'space/sm', pad: 'space/xl', align: 'CENTER' });
  drop.primaryAxisAlignItems = 'CENTER';
  drop.strokes = [K.C(filled ? 'color/brand/primary' : 'color/border/subtle')];
  drop.strokeWeight = 2;
  drop.dashPattern = [8, 8];
  bindRadius(drop, K.R('radius/md'));
  if (state === 'empty') {
    drop.appendChild(await glyph(K, '↑', 'color/text/muted', 'text/h1'));
    drop.appendChild(await txt(K, '.mp3 · .wav 파일을 끌어다 놓으세요', 'text/body', 'color/text/muted'));
    drop.appendChild(await buttonInstance('파일 선택', 'ghost'));
  } else {
    drop.appendChild(await txt(K, '새벽 세 시의 네온.mp3', 'text/bodyB', 'color/text/main'));
    if (state === 'filled') {
      drop.appendChild(await txt(K, '재생시간 3:24 · 자동 추출', 'text/caption', 'color/text/muted'));
      drop.appendChild(await buttonInstance('파일 교체', 'ghost'));
    } else {
      drop.appendChild(slider(K, inner - SPACES['space/xl'] * 2 - 4, 0.62));
      drop.appendChild(await txt(K, '업로드 중… 62%', 'text/caption', 'color/text/muted'));
    }
  }
  appendStretch(audio, drop);
  appendStretch(form, audio);

  // 2) 커버
  const cover = panel(K, '커버 등록', null, padToken);
  cover.appendChild(await txt(K, '커버 등록', 'text/h2', 'color/text/main'));
  const coverRow = AL({ name: 'cover/row', dir: 'H', gap: 'space/lg', align: 'CENTER' });
  coverRow.appendChild(box(K, 'cover-preview (1:1)', 160, 160, filled ? 'color/brand/primary' : 'color/bg/elevated', 'radius/md'));
  const coverMeta = AL({ name: 'cover/meta', dir: 'V', gap: 'space/sm', align: 'MIN' });
  coverMeta.appendChild(await txt(K, '1:1 비율 이미지', 'text/caption', 'color/text/muted'));
  coverMeta.appendChild(await buttonInstance('이미지 선택', 'ghost'));
  coverRow.appendChild(coverMeta);
  cover.appendChild(coverRow);
  appendStretch(form, cover);

  // 3) 메타데이터
  const meta = panel(K, '메타데이터', null, padToken);
  meta.appendChild(await txt(K, '메타데이터', 'text/h2', 'color/text/main'));
  appendStretch(meta, await labeledField(K, '제목', filled ? '새벽 세 시의 네온' : '곡 제목', filled));
  appendStretch(meta, await labeledField(K, '설명', filled ? '네온 불빛 아래의 새벽 산책' : '곡 설명', filled));
  appendStretch(meta, await labeledField(K, '장르', filled ? '일렉트로닉 ▾' : '장르 선택 ▾', filled));
  appendStretch(meta, await labeledField(K, '언어', '한국어 ▾', true));
  appendStretch(form, meta);

  // 4) AI 생성 정보
  const ai = panel(K, 'AI 생성 정보', null, padToken);
  ai.appendChild(await txt(K, 'AI 생성 정보', 'text/h2', 'color/text/main'));
  ai.appendChild(await tabRow(K, 'ai-tool', ['Suno', 'Udio', '기타'], filled ? 0 : -1));
  appendStretch(ai, await labeledField(K, '모델 버전', filled ? 'v4.5' : '예: v4.5', filled));
  appendStretch(ai, await labeledField(K, '프롬프트', filled ? '80s synthpop, nostalgic, emotional female vocal, 120bpm' : '스타일 프롬프트', filled));
  appendStretch(ai, await labeledField(K, '네거티브 프롬프트', filled ? '없음' : '네거티브 프롬프트', filled));
  const pub = AL({ name: 'prompt-public', dir: 'H', gap: 'space/md' });
  pub.appendChild(await foundationInstance('Switch', { value: 'on', state: 'default' }));
  pub.appendChild(await txt(K, '프롬프트 공개', 'text/body', 'color/text/main'));
  ai.appendChild(pub);
  appendStretch(form, ai);

  // 5) 저작권 서약 + 업로드
  form.appendChild(await checkbox(K, '직접 생성한 음원이며 저작권 및 이용약관을 준수합니다', filled));
  const submit = await buttonInstance(
    state === 'progress' ? '업로드 중…' : '업로드',
    'primary',
    state === 'filled' ? 'default' : 'disabled'
  );
  appendStretch(form, submit);
  try { submit.primaryAxisAlignItems = 'CENTER'; } catch (e) { console.warn('[upload] 버튼 라벨 정렬 실패', e.message); }
  return form;
}

/** PC/06-Upload-Empty · -Filled · -Progress */
async function buildUploadPC(K, state) {
  const content = pcContent('Upload/content');
  content.appendChild(await txt(K, '곡 업로드', 'text/h1', 'color/text/main'));
  content.appendChild(await buildUploadForm(K, state, 720));
  const names = { empty: 'PC/06-Upload-Empty', filled: 'PC/06-Upload-Filled', progress: 'PC/06-Upload-Progress' };
  return buildPCShell(K, names[state], content);
}

/** PC/07-Library, PC/07-Library-Empty */
async function buildLibraryPC(K, empty = false) {
  const content = pcContent('Library/content');
  content.appendChild(await txt(K, '내 보관함', 'text/h1', 'color/text/main'));
  content.appendChild(await tabRow(K, 'Library/tabs', ['좋아요한 곡', '내 플레이리스트', '내가 업로드한 곡'], 0));
  if (!empty) {
    const rows = AL({ name: 'Library/liked', dir: 'V', gap: 'space/xs', align: 'MIN' });
    await sampleRows(K, rows, 6);
    appendStretch(content, rows);
  } else {
    const box = AL({ name: 'Library/empty', dir: 'V', gap: 'space/lg', pad: 'space/xl', align: 'CENTER' });
    box.appendChild(await emptyStateInstance(K, {
      '아직 곡이 없어요': '아직 좋아요한 곡이 없어요',
    }));
    appendStretch(content, box);
  }
  return buildPCShell(K, empty ? 'PC/07-Library-Empty' : 'PC/07-Library', content);
}

/** PC/08-Playlist, PC/08-Playlist-TitleEdit */
async function buildPlaylistPC(K, editing = false) {
  const content = pcContent('Playlist/content');

  const header = AL({ name: 'Playlist/header', dir: 'H', gap: 'space/xl', pad: 'space/xl', align: 'CENTER' });
  header.fills = [K.C('color/bg/surface')];
  bindRadius(header, K.R('radius/lg'));

  const mosaic = AL({ name: 'cover-mosaic (4분할)', dir: 'V', gap: 0 });
  mosaic.clipsContent = true;
  bindRadius(mosaic, K.R('radius/md'));
  for (const pair of [['color/brand/primary', 'color/badge/udio'], ['color/badge/suno', 'color/bg/hover']]) {
    const r = AL({ name: 'mosaic-row', dir: 'H', gap: 0 });
    for (const token of pair) r.appendChild(box(K, 'tile', 100, 100, token));
    mosaic.appendChild(r);
  }
  header.appendChild(mosaic);

  const info = AL({ name: 'Playlist/info', dir: 'V', gap: 'space/md', align: 'MIN' });
  const titleRow = AL({ name: editing ? 'title (edit)' : 'title (hover: 편집 아이콘)', dir: 'H', gap: 'space/sm' });
  if (editing) {
    titleRow.appendChild(await inputInstance('새 플레이리스트', true, K));
    titleRow.appendChild(await txt(K, 'Enter 저장 · Esc 취소', 'text/caption', 'color/text/muted'));
  } else {
    titleRow.appendChild(await txt(K, '새 플레이리스트', 'text/h1', 'color/text/main'));
    titleRow.appendChild(await glyph(K, '✎'));
  }
  info.appendChild(titleRow);
  info.appendChild(await txt(K, '김하늘 · 6곡 · 총 21:48', 'text/caption', 'color/text/muted'));
  const actions = AL({ name: 'Playlist/actions', dir: 'H', gap: 'space/sm' });
  actions.appendChild(await buttonInstance('전체 재생', 'primary'));
  actions.appendChild(await buttonInstance('좋아요', 'ghost'));
  info.appendChild(actions);
  header.appendChild(info);
  appendStretch(content, header);

  const list = AL({ name: 'Playlist/tracks', dir: 'V', gap: 'space/xs', align: 'MIN' });
  for (let i = 0; i < 6; i += 1) {
    const sample = SCREEN_TRACKS[i % SCREEN_TRACKS.length];
    const line = AL({ name: 'playlist-row', dir: 'H', gap: 'space/sm', align: 'CENTER' });
    line.appendChild(await glyph(K, '≡'));
    const row = await trackRowInstance(K, {
      rank: i + 1, title: sample.title, artist: sample.artist, duration: sample.duration,
      tool: i % 2 === 0 ? 'Suno' : 'Udio', genre: i % 2 === 0 ? '일렉트로닉' : '발라드', likes: '1.2K',
    });
    line.appendChild(row);
    row.layoutGrow = 1;
    appendStretch(list, line);
  }
  appendStretch(content, list);
  return buildPCShell(K, editing ? 'PC/08-Playlist-TitleEdit' : 'PC/08-Playlist', content);
}

/** PC/09-Artist */
async function buildArtistPC(K) {
  const content = pcContent('Artist/content');

  const head = AL({ name: 'Artist/profile', dir: 'H', gap: 'space/xl', pad: 'space/xl', align: 'CENTER' });
  head.fills = [K.C('color/bg/surface')];
  bindRadius(head, K.R('radius/lg'));
  const avatar = AL({ name: 'avatar', dir: 'H', gap: 0, pad: 'space/xl' });
  avatar.fills = [K.C('color/bg/elevated')];
  bindRadius(avatar, K.R('radius/full'));
  avatar.appendChild(await txt(K, '김', 'text/display', 'color/text/main'));
  head.appendChild(avatar);
  const info = AL({ name: 'Artist/info', dir: 'V', gap: 'space/sm', align: 'MIN' });
  info.appendChild(await txt(K, '김하늘', 'text/h1', 'color/text/main'));
  info.appendChild(await txt(K, '@kimhaneul', 'text/caption', 'color/text/muted'));
  info.appendChild(await txt(K, '신스팝과 몽환적인 보컬을 만듭니다.', 'text/body', 'color/text/muted'));
  info.appendChild(await txt(K, '총 곡 수 24 · 총 재생수 1.2M', 'text/caption', 'color/text/muted'));
  head.appendChild(info);
  info.layoutGrow = 1;
  head.appendChild(await buttonInstance('프로필 편집', 'ghost'));
  appendStretch(content, head);

  const top = AL({ name: '대표곡', dir: 'V', gap: 'space/md', align: 'MIN' });
  appendStretch(top, await sectionHeading(K, '대표곡', '재생수 상위 3곡'));
  const cards = AL({ name: 'top-cards', dir: 'H', gap: 'space/md', align: 'MIN' });
  for (const s of SCREEN_TRACKS) cards.appendChild(await trackCardInstance({ title: s.title, artist: s.artist }));
  top.appendChild(cards);
  appendStretch(content, top);

  const all = AL({ name: '전체 곡 목록', dir: 'V', gap: 'space/xs', align: 'MIN' });
  appendStretch(all, await sectionHeading(K, '전체 곡', '순위 컬럼 없음'));
  await sampleRows(K, all, 6, { noRank: true });
  appendStretch(content, all);
  return buildPCShell(K, 'PC/09-Artist', content);
}

/** PC/QueuePanel — BottomPlayer 위 오버레이 */
async function buildQueuePanelPC(K) {
  const content = pcContent('QueuePanel/content');
  content.appendChild(await txt(K, '차트', 'text/h1', 'color/text/main'));
  const rows = AL({ name: 'rows', dir: 'V', gap: 'space/xs', align: 'MIN' });
  await sampleRows(K, rows, 4);
  appendStretch(content, rows);

  const screen = await buildPCShell(K, 'PC/QueuePanel', content);
  const player = screen.children.find((n) => n.name === 'BottomPlayer instance');
  const panelInst = await foundationInstance('QueuePanel');
  screen.appendChild(panelInst);
  panelInst.layoutPositioning = 'ABSOLUTE';
  panelInst.x = PC_WIDTH - panelInst.width - SPACES['space/lg'];
  panelInst.y = screen.height - (player ? player.height : 0) - panelInst.height - SPACES['space/sm'];
  return screen;
}

// ── Mobile ──────────────────────────────────────────────────

/** 모바일 셸: 상단 바 / 본문 / 미니 플레이어 / 하단 탭 3개 (PLAN.md §5.2) */
async function buildMobileShell(K, frameName, content, activeTab = 0) {
  const screen = AL({ name: frameName, dir: 'V', gap: 0, w: MOBILE_WIDTH, align: 'MIN' });
  screen.fills = [K.C('color/bg/base')];

  const bar = AL({ name: 'Mobile/topbar', dir: 'H', gap: 'space/md', pad: 'space/md', align: 'CENTER' });
  bar.appendChild(await logoPlaceholder(K));
  const spacer = figma.createFrame();
  spacer.name = 'spacer';
  spacer.resize(1, 1);
  spacer.fills = [];
  bar.appendChild(spacer);
  spacer.layoutGrow = 1;
  bar.appendChild(await glyph(K, '⌕', 'color/text/main', 'text/h2'));
  const avatar = AL({ name: 'avatar', dir: 'H', gap: 0, pad: 'space/sm' });
  avatar.fills = [K.C('color/bg/hover')];
  bindRadius(avatar, K.R('radius/full'));
  avatar.appendChild(await txt(K, '김', 'text/bodyB', 'color/text/main'));
  bar.appendChild(avatar);
  screen.appendChild(bar);
  fillCross(screen, bar);

  screen.appendChild(content);
  fillCross(screen, content);

  const mini = await foundationInstance('MiniPlayer');
  screen.appendChild(mini);
  fillCross(screen, mini);

  const tabs = AL({ name: 'Mobile/tabbar', dir: 'H', gap: 0, pad: 'space/sm', align: 'CENTER' });
  tabs.fills = [K.C('color/bg/surface')];
  for (const [i, [icon, label]] of [['⌂', '홈'], ['♫', '차트'], ['♥', '보관함']].entries()) {
    const item = AL({ name: `tab/${label}`, dir: 'V', gap: 'space/xs', align: 'CENTER' });
    const color = i === activeTab ? 'color/brand/primary' : 'color/text/muted';
    item.appendChild(await glyph(K, icon, color, 'text/h2'));
    item.appendChild(await txt(K, label, 'text/caption', color));
    tabs.appendChild(item);
    item.layoutGrow = 1;
  }
  screen.appendChild(tabs);
  fillCross(screen, tabs);
  return screen;
}

function mobileContent(name) {
  return AL({ name, dir: 'V', gap: 'space/xl', pad: 'space/md', w: MOBILE_WIDTH, align: 'MIN' });
}

async function mobileRows(K, parent, count, o = {}) {
  await sampleRows(K, parent, count, Object.assign({ mobile: true }, o));
}

/** M/01-Home */
async function buildHomeMobile(K) {
  const content = mobileContent('Home/content');

  const hero = panel(K, 'Hero/이주의 추천', null, 'space/md');
  const art = box(K, 'cover', 100, 200, 'color/bg/elevated', 'radius/md');
  hero.appendChild(art);
  art.layoutSizingHorizontal = 'FILL';
  hero.appendChild(await txt(K, '이주의 추천 AI 트랙', 'text/bodyB', 'color/brand/primary'));
  hero.appendChild(await txt(K, '새벽 세 시의 네온', 'text/h1', 'color/text/main'));
  const actions = AL({ name: 'Hero/actions', dir: 'H', gap: 'space/sm' });
  actions.appendChild(await buttonInstance('즉시 재생', 'primary'));
  actions.appendChild(await buttonInstance('프롬프트 보기', 'ghost'));
  hero.appendChild(actions);
  appendStretch(content, hero);

  for (const [title, tool] of [['Suno 핫트랙', 'Suno'], ['Udio 핫트랙', 'Udio']]) {
    const section = AL({ name: title, dir: 'V', gap: 'space/md', align: 'MIN' });
    appendStretch(section, await sectionHeading(K, title));
    appendStretch(section, await buildCardStrip(K, `${tool}/cards`, 6, tool));
    appendStretch(content, section);
  }

  const weekly = AL({ name: '주간 TOP 5', dir: 'V', gap: 'space/sm', align: 'MIN' });
  appendStretch(weekly, await sectionHeading(K, '주간 TOP 5'));
  await mobileRows(K, weekly, 5);
  appendStretch(content, weekly);

  const latest = AL({ name: '최신 업로드', dir: 'V', gap: 'space/md', align: 'MIN' });
  appendStretch(latest, await sectionHeading(K, '최신 업로드'));
  appendStretch(latest, await buildCardStrip(K, 'Latest/cards', 6, null, true));
  appendStretch(content, latest);
  return buildMobileShell(K, 'M/01-Home', content, 0);
}

/** M/02-Chart — 테이블 대신 리스트 행 */
async function buildChartMobile(K) {
  const content = mobileContent('Chart/content');
  appendStretch(content, await pageTitle(K, '차트', '매일 00:00 갱신'));
  const tabs = await tabRow(K, 'Chart/filters', ['종합 TOP 100', 'Suno TOP 50', 'Udio TOP 50', '장르별'], 0);
  appendStretch(content, scrollViewport('Chart/filters-scroll', tabs));
  content.appendChild(await buttonInstance('전체 재생', 'primary'));
  const rows = AL({ name: 'Chart/list', dir: 'V', gap: 'space/xs', align: 'MIN' });
  await mobileRows(K, rows, 10);
  appendStretch(content, rows);
  return buildMobileShell(K, 'M/02-Chart', content, 1);
}

/** M/03-TrackDetail */
async function buildTrackDetailMobile(K) {
  const content = mobileContent('TrackDetail/content');

  const head = AL({ name: 'TrackDetail/visual-header', dir: 'V', gap: 'space/md', align: 'CENTER' });
  const art = box(K, 'cover', 300, 300, 'color/bg/elevated', 'radius/md');
  bindSize(K, art, 'width', 'size/cover/hero');
  bindSize(K, art, 'height', 'size/cover/hero');
  head.appendChild(art);
  head.appendChild(await txt(K, '새벽 세 시의 네온', 'text/h1', 'color/text/main'));
  head.appendChild(await txt(K, '김하늘 · 업로드일 YYYY-MM-DD', 'text/caption', 'color/text/muted'));
  const badges = AL({ name: 'badges', dir: 'H', gap: 'space/sm' });
  badges.appendChild(await badgeInstance('suno', 'Suno'));
  badges.appendChild(await badgeInstance('model', 'v4.5'));
  head.appendChild(badges);
  const actions = AL({ name: 'actions', dir: 'H', gap: 'space/sm' });
  actions.appendChild(await buttonInstance('재생', 'primary'));
  actions.appendChild(await buttonInstance('좋아요', 'ghost'));
  head.appendChild(actions);
  appendStretch(content, head);

  const inspector = panel(K, 'PromptInspector', null, 'space/md');
  inspector.appendChild(await txt(K, '프롬프트', 'text/h2', 'color/text/main'));
  appendStretch(inspector, await promptField(K, '스타일 프롬프트', '80s synthpop, nostalgic, emotional female vocal, 120bpm'));
  appendStretch(inspector, await promptField(K, '네거티브 프롬프트', '없음'));
  inspector.appendChild(await buttonInstance('프롬프트 복사', 'ghost'));
  appendStretch(content, inspector);

  const lyrics = panel(K, '가사', null, 'space/md');
  lyrics.appendChild(await txt(K, '가사', 'text/h2', 'color/text/main'));
  lyrics.appendChild(await txt(K, '한글 가사 본문', 'text/body', 'color/text/muted'));
  lyrics.appendChild(await buttonInstance('가사 펼치기', 'ghost'));
  appendStretch(content, lyrics);

  const artist = panel(K, '창작자 카드', null, 'space/md');
  const line = AL({ name: 'artist/row', dir: 'H', gap: 'space/md', align: 'CENTER' });
  const avatar = AL({ name: 'avatar', dir: 'H', gap: 0, pad: 'space/md' });
  avatar.fills = [K.C('color/bg/elevated')];
  bindRadius(avatar, K.R('radius/full'));
  avatar.appendChild(await txt(K, '김', 'text/bodyB', 'color/text/main'));
  line.appendChild(avatar);
  const meta = AL({ name: 'artist/meta', dir: 'V', gap: 'space/xs', align: 'MIN' });
  meta.appendChild(await txt(K, '김하늘', 'text/bodyB', 'color/text/main'));
  meta.appendChild(await txt(K, '곡 수', 'text/caption', 'color/text/muted'));
  line.appendChild(meta);
  meta.layoutGrow = 1;
  line.appendChild(await buttonInstance('채널 가기', 'ghost'));
  artist.appendChild(line);
  fillCross(artist, line);
  appendStretch(content, artist);
  return buildMobileShell(K, 'M/03-TrackDetail', content, 1);
}

/** M/06-Upload — 모달이 아니라 풀스크린 페이지, 섹션 세로 스택 */
async function buildUploadMobile(K) {
  const content = mobileContent('Upload/content');
  content.appendChild(await txt(K, '곡 업로드', 'text/h1', 'color/text/main'));
  appendStretch(content, await buildUploadForm(K, 'empty', mobileInnerWidth(), 'space/md'));
  return buildMobileShell(K, 'M/06-Upload', content, 2);
}

/** M/07-Library */
async function buildLibraryMobile(K) {
  const content = mobileContent('Library/content');
  content.appendChild(await txt(K, '내 보관함', 'text/h1', 'color/text/main'));
  const tabs = await tabRow(K, 'Library/tabs', ['좋아요한 곡', '내 플레이리스트', '내가 업로드한 곡'], 0);
  appendStretch(content, scrollViewport('Library/tabs-scroll', tabs));
  const rows = AL({ name: 'Library/liked', dir: 'V', gap: 'space/xs', align: 'MIN' });
  await mobileRows(K, rows, 6);
  appendStretch(content, rows);
  return buildMobileShell(K, 'M/07-Library', content, 2);
}

/** M/Player-Fullscreen — 미니바 탭으로 확장되는 풀스크린 플레이어 (라우트 변경 없음) */
async function buildPlayerFullscreenMobile(K) {
  const screen = AL({ name: 'M/Player-Fullscreen', dir: 'V', gap: 'space/lg', pad: 'space/lg', w: MOBILE_WIDTH, h: 844, align: 'MIN' });
  screen.fills = [K.C('color/bg/base')];

  const top = AL({ name: 'top', dir: 'H', gap: 'space/md', align: 'CENTER' });
  top.appendChild(await glyph(K, '⌄', 'color/text/main', 'text/h2'));
  top.appendChild(await txt(K, '재생 중', 'text/caption', 'color/text/muted'));
  screen.appendChild(top);

  const art = box(K, 'cover', 342, 342, 'color/brand/primary', 'radius/md');
  screen.appendChild(art);
  art.layoutSizingHorizontal = 'FILL';

  const info = AL({ name: 'info', dir: 'H', gap: 'space/md', align: 'CENTER' });
  const names = AL({ name: 'names', dir: 'V', gap: 'space/xs', align: 'MIN' });
  names.appendChild(await txt(K, '새벽 세 시의 네온', 'text/h1', 'color/text/main'));
  names.appendChild(await txt(K, '김하늘', 'text/body', 'color/text/muted'));
  info.appendChild(names);
  names.layoutGrow = 1;
  info.appendChild(await glyph(K, '♥', 'color/brand/primary', 'text/h2'));
  screen.appendChild(info);
  fillCross(screen, info);

  const prog = AL({ name: 'progress', dir: 'V', gap: 'space/xs', align: 'MIN' });
  prog.appendChild(slider(K, MOBILE_WIDTH - SPACES['space/lg'] * 2, 0.35));
  const times = AL({ name: 'times', dir: 'H', gap: 'space/md', align: 'CENTER' });
  times.appendChild(await txt(K, '1:12', 'text/caption', 'color/text/muted'));
  const sp = figma.createFrame();
  sp.name = 'spacer';
  sp.resize(1, 1);
  sp.fills = [];
  times.appendChild(sp);
  sp.layoutGrow = 1;
  times.appendChild(await txt(K, '3:24', 'text/caption', 'color/text/muted'));
  prog.appendChild(times);
  fillCross(prog, times);
  screen.appendChild(prog);
  fillCross(screen, prog);

  const controls = AL({ name: 'controls', dir: 'H', gap: 'space/xl', align: 'CENTER' });
  controls.primaryAxisAlignItems = 'CENTER';
  for (const g of ['⟲', '|◀', '▶', '▶|', '⤮']) controls.appendChild(await glyph(K, g, 'color/text/main', 'text/h1'));
  screen.appendChild(controls);
  fillCross(screen, controls);

  const bottom = AL({ name: 'bottom', dir: 'H', gap: 'space/md', align: 'CENTER' });
  bottom.primaryAxisAlignItems = 'SPACE_BETWEEN';
  bottom.appendChild(slider(K, 160, 0.7));
  bottom.appendChild(await glyph(K, '☰'));
  screen.appendChild(bottom);
  fillCross(screen, bottom);
  return screen;
}

// ─────────────────────────────────────────────────────────────
// 9. main()
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
const SAMPLE_CARD = {
  title: '새벽 세 시의 네온',
  artist: '김하늘',
  isNew: true,
  coverToken: 'color/brand/primary',
};

async function main() {
  await resolveFont();
  const K = await buildTokens();
  TOKENS = K;

  const foundationPage = await ensurePage(PAGE_FOUNDATION);
  await figma.setCurrentPageAsync(foundationPage);

  if (CONFIG.rebuild) {
    const names = [];
    if (CONFIG.build.verifyGate) names.push(GATE_NAME);
    if (CONFIG.build.components) names.push(...COMPONENT_NAMES);
    clearByName(foundationPage, names);
  }

  let cursorY = 0;
  const place = (node) => {
    node.x = 0;
    node.y = cursorY;
    foundationPage.appendChild(node);
    cursorY += node.height + SPACES['space/2xl'];
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

  const B = CONFIG.build;
  const screenPlan = [
    // [프레임 이름, 켜짐 여부, 빌더, 페이지]
    ['PC/01-Home', B.homePC, buildHomePC, PAGE_PC],
    ['PC/02-Chart', B.chartPC, buildChartPC, PAGE_PC],
    ['PC/03-TrackDetail', B.trackDetailPC, buildTrackDetailPC, PAGE_PC],
    ['PC/03-TrackDetail-Locked', B.trackDetailLockedPC, buildTrackDetailLockedPC, PAGE_PC],
    ['PC/04-Search', B.searchPC, (k) => buildSearchPC(k, false), PAGE_PC],
    ['PC/04-Search-Empty', B.searchEmptyPC, (k) => buildSearchPC(k, true), PAGE_PC],
    ['PC/05-Auth-Login', B.authLoginPC, (k) => buildAuthPC(k, false), PAGE_PC],
    ['PC/05-Auth-Signup', B.authSignupPC, (k) => buildAuthPC(k, true), PAGE_PC],
    ['PC/06-Upload-Empty', B.uploadEmptyPC, (k) => buildUploadPC(k, 'empty'), PAGE_PC],
    ['PC/06-Upload-Filled', B.uploadFilledPC, (k) => buildUploadPC(k, 'filled'), PAGE_PC],
    ['PC/06-Upload-Progress', B.uploadProgressPC, (k) => buildUploadPC(k, 'progress'), PAGE_PC],
    ['PC/07-Library', B.libraryPC, (k) => buildLibraryPC(k, false), PAGE_PC],
    ['PC/07-Library-Empty', B.libraryEmptyPC, (k) => buildLibraryPC(k, true), PAGE_PC],
    ['PC/08-Playlist', B.playlistPC, (k) => buildPlaylistPC(k, false), PAGE_PC],
    ['PC/08-Playlist-TitleEdit', B.playlistEditPC, (k) => buildPlaylistPC(k, true), PAGE_PC],
    ['PC/09-Artist', B.artistPC, buildArtistPC, PAGE_PC],
    ['PC/QueuePanel', B.queuePanelPC, buildQueuePanelPC, PAGE_PC],
    ['M/01-Home', B.homeMobile, buildHomeMobile, PAGE_MOBILE],
    ['M/02-Chart', B.chartMobile, buildChartMobile, PAGE_MOBILE],
    ['M/03-TrackDetail', B.trackDetailMobile, buildTrackDetailMobile, PAGE_MOBILE],
    ['M/06-Upload', B.uploadMobile, buildUploadMobile, PAGE_MOBILE],
    ['M/07-Library', B.libraryMobile, buildLibraryMobile, PAGE_MOBILE],
    ['M/Player-Fullscreen', B.playerFullscreenMobile, buildPlayerFullscreenMobile, PAGE_MOBILE],
  ];
  const enabledScreens = screenPlan.filter(([, enabled]) => enabled);

  if (enabledScreens.length > 0) {
    const rendered = [];
    for (const pageName of [PAGE_PC, PAGE_MOBILE]) {
      const group = enabledScreens.filter(([, , , p]) => p === pageName);
      if (group.length === 0) continue;

      const page = await ensurePage(pageName);
      await figma.setCurrentPageAsync(page);
      if (CONFIG.rebuild) clearByName(page, group.map(([name]) => name));

      let cursorX = 0;
      for (const [name, , builder] of group) {
        console.log(`[screen] ${name} 렌더 시작`);
        const screen = await builder(K);
        screen.x = cursorX;
        screen.y = 0;
        page.appendChild(screen);
        cursorX += screen.width + SPACES['space/2xl'];
        rendered.push(screen);
      }
      figma.viewport.scrollAndZoomIntoView(page.children);
    }
    figma.closePlugin(`${rendered.length}개 프레임 렌더 완료: ${rendered.map((s) => s.name).join(', ')}`);
    return;
  }

  figma.viewport.scrollAndZoomIntoView(foundationPage.children);
  figma.closePlugin('Foundation 렌더 완료 — VERIFY 사각형으로 바인딩을 확인하세요.');
}

main().catch((e) => {
  console.error(e);
  figma.closePlugin(`실패: ${e.message}`);
});
