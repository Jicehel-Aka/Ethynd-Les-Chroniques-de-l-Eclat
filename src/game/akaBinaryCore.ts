import { SpriteBank, SpriteCanvas } from './spriteBank';
import { Direction, WorldBundle } from './types';

// Exact RGB565 transparent color key (#FF00FF -> 0xF81F)
const TRANSPARENT_565 = 0xf81f;

const FLAG_BITS: Record<string, number> = {
  talked_sage: 1 << 0,
  act1_done: 1 << 1,
  talked_roi: 1 << 2,
  act2_started: 1 << 3,
  talked_elowen: 1 << 4,
  act3_done: 1 << 5,
  act4_done: 1 << 6,
  boss_pyraxis: 1 << 7,
};

const BOSS_BIT_IDX: Record<string, number> = {
  boss_morvath: 1,   // débloque act1_done (Château ouvert, gardes du barrage partent)
  boss_malakor: 3,   // débloque act2_started (Forêt ouverte, gardes du barrage partent)
  boss_leviathan: 5, // débloque act3_done (Crypte ouverte, gardes du barrage partent)
  boss_vorgath: 6,   // débloque act4_done (Terres Ardentes ouvertes, gardes partent)
  boss_pyraxis: 7,   // Victoire finale
};

const AI_CODE: Record<string, number> = {
  passive: 0,
  wander: 1,
  chase: 2,
  ranged: 3,
  boss: 4,
};

const DIR_CODE: Record<Direction, number> = {
  [Direction.Bas]: 0,
  [Direction.Gauche]: 1,
  [Direction.Droite]: 2,
  [Direction.Haut]: 3,
};

function decodeB64Bytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function rgbaToRgb565(r: number, g: number, b: number, a: number): number {
  if (a < 96) return TRANSPARENT_565;
  let c565 = ((r & 0xf8) << 8) | ((g & 0xfc) << 3) | (b >> 3);
  if (c565 === TRANSPARENT_565) {
    c565 = 0xf81e; // avoid colliding with color key
  }
  return c565;
}

/**
 * Compiles all 11 maps, 1-bit collision masks, portals, chests, road-guard NPCs,
 * and monster spawns into /ETHYND/WORLD.BIN ("ETHW" v1) for Gamebuino AKA.
 */
export function buildAkaWorldBinary(world: WorldBundle): Uint8Array {
  const sortedMasks = Object.entries(world.masks)
    .map(([k, v]) => ({ tid: Number(k), bytes: decodeB64Bytes(v) }))
    .sort((a, b) => a.tid - b.tid);

  const mapIndexByName = new Map<string, number>();
  world.maps.forEach((m, i) => mapIndexByName.set(m.name, i));

  let totalSize = 12 + sortedMasks.length * 130;
  for (const m of world.maps) {
    totalSize +=
      32 +
      m.w * m.h * 4 * 2 +
      2 +
      m.doors.length * 20 +
      2 +
      m.chests.length * 10 +
      2 +
      m.npcs.length * 10 +
      2 +
      m.spawns.length * 16;
  }

  const buf = new ArrayBuffer(totalSize);
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  let off = 0;

  // Header "ETHW" v1
  u8[off++] = 0x45; // E
  u8[off++] = 0x54; // T
  u8[off++] = 0x48; // H
  u8[off++] = 0x57; // W
  dv.setUint16(off, 1, true);
  off += 2;
  dv.setUint16(off, world.maps.length, true);
  off += 2;
  dv.setUint16(off, world.tileCols, true);
  off += 2;
  dv.setUint16(off, sortedMasks.length, true);
  off += 2;

  for (const mk of sortedMasks) {
    dv.setUint16(off, mk.tid, true);
    off += 2;
    for (let i = 0; i < 128; i++) {
      u8[off++] = i < mk.bytes.length ? mk.bytes[i] : 0;
    }
  }

  let chestBitSeq = 0;
  const monsterKeys = [
    'chat',
    'oiseau',
    'poussin',
    'chauve_souris',
    'chauve_souris_givre',
    'chauve_souris_vampire',
    'slime_vert',
    'slime_caverne',
    'magma_vivant',
    'squelette',
    'garde_corrompu',
    'chevalier_os',
    'chevalier_dechu_elite',
    'spectre_ombre',
    'elementaire_eau',
    'mage_eclipse',
    'golem_rune',
    'golem_obsidienne',
    'vouivre_azur',
    'vouivre_obsidienne',
    'dragon_garde',
    'reine_caverne',
    'chevalier_dechu',
    'leviathanis',
    'archiliche_vorgath',
    'dragon_rouge',
    'pyraxis',
  ];

  for (const m of world.maps) {
    for (let i = 0; i < 24; i++) {
      u8[off++] = i < m.name.length ? m.name.charCodeAt(i) & 0x7f : 0;
    }
    dv.setUint16(off, m.w, true);
    off += 2;
    dv.setUint16(off, m.h, true);
    off += 2;
    u8[off++] = m.bgColor[0];
    u8[off++] = m.bgColor[1];
    u8[off++] = m.bgColor[2];
    u8[off++] = 0;

    for (let l = 0; l < 4; l++) {
      for (let y = 0; y < m.h; y++) {
        for (let x = 0; x < m.w; x++) {
          dv.setInt16(off, m.layers[l][y][x], true);
          off += 2;
        }
      }
    }

    dv.setUint16(off, m.doors.length, true);
    off += 2;
    for (const d of m.doors) {
      dv.setInt16(off, d.x, true);
      off += 2;
      dv.setInt16(off, d.y, true);
      off += 2;
      dv.setInt16(off, d.w, true);
      off += 2;
      dv.setInt16(off, d.h, true);
      off += 2;
      dv.setUint16(off, mapIndexByName.get(d.map) ?? 0, true);
      off += 2;
      dv.setInt16(off, d.dx, true);
      off += 2;
      dv.setInt16(off, d.dy, true);
      off += 2;
      dv.setUint16(off, d.reqFlag ? FLAG_BITS[d.reqFlag] ?? 0 : 0, true);
      off += 2;
      dv.setUint16(off, 0, true);
      off += 2;
      dv.setUint16(off, 0, true);
      off += 2;
    }

    dv.setUint16(off, m.chests.length, true);
    off += 2;
    for (const c of m.chests) {
      dv.setUint16(off, Math.min(63, chestBitSeq++), true);
      off += 2;
      dv.setInt16(off, c.x, true);
      off += 2;
      dv.setInt16(off, c.y, true);
      off += 2;
      dv.setUint16(off, c.gold, true);
      off += 2;
      u8[off++] = c.item ? 1 : 0;
      u8[off++] = c.equip ? 1 : 0;
    }

    dv.setUint16(off, m.npcs.length, true);
    off += 2;
    for (const n of m.npcs) {
      u8[off++] =
        n.type === 'roi'
          ? 1
          : n.type === 'gardien'
          ? 2
          : n.type === 'forgeron'
          ? 3
          : n.type === 'rodeuse'
          ? 6
          : 0;
      u8[off++] = DIR_CODE[n.dir] ?? 0;
      dv.setInt16(off, n.x, true);
      off += 2;
      dv.setInt16(off, n.y, true);
      off += 2;
      dv.setUint16(off, n.blockUntilFlag ? FLAG_BITS[n.blockUntilFlag] ?? 0 : 0, true);
      off += 2;
      u8[off++] = n.id === 'sage' ? 1 : n.id === 'roi' ? 2 : n.id === 'elowen' ? 3 : 0;
      u8[off++] = n.shop === 'market' ? 1 : n.shop === 'forge' ? 2 : n.shop === 'alchemy' ? 3 : 0;
    }

    dv.setUint16(off, m.spawns.length, true);
    off += 2;
    for (const sp of m.spawns) {
      const mIdx = Math.max(0, monsterKeys.indexOf(sp.type));
      const ai = AI_CODE[sp.ai] ?? 2;
      u8[off++] = mIdx;
      u8[off++] = ai;
      dv.setInt16(off, sp.x, true);
      off += 2;
      dv.setInt16(off, sp.y, true);
      off += 2;
      dv.setUint16(off, sp.hp, true);
      off += 2;
      dv.setUint16(off, sp.atk, true);
      off += 2;
      dv.setUint16(off, sp.xp, true);
      off += 2;
      dv.setUint16(off, sp.gold, true);
      off += 2;
      u8[off++] = ai === 4 ? 48 : 32;
      u8[off++] = sp.bossId ? BOSS_BIT_IDX[sp.bossId] ?? 0 : 0;
    }
  }

  return u8;
}

/**
 * Converts tileset.png into tile-major RGB565 little-endian blocks (2048 bytes per 32x32 tile)
 * for O(1) fseek streaming on Gamebuino AKA (/ETHYND/TILESET.565).
 */
export function buildAkaTileset565(tileset: HTMLImageElement, tileCols: number): Uint8Array {
  const w = tileset.naturalWidth || tileset.width;
  const h = tileset.naturalHeight || tileset.height;
  const rows = Math.floor(h / 32);
  const totalTiles = rows * tileCols;

  const cnv = document.createElement('canvas');
  cnv.width = w;
  cnv.height = h;
  const ctx = cnv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tileset, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h).data;

  const buf = new ArrayBuffer(8 + totalTiles * 32 * 32 * 2);
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  // Header "ET56" + totalTiles (u16) + tileSize=32 (u16)
  u8[0] = 0x45;
  u8[1] = 0x54;
  u8[2] = 0x35;
  u8[3] = 0x36;
  dv.setUint16(4, totalTiles, true);
  dv.setUint16(6, 32, true);

  let off = 8;
  for (let tid = 0; tid < totalTiles; tid++) {
    const sx = (tid % tileCols) * 32;
    const sy = Math.floor(tid / tileCols) * 32;
    for (let ty = 0; ty < 32; ty++) {
      const rowBase = (sy + ty) * w + sx;
      for (let tx = 0; tx < 32; tx++) {
        const p = (rowBase + tx) * 4;
        const c565 = rgbaToRgb565(imgData[p], imgData[p + 1], imgData[p + 2], imgData[p + 3]);
        dv.setUint16(off, c565, true);
        off += 2;
      }
    }
  }
  return u8;
}

/**
 * Packs procedural & image sprites (Hero, Chests, NPCs, and all Monsters including 48x48 Morvath)
 * into /ETHYND/SPRITES.565 in RGB565 little-endian format.
 */
export function buildAkaSprites565(sprites: SpriteBank): Uint8Array {
  const frames: Array<{ name: string; w: number; h: number; src: SpriteCanvas }> = [];
  const dirs = [Direction.Bas, Direction.Gauche, Direction.Droite, Direction.Haut];

  for (const d of dirs) {
    sprites.player.walk[d].forEach((s, f) =>
      frames.push({ name: `hero_w_${d}_${f}`, w: 32, h: 32, src: s })
    );
  }
  frames.push({ name: 'chest_closed', w: 40, h: 32, src: sprites.chestClosed });
  frames.push({ name: 'chest_open', w: 40, h: 32, src: sprites.chestOpen });

  for (const [mId, anim] of Object.entries(sprites.monsters)) {
    const sz = Math.min(48, anim.size);
    for (const d of dirs) {
      const f0 = anim.walk[d]?.[0];
      const f1 = anim.walk[d]?.[1] || f0;
      if (f0) frames.push({ name: `${mId}_${d}_0`, w: sz, h: sz, src: f0 });
      if (f1) frames.push({ name: `${mId}_${d}_1`, w: sz, h: sz, src: f1 });
    }
  }

  let totalBytes = 8;
  for (const fr of frames) {
    totalBytes += 28 + fr.w * fr.h * 2;
  }

  const buf = new ArrayBuffer(totalBytes);
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  u8[0] = 0x45; // E
  u8[1] = 0x53; // S
  u8[2] = 0x35; // 5
  u8[3] = 0x36; // 6
  dv.setUint16(4, frames.length, true);
  dv.setUint16(6, 1, true);

  const scratch = document.createElement('canvas');
  const sctx = scratch.getContext('2d')!;
  let off = 8;

  for (const fr of frames) {
    for (let i = 0; i < 24; i++) {
      u8[off++] = i < fr.name.length ? fr.name.charCodeAt(i) & 0x7f : 0;
    }
    dv.setUint16(off, fr.w, true);
    off += 2;
    dv.setUint16(off, fr.h, true);
    off += 2;

    scratch.width = fr.w;
    scratch.height = fr.h;
    sctx.imageSmoothingEnabled = false;
    sctx.clearRect(0, 0, fr.w, fr.h);
    sctx.drawImage(fr.src, 0, 0, fr.w, fr.h);
    const data = sctx.getImageData(0, 0, fr.w, fr.h).data;
    for (let i = 0; i < fr.w * fr.h; i++) {
      const p = i * 4;
      dv.setUint16(off, rgbaToRgb565(data[p], data[p + 1], data[p + 2], data[p + 3]), true);
      off += 2;
    }
  }

  return u8;
}

// ============================================================================
// Pure TypeScript PKZIP Builder (CRC32 + Store Mode, zero external dependencies)
// ============================================================================
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32Bytes(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export function buildZipBytes(files: Array<{ path: string; data: Uint8Array }>): Uint8Array {
  const enc = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = enc.encode(f.path);
    const crc = crc32Bytes(f.data);
    const size = f.data.length;

    const localHdr = new ArrayBuffer(30 + nameBytes.length);
    const ldv = new DataView(localHdr);
    ldv.setUint32(0, 0x04034b50, true);
    ldv.setUint16(4, 20, true);
    ldv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    ldv.setUint16(8, 0, true); // Store
    ldv.setUint16(10, 0, true);
    ldv.setUint16(12, 0x5421, true);
    ldv.setUint32(14, crc, true);
    ldv.setUint32(18, size, true);
    ldv.setUint32(22, size, true);
    ldv.setUint16(26, nameBytes.length, true);
    ldv.setUint16(28, 0, true);
    new Uint8Array(localHdr, 30).set(nameBytes);

    localParts.push(new Uint8Array(localHdr), f.data);

    const centralHdr = new ArrayBuffer(46 + nameBytes.length);
    const cdv = new DataView(centralHdr);
    cdv.setUint32(0, 0x02014b50, true);
    cdv.setUint16(4, 20, true);
    cdv.setUint16(6, 20, true);
    cdv.setUint16(8, 0x0800, true);
    cdv.setUint16(10, 0, true);
    cdv.setUint16(12, 0, true);
    cdv.setUint16(14, 0x5421, true);
    cdv.setUint32(16, crc, true);
    cdv.setUint32(20, size, true);
    cdv.setUint32(24, size, true);
    cdv.setUint16(28, nameBytes.length, true);
    cdv.setUint16(30, 0, true);
    cdv.setUint16(32, 0, true);
    cdv.setUint16(34, 0, true);
    cdv.setUint16(36, 0, true);
    cdv.setUint32(38, 0, true);
    cdv.setUint32(42, offset, true);
    new Uint8Array(centralHdr, 46).set(nameBytes);

    centralParts.push(new Uint8Array(centralHdr));
    offset += 30 + nameBytes.length + size;
  }

  let centralSize = 0;
  for (const c of centralParts) centralSize += c.length;

  const eocd = new ArrayBuffer(22);
  const edv = new DataView(eocd);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(4, 0, true);
  edv.setUint16(6, 0, true);
  edv.setUint16(8, files.length, true);
  edv.setUint16(10, files.length, true);
  edv.setUint32(12, centralSize, true);
  edv.setUint32(16, offset, true);
  edv.setUint16(20, 0, true);

  const eocdBytes = new Uint8Array(eocd);
  const totalZipSize = offset + centralSize + eocdBytes.length;
  const zipBuf = new ArrayBuffer(totalZipSize);
  const zipU8 = new Uint8Array(zipBuf);
  let writeOff = 0;
  for (const p of localParts) {
    zipU8.set(p, writeOff);
    writeOff += p.length;
  }
  for (const p of centralParts) {
    zipU8.set(p, writeOff);
    writeOff += p.length;
  }
  zipU8.set(eocdBytes, writeOff);
  return zipU8;
}

export function buildZipArchive(files: Array<{ path: string; data: Uint8Array }>): Blob {
  const bytes = buildZipBytes(files);
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return new Blob([ab], {
    type: 'application/zip',
  });
}
