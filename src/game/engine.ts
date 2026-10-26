import { audioEngine } from './audioEngine';
import {
  BESTIARY_CATALOG,
  EQUIPMENT_CATALOG,
  ITEM_CATALOG,
  LORE_CODEX,
  QUEST_CATALOG,
  computeDerivedStats,
  isFlagUnlocked,
  isNpcPresent,
  resolveDoorDenyDialogue,
  resolveNpcDialogue,
  xpRequiredForLevel,
} from './content';
import { SpriteBank } from './spriteBank';
import {
  ActiveDialogue,
  ChestDef,
  Direction,
  LoreEntryDef,
  MapData,
  NpcDef,
  PlayerProgress,
  SteleDef,
  WorldBundle,
} from './types';

export const VIEW_W = 768;
export const VIEW_H = 528;
export const TILE_LOGIC = 32;
export const TILE_SHOW = 48; // 1.5x crisp pixel scale (16x11 tiles visible)

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LiveMonster {
  id: number;
  type: string;
  wx: number;
  wy: number;
  homeX: number;
  homeY: number;
  hp: number;
  maxHp: number;
  atk: number;
  xp: number;
  gold: number;
  ai: 'passive' | 'wander' | 'chase' | 'ranged' | 'boss';
  radius: number;
  bossId?: string;
  ranged?: 'fireball' | 'frostbolt' | 'shadowbolt' | 'poison_dart';
  size: number;
  dir: Direction;
  frame: number;
  animTick: number;
  moveDirIdx: number;
  hurtFlash: number;
  shootCooldown: number;
  kbX: number;
  kbY: number;
}

interface Projectile {
  fromPlayer: boolean;
  kind: 'arcane_wave' | 'fireball' | 'frostbolt' | 'shadowbolt' | 'poison_dart';
  wx: number;
  wy: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  ttl: number;
  color: string;
  hitIds: Set<number>;
}

interface FloatingText {
  wx: number;
  wy: number;
  text: string;
  color: string;
  ttl: number;
}

export interface EngineSnapshot {
  skillCooldownRatio: number;
  activeBoss: { nameFr: string; nameEn: string; hp: number; maxHp: number } | null;
  toast: string | null;
  nearbyPrompt: string | null;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function decodeBase64Mask(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

function maskHitsRect(mask: Uint8Array, rx: number, ry: number, rw: number, rh: number): boolean {
  const x0 = Math.max(0, Math.floor(rx));
  const y0 = Math.max(0, Math.floor(ry));
  const x1 = Math.min(32, Math.ceil(rx + rw));
  const y1 = Math.min(32, Math.ceil(ry + rh));
  if (x0 >= x1 || y0 >= y1) return false;
  for (let y = y0; y < y1; y++) {
    const rowOff = y * 4;
    for (let x = x0; x < x1; x++) {
      const b = mask[rowOff + (x >> 3)];
      if ((b >> (7 - (x & 7))) & 1) return true;
    }
  }
  return false;
}

export class EthyndEngine {
  private world: WorldBundle;
  private sprites: SpriteBank;
  private masks: Map<number, Uint8Array> = new Map();
  private mapByName: Map<string, MapData> = new Map();

  public currentMap!: MapData;
  private animTiles: Map<number, number> = new Map();
  private currentTileDisplay: Map<number, number> = new Map();
  private tileAnimCounter = 0;

  private monsters: LiveMonster[] = [];
  private projectiles: Projectile[] = [];
  private popups: FloatingText[] = [];

  public progress: PlayerProgress;
  private lang: 'fr' | 'en' = 'fr';

  // Player animation & combat state
  private moving = false;
  private attacking = false;
  private animFrame = 0;
  private animCounter = 0;
  private hurtImmunity = 0;
  private skillCooldown = 0;
  private doorGraceUntilLeave = false;
  private hitMonstersThisSwing: Set<number> = new Set();

  // Toast notification
  private toastText: string | null = null;
  private toastTicks = 0;

  // Callbacks to React UI
  private onProgressChange: (p: PlayerProgress) => void;
  private onOpenDialogue: (dlg: ActiveDialogue) => void;
  private onOpenLore: (lore: LoreEntryDef, isNew: boolean) => void;
  private onPhaseChange: (phase: 'gameover' | 'victory') => void;
  private silentAudio = false;

  public keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    skill: false,
    potion: false,
  };
  private prevAttack = false;
  private prevSkill = false;
  private prevPotion = false;
  private playTickCounter = 0;

  constructor(
    world: WorldBundle,
    sprites: SpriteBank,
    initialProgress: PlayerProgress,
    callbacks: {
      onProgressChange: (p: PlayerProgress) => void;
      onOpenDialogue: (dlg: ActiveDialogue) => void;
      onOpenLore: (lore: LoreEntryDef, isNew: boolean) => void;
      onPhaseChange: (phase: 'gameover' | 'victory') => void;
      silentAudio?: boolean;
    }
  ) {
    this.world = world;
    this.sprites = sprites;
    this.progress = structuredClone(initialProgress);
    this.onProgressChange = callbacks.onProgressChange;
    this.onOpenDialogue = callbacks.onOpenDialogue;
    this.onOpenLore = callbacks.onOpenLore;
    this.onPhaseChange = callbacks.onPhaseChange;
    this.silentAudio = Boolean(callbacks.silentAudio);

    for (const [k, b64] of Object.entries(world.masks)) {
      this.masks.set(Number(k), decodeBase64Mask(b64));
    }
    for (const [k, v] of Object.entries(world.anim)) {
      const a = Number(k);
      this.animTiles.set(a, v);
      this.currentTileDisplay.set(a, a);
    }
    for (const m of world.maps) {
      this.mapByName.set(m.name, m);
    }

    const stats = computeDerivedStats(this.progress);
    if (this.progress.hp > stats.maxHp) {
      this.progress.hp = stats.maxHp;
    }

    this.loadMap(this.progress.currentMap, this.progress.wx, this.progress.wy, this.progress.dir, false);
    this.evaluateQuests(true);
  }

  public setLanguage(lang: 'fr' | 'en') {
    this.lang = lang;
  }

  public syncExternalProgress(next: PlayerProgress, keepSpatial = false) {
    const prevMap = this.progress.currentMap;
    const prevWx = this.progress.wx;
    const prevWy = this.progress.wy;
    const prevDir = this.progress.dir;
    const prevSecs = this.progress.playSeconds;

    this.progress = structuredClone(next);
    if (keepSpatial) {
      this.progress.currentMap = prevMap;
      this.progress.wx = prevWx;
      this.progress.wy = prevWy;
      this.progress.dir = prevDir;
      this.progress.playSeconds = Math.max(prevSecs, next.playSeconds);
    }
    const stats = computeDerivedStats(this.progress);
    if (this.progress.hp > stats.maxHp) {
      this.progress.hp = stats.maxHp;
    }
    this.evaluateQuests(false);
    this.emitProgress();
  }

  public flushProgress() {
    this.emitProgress();
  }

  public getLiveMonsters() {
    return this.monsters.map((m) => ({
      id: m.id,
      type: m.type,
      wx: m.wx,
      wy: m.wy,
      hp: m.hp,
      maxHp: m.maxHp,
      atk: m.atk,
      ai: m.ai,
      size: m.size,
      bossId: m.bossId,
      ranged: m.ranged,
    }));
  }

  public getProjectilesSummary() {
    let playerCount = 0;
    let enemyCount = 0;
    for (const p of this.projectiles) {
      if (p.fromPlayer) playerCount++;
      else enemyCount++;
    }
    return { playerCount, enemyCount, total: this.projectiles.length };
  }

  private emitProgress() {
    this.onProgressChange(structuredClone(this.progress));
  }

  public showToast(msg: string) {
    this.toastText = msg;
    this.toastTicks = 95;
  }

  public loadMap(name: string, wx: number, wy: number, dir: Direction, announce = true) {
    const m = this.mapByName.get(name) || this.world.maps[0];
    this.currentMap = m;
    this.progress.currentMap = m.name;
    this.progress.wx = wx;
    this.progress.wy = wy;
    this.progress.dir = dir;
    this.progress.visitedMaps[m.name] = true;
    this.doorGraceUntilLeave = true;
    this.projectiles = [];
    this.popups = [];

    if (!this.silentAudio) {
      audioEngine.setBossEngagement(false);
      audioEngine.playMusic(m.music);
    }

    this.monsters = [];
    m.spawns.forEach((sp, idx) => {
      if (sp.bossId && this.progress.flags[`${sp.bossId}_dead`]) {
        return; // Boss permanently defeated!
      }
      const animSet = this.sprites.monsters[sp.type];
      const sz = animSet ? animSet.size : 32;
      this.monsters.push({
        id: idx + 1,
        type: sp.type,
        wx: sp.x,
        wy: sp.y,
        homeX: sp.x,
        homeY: sp.y,
        hp: sp.hp,
        maxHp: sp.hp,
        atk: sp.atk,
        xp: sp.xp,
        gold: sp.gold,
        ai: sp.ai,
        radius: sp.radius || 0,
        bossId: sp.bossId,
        ranged: sp.ranged,
        size: sz,
        dir: Direction.Bas,
        frame: 0,
        animTick: 0,
        moveDirIdx: idx % 4,
        hurtFlash: 0,
        shootCooldown: 45 + (idx % 3) * 20,
        kbX: 0,
        kbY: 0,
      });
      this.progress.encountered[sp.type] = true;
    });

    if (announce) {
      this.showToast(this.lang === 'fr' ? m.titleFr : m.titleEn);
    }
    this.evaluateQuests(false);
    this.emitProgress();
  }

  private playerHitboxAt(wx: number, wy: number): Rect {
    return { x: wx - 12, y: wy - 10, w: 25, h: 20 };
  }

  public collidesWorld(r: Rect): boolean {
    const m = this.currentMap;
    if (r.x < 0 || r.y < 0 || r.x + r.w > m.w * TILE_LOGIC || r.y + r.h > m.h * TILE_LOGIC) {
      return true;
    }
    const tx0 = Math.max(0, Math.floor(r.x / TILE_LOGIC));
    const tx1 = Math.min(m.w - 1, Math.floor((r.x + r.w - 1) / TILE_LOGIC));
    const ty0 = Math.max(0, Math.floor(r.y / TILE_LOGIC));
    const ty1 = Math.min(m.h - 1, Math.floor((r.y + r.h - 1) / TILE_LOGIC));

    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        for (let l = 0; l < 3; l++) {
          const tid = m.layers[l][ty][tx];
          if (tid < 0) continue;
          const mask = this.masks.get(tid);
          if (mask && maskHitsRect(mask, r.x - tx * TILE_LOGIC, r.y - ty * TILE_LOGIC, r.w, r.h)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  public getNpcPos(n: NpcDef): { x: number; y: number } {
    return { x: n.x, y: n.y };
  }

  private collidesNpcOrProps(r: Rect): boolean {
    for (const n of this.currentMap.npcs) {
      if (!isNpcPresent(this.progress, n)) continue;
      const pos = this.getNpcPos(n);
      if (rectsOverlap(r, { x: pos.x + 2, y: pos.y + 4, w: 28, h: 28 })) return true;
    }
    for (const c of this.currentMap.chests) {
      if (rectsOverlap(r, { x: c.x + 2, y: c.y + 6, w: 28, h: 22 })) return true;
    }
    for (const s of this.currentMap.steles) {
      if (rectsOverlap(r, { x: s.x + 4, y: s.y + 6, w: 24, h: 22 })) return true;
    }
    return false;
  }

  private findInteractiveTarget():
    | { kind: 'npc'; npc: NpcDef }
    | { kind: 'chest'; chest: ChestDef }
    | { kind: 'stele'; stele: SteleDef }
    | null {
    const px = this.progress.wx;
    const py = this.progress.wy;
    let fx = px;
    let fy = py;
    const reach = 26;
    if (this.progress.dir === Direction.Haut) fy -= reach;
    else if (this.progress.dir === Direction.Bas) fy += reach;
    else if (this.progress.dir === Direction.Gauche) fx -= reach;
    else fx += reach;

    const probe: Rect = { x: fx - 20, y: fy - 20, w: 40, h: 40 };

    for (const npc of this.currentMap.npcs) {
      if (!isNpcPresent(this.progress, npc)) continue;
      const pos = this.getNpcPos(npc);
      if (rectsOverlap(probe, { x: pos.x, y: pos.y, w: 32, h: 32 })) {
        return { kind: 'npc', npc };
      }
    }
    for (const chest of this.currentMap.chests) {
      if (
        !this.progress.openedChests[chest.id] &&
        rectsOverlap(probe, { x: chest.x - 4, y: chest.y, w: 40, h: 32 })
      ) {
        return { kind: 'chest', chest };
      }
    }
    for (const stele of this.currentMap.steles) {
      if (rectsOverlap(probe, { x: stele.x, y: stele.y, w: 32, h: 32 })) {
        return { kind: 'stele', stele };
      }
    }
    return null;
  }

  public useQuickPotion(): boolean {
    const stats = computeDerivedStats(this.progress);
    if (this.progress.hp >= stats.maxHp) {
      this.showToast(this.lang === 'fr' ? 'PV déjà au maximum' : 'HP already full');
      return false;
    }
    let itemKey: 'potion' | 'elixir' | null = null;
    if ((this.progress.inventory.potion || 0) > 0) itemKey = 'potion';
    else if ((this.progress.inventory.elixir || 0) > 0) itemKey = 'elixir';

    if (!itemKey) {
      this.showToast(this.lang === 'fr' ? 'Aucune potion en sac' : 'No potions in pack');
      return false;
    }
    const def = ITEM_CATALOG.find((i) => i.id === itemKey)!;
    this.progress.inventory[itemKey] -= 1;
    const healed = Math.min(stats.maxHp - this.progress.hp, def.heal + this.progress.attrs.vitality);
    this.progress.hp += healed;
    audioEngine.playHeal();
    this.popups.push({
      wx: this.progress.wx,
      wy: this.progress.wy - 22,
      text: `+${healed} PV`,
      color: '#4ade80',
      ttl: 36,
    });
    this.emitProgress();
    return true;
  }

  private castArcaneWave() {
    if (this.skillCooldown > 0) return;
    const stats = computeDerivedStats(this.progress);
    this.skillCooldown = stats.skillCooldownTicks;
    audioEngine.playSkillWave();

    let vx = 0;
    let vy = 0;
    const spd = 6.5;
    if (this.progress.dir === Direction.Haut) vy = -spd;
    else if (this.progress.dir === Direction.Bas) vy = spd;
    else if (this.progress.dir === Direction.Gauche) vx = -spd;
    else vx = spd;

    this.projectiles.push({
      fromPlayer: true,
      kind: 'arcane_wave',
      wx: this.progress.wx,
      wy: this.progress.wy - 4,
      vx,
      vy,
      radius: 22,
      damage: stats.arcanePower,
      ttl: 38,
      color: stats.slashColor,
      hitIds: new Set(),
    });
  }

  private swordWorldRect(): Rect {
    const px = this.progress.wx;
    const py = this.progress.wy;
    switch (this.progress.dir) {
      case Direction.Bas:
        return { x: px - 22, y: py + 4, w: 44, h: 32 };
      case Direction.Haut:
        return { x: px - 22, y: py - 42, w: 44, h: 32 };
      case Direction.Gauche:
        return { x: px - 42, y: py - 22, w: 34, h: 40 };
      case Direction.Droite:
        return { x: px + 8, y: py - 22, w: 34, h: 40 };
    }
  }

  private damageMonster(m: LiveMonster, rawDamage: number, isCrit: boolean, lifesteal: number) {
    if (m.ai === 'passive' || m.hp <= 0) return;
    const dmg = Math.max(1, Math.round(rawDamage));
    m.hp -= dmg;
    m.hurtFlash = 7;

    // Knockback away from player
    const dx = m.wx + m.size / 2 - this.progress.wx;
    const dy = m.wy + m.size / 2 - this.progress.wy;
    const dist = Math.hypot(dx, dy) || 1;
    const kbForce = m.ai === 'boss' ? 2.2 : 5.5;
    m.kbX = (dx / dist) * kbForce;
    m.kbY = (dy / dist) * kbForce;

    this.popups.push({
      wx: m.wx + m.size / 2,
      wy: m.wy - 4,
      text: isCrit ? `${dmg}!` : `${dmg}`,
      color: isCrit ? '#fbbf24' : '#f8fafc',
      ttl: 28,
    });

    if (lifesteal > 0) {
      const stats = computeDerivedStats(this.progress);
      if (this.progress.hp < stats.maxHp) {
        this.progress.hp = Math.min(stats.maxHp, this.progress.hp + lifesteal);
      }
    }

    if (m.type.includes('dragon') || m.type === 'leviathanis' || m.type === 'pyraxis') {
      audioEngine.playOriginalSfx('monstre_dragon_rouge');
    } else {
      audioEngine.playOriginalSfx('monstre_chauve_souris');
    }

    if (m.hp <= 0) {
      m.hp = 0;
      this.progress.kills[m.type] = (this.progress.kills[m.type] || 0) + 1;
      this.progress.encountered[m.type] = true;
      if (m.bossId) {
        this.progress.flags[`${m.bossId}_dead`] = true;
      }
      this.grantRewards(m.xp, m.gold, m.wx + m.size / 2, m.wy);
      this.evaluateQuests(false);

      if (m.bossId === 'boss_pyraxis') {
        this.emitProgress();
        this.onPhaseChange('victory');
        return;
      }
      this.emitProgress();
    }
  }

  public grantRewards(xp: number, gold: number, popupX?: number, popupY?: number) {
    this.progress.xp += xp;
    this.progress.gold += gold;
    if (popupX !== undefined && popupY !== undefined && (xp > 0 || gold > 0)) {
      this.popups.push({
        wx: popupX,
        wy: popupY - 14,
        text: `+${xp} XP · +${gold} Or`,
        color: '#fde047',
        ttl: 42,
      });
    }

    let leveled = false;
    while (this.progress.level < 20) {
      const req = xpRequiredForLevel(this.progress.level);
      if (this.progress.xp < req) break;
      this.progress.xp -= req;
      this.progress.level += 1;
      this.progress.statPoints += 2;
      leveled = true;
    }

    if (leveled) {
      const stats = computeDerivedStats(this.progress);
      this.progress.hp = stats.maxHp;
      audioEngine.playLevelUp();
      this.showToast(
        this.lang === 'fr'
          ? `Niveau ${this.progress.level} atteint ! (+2 pts d'aptitude)`
          : `Level ${this.progress.level} reached! (+2 attribute pts)`
      );
    }
  }

  public evaluateQuests(silent: boolean) {
    let changed = false;
    const loreTotal = Object.keys(this.progress.unlockedLore).length;

    do {
      changed = false;
      for (const q of QUEST_CATALOG) {
        if (this.progress.completedQuests[q.id]) continue;
        if (q.prereqFlag && !this.progress.flags[q.prereqFlag]) continue;

        let ok = false;
        const c = q.check;
        if (c.kind === 'flag') {
          ok = Boolean(this.progress.flags[c.target]);
        } else if (c.kind === 'map') {
          ok = Boolean(this.progress.visitedMaps[c.target]);
        } else if (c.kind === 'kill') {
          ok = (this.progress.kills[c.target] || 0) >= (c.count || 1);
        } else if (c.kind === 'item') {
          ok = (this.progress.inventory[c.target] || 0) >= (c.count || 1);
        } else if (c.kind === 'lore_count') {
          ok = loreTotal >= (c.count || 1);
        }

        if (ok) {
          this.progress.completedQuests[q.id] = true;
          changed = true;
          if (!silent) {
            this.grantRewards(q.rewardXp, q.rewardGold, this.progress.wx, this.progress.wy - 20);
            if (q.rewardItem) {
              this.progress.inventory[q.rewardItem] = (this.progress.inventory[q.rewardItem] || 0) + 1;
            }
            if (q.rewardEquip && !this.progress.ownedEquip.includes(q.rewardEquip)) {
              this.progress.ownedEquip.push(q.rewardEquip);
            }
            audioEngine.playOriginalSfx('selection_menu');
            this.showToast(
              `${this.lang === 'fr' ? 'Quête accomplie : ' : 'Quest complete: '}${
                this.lang === 'fr' ? q.titleFr : q.titleEn
              }`
            );
          }
        }
      }
    } while (changed);
  }

  public tick(paused: boolean) {
    if (paused) return;

    // Playtime counter (30 ticks = 1 second)
    this.playTickCounter++;
    if (this.playTickCounter >= 30) {
      this.playTickCounter = 0;
      this.progress.playSeconds += 1;
    }

    if (this.toastTicks > 0) {
      this.toastTicks--;
      if (this.toastTicks === 0) this.toastText = null;
    }
    if (this.hurtImmunity > 0) this.hurtImmunity--;
    if (this.skillCooldown > 0) this.skillCooldown--;

    // Advance animated tiles every 6 ticks
    if (++this.tileAnimCounter >= 6) {
      this.tileAnimCounter = 0;
      for (const [orig, cur] of this.currentTileDisplay.entries()) {
        const nxt = this.animTiles.get(cur);
        if (nxt !== undefined) {
          this.currentTileDisplay.set(orig, nxt);
        }
      }
    }

    const attackEdge = this.keys.attack && !this.prevAttack;
    const skillEdge = this.keys.skill && !this.prevSkill;
    const potionEdge = this.keys.potion && !this.prevPotion;
    this.prevAttack = this.keys.attack;
    this.prevSkill = this.keys.skill;
    this.prevPotion = this.keys.potion;

    if (potionEdge) {
      this.useQuickPotion();
    }
    if (skillEdge) {
      this.castArcaneWave();
    }

    const stats = computeDerivedStats(this.progress);

    // Handle Interaction or Sword Attack on Action A
    if (attackEdge && !this.attacking) {
      const target = this.findInteractiveTarget();
      if (target) {
        this.moving = false;
        if (target.kind === 'npc') {
          audioEngine.playOriginalSfx('selection_menu');
          const res = resolveNpcDialogue(target.npc.id, this.progress);
          if (res.mutate) {
            res.mutate(this.progress);
            const updatedStats = computeDerivedStats(this.progress);
            if (this.progress.hp > updatedStats.maxHp) {
              this.progress.hp = updatedStats.maxHp;
            }
            this.evaluateQuests(false);
            this.emitProgress();
          }
          this.onOpenDialogue(res.dialogue);
          return;
        }
        if (target.kind === 'chest') {
          this.openChest(target.chest);
          return;
        }
        if (target.kind === 'stele') {
          this.readStele(target.stele);
          return;
        }
      } else {
        this.attacking = true;
        this.moving = false;
        this.animFrame = 0;
        this.animCounter = 0;
        this.hitMonstersThisSwing.clear();
        audioEngine.playOriginalSfx('joueur_attaque');
      }
    }

    // Player Movement or Attack Animation
    if (this.attacking) {
      const sRect = this.swordWorldRect();
      for (const m of this.monsters) {
        if (m.hp <= 0 || m.ai === 'passive' || this.hitMonstersThisSwing.has(m.id)) continue;
        if (rectsOverlap(sRect, { x: m.wx, y: m.wy, w: m.size, h: m.size })) {
          this.hitMonstersThisSwing.add(m.id);
          const isCrit = Math.random() * 100 < stats.critChance;
          const mult = isCrit ? 1.8 : 1.0;
          this.damageMonster(m, stats.attack * mult, isCrit, stats.lifesteal);
        }
      }

      if (++this.animCounter >= 2) {
        this.animCounter = 0;
        this.animFrame++;
        if (this.animFrame >= 4) {
          this.attacking = false;
          this.animFrame = 0;
        }
      }
    } else {
      let dx = 0;
      let dy = 0;
      if (this.keys.up) {
        dy = -stats.moveSpeed;
        this.progress.dir = Direction.Haut;
      } else if (this.keys.left) {
        dx = -stats.moveSpeed;
        this.progress.dir = Direction.Gauche;
      } else if (this.keys.down) {
        dy = stats.moveSpeed;
        this.progress.dir = Direction.Bas;
      } else if (this.keys.right) {
        dx = stats.moveSpeed;
        this.progress.dir = Direction.Droite;
      }

      if (dx !== 0 || dy !== 0) {
        this.moving = true;
        const targetX = Math.round(this.progress.wx + dx);
        const targetY = Math.round(this.progress.wy + dy);
        const hb = this.playerHitboxAt(targetX, targetY);
        if (!this.collidesWorld(hb) && !this.collidesNpcOrProps(hb)) {
          this.progress.wx = targetX;
          this.progress.wy = targetY;
        }
        audioEngine.playWalkStep();
        if (++this.animCounter >= 4) {
          this.animCounter = 0;
          this.animFrame = (this.animFrame + 1) % 4;
        }
      } else {
        this.moving = false;
        this.animFrame = 0;
        this.animCounter = 0;
      }
    }

    // Check Map Items Pickup
    const pRect = this.playerHitboxAt(this.progress.wx, this.progress.wy);
    this.currentMap.items.forEach((it, idx) => {
      const key = `${this.currentMap.name}:${idx}:${it.id}`;
      if (this.progress.takenMapItems[key]) return;
      if (it.afterFlag && !this.progress.flags[it.afterFlag]) return;
      if (rectsOverlap(pRect, { x: it.x + 4, y: it.y + 4, w: 24, h: 24 })) {
        this.progress.takenMapItems[key] = true;
        const def = ITEM_CATALOG.find((c) => c.id === it.id);
        if (it.id === 'potion' && this.progress.hp < stats.maxHp) {
          const healAmt = Math.min(stats.maxHp - this.progress.hp, 12);
          this.progress.hp += healAmt;
          audioEngine.playHeal();
          this.popups.push({
            wx: this.progress.wx,
            wy: this.progress.wy - 20,
            text: `+${healAmt} PV`,
            color: '#4ade80',
            ttl: 35,
          });
        } else {
          this.progress.inventory[it.id] = (this.progress.inventory[it.id] || 0) + 1;
          audioEngine.playOriginalSfx('selection_menu');
          if (def) {
            this.showToast(
              `${this.lang === 'fr' ? 'Objet obtenu : ' : 'Obtained: '}${
                this.lang === 'fr' ? def.nameFr : def.nameEn
              }`
            );
          }
        }
        this.evaluateQuests(false);
        this.emitProgress();
      }
    });

    // Check Doors
    let touchingAnyDoor = false;
    for (const d of this.currentMap.doors) {
      if (rectsOverlap(pRect, { x: d.x, y: d.y, w: d.w, h: d.h })) {
        touchingAnyDoor = true;
        if (!this.doorGraceUntilLeave) {
          if (d.reqFlag && !isFlagUnlocked(this.progress, d.reqFlag)) {
            this.doorGraceUntilLeave = true;
            this.moving = false;
            this.onOpenDialogue(resolveDoorDenyDialogue(d.denyDlg));
          } else {
            this.loadMap(d.map, d.dx, d.dy, this.progress.dir, true);
          }
          return;
        }
      }
    }
    if (!touchingAnyDoor) {
      this.doorGraceUntilLeave = false;
    }

    // Update Monsters & Contact Damage
    this.updateMonsters(pRect, stats.defense);

    // Update Projectiles
    this.updateProjectiles(pRect, stats.defense);

    // Update Floating Popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      this.popups[i].wy -= 0.7;
      this.popups[i].ttl--;
      if (this.popups[i].ttl <= 0) this.popups.splice(i, 1);
    }
  }

  private openChest(chest: ChestDef) {
    this.progress.openedChests[chest.id] = true;
    audioEngine.playChestOpen();
    const parts: string[] = [];
    if (chest.gold > 0) {
      this.progress.gold += chest.gold;
      parts.push(`+${chest.gold} Or`);
    }
    if (chest.equip && !this.progress.ownedEquip.includes(chest.equip)) {
      this.progress.ownedEquip.push(chest.equip);
      const eq = EQUIPMENT_CATALOG.find((e) => e.id === chest.equip);
      if (eq) parts.push(this.lang === 'fr' ? eq.nameFr : eq.nameEn);
    }
    if (chest.item) {
      this.progress.inventory[chest.item] = (this.progress.inventory[chest.item] || 0) + 1;
      const it = ITEM_CATALOG.find((i) => i.id === chest.item);
      if (it) parts.push(this.lang === 'fr' ? it.nameFr : it.nameEn);
    }
    this.showToast(
      `${this.lang === 'fr' ? 'Coffre : ' : 'Chest: '}${parts.join(' · ')}`
    );
    this.evaluateQuests(false);
    this.emitProgress();
  }

  private readStele(stele: SteleDef) {
    const lore = LORE_CODEX.find((l) => l.id === stele.id);
    if (!lore) return;
    const isNew = !this.progress.unlockedLore[lore.id];
    if (isNew) {
      this.progress.unlockedLore[lore.id] = true;
      audioEngine.playLoreUnlock();
      this.grantRewards(35, 20, stele.x + 16, stele.y);
      this.evaluateQuests(false);
      this.emitProgress();
    } else {
      audioEngine.playOriginalSfx('selection_menu');
    }
    this.onOpenLore(lore, isNew);
  }

  private monsterBaseSpeed(m: LiveMonster): number {
    if (m.ai === 'passive') return 1.5;
    if (m.ai === 'boss') return 2.85;
    if (
      m.type.includes('loup') ||
      m.type.includes('chauve_souris') ||
      m.type === 'rodeur_ombre' ||
      m.type.includes('vouivre')
    ) {
      return 3.35;
    }
    if (m.type.includes('golem') || m.type.includes('slime') || m.type === 'magma_vivant') {
      return 2.55;
    }
    return 2.95;
  }

  private updateMonsters(pRect: Rect, playerDef: number) {
    const stepDx = [0, -1, 0, 1];
    const stepDy = [-1, 0, 1, 0];
    const dirs = [Direction.Haut, Direction.Gauche, Direction.Bas, Direction.Droite];

    for (const m of this.monsters) {
      if (m.hp <= 0) continue;
      if (m.hurtFlash > 0) m.hurtFlash--;

      // Apply knockback decay
      if (Math.abs(m.kbX) > 0.2 || Math.abs(m.kbY) > 0.2) {
        const nx = Math.round(m.wx + m.kbX);
        const ny = Math.round(m.wy + m.kbY);
        if (!this.collidesWorld({ x: nx, y: ny, w: m.size, h: m.size })) {
          m.wx = nx;
          m.wy = ny;
        }
        m.kbX *= 0.65;
        m.kbY *= 0.65;
      }

      const cx = m.wx + m.size / 2;
      const cy = m.wy + m.size / 2;
      const hx = m.homeX + m.size / 2;
      const hy = m.homeY + m.size / 2;
      const distPlayer = Math.hypot(this.progress.wx - cx, this.progress.wy - cy);
      const distHome = Math.hypot(cx - hx, cy - hy);

      const enraged = m.ai === 'boss' && m.hp <= m.maxHp * 0.5;
      const spd = this.monsterBaseSpeed(m) * (enraged ? 1.35 : 1.0);

      let chasing = false;
      let targetDx = 0;
      let targetDy = 0;

      if (m.ai === 'chase' || m.ai === 'ranged' || m.ai === 'boss') {
        const aggroRange = m.radius > 0 ? Math.max(240, m.radius + 64) : 260;
        if (distPlayer <= aggroRange) {
          const tx = this.progress.wx - cx;
          const ty = this.progress.wy - cy;
          if (m.ai === 'ranged' && distPlayer < 92) {
            chasing = false;
            m.dir =
              Math.abs(tx) > Math.abs(ty)
                ? tx > 0
                  ? Direction.Droite
                  : Direction.Gauche
                : ty > 0
                ? Direction.Bas
                : Direction.Haut;
          } else {
            chasing = true;
            const norm = Math.hypot(tx, ty) || 1;
            targetDx = (tx / norm) * spd;
            targetDy = (ty / norm) * spd;
          }
        } else if (m.radius > 0 && distHome > m.radius) {
          chasing = true;
          const tx = hx - cx;
          const ty = hy - cy;
          const norm = Math.hypot(tx, ty) || 1;
          targetDx = (tx / norm) * spd;
          targetDy = (ty / norm) * spd;
        }
      }

      const canStepTo = (nx: number, ny: number) => {
        const mr: Rect = { x: nx, y: ny, w: m.size, h: m.size };
        if (this.collidesWorld(mr) || this.collidesNpcOrProps(mr)) return false;
        if (m.ai === 'boss' && m.radius > 0) {
          const nd = Math.hypot(nx + m.size / 2 - hx, ny + m.size / 2 - hy);
          if (nd > m.radius + 48 && nd > distHome) return false;
        }
        return true;
      };

      if (chasing) {
        const nx = Math.round(m.wx + targetDx);
        const ny = Math.round(m.wy + targetDy);
        if (canStepTo(nx, ny)) {
          m.wx = nx;
          m.wy = ny;
        } else if (nx !== m.wx && canStepTo(nx, m.wy)) {
          m.wx = nx;
        } else if (ny !== m.wy && canStepTo(m.wx, ny)) {
          m.wy = ny;
        }
        m.dir =
          Math.abs(targetDx) > Math.abs(targetDy)
            ? targetDx > 0
              ? Direction.Droite
              : Direction.Gauche
            : targetDy > 0
            ? Direction.Bas
            : Direction.Haut;
      } else if (!(m.ai === 'ranged' && distPlayer < 92)) {
        const idx = m.moveDirIdx & 3;
        const patrolSpd = m.ai === 'passive' ? 1.5 : 2.1;
        const nx = Math.round(m.wx + stepDx[idx] * patrolSpd);
        const ny = Math.round(m.wy + stepDy[idx] * patrolSpd);
        if (canStepTo(nx, ny)) {
          m.wx = nx;
          m.wy = ny;
          m.dir = dirs[idx];
        } else {
          m.moveDirIdx = (m.moveDirIdx + 1) & 3;
        }
      }

      // Ranged / Boss Projectile Firing
      if (m.ranged && distPlayer <= 320) {
        m.shootCooldown--;
        if (m.shootCooldown <= 0) {
          m.shootCooldown = m.ai === 'boss' ? (enraged ? 38 : 56) : 62;
          const baseAngle = Math.atan2(this.progress.wy - cy, this.progress.wx - cx);
          const angles = enraged ? [baseAngle - 0.26, baseAngle, baseAngle + 0.26] : [baseAngle];
          const colorMap = {
            fireball: '#f97316',
            frostbolt: '#38bdf8',
            shadowbolt: '#c084fc',
            poison_dart: '#4ade80',
          };
          for (const ang of angles) {
            this.projectiles.push({
              fromPlayer: false,
              kind: m.ranged,
              wx: cx,
              wy: cy,
              vx: Math.cos(ang) * 5.0,
              vy: Math.sin(ang) * 5.0,
              radius: m.ai === 'boss' ? 8 : 6,
              damage: Math.max(2, Math.round(m.atk * 0.95)),
              ttl: 75,
              color: colorMap[m.ranged],
              hitIds: new Set(),
            });
          }
        }
      }

      // Animation step
      const tickRate = m.ai === 'passive' ? 8 : 5;
      if (++m.animTick >= tickRate) {
        m.animTick = 0;
        m.frame = (m.frame + 1) % 4;
        if (m.frame === 0 && !chasing) {
          m.moveDirIdx = Math.floor(Math.random() * 4);
        }
      }

      // Contact Damage to Player
      if (m.atk > 0 && this.hurtImmunity <= 0) {
        const mRect: Rect = { x: m.wx + 3, y: m.wy + 3, w: m.size - 6, h: m.size - 6 };
        if (rectsOverlap(pRect, mRect)) {
          const parried =
            this.attacking && m.ai !== 'boss' && rectsOverlap(this.swordWorldRect(), mRect);
          if (!parried) {
            this.inflictPlayerDamage(m.atk, playerDef);
          }
        }
      }
    }
  }

  private updateProjectiles(pRect: Rect, playerDef: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.wx += pr.vx;
      pr.wy += pr.vy;
      pr.ttl--;

      if (pr.ttl <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (!pr.fromPlayer && this.collidesWorld({ x: pr.wx - 3, y: pr.wy - 3, w: 6, h: 6 })) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (pr.fromPlayer) {
        const waveRect: Rect = {
          x: pr.wx - pr.radius,
          y: pr.wy - pr.radius,
          w: pr.radius * 2,
          h: pr.radius * 2,
        };
        // Player arcane wave cancels enemy projectiles!
        for (let j = this.projectiles.length - 1; j >= 0; j--) {
          if (i === j || this.projectiles[j].fromPlayer) continue;
          const ep = this.projectiles[j];
          if (Math.hypot(ep.wx - pr.wx, ep.wy - pr.wy) <= pr.radius + ep.radius) {
            this.projectiles.splice(j, 1);
            if (j < i) i--;
          }
        }
        // Hit monsters
        for (const m of this.monsters) {
          if (m.hp <= 0 || m.ai === 'passive' || pr.hitIds.has(m.id)) continue;
          if (rectsOverlap(waveRect, { x: m.wx, y: m.wy, w: m.size, h: m.size })) {
            pr.hitIds.add(m.id);
            this.damageMonster(m, pr.damage, true, 0);
          }
        }
      } else if (this.hurtImmunity <= 0) {
        const projRect: Rect = {
          x: pr.wx - pr.radius,
          y: pr.wy - pr.radius,
          w: pr.radius * 2,
          h: pr.radius * 2,
        };
        if (rectsOverlap(pRect, projRect)) {
          this.projectiles.splice(i, 1);
          this.inflictPlayerDamage(pr.damage, playerDef);
        }
      }
    }
  }

  private inflictPlayerDamage(rawAtk: number, playerDef: number) {
    const minDmg = Math.max(1, Math.floor(rawAtk * 0.28));
    const reduced = Math.max(minDmg, Math.round(rawAtk - playerDef * 0.36));
    this.progress.hp = Math.max(0, this.progress.hp - reduced);
    this.hurtImmunity = 26;
    audioEngine.playOriginalSfx('joueur_blessure');
    this.popups.push({
      wx: this.progress.wx,
      wy: this.progress.wy - 24,
      text: `-${reduced}`,
      color: '#f87171',
      ttl: 30,
    });
    this.emitProgress();
    if (this.progress.hp <= 0) {
      this.onPhaseChange('gameover');
    }
  }

  public getSnapshot(): EngineSnapshot {
    const stats = computeDerivedStats(this.progress);
    let activeBoss: EngineSnapshot['activeBoss'] = null;
    for (const m of this.monsters) {
      if (m.ai === 'boss' && m.hp > 0) {
        const dist = Math.hypot(this.progress.wx - (m.wx + m.size / 2), this.progress.wy - (m.wy + m.size / 2));
        if (dist <= 380) {
          const bDef = BESTIARY_CATALOG.find((b) => b.id === m.type);
          activeBoss = {
            nameFr: bDef ? bDef.nameFr : m.type,
            nameEn: bDef ? bDef.nameEn : m.type,
            hp: m.hp,
            maxHp: m.maxHp,
          };
          break;
        }
      }
    }

    if (!this.silentAudio) {
      audioEngine.setBossEngagement(Boolean(activeBoss));
    }

    const target = this.findInteractiveTarget();
    let nearbyPrompt: string | null = null;
    if (target) {
      if (target.kind === 'npc') {
        nearbyPrompt = this.lang === 'fr' ? '[Espace] Parler' : '[Space] Talk';
      } else if (target.kind === 'chest') {
        nearbyPrompt = this.lang === 'fr' ? '[Espace] Ouvrir le coffre' : '[Space] Open Chest';
      } else if (target.kind === 'stele') {
        nearbyPrompt = this.lang === 'fr' ? '[Espace] Lire la stèle' : '[Space] Read Stele';
      }
    }

    return {
      skillCooldownRatio: Math.max(0, this.skillCooldown / stats.skillCooldownTicks),
      activeBoss,
      toast: this.toastText,
      nearbyPrompt,
    };
  }

  private drawTileById(ctx: CanvasRenderingContext2D, rawTid: number, dx: number, dy: number) {
    if (rawTid < 0) return;
    const tid = this.currentTileDisplay.get(rawTid) ?? rawTid;
    const sx = (tid % this.world.tileCols) * 32;
    const sy = Math.floor(tid / this.world.tileCols) * 32;
    ctx.drawImage(this.sprites.tileset, sx, sy, 32, 32, dx, dy, TILE_SHOW, TILE_SHOW);
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.imageSmoothingEnabled = false;
    const [br, bg, bb] = this.currentMap.bgColor;
    ctx.fillStyle = `rgb(${br},${bg},${bb})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    const scale = TILE_SHOW / TILE_LOGIC; // 1.5
    const mapPxW = this.currentMap.w * TILE_SHOW;
    const mapPxH = this.currentMap.h * TILE_SHOW;

    // Smooth clamped camera (centers small interiors like maison/forge, clamps smoothly on large maps)
    let ox = Math.round(VIEW_W / 2 - this.progress.wx * scale);
    let oy = Math.round(VIEW_H / 2 - this.progress.wy * scale);
    if (mapPxW <= VIEW_W) {
      ox = Math.round((VIEW_W - mapPxW) / 2);
    } else {
      ox = Math.min(0, Math.max(VIEW_W - mapPxW, ox));
    }
    if (mapPxH <= VIEW_H) {
      oy = Math.round((VIEW_H - mapPxH) / 2);
    } else {
      oy = Math.min(0, Math.max(VIEW_H - mapPxH, oy));
    }

    const toScreenX = (wx: number) => Math.round(ox + wx * scale);
    const toScreenY = (wy: number) => Math.round(oy + wy * scale);

    const tx0 = Math.max(0, Math.floor(-ox / TILE_SHOW));
    const tx1 = Math.min(this.currentMap.w - 1, Math.floor((VIEW_W - ox) / TILE_SHOW));
    const ty0 = Math.max(0, Math.floor(-oy / TILE_SHOW));
    const ty1 = Math.min(this.currentMap.h - 1, Math.floor((VIEW_H - oy) / TILE_SHOW));

    const nowMs = performance.now();
    const pulse = Math.sin(nowMs * 0.005);
    const fireFrame = Math.floor(nowMs / 130) % 4;

    // Background Layers 0..2 + Controlled Stone-Pot Braziers (2573) & Standing Royal Torches (2576)
    for (let ty = ty0; ty <= ty1; ty++) {
      const dy = oy + ty * TILE_SHOW;
      for (let tx = tx0; tx <= tx1; tx++) {
        const dx = ox + tx * TILE_SHOW;
        for (let l = 0; l <= 2; l++) {
          const tid = this.currentMap.layers[l][ty][tx];
          if (tid < 0) continue;
          if (tid === 2576) {
            // Wrought-iron & gilded brass standing castle torch (replaces raw floor fire)
            const torchSpr = this.sprites.torchStand[fireFrame];
            if (torchSpr) {
              ctx.drawImage(torchSpr, dx, dy - 12, TILE_SHOW, Math.round(TILE_SHOW * 1.25));
            }
          } else {
            this.drawTileById(ctx, tid, dx, dy);
            if (tid === 2573) {
              // Controlled flame burning inside the mouth of stone pot 2573
              const flameSpr = this.sprites.brazierFlame[fireFrame];
              if (flameSpr) {
                ctx.drawImage(flameSpr, dx, dy, TILE_SHOW, TILE_SHOW);
              }
            }
          }
        }
      }
    }

    // Complete 2-tile Treasure Chests (2569+2570 closed, 2571+2572 open -> 40x32 logical = 60x48 screen)
    for (const c of this.currentMap.chests) {
      const opened = Boolean(this.progress.openedChests[c.id]);
      const chestSpr = opened ? this.sprites.chestOpen : this.sprites.chestClosed;
      ctx.drawImage(chestSpr, toScreenX(c.x) - 6, toScreenY(c.y), 60, 48);
    }

    // Lore Steles / Grimoires
    for (const st of this.currentMap.steles) {
      const sx = toScreenX(st.x);
      const sy = toScreenY(st.y);
      this.drawTileById(ctx, st.tile, sx, sy);
      if (!this.progress.unlockedLore[st.id]) {
        ctx.save();
        ctx.strokeStyle = `rgba(251, 191, 36, ${0.45 + 0.35 * Math.abs(pulse)})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 4, sy + 4, TILE_SHOW - 8, TILE_SHOW - 8);
        ctx.restore();
      }
    }

    // Map Items
    const bob = Math.round(pulse * 3);
    this.currentMap.items.forEach((it, idx) => {
      const key = `${this.currentMap.name}:${idx}:${it.id}`;
      if (this.progress.takenMapItems[key]) return;
      if (it.afterFlag && !this.progress.flags[it.afterFlag]) return;
      const icon = this.sprites.items[it.id] || this.sprites.items.potion;
      ctx.drawImage(icon, toScreenX(it.x) + 6, toScreenY(it.y) + 6 + bob, 36, 36);
    });

    // Bespoke Gilded Royal Throne on Chateau Dais (drawn behind King Edward IV!)
    if (this.currentMap.name === 'chateau' && this.sprites.throne) {
      ctx.drawImage(this.sprites.throne, toScreenX(552), toScreenY(80), 72, 72);
    }

    // NPCs (blockade guards depart completely once their road is unlocked)
    for (const n of this.currentMap.npcs) {
      if (!isNpcPresent(this.progress, n)) continue;
      const pos = this.getNpcPos(n);
      const set = this.sprites.npcs[n.type] || this.sprites.npcs.sage;
      const spr = set[n.dir] || set[Direction.Bas];
      ctx.drawImage(spr, toScreenX(pos.x), toScreenY(pos.y) - 4, 48, 54);
    }

    // Monsters
    for (const m of this.monsters) {
      if (m.hp <= 0) continue;
      const anim = this.sprites.monsters[m.type];
      if (!anim) continue;
      const frames = anim.walk[m.dir] || anim.walk[Direction.Bas];
      const spr = frames[m.frame % frames.length];
      const drawSz = Math.round(m.size * scale);
      const mx = toScreenX(m.wx);
      const my = toScreenY(m.wy);

      ctx.save();
      if (m.hurtFlash > 0) {
        ctx.filter = 'brightness(2.4)';
      } else if (m.ai === 'boss' && m.hp <= m.maxHp * 0.5) {
        ctx.filter = 'saturate(1.6) drop-shadow(0 0 6px rgba(239,68,68,0.8))';
      }
      ctx.drawImage(spr, mx, my, drawSz, drawSz);
      ctx.restore();

      // Overhead Monster Health Bar (for damaged non-passive monsters)
      if (m.ai !== 'passive' && m.hp < m.maxHp && m.ai !== 'boss') {
        const bw = Math.max(36, drawSz);
        const bx = mx + Math.round((drawSz - bw) / 2);
        const by = my - 8;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(bx - 1, by - 1, bw + 2, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(bx, by, Math.round((bw * m.hp) / m.maxHp), 4);
      }
    }

    // Player Sprite + Sword Arc
    const stats = computeDerivedStats(this.progress);
    const pFrames = this.attacking
      ? this.sprites.player.attack![this.progress.dir]
      : this.sprites.player.walk[this.progress.dir];
    const pSprite = pFrames[this.moving || this.attacking ? this.animFrame % pFrames.length : 0];
    const pDrawSize = Math.round(64 * scale); // 96x96
    const pxScreen = toScreenX(this.progress.wx);
    const pyScreen = toScreenY(this.progress.wy) - 18;

    if (this.hurtImmunity === 0 || (this.hurtImmunity & 2) === 0) {
      ctx.drawImage(pSprite, pxScreen - pDrawSize / 2, pyScreen - pDrawSize / 2, pDrawSize, pDrawSize);
    }

    // Weapon Slash Arc visual during sword swing
    if (this.attacking) {
      ctx.save();
      ctx.strokeStyle = stats.slashColor;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.78;
      let startAng = 0;
      if (this.progress.dir === Direction.Bas) startAng = 0.2 * Math.PI;
      else if (this.progress.dir === Direction.Haut) startAng = 1.2 * Math.PI;
      else if (this.progress.dir === Direction.Gauche) startAng = 0.7 * Math.PI;
      else startAng = -0.3 * Math.PI;
      ctx.beginPath();
      ctx.arc(pxScreen, pyScreen + 8, 36, startAng, startAng + 0.65 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }

    // Projectiles & Arcane Wave
    for (const pr of this.projectiles) {
      const sx = toScreenX(pr.wx);
      const sy = toScreenY(pr.wy);
      ctx.save();
      if (pr.fromPlayer) {
        ctx.strokeStyle = pr.color;
        ctx.fillStyle = 'rgba(253, 224, 71, 0.24)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(sx, sy, pr.radius * scale * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = pr.color;
        ctx.beginPath();
        ctx.arc(sx, sy, pr.radius * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx - 2, sy - 2, pr.radius * scale * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Foreground Layer 3
    for (let ty = ty0; ty <= ty1; ty++) {
      const dy = oy + ty * TILE_SHOW;
      for (let tx = tx0; tx <= tx1; tx++) {
        const tid = this.currentMap.layers[3][ty][tx];
        if (tid >= 0) this.drawTileById(ctx, tid, ox + tx * TILE_SHOW, dy);
      }
    }

    // Interactive Prompt Bubble above target
    const target = this.findInteractiveTarget();
    if (target) {
      let tx = 0;
      let ty = 0;
      if (target.kind === 'npc') {
        const pos = this.getNpcPos(target.npc);
        tx = toScreenX(pos.x) + 24;
        ty = toScreenY(pos.y) - 14;
      } else if (target.kind === 'chest') {
        tx = toScreenX(target.chest.x) + 24;
        ty = toScreenY(target.chest.y) - 10;
      } else {
        tx = toScreenX(target.stele.x) + 24;
        ty = toScreenY(target.stele.y) - 10;
      }
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(tx - 12, ty - 18, 24, 20);
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('A', tx, ty - 4);
    }

    // Floating Damage / XP Popups
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    for (const pop of this.popups) {
      const sx = toScreenX(pop.wx);
      const sy = toScreenY(pop.wy);
      ctx.fillStyle = '#090d16';
      ctx.fillText(pop.text, sx + 1, sy + 1);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, sx, sy);
    }
  }

  public renderMinimap(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0b0f17';
    ctx.fillRect(0, 0, w, h);

    const m = this.currentMap;
    const scale = Math.min((w - 8) / m.w, (h - 8) / m.h);
    const ox = Math.floor((w - m.w * scale) / 2);
    const oy = Math.floor((h - m.h * scale) / 2);
    const cellW = Math.max(1, Math.ceil(scale));

    for (let ty = 0; ty < m.h; ty++) {
      for (let tx = 0; tx < m.w; tx++) {
        let blocked = false;
        let hasFloor = false;
        for (let l = 0; l < 3; l++) {
          const tid = m.layers[l][ty][tx];
          if (tid >= 0) {
            hasFloor = true;
            if (this.masks.has(tid)) blocked = true;
          }
        }
        if (!hasFloor) continue;
        ctx.fillStyle = blocked ? '#334155' : '#1e293b';
        ctx.fillRect(Math.floor(ox + tx * scale), Math.floor(oy + ty * scale), cellW, cellW);
      }
    }

    // Doors (cyan)
    for (const d of m.doors) {
      const locked = d.reqFlag && !isFlagUnlocked(this.progress, d.reqFlag);
      ctx.fillStyle = locked ? '#ef4444' : '#38bdf8';
      ctx.fillRect(
        Math.floor(ox + (d.x / 32) * scale) - 2,
        Math.floor(oy + (d.y / 32) * scale) - 2,
        5,
        5
      );
    }

    // Unopened Chests (gold)
    for (const c of m.chests) {
      if (this.progress.openedChests[c.id]) continue;
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(
        Math.floor(ox + (c.x / 32) * scale) - 2,
        Math.floor(oy + (c.y / 32) * scale) - 2,
        4,
        4
      );
    }

    // Unread Steles (violet)
    for (const st of m.steles) {
      if (this.progress.unlockedLore[st.id]) continue;
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(
        Math.floor(ox + (st.x / 32) * scale) - 2,
        Math.floor(oy + (st.y / 32) * scale) - 2,
        4,
        4
      );
    }

    // NPCs (emerald)
    for (const n of m.npcs) {
      if (!isNpcPresent(this.progress, n)) continue;
      const pos = this.getNpcPos(n);
      ctx.fillStyle = '#34d399';
      ctx.fillRect(
        Math.floor(ox + (pos.x / 32) * scale) - 2,
        Math.floor(oy + (pos.y / 32) * scale) - 2,
        4,
        4
      );
    }

    // Bosses (crimson)
    for (const mon of this.monsters) {
      if (mon.hp > 0 && mon.ai === 'boss') {
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(
          Math.floor(ox + (mon.wx / 32) * scale) - 3,
          Math.floor(oy + (mon.wy / 32) * scale) - 3,
          6,
          6
        );
      }
    }

    // Player (bright white/amber)
    ctx.fillStyle = '#fde047';
    ctx.fillRect(
      Math.floor(ox + (this.progress.wx / 32) * scale) - 3,
      Math.floor(oy + (this.progress.wy / 32) * scale) - 3,
      6,
      6
    );
  }
}
