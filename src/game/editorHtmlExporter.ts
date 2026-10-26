import { AUTOTILE_BRUSHES } from './autotile';
import { EDITOR_THEMES, PREFAB_STAMPS, THEMATIC_TILES } from './editorCatalog';
import { SpriteBank } from './spriteBank';
import { LangCode, WorldBundle } from './types';

function imageToDataUrl(img: HTMLImageElement | HTMLCanvasElement): string {
  if (img instanceof HTMLCanvasElement) {
    return img.toDataURL('image/png');
  }
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  return c.toDataURL('image/png');
}

function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/<\//g, '<\\/');
}

export function buildEditorHtmlDocument(options: {
  embeddedWorldJson: string | null;
  embeddedTilesetB64: string | null;
  lang: LangCode;
}): string {
  const catalogPayload = safeJsonForScript({
    themes: EDITOR_THEMES,
    autotiles: AUTOTILE_BRUSHES,
    stamps: PREFAB_STAMPS,
    tiles: THEMATIC_TILES,
  });

  const worldScript = options.embeddedWorldJson
    ? `window.__EMBEDDED_WORLD__ = ${options.embeddedWorldJson};`
    : `window.__EMBEDDED_WORLD__ = null;`;

  const tilesetScript = options.embeddedTilesetB64
    ? `window.__EMBEDDED_TILESET__ = ${JSON.stringify(options.embeddedTilesetB64)};`
    : `window.__EMBEDDED_TILESET__ = null;`;

  return `<!DOCTYPE html>
<html lang="${options.lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ethynd — Éditeur de Niveaux HTML Autonome (Auto-Tiling & Palette Thématique)</title>
  <style>
    :root {
      --bg: #0b0e14;
      --panel: #141a24;
      --panel-2: #0f141d;
      --border: #1e293b;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --amber: #f59e0b;
      --amber-hi: #fbbf24;
      --sky: #38bdf8;
      --rose: #fb7185;
      --emerald: #34d399;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
      font-size: 13px;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 20px;
      background: var(--panel);
      border-bottom: 1px solid var(--border);
    }
    header h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }
    .sub {
      color: var(--muted);
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    button, select, input[type="number"] {
      font: inherit;
      font-size: 12px;
      border-radius: 6px;
      border: 1px solid #334155;
      background: var(--panel-2);
      color: var(--text);
      padding: 6px 10px;
      cursor: pointer;
      white-space: nowrap;
    }
    button:hover { border-color: #64748b; color: #fff; }
    button.active, button.primary {
      background: var(--amber);
      border-color: var(--amber-hi);
      color: #090d14;
      font-weight: 700;
    }
    button.secondary-active {
      background: #1e293b;
      border-color: var(--amber);
      color: var(--amber-hi);
      font-weight: 600;
    }
    button.danger {
      background: rgba(244, 63, 94, 0.14);
      border-color: rgba(244, 63, 94, 0.45);
      color: #fecdd3;
    }
    button:disabled { opacity: 0.4; cursor: not-allowed; }
    .workspace {
      display: grid;
      grid-template-columns: 330px 1fr;
      gap: 16px;
      padding: 16px 20px;
      align-items: start;
    }
    @media (max-width: 1024px) {
      .workspace { grid-template-columns: 1fr; }
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 14px;
    }
    .card h2 {
      margin: 0 0 10px 0;
      font-size: 13px;
      font-weight: 700;
      color: #fff;
    }
    .pixel {
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
    .theme-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 10px;
    }
    .theme-tabs button {
      padding: 4px 8px;
      font-size: 11px;
    }
    .palette-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      max-height: 360px;
      overflow-y: auto;
      padding-right: 2px;
    }
    .pal-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      padding: 7px 5px;
      border-radius: 8px;
      background: var(--panel-2);
      border: 1px solid #1e293b;
      cursor: pointer;
      text-align: center;
    }
    .pal-card:hover { border-color: #475569; }
    .pal-card.selected {
      border-color: var(--amber-hi);
      background: rgba(245, 158, 11, 0.12);
    }
    .pal-card span {
      font-size: 10.5px;
      line-height: 1.2;
      color: #cbd5e1;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .shape-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      border-radius: 8px;
      background: var(--panel-2);
      border: 1px solid var(--border);
      margin-bottom: 10px;
    }
    .map-viewport {
      overflow: auto;
      max-height: 68vh;
      background: #070a10;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .tileset-drawer {
      overflow: auto;
      max-height: 250px;
      background: #070a10;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px;
    }
    .notice {
      margin: 0 20px;
      margin-top: 12px;
      padding: 8px 14px;
      border-radius: 8px;
      background: rgba(245, 158, 11, 0.14);
      border: 1px solid rgba(245, 158, 11, 0.45);
      color: #fde68a;
      display: none;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Ethynd — Éditeur de Niveaux HTML (11 Cartes · Auto-Tiling · Gamebuino AKA)</h1>
      <div class="sub" id="statusHeader">Chargement des ressources cartographiques…</div>
    </div>
    <div class="row">
      <button type="button" class="primary" id="btnExportJson">Exporter world_expanded.json</button>
      <button type="button" id="btnExportAkaBin">Exporter WORLD.BIN (Gamebuino AKA)</button>
      <button type="button" id="btnImportJson">Importer JSON…</button>
      <input type="file" id="fileJson" accept=".json,application/json" style="display:none" />
      <input type="file" id="fileTileset" accept="image/png" style="display:none" />
    </div>
  </header>

  <div class="notice" id="noticeBar">
    <span id="noticeText"></span>
    <button type="button" onclick="document.getElementById('noticeBar').style.display='none'">Fermer</button>
  </div>

  <div class="workspace">
    <!-- COLONNE GAUCHE : SÉLECTION CARTE + APERÇU FORME + MENU PAR NOM + PALETTE PAR THÈME -->
    <aside>
      <div class="card">
        <h2>1. Carte active (11 régions)</h2>
        <select id="mapSelect" style="width:100%; margin-bottom:8px;"></select>
        <div class="row" style="justify-content:space-between;">
          <button type="button" id="btnRepairAutotile">Réparer Auto-Tiling Carte</button>
          <button type="button" class="danger" id="btnResetMap">Réinitialiser</button>
        </div>
      </div>

      <div class="card">
        <h2>2. Choix par nom & Aperçu de la forme</h2>
        <label class="sub" style="display:block; margin-bottom:4px;">Menu rapide par nom :</label>
        <select id="namedCatalogSelect" style="width:100%; margin-bottom:10px;"></select>

        <div class="shape-box">
          <canvas id="selectedShapeCanvas" class="pixel" width="64" height="64"></canvas>
          <div>
            <div id="selectedShapeTitle" style="font-weight:700; color:#fff; margin-bottom:3px;">—</div>
            <div id="selectedShapeMeta" class="sub">—</div>
          </div>
        </div>

        <h2 style="margin-top:12px;">3. Palette visuelle classée par thème</h2>
        <div class="theme-tabs" id="themeTabs"></div>
        <div class="palette-grid" id="paletteGrid"></div>
      </div>
    </aside>

    <!-- COLONNE DROITE : BARRE D'OUTILS + CANVAS CARTE + PLANCHE TILESET COMPLÈTE -->
    <main>
      <div class="card">
        <div class="row" style="justify-content:space-between; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid var(--border);">
          <div class="row" id="toolBar">
            <button type="button" data-tool="autotile" class="active">Auto-Tiling (Pinceau)</button>
            <button type="button" data-tool="autotile_rect">Auto-Tiling (Zone Rect.)</button>
            <button type="button" data-tool="stamp">Préfabriqué</button>
            <button type="button" data-tool="brush">Tuile Unique</button>
            <button type="button" data-tool="eyedropper">Pipette</button>
            <button type="button" data-tool="eraser">Gomme</button>
          </div>
          <div class="row">
            <button type="button" id="btnUndo" disabled>Annuler (0)</button>
            <select id="zoomSelect">
              <option value="16">Zoom 50% (16px)</option>
              <option value="24" selected>Zoom 75% (24px)</option>
              <option value="32">Zoom 100% (32px · Natif AKA)</option>
              <option value="48">Zoom 150% (48px)</option>
            </select>
          </div>
        </div>

        <div class="row" style="justify-content:space-between; margin-bottom:10px;">
          <div class="row">
            <span class="sub">Couche :</span>
            <button type="button" data-layer="0" class="layer-btn">L0 Sol</button>
            <button type="button" data-layer="1" class="layer-btn secondary-active">L1 Tapis/Ponts</button>
            <button type="button" data-layer="2" class="layer-btn">L2 Murs/Forêt</button>
            <button type="button" data-layer="3" class="layer-btn">L3 Canopée</button>
            <span class="sub" style="margin-left:8px;">ID Tuile :</span>
            <input type="number" id="tileIdInput" min="0" max="3799" value="642" style="width:74px;" />
            <label class="sub" style="display:flex;align-items:center;gap:4px;cursor:pointer;">
              <input type="checkbox" id="chkAutoErase" /> Gomme Auto-Tile
            </label>
          </div>

          <div class="row">
            <button type="button" id="btnToggleCanopy" class="secondary-active">L3 Canopée</button>
            <button type="button" id="btnToggleCollisions">Collisions 1-bit</button>
            <button type="button" id="btnToggleDoors" class="secondary-active">Portes</button>
            <button type="button" id="btnToggleGrid" class="secondary-active">Grille</button>
          </div>
        </div>

        <div class="map-viewport">
          <canvas id="mapCanvas" class="pixel"></canvas>
        </div>

        <div class="row" style="justify-content:space-between; margin-top:8px;">
          <span class="sub" id="hintFooter">Astuce : l’outil Auto-Tiling calcule automatiquement tous les coins externes, bords et coins rentrants des forêts, chemins, lacs, dallages et tapis.</span>
          <span class="sub" id="coordFooter">(0, 0)</span>
        </div>
      </div>

      <div class="card">
        <div class="row" style="justify-content:space-between; margin-bottom:8px;">
          <h2 style="margin:0;">4. Planche complète tileset.png (40 colonnes — cliquez une tuile pour voir sa forme et la peindre)</h2>
          <span class="sub" id="tilesetInfo">#642</span>
        </div>
        <div class="tileset-drawer">
          <canvas id="tilesetCanvas" class="pixel"></canvas>
        </div>
      </div>
    </main>
  </div>

  <script>
    ${worldScript}
    ${tilesetScript}
    const CATALOG = ${catalogPayload};

    let world = null;
    let defaultWorld = null;
    let tilesetImg = new Image();
    let tilesetReady = false;
    let activeMapIdx = 0;
    let activeTheme = 'autotile';
    let tool = 'autotile';
    let activeAutotile = 'forest';
    let activeStamp = CATALOG.stamps[0];
    let activeLayer = 1;
    let selectedTileId = 642;
    let tilePx = 24;
    let showCanopy = true;
    let showCollisions = false;
    let showDoors = true;
    let showGrid = true;
    let hoverCell = null;
    let dragStartCell = null;
    let isPointerDown = false;
    let lastPaintedKey = null;
    let undoStack = [];
    let maskCanvases = new Map();

    function notify(msg) {
      const bar = document.getElementById('noticeBar');
      document.getElementById('noticeText').textContent = msg;
      bar.style.display = 'flex';
    }

    function resolveAutotileId(zone, n, s, w, e, nw, ne, sw, se) {
      if (zone === 'forest') {
        if (!n && !w) return 645;
        if (!n && !e) return 646;
        if (!s && !w) return 685;
        if (!s && !e) return 686;
        if (!n) return 725;
        if (!s) return 765;
        if (!w) return 726;
        if (!e) return 727;
        if (!nw && !se) return 647;
        if (!ne && !sw) return 687;
        if (!nw) return 643;
        if (!ne) return 644;
        if (!sw) return 763;
        if (!se) return 764;
        return 642;
      }
      if (zone === 'road') {
        if (!n && !w) return 120;
        if (!n && !e) return 122;
        if (!s && !w) return 200;
        if (!s && !e) return 202;
        if (!n) return 121;
        if (!s) return 201;
        if (!w) return 160;
        if (!e) return 162;
        if (!se) return 240;
        if (!sw) return 241;
        if (!ne) return 280;
        if (!nw) return 281;
        return 161;
      }
      if (zone === 'water') {
        if (!n && !w) return 242;
        if (!n && !e) return 244;
        if (!s && !w) return 322;
        if (!s && !e) return 324;
        if (!n) return 243;
        if (!s) return 323;
        if (!w) return 282;
        if (!e) return 284;
        if (!se) return 362;
        if (!sw) return 363;
        if (!ne) return 402;
        if (!nw) return 403;
        return 283;
      }
      if (zone === 'stone') {
        if (!n && !w) return 22;
        if (!n && !e) return 24;
        if (!s && !w) return 102;
        if (!s && !e) return 104;
        if (!n) return 23;
        if (!s) return 103;
        if (!w) return 62;
        if (!e) return 64;
        return 63;
      }
      if (!n && !w) return 2120;
      if (!n && !e) return 2122;
      if (!s && !w) return 2200;
      if (!s && !e) return 2202;
      if (!n) return 2121;
      if (!s) return 2201;
      if (!w) return 2160;
      if (!e) return 2162;
      return 2161;
    }

    function getAutotileDef(zone) {
      return CATALOG.autotiles.find(a => a.id === zone) || CATALOG.autotiles[0];
    }

    function applyAutotileRect(map, zone, ax, ay, bx, by, erase) {
      const def = getAutotileDef(zone);
      const set = new Set(def.memberTiles);
      const layer = def.targetLayer;
      const x0 = Math.max(0, Math.min(ax, bx));
      const y0 = Math.max(0, Math.min(ay, by));
      const x1 = Math.min(map.w - 1, Math.max(ax, bx));
      const y1 = Math.min(map.h - 1, Math.max(ay, by));
      const seed = resolveAutotileId(zone, true, true, true, true, true, true, true, true);

      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          if (erase) {
            if (layer === 0) {
              if (set.has(map.layers[0][y][x])) map.layers[0][y][x] = 0;
            } else {
              if (set.has(map.layers[layer][y][x])) map.layers[layer][y][x] = -1;
              if (zone === 'forest' && set.has(map.layers[3][y][x])) map.layers[3][y][x] = -1;
            }
          } else {
            if (def.groundTile !== undefined && map.layers[0][y][x] < 0) map.layers[0][y][x] = def.groundTile;
            map.layers[layer][y][x] = seed;
            if (zone === 'forest') {
              if (set.has(map.layers[1][y][x])) map.layers[1][y][x] = -1;
              if (set.has(map.layers[3][y][x])) map.layers[3][y][x] = -1;
            }
          }
        }
      }

      const isM = (x, y) => (x < 0 || x >= map.w || y < 0 || y >= map.h) ? true : set.has(map.layers[layer][y][x]);
      const rx0 = Math.max(0, x0 - 1), ry0 = Math.max(0, y0 - 1);
      const rx1 = Math.min(map.w - 1, x1 + 1), ry1 = Math.min(map.h - 1, y1 + 1);
      const updates = [];
      for (let y = ry0; y <= ry1; y++) {
        for (let x = rx0; x <= rx1; x++) {
          if (!set.has(map.layers[layer][y][x])) continue;
          updates.push([x, y, resolveAutotileId(
            zone,
            isM(x, y - 1), isM(x, y + 1), isM(x - 1, y), isM(x + 1, y),
            isM(x - 1, y - 1), isM(x + 1, y - 1), isM(x - 1, y + 1), isM(x + 1, y + 1)
          )]);
        }
      }
      for (const [ux, uy, tid] of updates) map.layers[layer][uy][ux] = tid;
    }

    function buildMasks() {
      maskCanvases.clear();
      if (!world || !world.masks) return;
      for (const [k, b64] of Object.entries(world.masks)) {
        const bin = atob(b64);
        const c = document.createElement('canvas');
        c.width = 32; c.height = 32;
        const ctx = c.getContext('2d');
        const img = ctx.createImageData(32, 32);
        for (let y = 0; y < 32; y++) {
          for (let x = 0; x < 32; x++) {
            const bit = (bin.charCodeAt(y * 4 + (x >> 3)) >> (7 - (x & 7))) & 1;
            if (bit) {
              const p = (y * 32 + x) * 4;
              img.data[p] = 244; img.data[p+1] = 63; img.data[p+2] = 94; img.data[p+3] = 140;
            }
          }
        }
        ctx.putImageData(img, 0, 0);
        maskCanvases.set(Number(k), c);
      }
    }

    function drawChecker(ctx, w, h, step) {
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          ctx.fillStyle = (((x / step + y / step) & 1) === 0) ? '#0d131f' : '#162032';
          ctx.fillRect(x, y, step, step);
        }
      }
    }

    function drawTileId(ctx, tid, dx, dy, sz) {
      if (!tilesetReady || tid < 0) return;
      const cols = world ? world.tileCols : 40;
      const sx = (tid % cols) * 32;
      const sy = Math.floor(tid / cols) * 32;
      ctx.drawImage(tilesetImg, sx, sy, 32, 32, dx, dy, sz, sz);
    }

    function renderShapeThumb(canvas, desc, maxPx) {
      const ctx = canvas.getContext('2d');
      let gw = 1, gh = 1;
      if (desc.kind === 'autotile') { gw = 3; gh = 3; }
      else if (desc.kind === 'stamp') { gw = desc.stamp.w; gh = desc.stamp.h; }
      const cell = Math.max(12, Math.min(32, Math.floor(maxPx / Math.max(gw, gh))));
      canvas.width = gw * cell;
      canvas.height = gh * cell;
      ctx.imageSmoothingEnabled = false;
      drawChecker(ctx, canvas.width, canvas.height, Math.max(4, cell >> 1));

      if (desc.kind === 'autotile') {
        for (let y = 0; y < 3; y++) {
          for (let x = 0; x < 3; x++) {
            if (desc.brush.groundTile !== undefined) drawTileId(ctx, desc.brush.groundTile, x * cell, y * cell, cell);
            drawTileId(ctx, desc.brush.preview3x3[y][x], x * cell, y * cell, cell);
          }
        }
      } else if (desc.kind === 'stamp') {
        const sorted = [...desc.stamp.cells].sort((a, b) => a.layer - b.layer);
        for (const c of sorted) {
          if (c.tid >= 0) drawTileId(ctx, c.tid, c.dx * cell, c.dy * cell, cell);
        }
      } else {
        drawTileId(ctx, desc.tid, 0, 0, cell);
      }
    }

    function updateSelectedShapeBox() {
      const c = document.getElementById('selectedShapeCanvas');
      const titleEl = document.getElementById('selectedShapeTitle');
      const metaEl = document.getElementById('selectedShapeMeta');
      if (tool === 'autotile' || tool === 'autotile_rect') {
        const b = getAutotileDef(activeAutotile);
        renderShapeThumb(c, { kind: 'autotile', brush: b }, 66);
        titleEl.textContent = b.nameFr;
        metaEl.textContent = 'Couche L' + b.targetLayer + ' · Auto-raccord 8 voisins';
      } else if (tool === 'stamp') {
        renderShapeThumb(c, { kind: 'stamp', stamp: activeStamp }, 66);
        titleEl.textContent = activeStamp.nameFr;
        metaEl.textContent = 'Empreinte ' + activeStamp.w + '×' + activeStamp.h + ' tuiles';
      } else {
        renderShapeThumb(c, { kind: 'raw', tid: selectedTileId }, 64);
        titleEl.textContent = 'Tuile #' + selectedTileId;
        metaEl.textContent = 'Couche L' + activeLayer + (maskCanvases.has(selectedTileId) ? ' · Collision solide' : ' · Praticable');
      }
    }

    function rebuildPaletteUI() {
      const tabsEl = document.getElementById('themeTabs');
      tabsEl.innerHTML = '';
      for (const th of CATALOG.themes) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = th.nameFr;
        if (th.id === activeTheme) btn.className = 'secondary-active';
        btn.onclick = () => { activeTheme = th.id; rebuildPaletteUI(); };
        tabsEl.appendChild(btn);
      }

      const grid = document.getElementById('paletteGrid');
      grid.innerHTML = '';

      if (activeTheme === 'autotile') {
        for (const b of CATALOG.autotiles) {
          const card = document.createElement('div');
          card.className = 'pal-card' + ((tool === 'autotile' || tool === 'autotile_rect') && activeAutotile === b.id ? ' selected' : '');
          const cnv = document.createElement('canvas');
          cnv.className = 'pixel';
          renderShapeThumb(cnv, { kind: 'autotile', brush: b }, 54);
          const lbl = document.createElement('span');
          lbl.textContent = b.nameFr;
          card.appendChild(cnv);
          card.appendChild(lbl);
          card.onclick = () => {
            activeAutotile = b.id;
            if (tool !== 'autotile_rect') setTool('autotile');
            rebuildPaletteUI();
            updateSelectedShapeBox();
          };
          grid.appendChild(card);
        }
      }

      for (const st of CATALOG.stamps.filter(s => s.theme === activeTheme)) {
        const card = document.createElement('div');
        card.className = 'pal-card' + (tool === 'stamp' && activeStamp.id === st.id ? ' selected' : '');
        const cnv = document.createElement('canvas');
        cnv.className = 'pixel';
        renderShapeThumb(cnv, { kind: 'stamp', stamp: st }, 54);
        const lbl = document.createElement('span');
        lbl.textContent = st.nameFr;
        card.appendChild(cnv);
        card.appendChild(lbl);
        card.onclick = () => {
          activeStamp = st;
          setTool('stamp');
          rebuildPaletteUI();
          updateSelectedShapeBox();
        };
        grid.appendChild(card);
      }

      for (const ti of CATALOG.tiles.filter(t => t.theme === activeTheme)) {
        const card = document.createElement('div');
        card.className = 'pal-card' + (tool === 'brush' && selectedTileId === ti.tid ? ' selected' : '');
        const cnv = document.createElement('canvas');
        cnv.className = 'pixel';
        renderShapeThumb(cnv, { kind: 'raw', tid: ti.tid }, 44);
        const lbl = document.createElement('span');
        lbl.textContent = ti.nameFr;
        card.appendChild(cnv);
        card.appendChild(lbl);
        card.onclick = () => {
          selectedTileId = ti.tid;
          activeLayer = ti.recommendedLayer;
          document.getElementById('tileIdInput').value = String(selectedTileId);
          syncLayerButtons();
          setTool('brush');
          rebuildPaletteUI();
          renderTilesetSheet();
          updateSelectedShapeBox();
        };
        grid.appendChild(card);
      }
    }

    function populateNamedDropdown() {
      const sel = document.getElementById('namedCatalogSelect');
      sel.innerHTML = '';
      const gAuto = document.createElement('optgroup');
      gAuto.label = 'Zones Auto-Tilées (Coins Automatiques)';
      for (const b of CATALOG.autotiles) {
        const o = document.createElement('option');
        o.value = 'auto:' + b.id;
        o.textContent = b.nameFr;
        gAuto.appendChild(o);
      }
      sel.appendChild(gAuto);

      const gStamp = document.createElement('optgroup');
      gStamp.label = 'Préfabriqués Multi-Tuiles';
      for (const st of CATALOG.stamps) {
        const o = document.createElement('option');
        o.value = 'stamp:' + st.id;
        o.textContent = st.nameFr;
        gStamp.appendChild(o);
      }
      sel.appendChild(gStamp);

      const gTile = document.createElement('optgroup');
      gTile.label = 'Tuiles Thématiques';
      for (const ti of CATALOG.tiles) {
        const o = document.createElement('option');
        o.value = 'tile:' + ti.id;
        o.textContent = ti.nameFr;
        gTile.appendChild(o);
      }
      sel.appendChild(gTile);

      sel.onchange = () => {
        const [kind, id] = sel.value.split(':');
        if (kind === 'auto') {
          activeAutotile = id;
          activeTheme = 'autotile';
          if (tool !== 'autotile_rect') setTool('autotile');
        } else if (kind === 'stamp') {
          const found = CATALOG.stamps.find(s => s.id === id);
          if (found) { activeStamp = found; activeTheme = found.theme; setTool('stamp'); }
        } else if (kind === 'tile') {
          const found = CATALOG.tiles.find(t => t.id === id);
          if (found) {
            selectedTileId = found.tid;
            activeLayer = found.recommendedLayer;
            activeTheme = found.theme;
            document.getElementById('tileIdInput').value = String(selectedTileId);
            syncLayerButtons();
            setTool('brush');
            renderTilesetSheet();
          }
        }
        rebuildPaletteUI();
        updateSelectedShapeBox();
      };
    }

    function setTool(nextTool) {
      tool = nextTool;
      document.querySelectorAll('#toolBar button').forEach(b => {
        b.className = b.dataset.tool === tool ? 'active' : '';
      });
      updateSelectedShapeBox();
      renderMap();
    }

    function syncLayerButtons() {
      document.querySelectorAll('.layer-btn').forEach(b => {
        b.className = 'layer-btn' + (Number(b.dataset.layer) === activeLayer ? ' secondary-active' : '');
      });
    }

    function renderTilesetSheet() {
      if (!tilesetReady || !world) return;
      const c = document.getElementById('tilesetCanvas');
      const cols = world.tileCols || 40;
      const rows = Math.floor(tilesetImg.height / 32);
      c.width = cols * 16;
      c.height = rows * 16;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#090d14';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(tilesetImg, 0, 0, cols * 32, rows * 32, 0, 0, cols * 16, rows * 16);
      const sx = (selectedTileId % cols) * 16;
      const sy = Math.floor(selectedTileId / cols) * 16;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, 14, 14);
      document.getElementById('tilesetInfo').textContent = '#' + selectedTileId + ' (col ' + (selectedTileId % cols) + ', lig ' + Math.floor(selectedTileId / cols) + ')';
    }

    function renderMap() {
      if (!world || !tilesetReady) return;
      const map = world.maps[activeMapIdx];
      const c = document.getElementById('mapCanvas');
      c.width = map.w * tilePx;
      c.height = map.h * tilePx;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = 'rgb(' + map.bgColor[0] + ',' + map.bgColor[1] + ',' + map.bgColor[2] + ')';
      ctx.fillRect(0, 0, c.width, c.height);

      for (let y = 0; y < map.h; y++) {
        for (let x = 0; x < map.w; x++) {
          for (let l = 0; l <= 2; l++) {
            const tid = map.layers[l][y][x];
            if (tid >= 0) drawTileId(ctx, tid, x * tilePx, y * tilePx, tilePx);
          }
        }
      }
      if (showCanopy) {
        for (let y = 0; y < map.h; y++) {
          for (let x = 0; x < map.w; x++) {
            const tid = map.layers[3][y][x];
            if (tid >= 0) drawTileId(ctx, tid, x * tilePx, y * tilePx, tilePx);
          }
        }
      }
      if (showCollisions) {
        for (let y = 0; y < map.h; y++) {
          for (let x = 0; x < map.w; x++) {
            for (let l = 0; l <= 2; l++) {
              const ov = maskCanvases.get(map.layers[l][y][x]);
              if (ov) ctx.drawImage(ov, 0, 0, 32, 32, x * tilePx, y * tilePx, tilePx, tilePx);
            }
          }
        }
      }
      if (showGrid) {
        ctx.strokeStyle = 'rgba(148,163,184,0.16)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= map.w; x++) { ctx.beginPath(); ctx.moveTo(x * tilePx + 0.5, 0); ctx.lineTo(x * tilePx + 0.5, c.height); ctx.stroke(); }
        for (let y = 0; y <= map.h; y++) { ctx.beginPath(); ctx.moveTo(0, y * tilePx + 0.5); ctx.lineTo(c.width, y * tilePx + 0.5); ctx.stroke(); }
      }
      if (showDoors) {
        const sc = tilePx / 32;
        map.doors.forEach((d, idx) => {
          const dx = Math.round(d.x * sc), dy = Math.round(d.y * sc);
          const dw = Math.max(10, Math.round(d.w * sc)), dh = Math.max(10, Math.round(d.h * sc));
          ctx.fillStyle = d.reqFlag ? 'rgba(244,63,94,0.28)' : 'rgba(56,189,248,0.28)';
          ctx.fillRect(dx, dy, dw, dh);
          ctx.strokeStyle = d.reqFlag ? '#fb7185' : '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(dx, dy, dw, dh);
        });
      }

      if (hoverCell) {
        if (tool === 'autotile_rect' && dragStartCell) {
          const x0 = Math.min(dragStartCell.tx, hoverCell.tx), y0 = Math.min(dragStartCell.ty, hoverCell.ty);
          const x1 = Math.max(dragStartCell.tx, hoverCell.tx), y1 = Math.max(dragStartCell.ty, hoverCell.ty);
          ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
          ctx.fillRect(x0 * tilePx, y0 * tilePx, (x1 - x0 + 1) * tilePx, (y1 - y0 + 1) * tilePx);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.strokeRect(x0 * tilePx + 1, y0 * tilePx + 1, (x1 - x0 + 1) * tilePx - 2, (y1 - y0 + 1) * tilePx - 2);
        } else {
          const fw = tool === 'stamp' ? activeStamp.w : 1;
          const fh = tool === 'stamp' ? activeStamp.h : 1;
          ctx.strokeStyle = tool === 'eraser' ? '#fb7185' : '#fbbf24';
          ctx.lineWidth = 2;
          ctx.strokeRect(hoverCell.tx * tilePx + 1, hoverCell.ty * tilePx + 1, fw * tilePx - 2, fh * tilePx - 2);
        }
      }
    }

    function pushUndo() {
      undoStack.push(JSON.parse(JSON.stringify(world)));
      if (undoStack.length > 30) undoStack.shift();
      const btn = document.getElementById('btnUndo');
      btn.disabled = false;
      btn.textContent = 'Annuler (' + undoStack.length + ')';
    }

    function applyCellAction(tx, ty, firstClick) {
      const map = world.maps[activeMapIdx];
      if (tool === 'eyedropper') {
        for (const l of [3, 2, 1, 0]) {
          const tid = map.layers[l][ty][tx];
          if (tid >= 0) {
            selectedTileId = tid;
            activeLayer = l;
            document.getElementById('tileIdInput').value = String(tid);
            syncLayerButtons();
            setTool('brush');
            renderTilesetSheet();
            notify('Tuile #' + tid + ' échantillonnée sur L' + l + '.');
            return;
          }
        }
        return;
      }
      if (firstClick) pushUndo();
      const autoErase = document.getElementById('chkAutoErase').checked;
      if (tool === 'autotile') {
        applyAutotileRect(map, activeAutotile, tx, ty, tx, ty, autoErase);
      } else if (tool === 'stamp') {
        for (const c of activeStamp.cells) {
          const cx = tx + c.dx, cy = ty + c.dy;
          if (cx >= 0 && cy >= 0 && cx < map.w && cy < map.h) map.layers[c.layer][cy][cx] = c.tid;
        }
      } else if (tool === 'brush') {
        map.layers[activeLayer][ty][tx] = selectedTileId;
      } else if (tool === 'eraser') {
        map.layers[activeLayer][ty][tx] = -1;
      }
      renderMap();
    }

    function compileAkaWorldBin(wBundle) {
      // Binary format ETHW v1 for Gamebuino AKA SD Card (/ETHYND/WORLD.BIN)
      const maskEntries = Object.entries(wBundle.masks);
      let totalBytes = 12 + maskEntries.length * 130;
      for (const m of wBundle.maps) {
        totalBytes += 32 + m.w * m.h * 4 * 2 + 2 + m.doors.length * 20;
      }
      const buf = new ArrayBuffer(totalBytes);
      const dv = new DataView(buf);
      const u8 = new Uint8Array(buf);
      let off = 0;
      // Magic "ETHW", version 1, mapCount, tileCols, maskCount
      u8[off++] = 69; u8[off++] = 84; u8[off++] = 72; u8[off++] = 87;
      dv.setUint16(off, 1, true); off += 2;
      dv.setUint16(off, wBundle.maps.length, true); off += 2;
      dv.setUint16(off, wBundle.tileCols, true); off += 2;
      dv.setUint16(off, maskEntries.length, true); off += 2;
      for (const [tidStr, b64] of maskEntries) {
        dv.setUint16(off, Number(tidStr), true); off += 2;
        const bin = atob(b64);
        for (let i = 0; i < 128; i++) u8[off++] = i < bin.length ? bin.charCodeAt(i) : 0;
      }
      for (const m of wBundle.maps) {
        for (let i = 0; i < 24; i++) u8[off++] = i < m.name.length ? m.name.charCodeAt(i) : 0;
        dv.setUint16(off, m.w, true); off += 2;
        dv.setUint16(off, m.h, true); off += 2;
        u8[off++] = m.bgColor[0]; u8[off++] = m.bgColor[1]; u8[off++] = m.bgColor[2]; u8[off++] = 0;
        for (let l = 0; l < 4; l++) {
          for (let y = 0; y < m.h; y++) {
            for (let x = 0; x < m.w; x++) {
              dv.setInt16(off, m.layers[l][y][x], true); off += 2;
            }
          }
        }
        dv.setUint16(off, m.doors.length, true); off += 2;
        for (const d of m.doors) {
          const targetIdx = Math.max(0, wBundle.maps.findIndex(tm => tm.name === d.map));
          dv.setInt16(off, d.x, true); off += 2;
          dv.setInt16(off, d.y, true); off += 2;
          dv.setInt16(off, d.w, true); off += 2;
          dv.setInt16(off, d.h, true); off += 2;
          dv.setUint16(off, targetIdx, true); off += 2;
          dv.setInt16(off, d.dx, true); off += 2;
          dv.setInt16(off, d.dy, true); off += 2;
          dv.setUint16(off, 0, true); off += 6;
        }
      }
      return new Blob([buf], { type: 'application/octet-stream' });
    }

    function downloadBlob(filename, blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function initWorldUI() {
      defaultWorld = JSON.parse(JSON.stringify(world));
      buildMasks();
      const mapSel = document.getElementById('mapSelect');
      mapSel.innerHTML = '';
      world.maps.forEach((m, i) => {
        const o = document.createElement('option');
        o.value = String(i);
        o.textContent = String(i + 1).padStart(2, '0') + '. ' + m.titleFr + ' (' + m.w + '×' + m.h + ')';
        mapSel.appendChild(o);
      });
      mapSel.onchange = () => { activeMapIdx = Number(mapSel.value); renderMap(); };
      populateNamedDropdown();
      rebuildPaletteUI();
      updateSelectedShapeBox();
      renderTilesetSheet();
      renderMap();
      document.getElementById('statusHeader').textContent =
        world.maps.length + ' cartes chargées · Tileset ' + tilesetImg.width + '×' + tilesetImg.height + ' px · Prêt à éditer en HTML pur.';
    }

    async function boot() {
      // Wire UI Controls
      document.querySelectorAll('#toolBar button').forEach(b => {
        b.onclick = () => setTool(b.dataset.tool);
      });
      document.querySelectorAll('.layer-btn').forEach(b => {
        b.onclick = () => { activeLayer = Number(b.dataset.layer); syncLayerButtons(); updateSelectedShapeBox(); };
      });
      document.getElementById('zoomSelect').onchange = e => { tilePx = Number(e.target.value); renderMap(); };
      document.getElementById('tileIdInput').onchange = e => {
        selectedTileId = Math.max(0, Number(e.target.value) || 0);
        setTool('brush');
        renderTilesetSheet();
        updateSelectedShapeBox();
      };
      document.getElementById('btnToggleCanopy').onclick = function() { showCanopy = !showCanopy; this.classList.toggle('secondary-active', showCanopy); renderMap(); };
      document.getElementById('btnToggleCollisions').onclick = function() { showCollisions = !showCollisions; this.classList.toggle('secondary-active', showCollisions); renderMap(); };
      document.getElementById('btnToggleDoors').onclick = function() { showDoors = !showDoors; this.classList.toggle('secondary-active', showDoors); renderMap(); };
      document.getElementById('btnToggleGrid').onclick = function() { showGrid = !showGrid; this.classList.toggle('secondary-active', showGrid); renderMap(); };

      document.getElementById('btnUndo').onclick = () => {
        if (!undoStack.length) return;
        world = undoStack.pop();
        const btn = document.getElementById('btnUndo');
        btn.disabled = undoStack.length === 0;
        btn.textContent = 'Annuler (' + undoStack.length + ')';
        renderMap();
      };

      document.getElementById('btnResetMap').onclick = () => {
        if (!world || !defaultWorld) return;
        pushUndo();
        world.maps[activeMapIdx] = JSON.parse(JSON.stringify(defaultWorld.maps[activeMapIdx]));
        renderMap();
        notify('Carte restaurée à son état initial.');
      };

      document.getElementById('btnRepairAutotile').onclick = () => {
        if (!world) return;
        pushUndo();
        const m = world.maps[activeMapIdx];
        for (const z of ['forest', 'road', 'water', 'carpet']) {
          const def = getAutotileDef(z);
          const set = new Set(def.memberTiles);
          const l = def.targetLayer;
          const isM = (x, y) => (x < 0 || x >= m.w || y < 0 || y >= m.h) ? true : set.has(m.layers[l][y][x]);
          const next = m.layers[l].map(r => [...r]);
          for (let y = 0; y < m.h; y++) {
            for (let x = 0; x < m.w; x++) {
              if (!set.has(m.layers[l][y][x])) continue;
              next[y][x] = resolveAutotileId(z, isM(x,y-1), isM(x,y+1), isM(x-1,y), isM(x+1,y), isM(x-1,y-1), isM(x+1,y-1), isM(x-1,y+1), isM(x+1,y+1));
            }
          }
          m.layers[l] = next;
        }
        renderMap();
        notify('Auto-tiling (Forêt, Route, Eau, Tapis) recalculé sur toute la carte.');
      };

      document.getElementById('btnExportJson').onclick = () => {
        if (!world) return;
        downloadBlob('world_expanded.json', new Blob([JSON.stringify(world)], { type: 'application/json' }));
        notify('world_expanded.json téléchargé (à copier dans public/ethynd/world_expanded.json).');
      };

      document.getElementById('btnExportAkaBin').onclick = () => {
        if (!world) return;
        downloadBlob('WORLD.BIN', compileAkaWorldBin(world));
        notify('WORLD.BIN généré pour la carte MicroSD Gamebuino AKA (/ETHYND/WORLD.BIN).');
      };

      document.getElementById('btnImportJson').onclick = () => document.getElementById('fileJson').click();
      document.getElementById('fileJson').onchange = async e => {
        const f = e.target.files[0];
        e.target.value = '';
        if (!f) return;
        world = JSON.parse(await f.text());
        if (tilesetReady) initWorldUI();
        notify('Fichier JSON chargé (' + world.maps.length + ' cartes).');
      };

      const mapCnv = document.getElementById('mapCanvas');
      const coordsOf = e => {
        const r = mapCnv.getBoundingClientRect();
        const map = world.maps[activeMapIdx];
        const cx = (e.clientX - r.left) * (mapCnv.width / r.width);
        const cy = (e.clientY - r.top) * (mapCnv.height / r.height);
        return {
          tx: Math.max(0, Math.min(map.w - 1, Math.floor(cx / tilePx))),
          ty: Math.max(0, Math.min(map.h - 1, Math.floor(cy / tilePx)))
        };
      };

      mapCnv.onmousedown = e => {
        if (!world) return;
        const p = coordsOf(e);
        isPointerDown = true;
        hoverCell = p;
        if (tool === 'autotile_rect') {
          dragStartCell = p;
          renderMap();
          return;
        }
        lastPaintedKey = p.tx + ',' + p.ty;
        applyCellAction(p.tx, p.ty, true);
      };
      mapCnv.onmousemove = e => {
        if (!world) return;
        const p = coordsOf(e);
        hoverCell = p;
        const map = world.maps[activeMapIdx];
        document.getElementById('coordFooter').textContent = '(' + p.tx + ', ' + p.ty + ') · ' + map.name + ' · [' + [0,1,2,3].map(l => map.layers[l][p.ty][p.tx]).join(', ') + ']';
        if (isPointerDown && (tool === 'autotile' || tool === 'brush' || tool === 'eraser')) {
          const k = p.tx + ',' + p.ty;
          if (k !== lastPaintedKey) {
            lastPaintedKey = k;
            applyCellAction(p.tx, p.ty, false);
          }
        } else {
          renderMap();
        }
      };
      window.addEventListener('mouseup', () => {
        if (isPointerDown && tool === 'autotile_rect' && dragStartCell && hoverCell && world) {
          pushUndo();
          const autoErase = document.getElementById('chkAutoErase').checked;
          applyAutotileRect(world.maps[activeMapIdx], activeAutotile, dragStartCell.tx, dragStartCell.ty, hoverCell.tx, hoverCell.ty, autoErase);
          dragStartCell = null;
          renderMap();
        }
        isPointerDown = false;
        dragStartCell = null;
        lastPaintedKey = null;
      });

      document.getElementById('tilesetCanvas').onclick = e => {
        if (!world || !tilesetReady) return;
        const c = document.getElementById('tilesetCanvas');
        const r = c.getBoundingClientRect();
        const col = Math.floor(((e.clientX - r.left) * (c.width / r.width)) / 16);
        const row = Math.floor(((e.clientY - r.top) * (c.height / r.height)) / 16);
        selectedTileId = row * (world.tileCols || 40) + col;
        document.getElementById('tileIdInput').value = String(selectedTileId);
        setTool('brush');
        renderTilesetSheet();
        updateSelectedShapeBox();
      };

      // Load embedded or adjacent assets
      tilesetImg.onload = () => {
        tilesetReady = true;
        if (world) initWorldUI();
      };
      if (window.__EMBEDDED_TILESET__) {
        tilesetImg.src = window.__EMBEDDED_TILESET__;
      } else {
        tilesetImg.src = './tileset.png';
      }

      if (window.__EMBEDDED_WORLD__) {
        world = window.__EMBEDDED_WORLD__;
        if (tilesetReady) initWorldUI();
      } else {
        try {
          const resp = await fetch('./world_expanded.json');
          if (resp.ok) {
            world = await resp.json();
            if (tilesetReady) initWorldUI();
          }
        } catch {
          document.getElementById('statusHeader').textContent =
            'Mode fichier local : cliquez « Importer JSON… » pour ouvrir world_expanded.json.';
        }
      }
    }

    boot();
  </script>
</body>
</html>`;
}

export function exportStandaloneEditorHtml(
  world: WorldBundle,
  sprites: SpriteBank,
  lang: LangCode
): string {
  const tilesetB64 = imageToDataUrl(sprites.tileset);
  return buildEditorHtmlDocument({
    embeddedWorldJson: safeJsonForScript(world),
    embeddedTilesetB64: tilesetB64,
    lang,
  });
}
