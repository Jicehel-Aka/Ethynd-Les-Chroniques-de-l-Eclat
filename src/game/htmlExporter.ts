import { COMPOSITIONS } from './audioEngine';
import {
  BESTIARY_CATALOG,
  EQUIPMENT_CATALOG,
  ITEM_CATALOG,
  LORE_CODEX,
  QUEST_CATALOG,
} from './content';
import { EntityAnimSet, SpriteBank, SpriteCanvas } from './spriteBank';
import { Direction, LangCode, PlayerProgress, WorldBundle } from './types';

interface SerializedAnimSet {
  size: number;
  walk: Record<string, string[]>;
  attack?: Record<string, string[]>;
}

function spriteToDataUrl(src: SpriteCanvas): string {
  if (src instanceof HTMLCanvasElement) {
    return src.toDataURL('image/png');
  }
  const w = src.naturalWidth || src.width || 32;
  const h = src.naturalHeight || src.height || 32;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0);
  return c.toDataURL('image/png');
}

function serializeAnimSet(anim: EntityAnimSet): SerializedAnimSet {
  const walk: Record<string, string[]> = {};
  for (const d of [Direction.Bas, Direction.Gauche, Direction.Droite, Direction.Haut]) {
    walk[d] = (anim.walk[d] || []).map(spriteToDataUrl);
  }
  let attack: Record<string, string[]> | undefined;
  if (anim.attack) {
    attack = {};
    for (const d of [Direction.Bas, Direction.Gauche, Direction.Droite, Direction.Haut]) {
      attack[d] = (anim.attack[d] || []).map(spriteToDataUrl);
    }
  }
  return { size: anim.size, walk, attack };
}

export function exportStandaloneSimulationHtml(
  world: WorldBundle,
  sprites: SpriteBank,
  currentProgress: PlayerProgress,
  lang: LangCode
): string {
  const npcsData: Record<string, Record<string, string>> = {};
  for (const [id, dirs] of Object.entries(sprites.npcs)) {
    npcsData[id] = {};
    for (const d of [Direction.Bas, Direction.Gauche, Direction.Droite, Direction.Haut]) {
      if (dirs[d]) {
        npcsData[id][d] = spriteToDataUrl(dirs[d]);
      }
    }
  }

  const monstersData: Record<string, SerializedAnimSet> = {};
  for (const [id, anim] of Object.entries(sprites.monsters)) {
    monstersData[id] = serializeAnimSet(anim);
  }

  const itemsData: Record<string, string> = {};
  for (const [id, canvas] of Object.entries(sprites.items)) {
    itemsData[id] = spriteToDataUrl(canvas);
  }

  const bundle = {
    lang,
    initialProgress: currentProgress,
    world,
    catalogs: {
      bestiary: BESTIARY_CATALOG,
      equipment: EQUIPMENT_CATALOG,
      items: ITEM_CATALOG,
      quests: QUEST_CATALOG,
      lore: LORE_CODEX,
      compositions: COMPOSITIONS,
    },
    assets: {
      tileset: spriteToDataUrl(sprites.tileset),
      heart: spriteToDataUrl(sprites.heart),
      throne: spriteToDataUrl(sprites.throne),
      chestClosed: spriteToDataUrl(sprites.chestClosed),
      chestOpen: spriteToDataUrl(sprites.chestOpen),
      brazierFlame: sprites.brazierFlame.map(spriteToDataUrl),
      torchStand: sprites.torchStand.map(spriteToDataUrl),
      player: serializeAnimSet(sprites.player),
      npcs: npcsData,
      monsters: monstersData,
      items: itemsData,
    },
  };

  const safeJson = JSON.stringify(bundle).replace(/</g, '\\u003c');

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Ethynd : Les Chroniques de l'Éclat — Simulation Autonome</title>
<style>
  :root {
    --bg: #0b0f17;
    --panel: #141a24;
    --panel-alt: #0f141d;
    --border: #232d3f;
    --text: #f1f5f9;
    --muted: #94a3b8;
    --amber: #f59e0b;
    --amber-light: #fcd34d;
    --emerald: #10b981;
    --sky: #38bdf8;
    --rose: #f43f5e;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.5;
    padding: 16px;
  }
  .wrap { max-width: 1380px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
  .bar {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  h1 { font-size: 18px; font-weight: 700; color: #fff; }
  .sub { font-size: 12px; color: var(--muted); }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  button, select {
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: #1e293b;
    color: var(--text);
    padding: 7px 12px;
    cursor: pointer;
    white-space: nowrap;
  }
  button:hover:not(:disabled), select:hover { border-color: var(--amber); color: var(--amber-light); }
  button:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-primary { background: var(--amber); color: #090d14; border-color: var(--amber); }
  .btn-primary:hover:not(:disabled) { background: #fbbf24; color: #090d14; }
  .btn-active { background: #1e293b; border-color: var(--amber); color: var(--amber-light); }
  .grid { display: grid; grid-template-columns: 1fr 370px; gap: 16px; align-items: start; }
  @media (max-width: 1080px) { .grid { grid-template-columns: 1fr; } }
  .stage-card, .side-card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px;
  }
  .canvas-box {
    position: relative;
    background: #070a10;
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    justify-content: center;
  }
  canvas {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    width: 100%;
    max-width: 768px;
    height: auto;
    aspect-ratio: 768 / 528;
    display: block;
  }
  .hud-metrics { display: flex; flex-wrap: wrap; gap: 18px; font-variant-numeric: tabular-nums; font-size: 12px; }
  .meter { width: 120px; height: 7px; background: #1e293b; border-radius: 4px; overflow: hidden; margin-top: 4px; }
  .meter > div { height: 100%; transition: width 0.12s linear; }
  .overlay-dlg {
    position: absolute; left: 14px; right: 14px; bottom: 14px;
    background: rgba(9, 13, 20, 0.96);
    border: 1px solid rgba(245, 158, 11, 0.65);
    border-radius: 10px;
    padding: 14px 16px;
  }
  .overlay-modal {
    position: absolute; inset: 14px;
    background: rgba(9, 13, 20, 0.97);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .boss-hud {
    position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
    width: 310px; max-width: 90%;
    background: rgba(9, 13, 20, 0.92);
    border: 1px solid rgba(244, 63, 94, 0.55);
    border-radius: 8px; padding: 6px 12px; pointer-events: none;
    font-size: 12px;
  }
  .toast-hud {
    position: absolute; top: 56px; left: 50%; transform: translateX(-50%);
    background: rgba(9, 13, 20, 0.92);
    border: 1px solid rgba(245, 158, 11, 0.45);
    border-radius: 8px; padding: 5px 12px; font-size: 12px; color: var(--amber-light);
    pointer-events: none;
  }
  .prompt-hud {
    position: absolute; right: 12px; bottom: 12px;
    background: rgba(9, 13, 20, 0.92);
    border: 1px solid var(--border);
    border-radius: 6px; padding: 4px 10px; font-family: monospace; font-size: 11px; color: var(--amber-light);
    pointer-events: none;
  }
  .kbd {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 28px; height: 28px; padding: 0 7px;
    border-radius: 6px; border: 1px solid var(--border);
    background: var(--panel-alt); font-family: monospace; font-size: 11px; color: var(--muted);
    user-select: none;
  }
  .kbd.on { background: var(--amber); color: #090d14; border-color: var(--amber); font-weight: 700; }
  .inv-grid { display: grid; grid-template-columns: 1fr 1.3fr; gap: 14px; }
  @media (max-width: 720px) { .inv-grid { grid-template-columns: 1fr; } }
  .item-row {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.12); font-size: 12px;
  }
  .logs {
    max-height: 210px; overflow-y: auto; font-family: monospace; font-size: 11px;
    color: #cbd5e1; background: var(--panel-alt); border: 1px solid var(--border);
    border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px;
  }
  .hidden { display: none !important; }
</style>
</head>
<body>
<div class="wrap">
  <header class="bar">
    <div>
      <h1>Ethynd : Les Chroniques de l'Éclat — Simulation Interactive &amp; Bot</h1>
      <p class="sub">Page HTML autonome · Clavier ZQSD/Flèches · Inventaire &amp; Forge [I] · 11 Cartes · Musique longue 80s</p>
    </div>
    <div class="row">
      <button id="btnModeManual" class="btn-active">Clavier (Joueur)</button>
      <button id="btnModeBot">Bot Automatique (5 Actes)</button>
      <select id="selSpeed" title="Vitesse de simulation">
        <option value="1">Vitesse 1×</option>
        <option value="2">Vitesse 2×</option>
        <option value="4">Vitesse 4×</option>
      </select>
      <button id="btnMusic">♫ Musique (80s) : Active</button>
      <button id="btnSaveLocal" class="btn-primary">Sauvegarder</button>
      <button id="btnLoadLocal">Restaurer</button>
    </div>
  </header>

  <section class="bar">
    <div class="hud-metrics">
      <div>
        <div>Santé · <strong id="hudHp">24/24 PV</strong></div>
        <div class="meter"><div id="barHp" style="width:100%;background:var(--emerald)"></div></div>
      </div>
      <div>
        <div><span id="hudLv">Niv. 1</span> · <strong id="hudXp" style="color:var(--amber-light)">0/40 XP</strong></div>
        <div class="meter"><div id="barXp" style="width:0%;background:var(--amber)"></div></div>
      </div>
      <div><span class="sub">Bourse</span><br/><strong id="hudGold" style="color:var(--amber-light)">25 Or</strong></div>
      <div><span class="sub">ATQ / DÉF</span><br/><strong id="hudAtkDef">6 / 1</strong></div>
      <div><span class="sub">Carte actuelle</span><br/><strong id="hudMap">Maison du Sage Aldric</strong></div>
    </div>
    <div class="row">
      <button id="btnSkill">Onde [E]</button>
      <button id="btnHeal">Soin [R]</button>
      <button id="btnInv" class="btn-primary">Inventaire &amp; Équipement [I]</button>
    </div>
  </section>

  <div class="grid">
    <div class="stage-card">
      <div class="canvas-box">
        <canvas id="gameCanvas" width="768" height="528"></canvas>
        <div id="bossHud" class="boss-hud hidden">
          <div style="display:flex;justify-content:space-between;color:#fecdd3;font-weight:600">
            <span id="bossName">Boss</span><span id="bossHp">50/50</span>
          </div>
          <div class="meter" style="width:100%"><div id="bossBar" style="width:100%;background:var(--rose)"></div></div>
        </div>
        <div id="toastHud" class="toast-hud hidden"></div>
        <div id="promptHud" class="prompt-hud hidden"></div>

        <!-- Dialogue Overlay -->
        <div id="dlgBox" class="overlay-dlg hidden">
          <div id="dlgSpeaker" style="color:var(--amber-light);font-weight:700;font-size:13px;margin-bottom:4px"></div>
          <div id="dlgText" style="font-size:13px;min-height:42px"></div>
          <div id="dlgActions" class="row" style="margin-top:10px"></div>
        </div>

        <!-- Inventory / Equipment / Forge Modal [I] -->
        <div id="invModal" class="overlay-modal hidden">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:8px">
            <div>
              <strong style="font-size:15px">Inventaire, Aptitudes &amp; Forge Runique [I]</strong>
              <div id="invSub" class="sub"></div>
            </div>
            <div class="row">
              <button id="btnGiftPack" title="Ajoute des ressources pour tester la Forge">+ Pack Test Forge</button>
              <button id="btnCloseInv" class="btn-primary">Fermer [I / Échap]</button>
            </div>
          </div>
          <div class="inv-grid">
            <div>
              <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:var(--amber-light)">Aptitudes &amp; Sacoche</div>
              <div id="invAttrs"></div>
              <div style="font-weight:700;font-size:13px;margin:12px 0 6px;color:var(--amber-light)">Objets &amp; Éclats en sac</div>
              <div id="invBag"></div>
            </div>
            <div>
              <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:var(--amber-light)">Équipements &amp; Trempe (+1/+2/+3)</div>
              <div id="invGear"></div>
            </div>
          </div>
        </div>

        <!-- Shop Modal -->
        <div id="shopModal" class="overlay-modal hidden">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:8px">
            <strong id="shopTitle" style="font-size:15px">Boutique</strong>
            <button id="btnCloseShop" class="btn-primary">Fermer</button>
          </div>
          <div id="shopItems"></div>
        </div>
      </div>

      <!-- Keyboard Indicators & Touch Controls -->
      <div style="margin-top:12px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px">
        <div class="row">
          <button data-hold="left">←</button>
          <button data-hold="up">↑</button>
          <button data-hold="down">↓</button>
          <button data-hold="right">→</button>
          <button data-hold="attack" class="btn-primary">Espace · Épée / Parler</button>
          <button data-hold="skill">E · Onde</button>
          <button id="btnTouchInv">I · Inventaire</button>
        </div>
        <div class="row">
          <span class="sub">Touches actives :</span>
          <span id="kUp" class="kbd">Z/↑</span>
          <span id="kLeft" class="kbd">Q/←</span>
          <span id="kDown" class="kbd">S/↓</span>
          <span id="kRight" class="kbd">D/→</span>
          <span id="kAtk" class="kbd">ESP</span>
          <span id="kSkill" class="kbd">E</span>
          <span id="kPot" class="kbd">R</span>
          <span id="kInv" class="kbd">I</span>
        </div>
      </div>
    </div>

    <aside class="side-card" style="display:flex;flex-direction:column;gap:14px">
      <div>
        <div style="font-weight:700;font-size:13px;margin-bottom:6px">Téléportation Rapide (11 Régions)</div>
        <select id="selTeleport" style="width:100%;margin-bottom:8px"></select>
        <button id="btnTeleport" style="width:100%">Téléporter le héros sur cette carte</button>
      </div>

      <div style="border-top:1px solid var(--border);padding-top:12px">
        <div style="font-weight:700;font-size:13px;margin-bottom:6px">Chapitres Prêts à Tester</div>
        <div class="row">
          <button data-preset="act1">Acte I (Maison)</button>
          <button data-preset="throne">Salle du Trône</button>
          <button data-preset="forest">Acte III (Forêt)</button>
          <button data-preset="dragon">Boss Final Dragon</button>
        </div>
      </div>

      <div style="border-top:1px solid var(--border);padding-top:12px">
        <div style="font-weight:700;font-size:13px;margin-bottom:4px">Éclats du Prisme</div>
        <div id="shardsRow" class="sub" style="font-family:monospace"></div>
      </div>

      <div style="border-top:1px solid var(--border);padding-top:12px">
        <div style="font-weight:700;font-size:13px;margin-bottom:6px">Journal de Simulation</div>
        <div id="logBox" class="logs"></div>
      </div>
    </aside>
  </div>
</div>

<script id="ethynd-bundle" type="application/json">${safeJson}</script>
<script>
(function() {
  const DATA = JSON.parse(document.getElementById('ethynd-bundle').textContent);
  const WORLD = DATA.world;
  const CAT = DATA.catalogs;
  const SCORES = CAT.compositions;
  const VIEW_W = 768, VIEW_H = 528, TILE_SHOW = 48;

  // Decode Base64 1-bit collision masks
  const MASKS = new Map();
  for (const [k, b64] of Object.entries(WORLD.masks)) {
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    MASKS.set(Number(k), u8);
  }
  const ANIM_TILES = new Map();
  const CUR_TILE = new Map();
  for (const [k, v] of Object.entries(WORLD.anim)) {
    ANIM_TILES.set(Number(k), v);
    CUR_TILE.set(Number(k), Number(k));
  }
  const MAPS = new Map();
  WORLD.maps.forEach(m => MAPS.set(m.name, m));

  function loadImg(url) {
    return new Promise((res) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => res(i);
      i.src = url;
    });
  }
  const DIRS = ['bas', 'gauche', 'droite', 'haut'];
  async function hydrateAnim(ser) {
    const walk = {}, attack = ser.attack ? {} : undefined;
    for (const d of DIRS) {
      walk[d] = await Promise.all((ser.walk[d] || []).map(loadImg));
      if (ser.attack && ser.attack[d]) {
        attack[d] = await Promise.all(ser.attack[d].map(loadImg));
      }
    }
    return { size: ser.size, walk, attack };
  }

  // Long-Phrase Web Audio Synthesizer (80s Maison score & regional themes)
  const SynthAudio = {
    ctx: null, bus: null, muted: false, track: '', timer: null, step: 0, nextTime: 0, noteMap: new Map(),
    ensure() {
      if (this.muted) return null;
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
        const master = this.ctx.createGain(); master.gain.value = 0.28;
        const lpf = this.ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 2400;
        const dly = this.ctx.createDelay(1.0); dly.delayTime.value = 0.26;
        const fb = this.ctx.createGain(); fb.gain.value = 0.2;
        const wet = this.ctx.createGain(); wet.gain.value = 0.16;
        master.connect(lpf); lpf.connect(this.ctx.destination);
        lpf.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(this.ctx.destination);
        this.bus = master;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return this.ctx;
    },
    m2f(m) { return 440 * Math.pow(2, (m - 69) / 12); },
    tone(freq, dur, type, vol, when) {
      const ctx = this.ensure(); if (!ctx || !this.bus) return;
      const t = when || ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'triangle'; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol || 0.12, t + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + dur + 0.03);
    },
    playMusic(id) {
      const comp = SCORES[id] || SCORES.maison;
      if (!comp) return;
      if (this.track === comp.id && this.timer) return;
      this.track = comp.id;
      this.noteMap.clear();
      comp.melody.forEach(ev => {
        const arr = this.noteMap.get(ev.step) || [];
        arr.push(ev); this.noteMap.set(ev.step, arr);
      });
      this.step = 0;
      if (!this.muted) this.startLoop();
    },
    startLoop() {
      if (this.timer) clearInterval(this.timer);
      const ctx = this.ensure(); if (!ctx) return;
      this.nextTime = ctx.currentTime + 0.06;
      const tick = () => {
        if (this.muted || !this.ctx) return;
        const comp = SCORES[this.track] || SCORES.maison;
        const eighth = 60 / (comp.bpm * 2);
        const total = comp.bars * 8;
        while (this.nextTime < this.ctx.currentTime + 0.28) {
          const bar = Math.floor(this.step / 8) % comp.barChords.length;
          const beat = this.step % 8;
          const ch = comp.barChords[bar];
          if (beat === 0) this.tone(this.m2f(ch[0]), eighth * 4.2, 'triangle', 0.16, this.nextTime);
          const up = ch.slice(1);
          if (beat % 2 === 0 || comp.arpStyle !== 'sparse_echo') {
            const pick = up[(beat + bar) % up.length];
            this.tone(this.m2f(pick), eighth * 1.9, 'sine', 0.08, this.nextTime);
          }
          const notes = this.noteMap.get(this.step);
          if (notes) {
            notes.forEach(n => {
              const wave = comp.lead === 'flute' ? 'sine' : comp.lead === 'brass' ? 'sawtooth' : 'triangle';
              this.tone(this.m2f(n.midi), Math.max(0.14, n.dur * eighth * 0.94), wave, 0.16, this.nextTime);
            });
          }
          this.nextTime += eighth;
          this.step = (this.step + 1) % total;
        }
      };
      tick();
      this.timer = setInterval(tick, 110);
    },
    sfxHit() { this.tone(240, 0.09, 'sawtooth', 0.15); },
    sfxHeal() { this.tone(523.25, 0.14, 'sine', 0.16); setTimeout(() => this.tone(783.99, 0.2, 'sine', 0.16), 90); },
    sfxForge() { this.tone(880, 0.08, 'square', 0.15); setTimeout(() => this.tone(1320, 0.2, 'triangle', 0.16), 45); }
  };
  window.addEventListener('pointerdown', () => { if (!SynthAudio.muted) SynthAudio.startLoop(); }, { once: true });
  window.addEventListener('keydown', () => { if (!SynthAudio.muted) SynthAudio.startLoop(); }, { once: true });

  function xpReq(lv) { return Math.floor(40 * Math.pow(lv, 1.35)); }
  function computeStats(p) {
    let maxHp = 20 + p.level * 4 + p.attrs.vitality * 4;
    let attack = 3 + Math.floor(p.level * 0.8) + p.attrs.strength * 2;
    let defense = Math.floor(p.attrs.vitality * 0.5);
    let speed = Math.min(7, 4 + Math.floor(p.attrs.agility * 0.2));
    let critChance = Math.min(60, 5 + p.attrs.agility * 3);
    let arcanePower = 8 + p.level * 2 + p.attrs.arcane * 4;
    let lifesteal = 0;
    for (const slot of ['weapon', 'armor', 'shield', 'relic']) {
      const id = p.equipped[slot];
      if (!id) continue;
      const def = CAT.equipment.find(e => e.id === id);
      if (!def) continue;
      const upg = p.upgrades[id] || 0;
      maxHp += def.hpBonus + (slot === 'armor' ? upg * 6 : upg * 2);
      attack += def.atkBonus + (slot === 'weapon' ? upg * 3 : 0);
      defense += def.defBonus + ((slot === 'armor' || slot === 'shield') ? upg * 2 : 0);
      speed = Math.min(8, speed + def.speedBonus);
      critChance = Math.min(75, critChance + def.critBonus + upg);
      arcanePower += def.arcaneBonus + (slot === 'relic' ? upg * 4 : upg);
      lifesteal += def.lifesteal || 0;
    }
    const cd = Math.max(36, 120 - p.attrs.arcane * 5);
    return { maxHp, attack, defense, speed, critChance, arcanePower, skillCooldownTicks: cd, lifesteal };
  }

  function resolveNpc(npcId, p) {
    const hasDawn = (p.inventory.crystal_aube || 0) > 0;
    const hasIron = (p.inventory.crystal_fer || 0) > 0;
    const hasAzure = (p.inventory.crystal_azur || 0) > 0;
    const hasAmeth = (p.inventory.crystal_amethyste || 0) > 0;
    if (npcId === 'sage') {
      if (!p.flags.talked_sage) return {
        mutate: d => { d.flags.talked_sage = true; },
        dlg: { speaker: 'Le Sage Aldric', lines: [
          "Ah, te voilà enfin ! Des chauves-souris ont emporté l'Éclat de l'Aube dans le nid de Morvath, la Couveuse tapie au fond de la grotte.",
          "Prends l'escalier de la cave au sud-est, terrasse Morvath et rapporte-moi le Cristal !"
        ]}
      };
      if (hasDawn && !p.flags.act1_done) return {
        mutate: d => { d.flags.act1_done = true; d.hp = 999; },
        dlg: { speaker: 'Le Sage Aldric', lines: [
          "Tu as vaincu Morvath et retrouvé l'Éclat de l'Aube ! Mais l'Ordre de l'Éclipse cherche à réveiller Pyraxis, le Grand Dragon Rouge dans le Sud.",
          "Prends mon Sceau du Conseil : les portes du Château Royal au nord-est de la Vallée te sont désormais ouvertes !"
        ]}
      };
      if (hasDawn && hasIron && hasAzure && hasAmeth && !p.flags.act4_done) return {
        mutate: d => { d.flags.act4_done = true; d.hp = 999; },
        dlg: { speaker: 'Le Sage Aldric', lines: [
          "Les Quatre Éclats rayonnent à l'unisson ! La Barrière de Cendre au sud de la Vallée s'est dissipée : va affronter le Grand Dragon Rouge Pyraxis !"
        ]}
      };
      return { mutate: d => { d.hp = 999; }, dlg: { speaker: 'Le Sage Aldric', lines: ["Que la lumière restaure tes forces (PV restaurés)."] } };
    }
    if (npcId === 'roi') {
      if (!p.flags.talked_roi) return {
        mutate: d => { d.flags.talked_roi = true; },
        dlg: { speaker: 'Roi Édouard IV', lines: [
          "Bienvenue devant le Trône d'Ethynd, porteur de l'Aube ! Sire Malakor a sombré sous nos Oubliettes avec l'Éclat de Fer.",
          "L'escalier à l'est de cette Salle du Trône est ouvert : libère Malakor et rapporte l'Éclat de Fer !"
        ]}
      };
      if (hasIron && !p.flags.act2_started) return {
        mutate: d => { d.flags.act2_started = true; d.hp = 999; },
        dlg: { speaker: 'Roi Édouard IV', lines: [
          "L'Éclat de Fer brille à nouveau ! J'ouvre le barrage de l'Ouest vers la Forêt de Sylvebrume : trouve la rôdeuse Élowen !"
        ]}
      };
      if (hasDawn && hasIron && hasAzure && hasAmeth && !p.flags.act4_done) return {
        mutate: d => { d.flags.act4_done = true; d.hp = 999; },
        dlg: { speaker: 'Roi Édouard IV', lines: [
          "Le Prisme d'Ethynd est restauré sous la voûte royale ! Marche au sud vers Pyra et terrasse enfin le Grand Dragon Rouge Pyraxis !"
        ]}
      };
      return { mutate: d => { d.hp = 999; }, dlg: { speaker: 'Roi Édouard IV', lines: ["La bénédiction de la Couronne restaure tes PV. Courage, Champion d'Ethynd !"] } };
    }
    if (npcId === 'garde_trone_g' || npcId === 'garde_trone_d' || npcId === 'sentinelle_salle_g' || npcId === 'sentinelle_salle_d') {
      return { dlg: { speaker: "Garde d'Honneur du Trône", lines: [
        p.flags.boss_malakor_dead
          ? "La Garde Royale salue le vainqueur des Oubliettes ! Longue vie au Roi Édouard IV !"
          : "Longue vie au Roi Édouard IV ! Avancez sur le tapis royal jusqu'au trône pour votre audience."
      ]}};
    }
    if (npcId === 'elowen') {
      if (!p.flags.talked_elowen) return {
        mutate: d => { d.flags.talked_elowen = true; d.hp = 999; },
        dlg: { speaker: 'Élowen, Rôdeuse de Sylvebrume', lines: [
          "Je dissipe le sceau de brume du Temple Englouti au nord-ouest ! Apaise Léviathanis et récupère l'Éclat d'Azur."
        ]}
      };
      if (hasAzure && !p.flags.act3_done) return {
        mutate: d => { d.flags.act3_done = true; d.hp = 999; },
        dlg: { speaker: 'Élowen, Rôdeuse de Sylvebrume', lines: [
          "Voici la Clé d'Argent Royal : elle ouvre la Nécropole des Rois Oubliés au sud-est de la Vallée d'Ethynd !"
        ]}
      };
      return { mutate: d => { d.hp = 999; }, dlg: { speaker: 'Élowen', lines: ["Repose-toi près du feu de camp (PV restaurés)."] } };
    }
    if (npcId === 'marchand') return { dlg: { speaker: 'Marchand Dorian', lines: ["Bienvenue au marché du Lac d'Ethynd !"], shop: 'market' } };
    if (npcId === 'forgeron') return { dlg: { speaker: 'Maître Forgeron Brom', lines: ["Trempe tes lames dans ton Inventaire [I] ou parcours mon armurerie !"], shop: 'forge' } };
    if (npcId === 'herboriste') return { dlg: { speaker: 'Herboriste Lysa', lines: ["Besoin de potions ou d'élixirs pour la route ?"], shop: 'alchemy' } };
    if (npcId === 'veilleur') return {
      mutate: d => { d.hp = 999; },
      dlg: { speaker: 'Kael, Veilleur des Cendres', lines: [
        "Ignis garde le pont de basalte, et au sud t'attend enfin Pyraxis, le Grand Dragon Rouge ! (PV restaurés)"
      ]}
    };
    if (npcId.startsWith('barrage_foret_')) {
      return { dlg: { speaker: 'Sentinelle de la Route Ouest', lines: [
        p.flags.act2_started
          ? "Le sceau royal d'Édouard IV est validé : la route de Sylvebrume est ouverte !"
          : "Halte ! Par ordre du Roi Édouard IV, la route de Sylvebrume est fermée tant que l'Éclat de Fer des Oubliettes n'a pas été rapporté."
      ]}};
    }
    if (npcId.startsWith('barrage_chateau_')) {
      return { dlg: { speaker: 'Hallebardier du Pont Royal', lines: [
        p.flags.act1_done
          ? "Le Sceau du Sage Aldric vous ouvre le Château Royal !"
          : "Halte ! Les portes du Château Royal sont fermées tant que vous ne portez pas le Sceau du Conseil du Sage Aldric."
      ]}};
    }
    if (npcId.startsWith('barrage_crypte')) {
      return { dlg: { speaker: 'Garde de la Nécropole Royale', lines: [
        p.flags.act3_done
          ? "Vous portez la Clé d'Argent Royal : la Nécropole est ouverte !"
          : "Halte ! La Nécropole des Rois Oubliés est scellée sans la Clé d'Argent Royal de Sylvebrume."
      ]}};
    }
    if (npcId.startsWith('barrage_pyra')) {
      return { dlg: { speaker: 'Garde du Col des Cendres', lines: [
        p.flags.act4_done
          ? "Le Prisme brille ! Le passage vers les Terres Ardentes est dégagé !"
          : "Impossible de passer ! Le souffle de Pyraxis consume le col tant que les Quatre Éclats du Prisme ne sont pas réunis."
      ]}};
    }
    if (npcId.startsWith('barrage_temple')) {
      return { dlg: { speaker: 'Veilleur de Sylvebrume', lines: [
        p.flags.talked_elowen
          ? "Le chant d'Élowen a dissipé la brume : vous pouvez entrer dans le Temple Englouti !"
          : "N'avancez pas ! Parlez d'abord à Élowen au Bosquet du Sanctuaire pour lever le sceau de brume."
      ]}};
    }
    return { dlg: { speaker: 'Habitant d’Ethynd', lines: ["Que la lumière du Prisme guide tes pas !"] } };
  }

  Promise.all([
    loadImg(DATA.assets.tileset),
    loadImg(DATA.assets.heart),
    loadImg(DATA.assets.throne),
    loadImg(DATA.assets.chestClosed),
    loadImg(DATA.assets.chestOpen),
    Promise.all((DATA.assets.brazierFlame || []).map(loadImg)),
    Promise.all((DATA.assets.torchStand || []).map(loadImg)),
    hydrateAnim(DATA.assets.player),
    (async () => {
      const out = {};
      for (const [k, dirs] of Object.entries(DATA.assets.npcs)) {
        out[k] = {};
        for (const d of DIRS) if (dirs[d]) out[k][d] = await loadImg(dirs[d]);
      }
      return out;
    })(),
    (async () => {
      const out = {};
      for (const [k, ser] of Object.entries(DATA.assets.monsters)) out[k] = await hydrateAnim(ser);
      return out;
    })(),
  ]).then(([tileset, heart, throne, chestClosed, chestOpen, brazierFlame, torchStand, playerAnim, npcSprites, monsterSprites]) => {
    startSimulation({ tileset, heart, throne, chestClosed, chestOpen, brazierFlame, torchStand, player: playerAnim, npcs: npcSprites, monsters: monsterSprites });
  });

  function startSimulation(SPR) {
    let prog = structuredClone(DATA.initialProgress);
    let curMap = MAPS.get(prog.currentMap) || WORLD.maps[0];
    let monsters = [], projectiles = [], popups = [];
    let keys = { up: false, down: false, left: false, right: false, attack: false, skill: false, potion: false };
    let prevAtk = false, prevSkill = false, prevPot = false;
    let attacking = false, animFrame = 0, animTick = 0, tileTick = 0, hurtImm = 0, skillCd = 0, doorGrace = false;
    let activeDlg = null, dlgIdx = 0, invOpen = false, activeShop = null;
    let botMode = false, simSpeed = 1, botStage = 0, botTicks = 0;
    const hitThisSwing = new Set();

    const logBox = document.getElementById('logBox');
    function addLog(txt) {
      const div = document.createElement('div');
      div.textContent = txt;
      logBox.prepend(div);
      while (logBox.children.length > 40) logBox.removeChild(logBox.lastChild);
    }

    function showToast(txt) {
      const el = document.getElementById('toastHud');
      el.textContent = txt; el.classList.remove('hidden');
      clearTimeout(el._t);
      el._t = setTimeout(() => el.classList.add('hidden'), 2400);
    }

    function maskHits(mask, rx, ry, rw, rh) {
      const x0 = Math.max(0, Math.floor(rx)), y0 = Math.max(0, Math.floor(ry));
      const x1 = Math.min(32, Math.ceil(rx + rw)), y1 = Math.min(32, Math.ceil(ry + rh));
      for (let y = y0; y < y1; y++) {
        const ro = y * 4;
        for (let x = x0; x < x1; x++) if ((mask[ro + (x >> 3)] >> (7 - (x & 7))) & 1) return true;
      }
      return false;
    }

    function isFlagUnlocked(flag) {
      if (!flag) return true;
      if (prog.flags[flag]) return true;
      if (flag === 'act1_done') return Boolean(prog.visitedMaps.chateau || prog.flags.talked_roi || prog.flags.act2_started);
      if (flag === 'act2_started') return Boolean(prog.visitedMaps.foret || prog.flags.talked_elowen || prog.flags.act3_done);
      if (flag === 'talked_elowen') return Boolean(prog.visitedMaps.temple || (prog.inventory.crystal_azur || 0) > 0 || prog.flags.act3_done);
      if (flag === 'act3_done') return Boolean(prog.visitedMaps.crypte || (prog.inventory.crystal_amethyste || 0) > 0 || prog.flags.act4_done);
      if (flag === 'act4_done') return Boolean(prog.visitedMaps.terres_ardentes || prog.visitedMaps.citadelle);
      return false;
    }

    function isNpcPresent(n) {
      return n.blockUntilFlag ? !isFlagUnlocked(n.blockUntilFlag) : true;
    }

    function getNpcPos(n) {
      return { x: n.x, y: n.y };
    }

    function collides(r) {
      if (r.x < 0 || r.y < 0 || r.x + r.w > curMap.w * 32 || r.y + r.h > curMap.h * 32) return true;
      const tx0 = Math.max(0, Math.floor(r.x / 32)), tx1 = Math.min(curMap.w - 1, Math.floor((r.x + r.w - 0.01) / 32));
      const ty0 = Math.max(0, Math.floor(r.y / 32)), ty1 = Math.min(curMap.h - 1, Math.floor((r.y + r.h - 0.01) / 32));
      for (let l = 0; l < 3; l++) {
        const grid = curMap.layers[l];
        for (let ty = ty0; ty <= ty1; ty++) {
          for (let tx = tx0; tx <= tx1; tx++) {
            const tid = grid[ty][tx];
            if (tid < 0) continue;
            const m = MASKS.get(tid);
            if (m && maskHits(m, r.x - tx * 32, r.y - ty * 32, r.w, r.h)) return true;
          }
        }
      }
      for (const n of curMap.npcs) {
        if (!isNpcPresent(n)) continue;
        const np = getNpcPos(n);
        if (r.x < np.x + 28 && r.x + r.w > np.x + 4 && r.y < np.y + 30 && r.y + r.h > np.y + 8) return true;
      }
      return false;
    }

    function loadMap(name, wx, wy, dir) {
      const m = MAPS.get(name);
      if (!m) return;
      curMap = m;
      prog.currentMap = name; prog.wx = wx; prog.wy = wy;
      if (dir !== undefined) prog.dir = dir;
      prog.visitedMaps[name] = true;
      doorGrace = true; projectiles = [];
      monsters = [];
      m.spawns.forEach((sp, idx) => {
        if (sp.bossId && prog.flags[sp.bossId + '_dead']) return;
        const anim = SPR.monsters[sp.type];
        monsters.push({
          id: idx + 1, type: sp.type, wx: sp.x, wy: sp.y, hp: sp.hp, maxHp: sp.hp,
          atk: sp.atk, xp: sp.xp, gold: sp.gold, ai: sp.ai, radius: sp.radius || 180,
          bossId: sp.bossId, ranged: sp.ranged, size: anim ? anim.size : 32,
          dir: 'bas', frame: 0, tick: 0, moveIdx: idx % 4, hurt: 0, shootCd: 45
        });
        prog.encountered[sp.type] = true;
      });
      SynthAudio.playMusic(m.music || 'aventure');
      addLog('Carte chargée : ' + m.titleFr);
    }

    function openDialogue(dlg) {
      activeDlg = dlg; dlgIdx = 0;
      renderDialogue();
    }
    function renderDialogue() {
      const box = document.getElementById('dlgBox');
      if (!activeDlg) { box.classList.add('hidden'); return; }
      box.classList.remove('hidden');
      document.getElementById('dlgSpeaker').textContent = activeDlg.speaker;
      document.getElementById('dlgText').textContent = activeDlg.lines[dlgIdx] || '';
      const act = document.getElementById('dlgActions');
      act.innerHTML = '';
      if (dlgIdx < activeDlg.lines.length - 1) {
        const b = document.createElement('button');
        b.className = 'btn-primary'; b.textContent = 'Suivant [Espace]';
        b.onclick = () => { dlgIdx++; renderDialogue(); };
        act.appendChild(b);
      } else {
        if (activeDlg.shop) {
          const sb = document.createElement('button');
          sb.className = 'btn-primary'; sb.textContent = 'Ouvrir la boutique';
          sb.onclick = () => { const s = activeDlg.shop; activeDlg = null; renderDialogue(); openShop(s); };
          act.appendChild(sb);
        }
        const cb = document.createElement('button');
        cb.className = activeDlg.shop ? '' : 'btn-primary';
        cb.textContent = 'Fermer [Espace]';
        cb.onclick = () => { activeDlg = null; renderDialogue(); };
        act.appendChild(cb);
      }
    }

    function openShop(kind) {
      activeShop = kind;
      const modal = document.getElementById('shopModal');
      modal.classList.remove('hidden');
      document.getElementById('shopTitle').textContent =
        kind === 'forge' ? 'Armurerie de Maître Brom (' + prog.gold + ' Or)' :
        kind === 'alchemy' ? 'Herboristerie de Lysa (' + prog.gold + ' Or)' : 'Marché (' + prog.gold + ' Or)';
      const list = document.getElementById('shopItems');
      list.innerHTML = '';
      CAT.items.filter(it => it.price && (kind === 'alchemy' ? it.category === 'consumable' : true)).forEach(it => {
        const row = document.createElement('div'); row.className = 'item-row';
        row.innerHTML = '<div><strong>' + it.nameFr + '</strong> (En sac: ' + (prog.inventory[it.id] || 0) + ')<div class="sub">' + it.descFr + '</div></div>';
        const b = document.createElement('button');
        b.textContent = 'Acheter (' + it.price + ' Or)';
        b.disabled = prog.gold < it.price;
        b.onclick = () => { prog.gold -= it.price; prog.inventory[it.id] = (prog.inventory[it.id] || 0) + 1; SynthAudio.sfxHeal(); openShop(kind); };
        row.appendChild(b); list.appendChild(row);
      });
      if (kind !== 'alchemy') {
        CAT.equipment.filter(eq => eq.price > 0 && !prog.ownedEquip.includes(eq.id)).forEach(eq => {
          const row = document.createElement('div'); row.className = 'item-row';
          row.innerHTML = '<div><strong>' + eq.nameFr + '</strong><div class="sub">' + eq.descFr + '</div></div>';
          const b = document.createElement('button');
          b.textContent = 'Acheter (' + eq.price + ' Or)';
          b.disabled = prog.gold < eq.price;
          b.onclick = () => { prog.gold -= eq.price; prog.ownedEquip.push(eq.id); prog.equipped[eq.slot] = eq.id; SynthAudio.sfxForge(); openShop(kind); };
          row.appendChild(b); list.appendChild(row);
        });
      }
    }

    function toggleInventory(force) {
      invOpen = typeof force === 'boolean' ? force : !invOpen;
      const modal = document.getElementById('invModal');
      if (!invOpen) { modal.classList.add('hidden'); return; }
      modal.classList.remove('hidden');
      renderInventory();
    }

    function renderInventory() {
      if (!invOpen) return;
      const st = computeStats(prog);
      document.getElementById('invSub').textContent =
        'Niveau ' + prog.level + ' · ' + prog.gold + ' Or · Points d’aptitude : ' + prog.statPoints +
        ' · Sidérite ×' + (prog.inventory.siderite || 0) + ' · Écaille ×' + (prog.inventory.ecaille_dragon || 0);

      const attrsEl = document.getElementById('invAttrs');
      attrsEl.innerHTML = '';
      [['vitality', 'Vitalité (+4 PV)'], ['strength', 'Force (+2 ATQ)'], ['agility', 'Agilité (+CRIT)'], ['arcane', 'Arcane (+Onde [E])']].forEach(([k, label]) => {
        const r = document.createElement('div'); r.className = 'item-row';
        r.innerHTML = '<span>' + label + ' : <strong>' + prog.attrs[k] + '</strong></span>';
        const b = document.createElement('button'); b.textContent = '+1'; b.disabled = prog.statPoints <= 0;
        b.onclick = () => { prog.statPoints--; prog.attrs[k]++; if (k === 'vitality') prog.hp += 4; renderInventory(); };
        r.appendChild(b); attrsEl.appendChild(r);
      });

      const bagEl = document.getElementById('invBag');
      bagEl.innerHTML = '';
      const ownedItems = CAT.items.filter(i => (prog.inventory[i.id] || 0) > 0);
      if (ownedItems.length === 0) bagEl.innerHTML = '<div class="sub">Sacoche vide.</div>';
      ownedItems.forEach(it => {
        const r = document.createElement('div'); r.className = 'item-row';
        r.innerHTML = '<div><strong>' + it.nameFr + ' ×' + prog.inventory[it.id] + '</strong><div class="sub">' + it.descFr + '</div></div>';
        if (it.heal > 0) {
          const b = document.createElement('button'); b.textContent = 'Boire';
          b.disabled = prog.hp >= st.maxHp;
          b.onclick = () => { prog.inventory[it.id]--; prog.hp = Math.min(st.maxHp, prog.hp + it.heal + prog.attrs.vitality); SynthAudio.sfxHeal(); renderInventory(); };
          r.appendChild(b);
        }
        bagEl.appendChild(r);
      });

      const gearEl = document.getElementById('invGear');
      const inForge = prog.currentMap === 'forge';
      gearEl.innerHTML = '<div class="sub" style="margin-bottom:6px;color:' + (inForge ? 'var(--emerald)' : 'var(--amber-light)') + '">' +
        (inForge ? 'Enclume de la Forge d’Airain active : trempe (+1/+2/+3) disponible.' : 'Trempe (+1/+2/+3) réservée à l’intérieur de la Forge d’Airain.') + '</div>';
      CAT.equipment.filter(e => prog.ownedEquip.includes(e.id)).forEach(eq => {
        const eqp = prog.equipped[eq.slot] === eq.id;
        const upg = prog.upgrades[eq.id] || 0;
        const mat = upg >= 2 ? 'ecaille_dragon' : (eq.upgradeMat || 'siderite');
        const cost = (upg + 1) * 60;
        const canUpg = inForge && eq.upgradeMat && upg < 3 && prog.gold >= cost && (prog.inventory[mat] || 0) >= 1;
        const r = document.createElement('div'); r.className = 'item-row';
        r.innerHTML = '<div><strong>' + eq.nameFr + (upg > 0 ? ' +' + upg : '') + '</strong> ' +
          (eqp ? '<span style="color:var(--amber-light)">[Équipé]</span>' : '') +
          '<div class="sub">' + eq.descFr + '</div></div>';
        const btns = document.createElement('div'); btns.className = 'row';
        if (eq.upgradeMat && upg < 3) {
          const fb = document.createElement('button');
          fb.textContent = inForge ? ('Forger +' + (upg + 1) + ' (' + cost + ' Or)') : 'À la Forge uniquement';
          fb.disabled = !canUpg;
          fb.onclick = () => { if (!inForge) return; prog.gold -= cost; prog.inventory[mat]--; prog.upgrades[eq.id] = upg + 1; SynthAudio.sfxForge(); renderInventory(); };
          btns.appendChild(fb);
        }
        const eb = document.createElement('button');
        eb.className = eqp ? '' : 'btn-primary';
        eb.textContent = eqp ? 'Retirer' : 'Équiper';
        eb.onclick = () => {
          prog.equipped[eq.slot] = eqp ? null : eq.id;
          const ns = computeStats(prog); if (prog.hp > ns.maxHp) prog.hp = ns.maxHp;
          renderInventory();
        };
        btns.appendChild(eb); r.appendChild(btns); gearEl.appendChild(r);
      });
    }

    function usePotion() {
      const st = computeStats(prog);
      if (prog.hp >= st.maxHp) { showToast('Points de vie déjà au maximum'); return; }
      const id = (prog.inventory.potion || 0) > 0 ? 'potion' : (prog.inventory.elixir || 0) > 0 ? 'elixir' : null;
      if (!id) { showToast('Aucune potion en sacoche'); return; }
      const def = CAT.items.find(i => i.id === id);
      prog.inventory[id]--;
      prog.hp = Math.min(st.maxHp, prog.hp + def.heal + prog.attrs.vitality);
      SynthAudio.sfxHeal();
      showToast('+' + (def.heal + prog.attrs.vitality) + ' PV');
    }

    function getFacingProbe() {
      const hb = { x: prog.wx - 12, y: prog.wy - 10, w: 25, h: 20 };
      if (prog.dir === 'haut') return { x: hb.x - 4, y: hb.y - 26, w: hb.w + 8, h: 28 };
      if (prog.dir === 'bas') return { x: hb.x - 4, y: hb.y + hb.h, w: hb.w + 8, h: 28 };
      if (prog.dir === 'gauche') return { x: hb.x - 28, y: hb.y - 4, w: 28, h: hb.h + 8 };
      return { x: hb.x + hb.w, y: hb.y - 4, w: 28, h: hb.h + 8 };
    }
    function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

    function tryInteract() {
      const pr = getFacingProbe();
      for (const n of curMap.npcs) {
        if (!isNpcPresent(n)) continue;
        const np = getNpcPos(n);
        if (overlap(pr, { x: np.x, y: np.y, w: 32, h: 32 })) {
          const res = resolveNpc(n.id, prog);
          if (res.mutate) {
            res.mutate(prog);
            const st = computeStats(prog);
            if (prog.hp > st.maxHp) prog.hp = st.maxHp;
          }
          openDialogue(res.dlg);
          return true;
        }
      }
      for (const ch of curMap.chests) {
        if (!prog.openedChests[ch.id] && overlap(pr, { x: ch.x - 4, y: ch.y, w: 40, h: 32 })) {
          prog.openedChests[ch.id] = true;
          if (ch.gold) prog.gold += ch.gold;
          if (ch.equip && !prog.ownedEquip.includes(ch.equip)) prog.ownedEquip.push(ch.equip);
          if (ch.item) prog.inventory[ch.item] = (prog.inventory[ch.item] || 0) + 1;
          SynthAudio.sfxForge();
          showToast('Coffre ouvert !');
          addLog('Coffre ouvert : ' + ch.id);
          return true;
        }
      }
      for (const st of curMap.steles) {
        if (overlap(pr, { x: st.x, y: st.y, w: 32, h: 32 })) {
          const lore = CAT.lore.find(l => l.id === st.id);
          if (lore) {
            if (!prog.unlockedLore[lore.id]) { prog.unlockedLore[lore.id] = true; prog.gold += 20; prog.xp += 35; }
            openDialogue({ speaker: lore.titleFr, lines: lore.textFr });
          }
          return true;
        }
      }
      return false;
    }

    function damageMonster(m, dmg) {
      m.hp -= dmg; m.hurt = 6;
      SynthAudio.sfxHit();
      popups.push({ wx: m.wx + m.size / 2, wy: m.wy, text: '-' + dmg, color: '#fde047', ttl: 20 });
      if (m.hp <= 0) {
        prog.gold += m.gold; prog.xp += m.xp;
        prog.kills[m.type] = (prog.kills[m.type] || 0) + 1;
        if (m.bossId) {
          prog.flags[m.bossId + '_dead'] = true;
          addLog('BOSS VAINCU : ' + m.bossId + ' (+' + m.xp + ' XP)');
          if (m.bossId === 'boss_pyraxis') {
            openDialogue({ speaker: 'Victoire Finale !', lines: [
              "Pyraxis, le Grand Dragon Rouge, est vaincu ! Les Quatre Éclats d'Ethynd illuminent de nouveau le Royaume !"
            ]});
          }
        }
        while (prog.xp >= xpReq(prog.level) && prog.level < 30) {
          prog.xp -= xpReq(prog.level); prog.level++; prog.statPoints += 2;
          prog.hp = computeStats(prog).maxHp;
          showToast('Niveau ' + prog.level + ' atteint ! (+2 pts [I])');
        }
      }
    }

    // Bot Autopilot across all 5 Acts
    const BOT_TARGETS = [
      { map: 'grotte', bossId: 'boss_morvath', shard: 'crystal_aube', label: 'Acte I : Morvath (Grotte)' },
      { map: 'oubliettes', bossId: 'boss_malakor', shard: 'crystal_fer', label: 'Acte II : Sire Malakor (Oubliettes)' },
      { map: 'temple', bossId: 'boss_leviathan', shard: 'crystal_azur', label: 'Acte III : Léviathanis (Temple)' },
      { map: 'crypte', bossId: 'boss_vorgath', shard: 'crystal_amethyste', label: 'Acte IV : Vorgath (Nécropole)' },
      { map: 'citadelle', bossId: 'boss_pyraxis', shard: null, label: 'Acte V : Dragon Rouge Pyraxis' },
    ];
    function setupBotStage(idx) {
      botStage = idx; botTicks = 0;
      if (idx >= BOT_TARGETS.length) {
        botMode = false; updateModeButtons();
        addLog('Parcours Bot 5 Actes terminé avec succès !');
        return;
      }
      const st = BOT_TARGETS[idx];
      prog.level = Math.max(prog.level, 14);
      prog.ownedEquip = Array.from(new Set([...prog.ownedEquip, 'sword_solar', 'armor_draconic', 'shield_prismatic', 'relic_prism']));
      prog.equipped = { weapon: 'sword_solar', armor: 'armor_draconic', shield: 'shield_prismatic', relic: 'relic_prism' };
      prog.hp = computeStats(prog).maxHp;
      const m = MAPS.get(st.map);
      const sp = m.spawns.find(s => s.bossId === st.bossId);
      loadMap(st.map, sp ? sp.x + 28 : 320, sp ? sp.y + 88 : 320, 'haut');
      addLog('Bot -> ' + st.label);
    }

    function runBotAI() {
      botTicks++;
      const st = BOT_TARGETS[botStage];
      if (!st) return;
      const boss = monsters.find(m => m.bossId === st.bossId && m.hp > 0);
      keys.up = keys.down = keys.left = keys.right = keys.attack = keys.skill = false;
      if (boss) {
        prog.hp = computeStats(prog).maxHp;
        const tx = boss.wx + boss.size / 2, ty = boss.wy + boss.size + 8;
        const dx = tx - prog.wx, dy = ty - prog.wy;
        if (Math.hypot(dx, dy) > 10) {
          if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0) keys.right = true; else keys.left = true; }
          else { if (dy > 0) keys.down = true; else keys.up = true; }
        } else { prog.dir = 'haut'; }
        keys.attack = botTicks % 9 === 1;
        keys.skill = botTicks % 45 === 2;
      } else {
        const it = st.shard ? curMap.items.find(x => x.id === st.shard) : null;
        if (it && !(prog.inventory[st.shard] > 0)) {
          const dx = it.x + 12 - prog.wx, dy = it.y + 12 - prog.wy;
          if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0) keys.right = true; else keys.left = true; }
          else { if (dy > 0) keys.down = true; else keys.up = true; }
        } else {
          setupBotStage(botStage + 1);
        }
      }
    }

    function tick() {
      tileTick++;
      if (tileTick >= 8) {
        tileTick = 0;
        for (const [s, len] of ANIM_TILES.entries()) {
          const c = CUR_TILE.get(s) || s;
          CUR_TILE.set(s, c + 1 < s + len ? c + 1 : s);
        }
      }
      if (activeDlg || invOpen || activeShop) return;
      if (botMode) runBotAI();

      const stats = computeStats(prog);
      if (hurtImm > 0) hurtImm--;
      if (skillCd > 0) skillCd--;

      const atkEdge = keys.attack && !prevAtk;
      const sklEdge = keys.skill && !prevSkill;
      const potEdge = keys.potion && !prevPot;
      prevAtk = keys.attack; prevSkill = keys.skill; prevPot = keys.potion;

      if (potEdge) usePotion();
      if (sklEdge && skillCd <= 0) {
        skillCd = stats.skillCooldownTicks;
        const v = prog.dir === 'haut' ? [0, -9] : prog.dir === 'bas' ? [0, 9] : prog.dir === 'gauche' ? [-9, 0] : [9, 0];
        projectiles.push({ fromPlayer: true, wx: prog.wx, wy: prog.wy - 4, vx: v[0], vy: v[1], dmg: stats.arcanePower, ttl: 28, hit: new Set() });
      }
      if (atkEdge && !attacking) {
        if (!tryInteract()) { attacking = true; animFrame = 0; animTick = 0; hitThisSwing.clear(); }
      }

      if (attacking) {
        animTick++;
        if (animTick >= 2) {
          animTick = 0; animFrame++;
          const sb = getFacingProbe();
          monsters.forEach(m => {
            if (m.hp > 0 && m.ai !== 'passive' && !hitThisSwing.has(m.id)) {
              if (overlap(sb, { x: m.wx + 4, y: m.wy + 4, w: m.size - 8, h: m.size - 8 })) {
                hitThisSwing.add(m.id);
                damageMonster(m, stats.attack);
              }
            }
          });
          if (animFrame >= 4) { attacking = false; animFrame = 0; }
        }
      } else {
        let dx = 0, dy = 0;
        if (keys.up) { dy -= stats.speed; prog.dir = 'haut'; }
        else if (keys.down) { dy += stats.speed; prog.dir = 'bas'; }
        if (keys.left) { dx -= stats.speed; prog.dir = 'gauche'; }
        else if (keys.right) { dx += stats.speed; prog.dir = 'droite'; }
        if (dx && dy) { dx = Math.round(dx * 0.707); dy = Math.round(dy * 0.707); }
        if (dx || dy) {
          if (!collides({ x: prog.wx + dx - 12, y: prog.wy - 10, w: 25, h: 20 })) prog.wx += dx;
          if (!collides({ x: prog.wx - 12, y: prog.wy + dy - 10, w: 25, h: 20 })) prog.wy += dy;
          animTick++; if (animTick >= 3) { animTick = 0; animFrame = (animFrame + 1) % 9; }
        } else { animFrame = 0; }
      }

      // Ground items (Shards, Moonflowers)
      const phb = { x: prog.wx - 12, y: prog.wy - 10, w: 25, h: 20 };
      curMap.items.forEach(it => {
        const key = curMap.name + ':' + it.id;
        if (prog.takenMapItems[key]) return;
        if (it.afterFlag && !prog.flags[it.afterFlag]) return;
        if (overlap(phb, { x: it.x, y: it.y, w: 28, h: 28 })) {
          prog.takenMapItems[key] = true;
          prog.inventory[it.id] = (prog.inventory[it.id] || 0) + 1;
          SynthAudio.sfxHeal();
          const def = CAT.items.find(x => x.id === it.id);
          showToast('Obtenu : ' + (def ? def.nameFr : it.id));
          addLog('Objet ramassé : ' + (def ? def.nameFr : it.id));
        }
      });

      // Doors
      let onDoor = null;
      for (const d of curMap.doors) {
        if (overlap(phb, d)) { onDoor = d; break; }
      }
      if (!onDoor) doorGrace = false;
      else if (!doorGrace) {
        if (onDoor.reqFlag && !isFlagUnlocked(onDoor.reqFlag)) {
          doorGrace = true;
          openDialogue({ speaker: 'Passage verrouillé', lines: ['Ce passage nécessite d’avancer dans votre quête actuelle (' + onDoor.reqFlag + ').'] });
        } else {
          loadMap(onDoor.map, onDoor.dx, onDoor.dy, prog.dir);
          return;
        }
      }

      // Monsters AI
      monsters = monsters.filter(m => m.hp > 0);
      monsters.forEach(m => {
        if (m.hurt > 0) m.hurt--;
        m.tick++; if (m.tick >= 6) { m.tick = 0; m.frame = (m.frame + 1) % 3; }
        if (m.ai === 'passive') return;
        const cx = m.wx + m.size / 2, cy = m.wy + m.size / 2;
        const dist = Math.hypot(prog.wx - cx, prog.wy - cy);
        let vx = 0, vy = 0;
        if (dist <= m.radius) {
          vx = ((prog.wx - cx) / Math.max(1, dist)) * (m.ai === 'boss' ? 2.1 : 1.7);
          vy = ((prog.wy - cy) / Math.max(1, dist)) * (m.ai === 'boss' ? 2.1 : 1.7);
          if (m.ranged) {
            m.shootCd--;
            if (m.shootCd <= 0) {
              m.shootCd = m.ai === 'boss' ? 50 : 72;
              const ang = Math.atan2(prog.wy - cy, prog.wx - cx);
              projectiles.push({ fromPlayer: false, wx: cx, wy: cy, vx: Math.cos(ang) * 5.2, vy: Math.sin(ang) * 5.2, dmg: m.atk + 2, ttl: 55 });
            }
          }
        }
        if ((vx || vy) && !collides({ x: m.wx + vx + 6, y: m.wy + vy + 6, w: m.size - 12, h: m.size - 12 })) {
          m.wx += vx; m.wy += vy;
          m.dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'droite' : 'gauche') : (vy > 0 ? 'bas' : 'haut');
        }
        if (hurtImm <= 0 && overlap(phb, { x: m.wx + 5, y: m.wy + 5, w: m.size - 10, h: m.size - 10 })) {
          const minFloor = Math.max(1, Math.ceil(m.atk * 0.28));
          const dmg = Math.max(minFloor, m.atk - Math.floor(stats.defense * 0.55));
          prog.hp = Math.max(0, prog.hp - dmg); hurtImm = 26;
          popups.push({ wx: prog.wx, wy: prog.wy - 20, text: '-' + dmg, color: '#fb7185', ttl: 20 });
          if (prog.hp <= 0) {
            prog.hp = stats.maxHp;
            loadMap('maison', 306, 160, 'bas');
            showToast('Secouru et ramené chez le Sage Aldric !');
          }
        }
      });

      // Projectiles
      const nextProj = [];
      for (const pr of projectiles) {
        pr.wx += pr.vx; pr.wy += pr.vy; pr.ttl--;
        if (pr.ttl <= 0) continue;
        if (pr.fromPlayer) {
          monsters.forEach(m => {
            if (m.hp > 0 && m.ai !== 'passive' && !pr.hit.has(m.id)) {
              if (Math.hypot(m.wx + m.size / 2 - pr.wx, m.wy + m.size / 2 - pr.wy) < m.size / 2 + 16) {
                pr.hit.add(m.id); damageMonster(m, pr.dmg);
              }
            }
          });
          nextProj.push(pr);
        } else {
          if (hurtImm <= 0 && Math.hypot(prog.wx - pr.wx, pr.wy - pr.wy) < 18) {
            const minFloor = Math.max(1, Math.ceil(pr.dmg * 0.28));
            const dmg = Math.max(minFloor, pr.dmg - Math.floor(stats.defense * 0.55));
            prog.hp = Math.max(0, prog.hp - dmg); hurtImm = 26;
            continue;
          }
          nextProj.push(pr);
        }
      }
      projectiles = nextProj;
      popups = popups.filter(p => { p.wy -= 0.7; p.ttl--; return p.ttl > 0; });
    }

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let flamePhase = 0;
    function drawTileLayer(idx, camX, camY) {
      const grid = curMap.layers[idx];
      const cols = WORLD.tileCols;
      const c0 = Math.max(0, Math.floor(camX / 32)), c1 = Math.min(curMap.w - 1, Math.ceil((camX + 512) / 32));
      const r0 = Math.max(0, Math.floor(camY / 32)), r1 = Math.min(curMap.h - 1, Math.ceil((camY + 352) / 32));
      for (let ty = r0; ty <= r1; ty++) {
        for (let tx = c0; tx <= c1; tx++) {
          const rawTid = grid[ty][tx];
          if (rawTid < 0) continue;
          const dx = Math.round((tx * 32 - camX) * 1.5), dy = Math.round((ty * 32 - camY) * 1.5);
          if (rawTid === 2576 && SPR.torchStand && SPR.torchStand.length) {
            const tf = SPR.torchStand[(flamePhase + tx + ty) % SPR.torchStand.length];
            ctx.drawImage(tf, dx, dy, TILE_SHOW, TILE_SHOW);
            continue;
          }
          let tid = CUR_TILE.has(rawTid) ? CUR_TILE.get(rawTid) : rawTid;
          const sx = (tid % cols) * 32, sy = Math.floor(tid / cols) * 32;
          ctx.drawImage(SPR.tileset, sx, sy, 32, 32, dx, dy, TILE_SHOW, TILE_SHOW);
          if (rawTid === 2573 && SPR.brazierFlame && SPR.brazierFlame.length) {
            const bf = SPR.brazierFlame[(flamePhase + tx * 3 + ty) % SPR.brazierFlame.length];
            ctx.drawImage(bf, dx, dy - 18, TILE_SHOW, TILE_SHOW);
          }
        }
      }
    }

    function render() {
      flamePhase = Math.floor(performance.now() / 120);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#070a10'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      const mapW = curMap.w * 32, mapH = curMap.h * 32;
      const camX = mapW <= 512 ? -(512 - mapW) / 2 : Math.max(0, Math.min(mapW - 512, prog.wx - 256));
      const camY = mapH <= 352 ? -(352 - mapH) / 2 : Math.max(0, Math.min(mapH - 352, prog.wy - 176));
      const sx = wx => Math.round((wx - camX) * 1.5), sy = wy => Math.round((wy - camY) * 1.5);

      drawTileLayer(0, camX, camY);
      drawTileLayer(1, camX, camY);
      drawTileLayer(2, camX, camY);

      if (curMap.name === 'chateau' && SPR.throne) {
        ctx.drawImage(SPR.throne, sx(552), sy(80), 72, 72);
      }

      curMap.steles.forEach(st => {
        const x = sx(st.x), y = sy(st.y);
        ctx.fillStyle = '#334155'; ctx.fillRect(x + 10, y + 6, 28, 38);
        ctx.fillStyle = prog.unlockedLore[st.id] ? '#38bdf8' : '#f59e0b';
        ctx.fillRect(x + 18, y + 14, 12, 18);
      });
      curMap.chests.forEach(ch => {
        const img = prog.openedChests[ch.id] ? SPR.chestOpen : SPR.chestClosed;
        if (img) ctx.drawImage(img, sx(ch.x - 4), sy(ch.y), 60, 48);
      });
      curMap.items.forEach(it => {
        if (prog.takenMapItems[curMap.name + ':' + it.id]) return;
        if (it.afterFlag && !prog.flags[it.afterFlag]) return;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(sx(it.x + 14), sy(it.y + 14), 10, 0, Math.PI * 2); ctx.fill();
      });

      const drawables = [];
      curMap.npcs.forEach(n => {
        if (!isNpcPresent(n)) return;
        const np = getNpcPos(n);
        drawables.push({ y: np.y + 32, fn: () => {
          const bank = SPR.npcs[n.type] || SPR.npcs.villageois;
          const sp = bank && (bank[n.dir] || bank.bas);
          if (sp) ctx.drawImage(sp, sx(np.x), sy(np.y), 48, 48);
        }});
      });
      monsters.forEach(m => {
        drawables.push({ y: m.wy + m.size, fn: () => {
          const set = SPR.monsters[m.type];
          const arr = set && (set.walk[m.dir] || set.walk.bas);
          const img = arr && arr[m.frame % arr.length];
          const dw = Math.round(m.size * 1.5);
          if (img) ctx.drawImage(img, sx(m.wx), sy(m.wy), dw, dw);
          if (m.ai !== 'passive' && m.hp < m.maxHp) {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(sx(m.wx), sy(m.wy) - 8, dw, 5);
            ctx.fillStyle = '#ef4444'; ctx.fillRect(sx(m.wx), sy(m.wy) - 8, Math.round(dw * (m.hp / m.maxHp)), 5);
          }
        }});
      });
      drawables.push({ y: prog.wy + 16, fn: () => {
        if (hurtImm > 0 && Math.floor(hurtImm / 2) % 2 === 1) return;
        const bank = attacking && SPR.player.attack ? SPR.player.attack : SPR.player.walk;
        const arr = bank[prog.dir] || bank.bas;
        const img = arr[animFrame % arr.length];
        if (img) ctx.drawImage(img, sx(prog.wx - 32), sy(prog.wy - 32), 96, 96);
      }});
      drawables.sort((a, b) => a.y - b.y).forEach(d => d.fn());

      projectiles.forEach(pr => {
        ctx.fillStyle = pr.fromPlayer ? '#38bdf8' : '#fb7185';
        ctx.beginPath(); ctx.arc(sx(pr.wx), sy(pr.wy), pr.fromPlayer ? 11 : 7, 0, Math.PI * 2); ctx.fill();
      });

      drawTileLayer(3, camX, camY);

      popups.forEach(p => {
        ctx.font = 'bold 14px monospace'; ctx.fillStyle = p.color;
        ctx.fillText(p.text, sx(p.wx) - 10, sy(p.wy));
      });
    }

    function syncHud() {
      const st = computeStats(prog);
      const req = xpReq(prog.level);
      document.getElementById('hudHp').textContent = prog.hp + '/' + st.maxHp + ' PV';
      document.getElementById('barHp').style.width = Math.max(0, Math.min(100, (prog.hp / st.maxHp) * 100)) + '%';
      document.getElementById('hudLv').textContent = 'Niv. ' + prog.level + (prog.statPoints > 0 ? ' (+' + prog.statPoints + ')' : '');
      document.getElementById('hudXp').textContent = prog.xp + '/' + req + ' XP';
      document.getElementById('barXp').style.width = Math.max(0, Math.min(100, (prog.xp / req) * 100)) + '%';
      document.getElementById('hudGold').textContent = prog.gold + ' Or';
      document.getElementById('hudAtkDef').textContent = st.attack + ' / ' + st.defense;
      document.getElementById('hudMap').textContent = curMap.titleFr;
      document.getElementById('btnHeal').textContent = 'Soin [R] ×' + ((prog.inventory.potion || 0) + (prog.inventory.elixir || 0));
      document.getElementById('btnSkill').textContent = skillCd > 0 ? 'Onde [E] ' + Math.ceil(skillCd / 30) + 's' : 'Onde [E] Prête';

      const boss = monsters.find(m => m.ai === 'boss' && m.hp > 0);
      const bh = document.getElementById('bossHud');
      if (boss) {
        bh.classList.remove('hidden');
        const bDef = CAT.bestiary.find(b => b.id === boss.type);
        document.getElementById('bossName').textContent = bDef ? bDef.nameFr : boss.type;
        document.getElementById('bossHp').textContent = boss.hp + '/' + boss.maxHp;
        document.getElementById('bossBar').style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + '%';
      } else bh.classList.add('hidden');

      const shards = [['crystal_aube', 'Aube'], ['crystal_fer', 'Fer'], ['crystal_azur', 'Azur'], ['crystal_amethyste', 'Améthyste']];
      document.getElementById('shardsRow').textContent = shards.map(([k, n]) => ((prog.inventory[k] || 0) > 0 ? '◆ ' : '◇ ') + n).join(' · ');

      document.getElementById('kUp').classList.toggle('on', keys.up);
      document.getElementById('kLeft').classList.toggle('on', keys.left);
      document.getElementById('kDown').classList.toggle('on', keys.down);
      document.getElementById('kRight').classList.toggle('on', keys.right);
      document.getElementById('kAtk').classList.toggle('on', keys.attack);
      document.getElementById('kSkill').classList.toggle('on', keys.skill);
      document.getElementById('kPot').classList.toggle('on', keys.potion);
      document.getElementById('kInv').classList.toggle('on', invOpen);
    }

    // Populate Teleport selector
    const selTel = document.getElementById('selTeleport');
    WORLD.maps.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.name; opt.textContent = m.titleFr + ' (' + m.region + ')';
      if (m.name === prog.currentMap) opt.selected = true;
      selTel.appendChild(opt);
    });
    document.getElementById('btnTeleport').onclick = () => {
      const target = MAPS.get(selTel.value);
      if (!target) return;
      botMode = false; updateModeButtons();
      let tx = Math.floor((target.w * 32) / 2), ty = Math.floor((target.h * 32) / 2);
      if (target.name === 'maison') { tx = 306; ty = 160; }
      else if (target.name === 'chateau') { tx = 560; ty = 320; }
      else {
        for (const om of WORLD.maps) {
          const inc = om.doors.find(d => d.map === target.name);
          if (inc) { tx = inc.dx; ty = inc.dy; break; }
        }
      }
      loadMap(target.name, tx, ty, 'haut');
    };

    // Presets
    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.onclick = () => {
        botMode = false; updateModeButtons();
        const p = btn.getAttribute('data-preset');
        if (p === 'act1') { loadMap('maison', 306, 160, 'bas'); }
        else if (p === 'throne') {
          prog.flags.talked_sage = true; prog.flags.act1_done = true; prog.inventory.crystal_aube = 1;
          loadMap('chateau', 560, 320, 'haut');
        } else if (p === 'forest') {
          prog.flags.act1_done = true; prog.flags.act2_started = true;
          prog.inventory.crystal_aube = 1; prog.inventory.crystal_fer = 1;
          loadMap('foret', 1520, 640, 'gauche');
        } else if (p === 'dragon') {
          prog.level = 16;
          prog.ownedEquip = Array.from(new Set([...prog.ownedEquip, 'sword_solar', 'armor_draconic', 'shield_prismatic', 'relic_prism']));
          prog.equipped = { weapon: 'sword_solar', armor: 'armor_draconic', shield: 'shield_prismatic', relic: 'relic_prism' };
          prog.hp = computeStats(prog).maxHp;
          loadMap('citadelle', 640, 880, 'haut');
        }
      };
    });

    function updateModeButtons() {
      document.getElementById('btnModeManual').classList.toggle('btn-active', !botMode);
      document.getElementById('btnModeBot').classList.toggle('btn-active', botMode);
    }
    document.getElementById('btnModeManual').onclick = () => { botMode = false; updateModeButtons(); addLog('Mode Clavier activé.'); };
    document.getElementById('btnModeBot').onclick = () => { botMode = true; updateModeButtons(); setupBotStage(0); };
    document.getElementById('selSpeed').onchange = e => { simSpeed = Number(e.target.value) || 1; };
    document.getElementById('btnMusic').onclick = e => {
      SynthAudio.muted = !SynthAudio.muted;
      if (SynthAudio.muted && SynthAudio.timer) { clearInterval(SynthAudio.timer); SynthAudio.timer = null; }
      else if (!SynthAudio.muted) SynthAudio.startLoop();
      e.target.textContent = SynthAudio.muted ? '♫ Musique : Coupée' : '♫ Musique (80s) : Active';
    };
    document.getElementById('btnInv').onclick = () => toggleInventory();
    document.getElementById('btnTouchInv').onclick = () => toggleInventory();
    document.getElementById('btnCloseInv').onclick = () => toggleInventory(false);
    document.getElementById('btnGiftPack').onclick = () => {
      prog.gold += 500;
      prog.inventory.siderite = (prog.inventory.siderite || 0) + 3;
      prog.inventory.ecaille_dragon = (prog.inventory.ecaille_dragon || 0) + 2;
      prog.statPoints += 2;
      SynthAudio.sfxForge(); renderInventory();
    };
    document.getElementById('btnCloseShop').onclick = () => { activeShop = null; document.getElementById('shopModal').classList.add('hidden'); };
    document.getElementById('btnHeal').onclick = () => usePotion();
    document.getElementById('btnSkill').onclick = () => { keys.skill = true; setTimeout(() => { keys.skill = false; }, 60); };
    document.getElementById('btnSaveLocal').onclick = () => {
      localStorage.setItem('ethynd_standalone_save_v1', JSON.stringify(prog));
      showToast('Partie sauvegardée dans le navigateur !');
    };
    document.getElementById('btnLoadLocal').onclick = () => {
      const raw = localStorage.getItem('ethynd_standalone_save_v1');
      if (!raw) { showToast('Aucune sauvegarde locale trouvée.'); return; }
      prog = JSON.parse(raw);
      loadMap(prog.currentMap, prog.wx, prog.wy, prog.dir);
      showToast('Sauvegarde restaurée !');
    };

    document.querySelectorAll('[data-hold]').forEach(btn => {
      const k = btn.getAttribute('data-hold');
      btn.onpointerdown = () => { botMode = false; updateModeButtons(); keys[k] = true; };
      btn.onpointerup = () => { keys[k] = false; };
      btn.onpointerleave = () => { keys[k] = false; };
    });

    window.addEventListener('keydown', e => {
      if (e.code === 'KeyI') { e.preventDefault(); toggleInventory(); return; }
      if (e.code === 'Escape' || e.code === 'Backspace' || (e.code === 'KeyB' && (activeDlg || invOpen || activeShop))) {
        e.preventDefault();
        activeDlg = null; renderDialogue(); toggleInventory(false); activeShop = null; document.getElementById('shopModal').classList.add('hidden'); return;
      }
      if (activeDlg && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        if (dlgIdx < activeDlg.lines.length - 1) { dlgIdx++; renderDialogue(); }
        else { activeDlg = null; renderDialogue(); }
        return;
      }
      if (invOpen || activeShop) return;
      if (['ArrowUp','KeyW','KeyZ','ArrowDown','KeyS','ArrowLeft','KeyA','KeyQ','ArrowRight','KeyD','Space','KeyX','KeyE','KeyC','KeyR'].includes(e.code)) {
        e.preventDefault();
        if (botMode) { botMode = false; updateModeButtons(); }
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyZ') keys.up = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = true;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
      if (e.code === 'Space' || e.code === 'KeyX' || e.code === 'Enter') keys.attack = true;
      if (e.code === 'KeyE' || e.code === 'KeyC') keys.skill = true;
      if (e.code === 'KeyR') keys.potion = true;
    });
    window.addEventListener('keyup', e => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyZ') keys.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = false;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
      if (e.code === 'Space' || e.code === 'KeyX' || e.code === 'Enter') keys.attack = false;
      if (e.code === 'KeyE' || e.code === 'KeyC') keys.skill = false;
      if (e.code === 'KeyR') keys.potion = false;
    });

    loadMap(prog.currentMap, prog.wx, prog.wy, prog.dir);
    let last = performance.now(), acc = 0, frames = 0;
    function loop(now) {
      acc += Math.min(100, now - last); last = now;
      while (acc >= 1000 / 30) {
        for (let s = 0; s < simSpeed; s++) tick();
        acc -= 1000 / 30;
      }
      render();
      frames++;
      if (frames % 4 === 0) syncHud();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
})();
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const fileName = 'ethynd_chroniques_simulation.html';
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return fileName;
}
