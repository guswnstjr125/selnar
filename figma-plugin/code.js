// Selnar Design Renderer
// 기준 문서: FIGMA_SPEC.md v1.2 §4(토큰) · §3.1(프레임) · §6(아키텍처)
//
// 이 파일은 Foundation 단계까지만 구현합니다.
// 화면 빌더(buildHome 등)는 §7-2 검증 게이트를 통과한 뒤 얹습니다.

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
    components: true,   // Badge / Button / Input / TrackRow / TrackCard
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
 * @param {object} o - name, dir('H'|'V'), gap, pad, w, h, fill, radius, align
 */
function AL(o = {}) {
  const f = figma.createFrame();
  f.name = o.name || 'Frame';
  f.layoutMode = o.dir === 'V' ? 'VERTICAL' : 'HORIZONTAL';
  f.primaryAxisSizingMode = o.primary || 'AUTO';
  f.counterAxisSizingMode = o.counter || 'AUTO';
  f.itemSpacing = o.gap != null ? o.gap : 0;
  f.counterAxisAlignItems = o.align || 'CENTER';
  f.clipsContent = false;

  const p = pad(o.pad);
  f.paddingTop = p[0];
  f.paddingRight = p[1];
  f.paddingBottom = p[2];
  f.paddingLeft = p[3];

  if (o.w) { f.resize(o.w, f.height); f.counterAxisSizingMode = 'FIXED'; }
  if (o.fill) f.fills = [solid(o.fill)];
  else f.fills = [];
  if (o.radius != null) f.cornerRadius = o.radius;

  return f;
}

/** pad(8) / pad([8,16]) / pad([8,16,8,16]) → [T,R,B,L] */
function pad(v) {
  if (v == null) return [0, 0, 0, 0];
  if (typeof v === 'number') return [v, v, v, v];
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
    dir: 'V', gap: 16, pad: 24, align: 'MIN',
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

/** Badge — suno / udio / other / new / 모델 버전 */
async function buildBadge(K, label, colorToken) {
  const f = AL({ name: `Badge/${label}`, dir: 'H', gap: 0, pad: [3, 8] });
  f.fills = [K.C(colorToken)];
  bindRadius(f, K.R('radius/sm'));

  // NEW·suno·udio 뱃지는 배경이 밝아 on-brand 계열 텍스트를 씁니다
  const dark = colorToken === 'color/badge/new';
  const t = await txt(K, label, 'text/badge', dark ? 'color/text/on-brand' : 'color/text/main');
  f.appendChild(t);
  return f;
}

/** Button — primary / ghost / pill */
async function buildButton(K, label, variant = 'primary') {
  const f = AL({ name: `Button/${variant}`, dir: 'H', gap: 8, pad: [10, 16] });

  if (variant === 'primary') {
    f.fills = [K.C('color/brand/primary')];
    bindRadius(f, K.R('radius/sm'));
  } else if (variant === 'pill') {
    f.fills = [K.C('color/bg/hover')];
    bindRadius(f, K.R('radius/full'));
  } else {
    f.fills = [];
    bindRadius(f, K.R('radius/sm'));
  }

  // 대비 미달 방지 — primary 위에는 흰색을 쓰지 않습니다 (FIGMA_SPEC §4.1)
  const colorToken = variant === 'primary' ? 'color/text/on-brand' : 'color/text/main';
  const t = await txt(K, label, 'text/bodyB', colorToken);
  f.appendChild(t);
  return f;
}

/** Input */
async function buildInput(K, placeholder, width = 320) {
  const f = AL({ name: 'Input', dir: 'H', gap: 8, pad: [10, 12], w: width });
  f.fills = [K.C('color/bg/elevated')];
  f.strokes = [K.C('color/border/subtle')];
  f.strokeWeight = 1;
  bindRadius(f, K.R('radius/sm'));

  const t = await txt(K, placeholder, 'text/body', 'color/text/disabled');
  t.layoutGrow = 1;
  f.appendChild(t);
  return f;
}

/** TrackRow — 차트 / 플레이리스트 / 창작자 채널 / 보관함 공용 */
async function buildTrackRow(K, o = {}) {
  const row = AL({
    name: 'TrackRow',
    dir: 'H', gap: 16, pad: [8, 12], w: o.width || 880,
    primary: 'FIXED',
  });
  row.fills = [];
  bindRadius(row, K.R('radius/sm'));

  if (o.rank != null) {
    const rank = await txt(K, String(o.rank), 'text/bodyB', 'color/text/muted');
    rank.textAlignHorizontal = 'CENTER';
    rank.resize(28, rank.height);
    row.appendChild(rank);
  }

  const cover = figma.createRectangle();
  cover.name = 'cover';
  cover.resize(40, 40);
  thumbFill(cover, o.coverHex || '#10B981');
  bindRadius(cover, K.R('radius/sm'));
  row.appendChild(cover);

  const meta = AL({ name: 'meta', dir: 'V', gap: 2, align: 'MIN' });
  meta.layoutGrow = 1;

  const titleLine = AL({ name: 'titleLine', dir: 'H', gap: 6 });
  titleLine.appendChild(await txt(K, o.title || '무제', 'text/bodyB', 'color/text/main'));
  if (o.isNew) titleLine.appendChild(await buildBadge(K, 'NEW', 'color/badge/new'));
  meta.appendChild(titleLine);

  meta.appendChild(await txt(K, o.artist || '창작자', 'text/caption', 'color/text/muted'));
  row.appendChild(meta);

  if (o.tool) {
    const toolToken =
      o.tool === 'Suno' ? 'color/badge/suno' :
      o.tool === 'Udio' ? 'color/badge/udio' : 'color/badge/other';
    row.appendChild(await buildBadge(K, o.tool, toolToken));
  }

  row.appendChild(await txt(K, o.genre || '—', 'text/caption', 'color/text/muted'));
  row.appendChild(await txt(K, o.duration || '0:00', 'text/caption', 'color/text/muted'));
  row.appendChild(await txt(K, `♥ ${o.likes != null ? o.likes : 0}`, 'text/caption', 'color/text/muted'));

  return row;
}

/** TrackCard — 홈 가로 스크롤 / 그리드 / 창작자 대표곡 */
async function buildTrackCard(K, o = {}) {
  const card = AL({ name: 'TrackCard', dir: 'V', gap: 8, pad: 12, w: 180, align: 'MIN' });
  card.fills = [K.C('color/bg/surface')];
  bindRadius(card, K.R('radius/md'));

  const cover = figma.createRectangle();
  cover.name = 'cover';
  cover.resize(156, 156);
  thumbFill(cover, o.coverHex || '#7C3AED');
  bindRadius(cover, K.R('radius/md'));
  card.appendChild(cover);

  const titleLine = AL({ name: 'titleLine', dir: 'H', gap: 6 });
  titleLine.appendChild(await txt(K, o.title || '무제', 'text/bodyB', 'color/text/main'));
  if (o.isNew) titleLine.appendChild(await buildBadge(K, 'NEW', 'color/badge/new'));
  card.appendChild(titleLine);

  card.appendChild(await txt(K, o.artist || '창작자', 'text/caption', 'color/text/muted'));
  return card;
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

async function main() {
  await resolveFont();
  const K = await buildTokens();

  const page = await ensurePage(PAGE_FOUNDATION);
  await figma.setCurrentPageAsync(page);

  if (CONFIG.rebuild) {
    clearByName(page, ['VERIFY — 변수 값을 바꿔 따라오는지 확인', 'Components']);
  }

  let cursorY = 0;

  if (CONFIG.build.verifyGate) {
    const gate = await buildVerifyGate(K);
    gate.x = 0;
    gate.y = cursorY;
    page.appendChild(gate);
    cursorY += gate.height + 80;
  }

  if (CONFIG.build.components) {
    const shelf = AL({ name: 'Components', dir: 'V', gap: 32, pad: 32, align: 'MIN' });
    shelf.fills = [K.C('color/bg/base')];
    bindRadius(shelf, K.R('radius/lg'));

    // Badge 5종
    const badges = AL({ name: 'Badges', dir: 'H', gap: 8 });
    badges.appendChild(await buildBadge(K, 'Suno', 'color/badge/suno'));
    badges.appendChild(await buildBadge(K, 'Udio', 'color/badge/udio'));
    badges.appendChild(await buildBadge(K, '기타', 'color/badge/other'));
    badges.appendChild(await buildBadge(K, 'NEW', 'color/badge/new'));
    badges.appendChild(await buildBadge(K, 'v4.5', 'color/badge/other'));
    shelf.appendChild(badges);

    // Button 3종
    const buttons = AL({ name: 'Buttons', dir: 'H', gap: 12 });
    buttons.appendChild(await buildButton(K, '곡 업로드', 'primary'));
    buttons.appendChild(await buildButton(K, '프롬프트 복사', 'ghost'));
    buttons.appendChild(await buildButton(K, '종합 TOP 100', 'pill'));
    shelf.appendChild(buttons);

    // Input
    shelf.appendChild(await buildInput(K, '곡명, 창작자, 프롬프트 키워드 검색', 420));

    // TrackRow 2종
    const rows = AL({ name: 'TrackRows', dir: 'V', gap: 4, align: 'MIN' });
    rows.appendChild(await buildTrackRow(K, {
      rank: 1, title: '새벽 세 시의 네온', artist: '김하늘',
      tool: 'Suno', genre: 'Synthpop', duration: '3:24', likes: 182, isNew: true,
    }));
    rows.appendChild(await buildTrackRow(K, {
      rank: 2, title: '비 오는 날의 발라드', artist: '이준서',
      tool: 'Udio', genre: 'Ballad', duration: '4:02', likes: 147,
    }));
    shelf.appendChild(rows);

    // TrackCard 2종
    const cards = AL({ name: 'TrackCards', dir: 'H', gap: 16 });
    cards.appendChild(await buildTrackCard(K, {
      title: '새벽 세 시의 네온', artist: '김하늘', isNew: true, coverHex: '#10B981',
    }));
    cards.appendChild(await buildTrackCard(K, {
      title: '비 오는 날의 발라드', artist: '이준서', coverHex: '#7C3AED',
    }));
    shelf.appendChild(cards);

    shelf.x = 0;
    shelf.y = cursorY;
    page.appendChild(shelf);
  }

  figma.viewport.scrollAndZoomIntoView(page.children);
  figma.closePlugin('Foundation 렌더 완료 — VERIFY 사각형으로 바인딩을 확인하세요.');
}

main().catch((e) => {
  console.error(e);
  figma.closePlugin(`실패: ${e.message}`);
});
