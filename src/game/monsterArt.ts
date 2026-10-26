import { EntityAnimSet } from './spriteBank';
import { Direction } from './types';

class PixelSurface {
  public readonly w: number;
  public readonly h: number;
  private buf: Uint8ClampedArray;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.buf = new Uint8ClampedArray(w * h * 4);
  }

  private parseHex(hex: string): [number, number, number, number] {
    const clean = hex.startsWith('#') ? hex.slice(1) : hex;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const a = clean.length >= 8 ? parseInt(clean.slice(6, 8), 16) : 255;
    return [r, g, b, a];
  }

  public px(x: number, y: number, hex: string) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.w || iy >= this.h) return;
    const [r, g, b, a] = this.parseHex(hex);
    const idx = (iy * this.w + ix) * 4;
    if (a === 255 || this.buf[idx + 3] === 0) {
      this.buf[idx] = r;
      this.buf[idx + 1] = g;
      this.buf[idx + 2] = b;
      this.buf[idx + 3] = a;
    } else {
      const alpha = a / 255;
      this.buf[idx] = Math.round(this.buf[idx] * (1 - alpha) + r * alpha);
      this.buf[idx + 1] = Math.round(this.buf[idx + 1] * (1 - alpha) + g * alpha);
      this.buf[idx + 2] = Math.round(this.buf[idx + 2] * (1 - alpha) + b * alpha);
      this.buf[idx + 3] = Math.min(255, this.buf[idx + 3] + a);
    }
  }

  public rect(x: number, y: number, w: number, h: number, hex: string) {
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    for (let dy = 0; dy < Math.round(h); dy++) {
      for (let dx = 0; dx < Math.round(w); dx++) {
        this.px(x0 + dx, y0 + dy, hex);
      }
    }
  }

  public hline(x0: number, x1: number, y: number, hex: string) {
    const a = Math.min(Math.round(x0), Math.round(x1));
    const b = Math.max(Math.round(x0), Math.round(x1));
    for (let x = a; x <= b; x++) this.px(x, y, hex);
  }

  public vline(x: number, y0: number, y1: number, hex: string) {
    const a = Math.min(Math.round(y0), Math.round(y1));
    const b = Math.max(Math.round(y0), Math.round(y1));
    for (let y = a; y <= b; y++) this.px(x, y, hex);
  }

  public line(x0: number, y0: number, x1: number, y1: number, hex: string) {
    let ix0 = Math.round(x0);
    let iy0 = Math.round(y0);
    const ix1 = Math.round(x1);
    const iy1 = Math.round(y1);
    const dx = Math.abs(ix1 - ix0);
    const sx = ix0 < ix1 ? 1 : -1;
    const dy = -Math.abs(iy1 - iy0);
    const sy = iy0 < iy1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
      this.px(ix0, iy0, hex);
      if (ix0 === ix1 && iy0 === iy1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        ix0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        iy0 += sy;
      }
    }
  }

  public ellipse(cx: number, cy: number, rx: number, ry: number, hex: string) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x - cx) / Math.max(0.5, rx);
        const ny = (y - cy) / Math.max(0.5, ry);
        if (nx * nx + ny * ny <= 1.0) {
          this.px(x, y, hex);
        }
      }
    }
  }

  public outline(outlineHex = '#0b0d14') {
    const copy = new Uint8ClampedArray(this.buf);
    const [or, og, ob, oa] = this.parseHex(outlineHex);
    const isOpaque = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
      return copy[(y * this.w + x) * 4 + 3] > 180;
    };
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const idx = (y * this.w + x) * 4;
        if (copy[idx + 3] > 40) continue;
        if (isOpaque(x - 1, y) || isOpaque(x + 1, y) || isOpaque(x, y - 1) || isOpaque(x, y + 1)) {
          this.buf[idx] = or;
          this.buf[idx + 1] = og;
          this.buf[idx + 2] = ob;
          this.buf[idx + 3] = oa;
        }
      }
    }
  }

  public mirrorX(): PixelSurface {
    const out = new PixelSurface(this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const src = (y * this.w + x) * 4;
        const dst = (y * this.w + (this.w - 1 - x)) * 4;
        out.buf[dst] = this.buf[src];
        out.buf[dst + 1] = this.buf[src + 1];
        out.buf[dst + 2] = this.buf[src + 2];
        out.buf[dst + 3] = this.buf[src + 3];
      }
    }
    return out;
  }

  public toCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.w;
    c.height = this.h;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const img = ctx.createImageData(this.w, this.h);
    img.data.set(this.buf);
    ctx.putImageData(img, 0, 0);
    return c;
  }
}

function buildFourDirSet(
  size: number,
  drawDirFrame: (dir: 'bas' | 'haut' | 'gauche', frame: number) => PixelSurface
): EntityAnimSet {
  const bas: HTMLCanvasElement[] = [];
  const haut: HTMLCanvasElement[] = [];
  const gauche: HTMLCanvasElement[] = [];
  const droite: HTMLCanvasElement[] = [];

  for (let f = 0; f < 4; f++) {
    bas.push(drawDirFrame('bas', f).toCanvas());
    haut.push(drawDirFrame('haut', f).toCanvas());
    const leftSurf = drawDirFrame('gauche', f);
    gauche.push(leftSurf.toCanvas());
    droite.push(leftSurf.mirrorX().toCanvas());
  }

  return {
    size,
    walk: {
      [Direction.Bas]: bas,
      [Direction.Haut]: haut,
      [Direction.Gauche]: gauche,
      [Direction.Droite]: droite,
    },
  };
}

// ============================================================================
// 1. CHEVALIER D'OS (Bone Knight) & UNDEAD / PRAETORIAN VARIANTS — 32x32
// ============================================================================
export interface BoneKnightPalette {
  boneLight: string;
  boneMid: string;
  boneShadow: string;
  armorLight: string;
  armorMid: string;
  armorDark: string;
  tabardLight: string;
  tabardDark: string;
  eyeGlow: string;
  eyeCore: string;
  bladeLight: string;
  bladeMid: string;
  horned: boolean;
  crestedShield: boolean;
}

export function buildBoneKnightSprite(pal: BoneKnightPalette): EntityAnimSet {
  return buildFourDirSet(32, (dir, f) => {
    const s = new PixelSurface(32, 32);
    const bob = f === 1 || f === 3 ? 1 : 0;
    const stride = f === 1 ? -2 : f === 3 ? 2 : 0;
    const swing = f === 1 ? 1 : f === 3 ? -1 : 0;

    // Ground shadow
    s.ellipse(16, 29, 8, 2, '#090d1688');

    if (dir === 'bas') {
      // Tattered Crimson Back-Cape peeking behind legs
      s.rect(10, 15 + bob, 12, 10, pal.tabardDark);
      s.px(10, 25 + bob, pal.tabardDark);
      s.px(15, 25 + bob, pal.tabardDark);
      s.px(21, 25 + bob, pal.tabardDark);

      // Skeletal Greaves & Boots
      const ly = 22 + (stride < 0 ? -1 : 0);
      const ry = 22 + (stride > 0 ? -1 : 0);
      s.rect(11, ly, 3, 6, pal.armorDark);
      s.rect(11, ly + 1, 2, 4, pal.boneMid);
      s.rect(10, ly + 5, 4, 2, pal.armorMid);

      s.rect(18, ry, 3, 6, pal.armorDark);
      s.rect(19, ry + 1, 2, 4, pal.boneMid);
      s.rect(18, ry + 5, 4, 2, pal.armorMid);

      // Ribcage & Royal Tabard
      s.rect(11, 13 + bob, 10, 9, pal.armorDark);
      for (let ryRib = 14; ryRib <= 18; ryRib += 2) {
        s.hline(12, 19, ryRib + bob, pal.boneMid);
      }
      s.vline(15, 13 + bob, 19 + bob, pal.tabardLight);
      s.vline(16, 13 + bob, 19 + bob, pal.tabardDark);
      s.rect(13, 19 + bob, 6, 4, pal.tabardLight);
      s.hline(12, 19, 19 + bob, pal.armorLight); // Belt

      // Spiked Pauldrons
      s.rect(7, 12 + bob, 5, 4, pal.armorMid);
      s.hline(8, 11, 12 + bob, pal.armorLight);
      s.px(7, 11 + bob, pal.boneLight);
      s.rect(20, 12 + bob, 5, 4, pal.armorMid);
      s.hline(20, 23, 12 + bob, pal.armorLight);
      s.px(24, 11 + bob, pal.boneLight);

      // Horns (if horned champion)
      if (pal.horned) {
        s.line(10, 7 + bob, 6, 3 + bob, pal.boneMid);
        s.line(7, 3 + bob, 6, 2 + bob, pal.boneLight);
        s.line(21, 7 + bob, 25, 3 + bob, pal.boneMid);
        s.line(24, 3 + bob, 25, 2 + bob, pal.boneLight);
      }

      // Skull & Crowned Nasal Helm
      s.ellipse(15.5, 8 + bob, 5, 4.5, pal.boneMid);
      s.hline(12, 19, 4 + bob, pal.armorLight);
      s.hline(11, 20, 5 + bob, pal.armorMid);
      s.vline(15, 5 + bob, 8 + bob, pal.armorLight);
      s.hline(12, 19, 6 + bob, pal.boneLight);
      // Hollow eye sockets + soul fire
      s.rect(12, 7 + bob, 3, 2, '#090d16');
      s.rect(17, 7 + bob, 3, 2, '#090d16');
      s.px(13, 7 + bob, pal.eyeCore);
      s.px(12, 8 + bob, pal.eyeGlow);
      s.px(18, 7 + bob, pal.eyeCore);
      s.px(19, 8 + bob, pal.eyeGlow);
      // Grinning teeth
      s.hline(13, 18, 11 + bob, '#090d16');
      s.px(13, 11 + bob, pal.boneLight);
      s.px(15, 11 + bob, pal.boneLight);
      s.px(17, 11 + bob, pal.boneLight);

      // Left-hand Bone Broadsword (viewer left, x=4..8)
      const sy = 15 + bob + swing;
      s.vline(5, sy - 9, sy + 2, pal.bladeLight);
      s.vline(6, sy - 8, sy + 2, pal.bladeMid);
      s.px(5, sy - 10, '#ffffff');
      s.hline(3, 8, sy + 2, pal.armorLight); // Crossguard
      s.vline(5, sy + 3, sy + 5, pal.tabardDark);
      s.rect(6, 15 + bob, 2, 3, pal.boneLight); // Skeletal hand

      // Right-hand Spiked Heater Shield (viewer right, x=20..27)
      const shy = 14 + bob - swing;
      s.rect(20, shy, 7, 8, pal.armorDark);
      s.rect(21, shy + 1, 5, 6, pal.tabardDark);
      s.hline(20, 26, shy, pal.armorLight);
      s.vline(20, shy, shy + 6, pal.armorMid);
      s.vline(26, shy, shy + 6, pal.armorMid);
      s.hline(21, 25, shy + 8, pal.armorMid);
      s.hline(22, 24, shy + 9, pal.armorDark);
      if (pal.crestedShield) {
        s.rect(22, shy + 2, 3, 3, pal.boneLight);
        s.px(23, shy + 3, pal.eyeGlow);
      }
    } else if (dir === 'haut') {
      // Back view: horned helm rear, full tattered royal crimson cloak & exposed spine crest
      if (pal.horned) {
        s.line(10, 7 + bob, 6, 3 + bob, pal.boneMid);
        s.px(6, 2 + bob, pal.boneLight);
        s.line(21, 7 + bob, 25, 3 + bob, pal.boneMid);
        s.px(25, 2 + bob, pal.boneLight);
      }
      // Sword tip & shield rim peeking from behind
      s.vline(6, 6 + bob + swing, 16 + bob + swing, pal.bladeMid);
      s.vline(5, 7 + bob + swing, 14 + bob + swing, pal.bladeLight);
      s.rect(22, 14 + bob - swing, 5, 8, pal.armorMid);

      // Legs
      s.rect(11, 22 + (stride < 0 ? -1 : 0), 3, 6, pal.armorDark);
      s.rect(18, 22 + (stride > 0 ? -1 : 0), 3, 6, pal.armorDark);

      // Helm back
      s.ellipse(15.5, 8 + bob, 5, 4.5, pal.armorMid);
      s.hline(12, 19, 5 + bob, pal.armorLight);
      s.rect(13, 9 + bob, 6, 3, pal.boneShadow);

      // Pauldrons + Tattered Cloak
      s.rect(7, 12 + bob, 18, 4, pal.armorMid);
      s.hline(8, 23, 12 + bob, pal.armorLight);
      s.rect(9, 14 + bob, 14, 10, pal.tabardDark);
      s.rect(11, 14 + bob, 10, 8, pal.tabardLight);
      // Bone spine motif down cloak back
      for (let y = 15; y <= 21; y += 2) {
        s.hline(14, 17, y + bob, pal.boneMid);
      }
      // Tattered notches at bottom
      s.px(10, 24 + bob, pal.tabardDark);
      s.px(13, 25 + bob, pal.tabardDark);
      s.px(18, 25 + bob, pal.tabardDark);
      s.px(21, 24 + bob, pal.tabardDark);
    } else {
      // Side profile (facing LEFT; mirrored automatically for RIGHT)
      // Flowing cloak behind right side
      s.line(18, 13 + bob, 24, 23 + bob, pal.tabardDark);
      s.line(17, 13 + bob, 22, 24 + bob, pal.tabardLight);
      s.line(19, 15 + bob, 25, 22 + bob, pal.tabardDark);

      // Striding skeletal legs
      const lx1 = 14 + stride;
      const lx2 = 17 - stride;
      s.rect(lx1, 22, 3, 6, pal.armorDark);
      s.vline(lx1 + 1, 22, 26, pal.boneMid);
      s.hline(lx1 - 1, lx1 + 2, 27, pal.armorMid);

      s.rect(lx2, 22, 3, 6, pal.armorDark);
      s.vline(lx2 + 1, 22, 26, pal.boneShadow);
      s.hline(lx2 - 1, lx2 + 2, 27, pal.armorMid);

      // Extended Bone Broadsword thrusting forward-left
      const wy = 15 + bob + swing;
      s.line(3, wy - 6, 11, wy + 2, pal.bladeLight);
      s.line(4, wy - 6, 12, wy + 2, pal.bladeMid);
      s.px(2, wy - 7, '#ffffff');
      s.line(9, wy + 4, 13, wy, pal.armorLight);

      // Torso & Ribcage profile
      s.rect(12, 13 + bob, 8, 9, pal.armorDark);
      s.hline(12, 18, 15 + bob, pal.boneLight);
      s.hline(12, 18, 17 + bob, pal.boneMid);
      s.rect(13, 19 + bob, 6, 4, pal.tabardLight);

      // Profile Skull & Horn curving sweepingly back
      s.ellipse(15, 8 + bob, 4.5, 4.2, pal.boneMid);
      s.hline(11, 19, 5 + bob, pal.armorLight);
      s.rect(10, 7 + bob, 3, 2, '#090d16');
      s.px(11, 7 + bob, pal.eyeCore);
      s.px(12, 8 + bob, pal.eyeGlow);
      s.hline(10, 14, 10 + bob, pal.boneLight); // Jaw
      if (pal.horned) {
        s.line(15, 6 + bob, 22, 2 + bob, pal.boneLight);
        s.line(16, 7 + bob, 22, 3 + bob, pal.boneMid);
      }

      // Heater Shield strapped on near shoulder/forearm
      s.rect(13, 13 + bob - swing, 6, 8, pal.armorLight);
      s.rect(14, 14 + bob - swing, 4, 6, pal.tabardDark);
      if (pal.crestedShield) {
        s.px(15, 16 + bob - swing, pal.boneLight);
        s.px(16, 16 + bob - swing, pal.eyeGlow);
      }
    }

    s.outline('#0b0d14');
    return s;
  });
}

// ============================================================================
// 2. ARCHIMAGE DE L'ECLIPSE (Eclipse Archmage) & CASTERS — 32x32
// ============================================================================
export interface CasterSpritePalette {
  robeLight: string;
  robeMid: string;
  robeDark: string;
  trimGold: string;
  trimBright: string;
  innerVoid: string;
  eyeGlow: string;
  orbCore: string;
  orbRing: string;
  staffWood: string;
  eclipseCrest: boolean;
}

export function buildCasterSprite(pal: CasterSpritePalette): EntityAnimSet {
  return buildFourDirSet(32, (dir, f) => {
    const s = new PixelSurface(32, 32);
    const floatY = f === 1 ? -1 : f === 3 ? 1 : 0;
    const pulse = f % 2 === 0;

    // Arcane shadow aura on floor
    s.ellipse(16, 29, 8, 2, '#1e1b4b99');

    if (dir === 'bas') {
      // Flowing Bell-Shaped Vestments
      s.ellipse(16, 22 + floatY, 7.5, 6, pal.robeDark);
      s.rect(11, 13 + floatY, 10, 12, pal.robeMid);
      s.vline(10, 16 + floatY, 25 + floatY, pal.robeDark);
      s.vline(21, 16 + floatY, 25 + floatY, pal.robeDark);
      // Gold embroidered stole & hem
      s.hline(9, 22, 25 + floatY, pal.trimGold);
      s.vline(13, 13 + floatY, 25 + floatY, pal.trimGold);
      s.vline(18, 13 + floatY, 25 + floatY, pal.trimGold);
      s.rect(14, 14 + floatY, 4, 11, pal.innerVoid);

      // Solar Eclipse Medallion on chest
      if (pal.eclipseCrest) {
        s.rect(14, 15 + floatY, 4, 4, pal.trimBright);
        s.rect(15, 16 + floatY, 2, 2, '#09090b');
      }

      // Wide Mantle Shoulders
      s.rect(8, 12 + floatY, 16, 3, pal.robeLight);
      s.hline(8, 23, 12 + floatY, pal.trimGold);

      // Deep Pointed Occultist Hood + Burning Eyes
      s.ellipse(15.5, 8 + floatY, 5, 4.5, pal.robeLight);
      s.px(15, 2 + floatY, pal.robeMid);
      s.hline(14, 17, 3 + floatY, pal.robeLight);
      s.ellipse(15.5, 8.5 + floatY, 3.3, 3, '#05050a');
      s.px(14, 8 + floatY, pal.eyeGlow);
      s.px(13, 8 + floatY, pal.trimBright);
      s.px(17, 8 + floatY, pal.eyeGlow);
      s.px(18, 8 + floatY, pal.trimBright);

      // Left-side Tall Gnarled Eclipse Staff (x=5..7)
      s.vline(6, 7 + floatY, 27 + floatY, pal.staffWood);
      s.hline(5, 7, 7 + floatY, pal.trimGold);
      // Levitating Black-Sun Eclipse Ring above staff!
      s.ellipse(6, 4 + floatY, 3, 3, pal.orbRing);
      s.ellipse(6, 4 + floatY, 1.6, 1.6, pal.orbCore);
      if (pulse) {
        s.px(2, 4 + floatY, pal.trimBright);
        s.px(10, 4 + floatY, pal.trimBright);
        s.px(6, 0 + Math.max(0, floatY), pal.trimBright);
      }

      // Right-hand Spell Focus / Orbiting Fire Mote
      const mx = pulse ? 25 : 24;
      const my = 15 + floatY + (f === 2 ? -1 : 0);
      s.ellipse(mx, my, 2.2, 2.2, pal.orbRing);
      s.px(mx, my, pal.trimBright);
    } else if (dir === 'haut') {
      // Back of Hood & Grand Eclipse Sun-Crest Cloak
      s.vline(6, 7 + floatY, 27 + floatY, pal.staffWood);
      s.ellipse(6, 4 + floatY, 3, 3, pal.orbRing);
      s.ellipse(6, 4 + floatY, 1.6, 1.6, pal.orbCore);

      s.ellipse(16, 22 + floatY, 7.5, 6, pal.robeDark);
      s.rect(9, 12 + floatY, 14, 13, pal.robeMid);
      s.hline(9, 22, 25 + floatY, pal.trimGold);
      s.hline(8, 23, 12 + floatY, pal.trimGold);

      // Embroidered Eclipse Ring on back of robe
      if (pal.eclipseCrest) {
        s.ellipse(15.5, 18 + floatY, 3.5, 3.5, pal.trimGold);
        s.ellipse(15.5, 18 + floatY, 2, 2, pal.innerVoid);
        s.px(15, 13 + floatY, pal.trimBright);
        s.px(15, 23 + floatY, pal.trimBright);
        s.px(10, 18 + floatY, pal.trimBright);
        s.px(21, 18 + floatY, pal.trimBright);
      }

      s.ellipse(15.5, 8 + floatY, 5, 4.5, pal.robeMid);
      s.hline(14, 17, 3 + floatY, pal.robeLight);
      s.px(15, 2 + floatY, pal.robeDark);
    } else {
      // Side Profile (facing LEFT; mirrored for RIGHT)
      // Staff held forward on left (x=5..8)
      s.vline(7, 8 + floatY, 27 + floatY, pal.staffWood);
      s.ellipse(7, 5 + floatY, 3, 3, pal.orbRing);
      s.ellipse(7, 5 + floatY, 1.5, 1.5, pal.orbCore);
      if (pulse) s.px(4, 3 + floatY, pal.trimBright);

      // Sweeping robe train to the right
      s.ellipse(16, 22 + floatY, 6.5, 5.5, pal.robeDark);
      s.rect(12, 12 + floatY, 9, 13, pal.robeMid);
      s.line(20, 13 + floatY, 24, 25 + floatY, pal.robeDark);
      s.hline(11, 24, 25 + floatY, pal.trimGold);
      s.vline(14, 13 + floatY, 25 + floatY, pal.trimGold);

      // Pointed hood profile curving back + glowing eye
      s.ellipse(15, 8 + floatY, 4.5, 4.2, pal.robeLight);
      s.line(17, 5 + floatY, 22, 4 + floatY, pal.robeMid);
      s.rect(11, 7 + floatY, 3, 3, '#05050a');
      s.px(12, 8 + floatY, pal.eyeGlow);
      s.px(11, 8 + floatY, pal.trimBright);

      // Sleeve extended toward staff
      s.rect(9, 15 + floatY, 5, 3, pal.robeLight);
      s.px(9, 16 + floatY, pal.trimGold);
    }

    s.outline('#0b0d14');
    return s;
  });
}

// ============================================================================
// 3. GOLEM D'OBSIDIENNE (Obsidian Golem) & RUNE GOLEM — 36x36
// ============================================================================
export interface GolemPalette {
  rockHighlight: string;
  rockMid: string;
  rockDark: string;
  rockDeep: string;
  veinOuter: string;
  veinMid: string;
  veinCore: string;
  obsidianSpikes: boolean;
}

export function buildGolemSprite(pal: GolemPalette, size = 36): EntityAnimSet {
  return buildFourDirSet(size, (dir, f) => {
    const s = new PixelSurface(size, size);
    const cx = Math.floor(size / 2);
    const stompL = f === 1 ? -2 : 0;
    const stompR = f === 3 ? -2 : 0;
    const heave = f === 1 || f === 3 ? 1 : 0;
    const brightCore = f % 2 === 0 ? pal.veinCore : pal.veinMid;

    s.ellipse(cx, size - 3, 11, 2.5, '#090d1699');

    if (dir === 'bas') {
      // Pillar Legs
      s.rect(cx - 8, 23 + stompL, 6, 9, pal.rockDark);
      s.rect(cx - 7, 24 + stompL, 4, 7, pal.rockMid);
      s.hline(cx - 7, cx - 4, 27 + stompL, pal.veinOuter);

      s.rect(cx + 2, 23 + stompR, 6, 9, pal.rockDark);
      s.rect(cx + 3, 24 + stompR, 4, 7, pal.rockMid);
      s.hline(cx + 4, cx + 7, 27 + stompR, pal.veinOuter);

      // Massive Craggy Torso
      s.ellipse(cx, 16 + heave, 9.5, 8, pal.rockDark);
      s.ellipse(cx, 15 + heave, 8, 6.5, pal.rockMid);
      // Faceted glass highlights
      s.line(cx - 7, 11 + heave, cx - 3, 9 + heave, pal.rockHighlight);
      s.line(cx + 3, 9 + heave, cx + 7, 11 + heave, pal.rockHighlight);

      // Jagged Obsidian Shoulder Spires
      if (pal.obsidianSpikes) {
        s.line(cx - 10, 12 + heave, cx - 13, 5 + heave, pal.rockMid);
        s.line(cx - 9, 12 + heave, cx - 12, 6 + heave, pal.rockHighlight);
        s.line(cx + 10, 12 + heave, cx + 13, 5 + heave, pal.rockMid);
        s.line(cx + 9, 12 + heave, cx + 12, 6 + heave, pal.rockHighlight);
      }

      // Blazing Magma / Rune Core in Chest + Fissure Veins
      s.ellipse(cx, 16 + heave, 3.2, 3.2, pal.veinOuter);
      s.ellipse(cx, 16 + heave, 2, 2, pal.veinMid);
      s.rect(cx - 1, 15 + heave, 2, 2, brightCore);
      s.line(cx - 3, 15 + heave, cx - 6, 13 + heave, pal.veinOuter);
      s.line(cx + 3, 15 + heave, cx + 6, 13 + heave, pal.veinOuter);
      s.line(cx, 19 + heave, cx, 22 + heave, pal.veinMid);

      // Low-slung Monolithic Head & Cyclopean Furnace Visor
      s.rect(cx - 5, 6 + heave, 10, 6, pal.rockDeep);
      s.rect(cx - 4, 5 + heave, 8, 5, pal.rockMid);
      s.hline(cx - 3, cx + 2, 5 + heave, pal.rockHighlight);
      s.rect(cx - 3, 8 + heave, 6, 2, pal.veinOuter);
      s.hline(cx - 2, cx + 1, 8 + heave, brightCore);

      // Heavy Gorilla-Style Boulder Arms & Fists
      const ayL = 13 + heave - stompL;
      const ayR = 13 + heave - stompR;
      s.rect(cx - 14, ayL, 5, 12, pal.rockDark);
      s.rect(cx - 13, ayL + 1, 3, 5, pal.rockHighlight);
      s.rect(cx - 15, ayL + 8, 6, 6, pal.rockDeep);
      s.hline(cx - 14, cx - 10, ayL + 10, pal.veinMid);

      s.rect(cx + 9, ayR, 5, 12, pal.rockDark);
      s.rect(cx + 10, ayR + 1, 3, 5, pal.rockHighlight);
      s.rect(cx + 9, ayR + 8, 6, 6, pal.rockDeep);
      s.hline(cx + 10, cx + 14, ayR + 10, pal.veinMid);
    } else if (dir === 'haut') {
      // Back view: volcanic dorsal vents & glowing magma spine
      s.rect(cx - 8, 23 + stompL, 6, 9, pal.rockDark);
      s.rect(cx + 2, 23 + stompR, 6, 9, pal.rockDark);
      s.ellipse(cx, 16 + heave, 9.5, 8, pal.rockDeep);
      s.ellipse(cx, 15 + heave, 8, 6.5, pal.rockDark);
      if (pal.obsidianSpikes) {
        s.line(cx - 10, 12 + heave, cx - 13, 5 + heave, pal.rockHighlight);
        s.line(cx + 10, 12 + heave, cx + 13, 5 + heave, pal.rockHighlight);
      }
      // Glowing dorsal spine fissures
      for (let vy = 9; vy <= 20; vy += 3) {
        s.hline(cx - 2, cx + 2, vy + heave, pal.veinOuter);
        s.px(cx, vy + heave, brightCore);
      }
      s.rect(cx - 14, 13 + heave, 5, 13, pal.rockDark);
      s.rect(cx + 9, 13 + heave, 5, 13, pal.rockDark);
      s.rect(cx - 4, 5 + heave, 8, 6, pal.rockMid);
    } else {
      // Side Profile (facing LEFT; mirrored for RIGHT)
      const stride = f === 1 ? -2 : f === 3 ? 2 : 0;
      // Back leg
      s.rect(cx + 1 - stride, 23, 6, 9, pal.rockDeep);
      // Torso & hunched monolith head jutting forward-left
      s.ellipse(cx, 16 + heave, 8, 8, pal.rockDark);
      s.ellipse(cx - 1, 15 + heave, 6.5, 6.5, pal.rockMid);
      if (pal.obsidianSpikes) {
        s.line(cx + 2, 10 + heave, cx + 8, 4 + heave, pal.rockHighlight);
        s.line(cx + 4, 12 + heave, cx + 10, 7 + heave, pal.rockMid);
      }
      // Visor on left side of head
      s.rect(cx - 7, 7 + heave, 8, 6, pal.rockMid);
      s.rect(cx - 8, 9 + heave, 3, 2, pal.veinOuter);
      s.px(cx - 7, 9 + heave, brightCore);

      // Front leg
      s.rect(cx - 5 + stride, 23, 6, 9, pal.rockDark);
      s.rect(cx - 4 + stride, 24, 4, 7, pal.rockMid);

      // Foreground swinging boulder arm with magma cracks
      const swingX = f === 1 ? -2 : f === 3 ? 2 : 0;
      s.rect(cx - 5 + swingX, 13 + heave, 6, 13, pal.rockDark);
      s.rect(cx - 4 + swingX, 14 + heave, 4, 6, pal.rockHighlight);
      s.rect(cx - 7 + swingX, 21 + heave, 7, 6, pal.rockDeep);
      s.hline(cx - 6 + swingX, cx - 2 + swingX, 23 + heave, pal.veinMid);
      s.px(cx - 4 + swingX, 18 + heave, brightCore);
    }

    s.outline('#090b10');
    return s;
  });
}

// ============================================================================
// 4. SIRE MALAKOR, CHEVALIER DECHU (Boss Act II) — 48x48
// ============================================================================
export function buildSirMalakorSprite(): EntityAnimSet {
  const steelHi = '#94a3b8';
  const steelMid = '#475569';
  const steelDark = '#1e293b';
  const steelDeep = '#0f172a';
  const goldHi = '#fde047';
  const goldMid = '#d97706';
  const capeHi = '#dc2626';
  const capeMid = '#991b1b';
  const capeDark = '#450a0a';
  const runeGlow = '#c084fc';
  const visorGlow = '#f59e0b';

  return buildFourDirSet(48, (dir, f) => {
    const s = new PixelSurface(48, 48);
    const bob = f === 1 || f === 3 ? 1 : 0;
    const stride = f === 1 ? -2 : f === 3 ? 2 : 0;
    const capeWave = f === 0 ? 0 : f === 1 ? 1 : f === 2 ? 2 : 1;

    s.ellipse(24, 44, 13, 3, '#090d16aa');

    if (dir === 'bas') {
      // Billowing Royal Crimson Cape behind armor
      s.ellipse(24, 29 + bob, 13 + (capeWave === 2 ? 1 : 0), 12, capeDark);
      s.ellipse(24, 28 + bob, 11, 10, capeMid);
      s.px(13, 40 + bob, capeDark);
      s.px(19, 41 + bob, capeMid);
      s.px(29, 41 + bob, capeMid);
      s.px(35, 40 + bob, capeDark);

      // Armored Sabatons & Greaves
      const ly = 32 + (stride < 0 ? -1 : 0);
      const ry = 32 + (stride > 0 ? -1 : 0);
      s.rect(16, ly, 6, 11, steelDeep);
      s.rect(17, ly + 1, 4, 8, steelMid);
      s.hline(17, 20, ly + 3, goldMid);
      s.rect(15, ly + 9, 7, 3, steelHi);

      s.rect(26, ry, 6, 11, steelDeep);
      s.rect(27, ry + 1, 4, 8, steelMid);
      s.hline(27, 30, ry + 3, goldMid);
      s.rect(26, ry + 9, 7, 3, steelHi);

      // Breastplate & Corrupted Iron-Shard Core
      s.rect(16, 18 + bob, 16, 14, steelDark);
      s.rect(18, 19 + bob, 12, 11, steelMid);
      s.hline(16, 31, 29 + bob, goldMid); // Royal girdle
      s.rect(22, 28 + bob, 4, 4, goldHi);
      // Tattered front surcoat
      s.rect(20, 31 + bob, 8, 7, capeHi);
      s.vline(23, 31 + bob, 37 + bob, goldMid);
      // Cursed Iron-Shard Emblem on chest
      s.ellipse(24, 23 + bob, 3, 3, '#090d16');
      s.ellipse(24, 23 + bob, 1.8, 1.8, runeGlow);
      s.px(24, 23 + bob, '#ffffff');

      // Asymmetric Lion/Spiked Pauldrons
      s.rect(10, 17 + bob, 8, 6, steelMid);
      s.hline(11, 17, 17 + bob, steelHi);
      s.hline(10, 17, 22 + bob, goldMid);
      s.line(10, 17 + bob, 7, 13 + bob, steelHi);

      s.rect(30, 17 + bob, 8, 6, steelMid);
      s.hline(30, 36, 17 + bob, steelHi);
      s.hline(30, 37, 22 + bob, goldMid);
      s.line(37, 17 + bob, 40, 13 + bob, steelHi);

      // Winged Dark-Steel Greathelm + Burning Amber T-Visor
      s.rect(18, 8 + bob, 12, 10, steelDark);
      s.rect(19, 7 + bob, 10, 9, steelMid);
      s.hline(20, 27, 7 + bob, steelHi);
      // Winged crests
      s.line(17, 12 + bob, 12, 5 + bob, goldMid);
      s.line(17, 10 + bob, 13, 4 + bob, goldHi);
      s.line(30, 12 + bob, 35, 5 + bob, goldMid);
      s.line(30, 10 + bob, 34, 4 + bob, goldHi);
      // Burning T-visor
      s.hline(20, 27, 12 + bob, '#09090b');
      s.vline(23, 12 + bob, 16 + bob, '#09090b');
      s.vline(24, 12 + bob, 16 + bob, '#09090b');
      s.hline(20, 22, 12 + bob, visorGlow);
      s.hline(25, 27, 12 + bob, visorGlow);
      s.px(21, 12 + bob, goldHi);
      s.px(26, 12 + bob, goldHi);

      // Colossal Runed Eclipse Greatsword (left hand x=5..11)
      const sy = 10 + bob + (f === 1 ? 1 : 0);
      s.rect(7, sy, 3, 24, steelHi);
      s.vline(9, sy + 1, sy + 23, steelMid);
      s.vline(8, sy + 4, sy + 19, runeGlow); // Glowing Eclipse runes on blade!
      s.px(8, sy - 2, '#ffffff');
      s.hline(7, 9, sy - 1, steelHi);
      s.hline(4, 12, sy + 23, goldHi); // Wide winged crossguard
      s.vline(8, sy + 24, sy + 28, capeDark);
      s.rect(7, sy + 28, 3, 2, goldMid);

      // Right-hand Runic Tower Shield (x=34..42)
      s.rect(34, 21 + bob, 8, 13, steelDeep);
      s.rect(35, 22 + bob, 6, 11, capeMid);
      s.hline(34, 41, 21 + bob, goldMid);
      s.vline(34, 21 + bob, 33 + bob, steelHi);
      s.vline(41, 21 + bob, 33 + bob, steelMid);
      s.rect(37, 25 + bob, 2, 5, goldHi);
    } else if (dir === 'haut') {
      // Majestic Rear View: Winged Greathelm + Full Royal-Crimson Embroidered Cape
      s.rect(7, 10 + bob, 3, 22, steelMid);
      s.rect(35, 21 + bob, 7, 12, steelMid);

      s.rect(16, 33 + (stride < 0 ? -1 : 0), 6, 10, steelDeep);
      s.rect(26, 33 + (stride > 0 ? -1 : 0), 6, 10, steelDeep);

      // Winged Helm Back
      s.rect(18, 7 + bob, 12, 10, steelMid);
      s.line(17, 12 + bob, 12, 5 + bob, goldHi);
      s.line(30, 12 + bob, 35, 5 + bob, goldHi);

      // Pauldrons + Sweeping Crimson Mantle
      s.rect(10, 17 + bob, 28, 5, steelHi);
      s.rect(12, 19 + bob, 24, 21, capeDark);
      s.rect(14, 19 + bob, 20, 19, capeMid);
      s.rect(17, 20 + bob, 14, 16, capeHi);
      // Broken Crown / Eclipse Heraldry in gold on back of cape
      s.ellipse(24, 27 + bob, 4.5, 4.5, goldMid);
      s.ellipse(24, 27 + bob, 2.5, 2.5, capeDark);
      s.hline(14, 33, 37 + bob, goldMid);
    } else {
      // Side Profile (facing LEFT; mirrored for RIGHT)
      // Flowing crimson cape trailing right
      s.line(26, 18 + bob, 39, 36 + bob, capeDark);
      s.ellipse(31, 29 + bob, 7, 9, capeMid);
      s.line(25, 19 + bob, 36, 37 + bob, capeHi);

      // Striding Armored Legs
      s.rect(20 + stride, 32, 6, 11, steelMid);
      s.hline(19 + stride, 25 + stride, 41, steelHi);
      s.rect(25 - stride, 32, 6, 11, steelDeep);

      // Eclipse Greatsword angled menacingly forward-left
      s.line(4, 10 + bob, 16, 26 + bob, steelHi);
      s.line(5, 10 + bob, 17, 26 + bob, steelMid);
      s.line(7, 13 + bob, 14, 23 + bob, runeGlow);
      s.line(13, 28 + bob, 19, 23 + bob, goldHi);

      // Breastplate & Pauldron Profile
      s.rect(17, 18 + bob, 12, 14, steelDark);
      s.rect(18, 19 + bob, 9, 11, steelMid);
      s.ellipse(23, 21 + bob, 5, 4, steelHi);
      s.hline(18, 27, 29 + bob, goldMid);

      // Profile Greathelm + Swept Golden Wing + Burning Visor Slit
      s.rect(17, 8 + bob, 11, 10, steelMid);
      s.hline(18, 27, 8 + bob, steelHi);
      s.rect(16, 12 + bob, 4, 2, visorGlow);
      s.px(17, 12 + bob, goldHi);
      s.line(23, 11 + bob, 33, 4 + bob, goldHi);
      s.line(24, 13 + bob, 34, 6 + bob, goldMid);
    }

    s.outline('#090b10');
    return s;
  });
}

// ============================================================================
// 5. VORGATH, ARCHILICHE DE L'ECLIPSE (Boss Act IV) — 48x48
// ============================================================================
export function buildArchlichVorgathSprite(): EntityAnimSet {
  const robeLight = '#9333ea';
  const robeMid = '#6b21a8';
  const robeDark = '#3b0764';
  const voidBlack = '#090514';
  const boneHi = '#f8fafc';
  const boneMid = '#cbd5e1';
  const goldHi = '#fef08a';
  const goldMid = '#f59e0b';
  const goldDark = '#b45309';
  const amethHi = '#f0abfc';
  const amethMid = '#c084fc';

  return buildFourDirSet(48, (dir, f) => {
    const s = new PixelSurface(48, 48);
    const hover = f === 1 ? -2 : f === 2 ? -1 : f === 3 ? 1 : 0;
    const crownBob = f % 2 === 0 ? -1 : 0;

    // Swirling Necromantic Shadow Vortex on the floor
    s.ellipse(24, 44, 13, 3, '#3b0764bb');
    s.ellipse(24, 44, 8, 1.8, amethMid);

    if (dir === 'bas') {
      // High Gothic Necromancer Collar behind skull
      s.ellipse(24, 15 + hover, 10, 5, robeDark);
      s.hline(14, 34, 12 + hover, goldMid);

      // Flowing Imperial Violet & Gold Vestments (levitating hem)
      s.ellipse(24, 31 + hover, 11, 11, robeDark);
      s.rect(16, 17 + hover, 16, 20, robeMid);
      s.rect(20, 18 + hover, 8, 20, voidBlack);
      s.vline(19, 17 + hover, 38 + hover, goldMid);
      s.vline(28, 17 + hover, 38 + hover, goldMid);
      // Exposed gilded skeletal ribcage & Amethyst Heart
      for (let ry = 19; ry <= 25; ry += 2) {
        s.hline(21, 26, ry + hover, boneMid);
      }
      s.ellipse(24, 22 + hover, 2, 2, amethHi);
      // Tattered levitating robe tails
      s.rect(15, 37 + hover, 3, 4, robeDark);
      s.rect(22, 38 + hover, 4, 4, robeMid);
      s.rect(30, 37 + hover, 3, 4, robeDark);

      // Gilded Bone Pauldrons
      s.ellipse(14, 18 + hover, 4, 3, boneMid);
      s.hline(11, 17, 17 + hover, goldHi);
      s.ellipse(34, 18 + hover, 4, 3, boneMid);
      s.hline(31, 37, 17 + hover, goldHi);

      // Sculpted Ancient Lich Skull
      s.ellipse(24, 13 + hover, 5, 5, boneHi);
      s.rect(20, 12 + hover, 3, 3, voidBlack);
      s.rect(25, 12 + hover, 3, 3, voidBlack);
      s.px(21, 13 + hover, goldHi);
      s.px(22, 13 + hover, amethHi);
      s.px(26, 13 + hover, goldHi);
      s.px(25, 13 + hover, amethHi);
      s.hline(22, 26, 17 + hover, boneMid);

      // Five-Spired Floating Crown of Forgotten Kings
      const cy = 6 + hover + crownBob;
      s.hline(19, 29, cy + 2, goldMid);
      s.hline(20, 28, cy + 1, goldHi);
      s.vline(19, cy - 1, cy + 2, goldMid);
      s.vline(21, cy - 2, cy + 2, goldHi);
      s.vline(24, cy - 4, cy + 2, goldHi);
      s.px(24, cy - 4, amethHi);
      s.vline(27, cy - 2, cy + 2, goldHi);
      s.vline(29, cy - 1, cy + 2, goldMid);

      // Right-hand Twin-Crescent Eclipse Scepter (viewer left, x=6..12)
      s.vline(9, 12 + hover, 39 + hover, goldDark);
      s.vline(8, 14 + hover, 37 + hover, goldMid);
      s.ellipse(9, 9 + hover, 4, 4, goldHi);
      s.ellipse(9, 9 + hover, 2.2, 2.2, voidBlack);
      s.px(9, 9 + hover, amethHi);

      // Left-hand Levitating Amethyst Phylactery Orb (viewer right, x=36..42)
      const oy = 20 + hover + (f % 2 === 0 ? -1 : 1);
      s.ellipse(39, oy, 3.5, 3.5, amethMid);
      s.ellipse(39, oy, 2, 2, amethHi);
      s.px(38, oy - 1, '#ffffff');
      s.rect(35, 25 + hover, 3, 2, boneHi); // Skeletal casting hand
    } else if (dir === 'haut') {
      // Back view: Floating Five-Spired Crown + Grand Astral Eclipse Mantle
      s.vline(9, 12 + hover, 39 + hover, goldMid);
      s.ellipse(9, 9 + hover, 4, 4, goldHi);
      s.ellipse(9, 9 + hover, 2, 2, voidBlack);

      s.ellipse(24, 30 + hover, 11.5, 12, robeDark);
      s.rect(14, 15 + hover, 20, 23, robeMid);
      s.rect(17, 17 + hover, 14, 19, robeLight);
      s.hline(14, 33, 12 + hover, goldMid);
      s.hline(15, 32, 37 + hover, goldMid);
      // Giant Golden Eclipse Seal on back
      s.ellipse(24, 26 + hover, 5, 5, goldHi);
      s.ellipse(24, 26 + hover, 3, 3, voidBlack);
      s.px(24, 26 + hover, amethHi);

      s.ellipse(24, 12 + hover, 5, 4.5, boneMid);
      const cy = 6 + hover + crownBob;
      s.hline(19, 29, cy + 2, goldMid);
      s.vline(21, cy - 2, cy + 2, goldHi);
      s.vline(24, cy - 4, cy + 2, goldHi);
      s.vline(27, cy - 2, cy + 2, goldHi);
    } else {
      // Side Profile (facing LEFT; mirrored for RIGHT)
      // Twin-Crescent Scepter held forward-left (x=8..12)
      s.vline(10, 12 + hover, 39 + hover, goldMid);
      s.ellipse(10, 9 + hover, 4, 4, goldHi);
      s.ellipse(10, 9 + hover, 2, 2, voidBlack);
      s.px(10, 9 + hover, amethHi);

      // Sweeping Necromancer Robes
      s.ellipse(25, 31 + hover, 9, 11, robeDark);
      s.rect(19, 16 + hover, 12, 22, robeMid);
      s.line(30, 17 + hover, 36, 37 + hover, robeDark);
      s.vline(21, 17 + hover, 38 + hover, goldMid);
      s.hline(18, 35, 37 + hover, goldMid);

      // High Collar + Skull Profile + Floating Crown
      s.line(26, 16 + hover, 32, 11 + hover, robeDark);
      s.line(26, 15 + hover, 32, 10 + hover, goldMid);
      s.ellipse(23, 13 + hover, 4.8, 4.5, boneHi);
      s.rect(19, 12 + hover, 3, 3, voidBlack);
      s.px(20, 13 + hover, goldHi);
      s.px(21, 13 + hover, amethHi);

      const cy = 6 + hover + crownBob;
      s.hline(19, 28, cy + 2, goldMid);
      s.vline(20, cy - 2, cy + 2, goldHi);
      s.vline(23, cy - 4, cy + 2, goldHi);
      s.vline(27, cy - 2, cy + 2, goldHi);

      // Skeletal arm extending toward scepter + trailing amethyst orb
      s.hline(12, 19, 22 + hover, robeLight);
      s.rect(11, 21 + hover, 3, 2, boneHi);
      s.ellipse(16, 18 + hover, 2.2, 2.2, amethHi);
    }

    s.outline('#090514');
    return s;
  });
}
