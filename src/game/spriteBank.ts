import {
  buildArchlichVorgathSprite,
  buildBoneKnightSprite,
  buildCasterSprite,
  buildGolemSprite,
  buildMorvathBroodmotherSprite,
  buildSirMalakorSprite,
} from './monsterArt';
import { assetUrl } from './assetUrl';
import { Direction } from './types';

export type SpriteCanvas = HTMLCanvasElement | HTMLImageElement;

export interface EntityAnimSet {
  size: number;
  walk: Record<Direction, SpriteCanvas[]>;
  attack?: Record<Direction, SpriteCanvas[]>;
}

export interface SpriteBank {
  tileset: HTMLImageElement;
  heart: HTMLImageElement;
  throne: HTMLCanvasElement;
  chestClosed: HTMLCanvasElement;
  chestOpen: HTMLCanvasElement;
  brazierFlame: HTMLCanvasElement[];
  torchStand: HTMLCanvasElement[];
  player: EntityAnimSet;
  npcs: Record<string, Record<Direction, SpriteCanvas>>;
  monsters: Record<string, EntityAnimSet>;
  items: Record<string, HTMLCanvasElement>;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

type ColorMap = Array<[[number, number, number], [number, number, number]]>;

function recolorImage(
  img: HTMLImageElement,
  colorMap: ColorMap,
  targetW?: number,
  targetH?: number,
  tint?: { rMul: number; gMul: number; bMul: number }
): HTMLCanvasElement {
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = img.width;
  srcCanvas.height = img.height;
  const sctx = srcCanvas.getContext('2d')!;
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(img, 0, 0);

  const imgData = sctx.getImageData(0, 0, img.width, img.height);
  const d = imgData.data;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 20) continue;
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    let matched = false;
    for (const [from, to] of colorMap) {
      if (Math.abs(r - from[0]) <= 6 && Math.abs(g - from[1]) <= 6 && Math.abs(b - from[2]) <= 6) {
        d[i] = to[0];
        d[i + 1] = to[1];
        d[i + 2] = to[2];
        matched = true;
        break;
      }
    }
    if (!matched && tint) {
      d[i] = Math.min(255, Math.round(r * tint.rMul));
      d[i + 1] = Math.min(255, Math.round(g * tint.gMul));
      d[i + 2] = Math.min(255, Math.round(b * tint.bMul));
    }
  }
  sctx.putImageData(imgData, 0, 0);

  if (targetW && targetH && (targetW !== img.width || targetH !== img.height)) {
    const out = document.createElement('canvas');
    out.width = targetW;
    out.height = targetH;
    const octx = out.getContext('2d')!;
    octx.imageSmoothingEnabled = false;
    octx.drawImage(srcCanvas, 0, 0, targetW, targetH);
    return out;
  }
  return srcCanvas;
}

function drawPixelGrid(
  rows: string[],
  palette: Record<string, string>,
  scale = 2
): HTMLCanvasElement {
  const h = rows.length;
  const w = rows[0].length;
  const c = document.createElement('canvas');
  c.width = w * scale;
  c.height = h * scale;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.' || !palette[ch]) continue;
      ctx.fillStyle = palette[ch];
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return c;
}

function makeSlimeAnim(body: string, shade: string, shine: string, eye: string): EntityAnimSet {
  const pal = { K: '#14141c', B: body, S: shade, W: shine, E: eye };
  const f0 = drawPixelGrid(
    [
      '................',
      '................',
      '................',
      '.....KKKKKK.....',
      '...KKBBBBBBKK...',
      '..KBBWWBBBBBBK..',
      '.KBBWBBBBBBBBBK.',
      '.KBBBBBBBBBBBBK.',
      '.KBBEBBBBBBEEBK.',
      '.KBBEBBBBBBEEBK.',
      '.KBBBBBBBBBBBBK.',
      '.KSSSBBBBBBSSSK.',
      '..KSSSSSSSSSSK..',
      '...KKKKKKKKKK...',
      '................',
      '................',
    ],
    pal,
    2
  );
  const f1 = drawPixelGrid(
    [
      '................',
      '................',
      '................',
      '................',
      '....KKKKKKKK....',
      '..KKBBBBBBBBKK..',
      '.KBBWWBBBBBBBBK.',
      'KBBWBBBBBBBBBBBK',
      'KBBBEBBBBBBEEBBK',
      'KBBBEBBBBBBEEBBK',
      'KBBBBBBBBBBBBBBK',
      'KSSSSBBBBBBSSSSK',
      '.KSSSSSSSSSSSSK.',
      '..KKKKKKKKKKKK..',
      '................',
      '................',
    ],
    pal,
    2
  );
  const f2 = drawPixelGrid(
    [
      '................',
      '.....KKKKKK.....',
      '....KBBBBBBK....',
      '...KBBWWBBBBK...',
      '..KBBWBBBBBBBK..',
      '..KBBBBBBBBBBK..',
      '..KBBEBBBBEEBK..',
      '..KBBEBBBBEEBK..',
      '..KBBBBBBBBBBK..',
      '..KSSBBBBBBSSK..',
      '...KSSSSSSSSK...',
      '....KKKKKKKK....',
      '................',
      '................',
      '................',
      '................',
    ],
    pal,
    2
  );
  const seq = [f0, f1, f2, f0];
  return {
    size: 32,
    walk: {
      [Direction.Bas]: seq,
      [Direction.Haut]: seq,
      [Direction.Gauche]: seq,
      [Direction.Droite]: seq,
    },
  };
}

function makeGolemAnim(stone: string, dark: string, rune: string, size = 32): EntityAnimSet {
  const sc = size / 16;
  const pal = { K: '#11131a', G: stone, D: dark, R: rune, W: '#f8fafc' };
  const makeFrame = (step: number) =>
    drawPixelGrid(
      [
        '....KKKKKKKK....',
        '...KGGGGGGGGK...',
        '..KGGRRGGGRRGK..',
        '..KGGRWGGRWRGK..',
        '..KGGGGGGGGGGK..',
        '.KKDDDDDDDDDDKK.',
        'KGGGGGGKKGGGGGGK',
        'KGGDDGGRRGGDDGGK',
        'KGGDDGGRRGGDDGGK',
        'KDDDDDDDDDDDDDDK',
        '.KKGGGGGGGGGGKK.',
         step === 0 ? '..KGGDDKKGGDDK..' : '..KDDGGKKDDGGK..',
         step === 0 ? '..KGGDDKKDDDDK..' : '..KDDDDKKGGDDK..',
         step === 0 ? '..KKKKK..KKKKK..' : '...KKKK..KKKK...',
        '................',
        '................',
      ],
      pal,
      sc
    );
  const seq = [makeFrame(0), makeFrame(1), makeFrame(0), makeFrame(1)];
  return {
    size,
    walk: {
      [Direction.Bas]: seq,
      [Direction.Haut]: seq,
      [Direction.Gauche]: seq,
      [Direction.Droite]: seq,
    },
  };
}

function makeWraithAnim(cloak: string, inner: string, glow: string, crown = false, size = 32): EntityAnimSet {
  const sc = size / 16;
  const pal = { K: '#0f101a', C: cloak, I: inner, G: glow, Y: '#fbbf24' };
  const top0 = crown ? '...KYK.KK.KYK...' : '.....KKKKKK.....';
  const top1 = crown ? '...KYYYYYYYYK...' : '....KCCCCCCK....';
  const makeFrame = (shift: boolean) =>
    drawPixelGrid(
      [
        top0,
        top1,
        '...KCCCCCCCCK...',
        '..KCCKKKKKKCCK..',
        '..KCKGGGGGGKCK..',
        '..KCKGKKKKGKCK..',
        '..KCCIIIIIIICK..',
        '.KCCCICCCCCICCK.',
        '.KCCCIIGGGIICCK.',
        '.KCCCCIIIIICCCK.',
        '.KCCCCCCCCCCCCK.',
        shift ? '..KCCC.KCC.KCK..' : '..KCK.KCCC.KCCK.',
        shift ? '...KK...KK..KK..' : '...KK..KK...KK..',
        '................',
        '................',
        '................',
      ],
      pal,
      sc
    );
  const seq = [makeFrame(false), makeFrame(true), makeFrame(false), makeFrame(true)];
  return {
    size,
    walk: {
      [Direction.Bas]: seq,
      [Direction.Haut]: seq,
      [Direction.Gauche]: seq,
      [Direction.Droite]: seq,
    },
  };
}

function makeKnightOrSkeletonAnim(
  boneOrHelm: string,
  armor: string,
  cape: string,
  eye: string,
  size = 32,
  horned = false
): EntityAnimSet {
  const sc = size / 16;
  const pal = { K: '#111218', H: boneOrHelm, A: armor, C: cape, E: eye, S: '#cbd5e1' };
  const h0 = horned ? '..KHK.KKKK.KHK..' : '....KKKKKKKK....';
  const h1 = horned ? '..KHHKHHHHKHHK..' : '...KHHHHHHHHK...';
  const makeFrame = (step: number) =>
    drawPixelGrid(
      [
        h0,
        h1,
        '...KHHHHHHHHK...',
        '...KHEKHHKEHK...',
        '....KKKKKKKK....',
        '..KKCCCCCCCCKK..',
        '.KCAAAAAAAAAAACK',
        '.KCAAKAAAAKAACKS',
        '.KCAKAAAAAAKACKS',
        '..KKAAAAAAAAKKKS',
        '...KAAKKKKAAK...',
        step === 0 ? '...KAAK..KAAK...' : '...KAK....KAK...',
        step === 0 ? '..KHHK....KHHK..' : '...KHHK..KHHK...',
        '..KKKK....KKKK..',
        '................',
        '................',
      ],
      pal,
      sc
    );
  const seq = [makeFrame(0), makeFrame(1), makeFrame(0), makeFrame(1)];
  return {
    size,
    walk: {
      [Direction.Bas]: seq,
      [Direction.Haut]: seq,
      [Direction.Gauche]: seq,
      [Direction.Droite]: seq,
    },
  };
}

function makeHydraSerpentAnim(
  scales: string,
  belly: string,
  crest: string,
  eye: string,
  size = 52
): EntityAnimSet {
  const sc = size / 16;
  const pal = { K: '#08111d', S: scales, B: belly, F: crest, E: eye, W: '#ffffff' };
  const makeFrame = (sway: boolean) =>
    drawPixelGrid(
      [
        '..KFK..KKKK..KFK',
        '.KFFK.KSSSSK.KFF',
        '.KFSKKSSFFSSKKFS',
        '..KKKSSEKKESSKKK',
        '....KSSBBBBSSK..',
        sway ? '...KFFSSBBSSFFK.' : '..KFFSSBBBBSSFFK',
        sway ? '..K.KSSBBBBSSK.K' : '...KKSSBBBBSSKK.',
        '....KSSSBBSSSK..',
        sway ? '...KSSSSBBSSSSK.' : '....KSSSSBBSSSSK',
        sway ? '..KSSSSBBBBSSSSK' : '...KSSSSBBBBSSSK',
        '..KSSSBBBBBBSSSK',
        '...KSSSSSSSSSSK.',
        sway ? '....KKSSSSSSKK..' : '...KKSSSSSSKK...',
        '......KKKKKK....',
        '................',
        '................',
      ],
      pal,
      sc
    );
  const seq = [makeFrame(false), makeFrame(true), makeFrame(false), makeFrame(true)];
  return {
    size,
    walk: {
      [Direction.Bas]: seq,
      [Direction.Haut]: seq,
      [Direction.Gauche]: seq,
      [Direction.Droite]: seq,
    },
  };
}

function buildItemIcons(): Record<string, HTMLCanvasElement> {
  const basePotion = [
    '................',
    '......KKKK......',
    '......KCCK......',
    '.....KKGGKK.....',
    '......KGGK......',
    '.....KGGGGK.....',
    '....KGRRRRGK....',
    '...KGRRWRRRrK...',
    '...KRRWRRRRrK...',
    '...KRRRRRRRrK...',
    '...KRRRRRRrrK...',
    '...KrRRRRrrrK...',
    '....KrrrrrrK....',
    '.....KKKKKK.....',
    '................',
    '................',
  ];
  const baseCrystal = [
    '................',
    '.......KK.......',
    '......KBBK......',
    '.....KBWBbK.....',
    '....KBWBBbbK....',
    '...KBWBBBbbdK...',
    '...KBBBBBbbdK...',
    '...KBBBBBbbdK...',
    '...KbBBBBbbdK...',
    '....KbBBbbdK....',
    '.....KbBbdK.....',
    '......KbdK......',
    '.......KK.......',
    '................',
    '................',
    '................',
  ];
  const oreRows = [
    '................',
    '................',
    '.....KKKKKK.....',
    '...KKBBBBBBKK...',
    '..KBBWWBBBBBbk..',
    '.KBBWBBBBbWbbk..',
    '.KBBBBbbbbbBbk..',
    '.KbbBBbWWbbddk..',
    '..Kbbbbbbbbddk..',
    '..Kddbbbbddddk..',
    '...KKddddddKK...',
    '.....KKKKKK.....',
    '................',
    '................',
    '................',
    '................',
  ];
  const flowerRows = [
    '................',
    '......KKKK......',
    '....KKBBBBKK....',
    '...KBBWWWWBBK...',
    '...KBBWYYWBBK...',
    '....KKBYYBKK....',
    '......KGGK......',
    '....KKKGGKKK....',
    '...KGGGGGGGGK...',
    '....KKKGGKKK....',
    '......KGGK......',
    '......KGGK......',
    '......KKKK......',
    '................',
    '................',
    '................',
  ];
  const scaleRows = [
    '................',
    '.......KK.......',
    '......KRRK......',
    '.....KRWWRK.....',
    '....KRRYYRRK....',
    '...KRRRYYRRrK...',
    '..KRRRRYYRRrrK..',
    '..KRRRRRRRRrrK..',
    '...KrRRRRRrrrK..',
    '....KrrrrrrrK...',
    '.....KKrrrKK....',
    '.......KKK......',
    '................',
    '................',
    '................',
    '................',
  ];
  const badgeRows = [
    '................',
    '....KKKKKKKK....',
    '...KYYYYYYYYK...',
    '..KYYBBBBBBYYK..',
    '..KYBBWWWWBBYK..',
    '..KYBBWYYWBBYK..',
    '..KYBBBBBBBBYK..',
    '...KYYBBBBYYK...',
    '....KYYYYYYK....',
    '.....KYYYYK.....',
    '......KYYK......',
    '.......KK.......',
    '................',
    '................',
    '................',
    '................',
  ];

  return {
    potion: drawPixelGrid(basePotion, {
      K: '#171717',
      G: '#cbd5e1',
      R: '#dc2626',
      r: '#991b1b',
      W: '#ffffff',
      C: '#854d0e',
    }),
    elixir: drawPixelGrid(basePotion, {
      K: '#171717',
      G: '#fde68a',
      R: '#8b5cf6',
      r: '#5b21b6',
      W: '#ffffff',
      C: '#f59e0b',
    }),
    crystal_aube: drawPixelGrid(baseCrystal, {
      K: '#171717',
      W: '#ffffff',
      B: '#fde047',
      b: '#f59e0b',
      d: '#b45309',
    }),
    crystal_fer: drawPixelGrid(baseCrystal, {
      K: '#171717',
      W: '#ffffff',
      B: '#cbd5e1',
      b: '#64748b',
      d: '#334155',
    }),
    crystal_azur: drawPixelGrid(baseCrystal, {
      K: '#171717',
      W: '#ffffff',
      B: '#38bdf8',
      b: '#0284c7',
      d: '#075985',
    }),
    crystal_amethyste: drawPixelGrid(baseCrystal, {
      K: '#171717',
      W: '#ffffff',
      B: '#e879f9',
      b: '#a21caf',
      d: '#581c87',
    }),
    siderite: drawPixelGrid(oreRows, {
      K: '#171717',
      k: '#171717',
      W: '#e0f2fe',
      B: '#60a5fa',
      b: '#3b82f6',
      d: '#1e3a8a',
    }),
    fleur_lune: drawPixelGrid(flowerRows, {
      K: '#171717',
      W: '#f0f9ff',
      B: '#7dd3fc',
      Y: '#fef08a',
      G: '#10b981',
    }),
    ecaille_dragon: drawPixelGrid(scaleRows, {
      K: '#171717',
      W: '#fef08a',
      Y: '#f97316',
      R: '#dc2626',
      r: '#7f1d1d',
    }),
    insigne_garde: drawPixelGrid(badgeRows, {
      K: '#171717',
      Y: '#fbbf24',
      B: '#2563eb',
      W: '#ffffff',
    }),
  };
}

let cachedPromise: Promise<SpriteBank> | null = null;

export function loadSpriteBank(): Promise<SpriteBank> {
  if (cachedPromise) return cachedPromise;

  cachedPromise = (async () => {
    const playerNums = [
      '00', '01', '02', '03',
      '11', '12', '13', '14',
      '22', '23', '24', '25',
      '33', '34', '35', '36',
      '44', '45', '46', '47',
      '48', '49', '50', '51',
      '52', '53', '54', '55',
      '56', '57', '58', '59',
    ];
    const batNums = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '11', '12', '13', '14', '15'];
    const seq12 = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
    const seq16 = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'];

    const [tileset, heart] = await Promise.all([
      loadImage(assetUrl('ethynd/tileset.png')),
      loadImage(assetUrl('ethynd/coeur.png')),
    ]);

    const loadGroup = async (prefix: string, nums: string[]) => {
      const entries = await Promise.all(
        nums.map(async (n) => [n, await loadImage(assetUrl(`ethynd/sprites/${prefix}_${n}.png`))] as const)
      );
      return Object.fromEntries(entries) as Record<string, HTMLImageElement>;
    };

    const [pImgs, batImgs, dragonImgs, chatImgs, oiseauImgs, poussinImgs] = await Promise.all([
      loadGroup('personnage', playerNums),
      loadGroup('chauve_souris', batNums),
      loadGroup('dragon_rouge', seq16),
      loadGroup('chat', seq12),
      loadGroup('oiseau', seq12),
      loadGroup('poussin', seq12),
    ]);

    const player: EntityAnimSet = {
      size: 64,
      walk: {
        [Direction.Bas]: [pImgs['00'], pImgs['01'], pImgs['02'], pImgs['03']],
        [Direction.Droite]: [pImgs['11'], pImgs['12'], pImgs['13'], pImgs['14']],
        [Direction.Haut]: [pImgs['22'], pImgs['23'], pImgs['24'], pImgs['25']],
        [Direction.Gauche]: [pImgs['33'], pImgs['34'], pImgs['35'], pImgs['36']],
      },
      attack: {
        [Direction.Bas]: [pImgs['44'], pImgs['45'], pImgs['46'], pImgs['47']],
        [Direction.Haut]: [pImgs['48'], pImgs['49'], pImgs['50'], pImgs['51']],
        [Direction.Droite]: [pImgs['52'], pImgs['53'], pImgs['54'], pImgs['55']],
        [Direction.Gauche]: [pImgs['56'], pImgs['57'], pImgs['58'], pImgs['59']],
      },
    };

    // NPC Palette Variants (exact RGB swaps from ethynd_aka/tools/npc_defs.py + new cast)
    const npcPalettes: Record<string, ColorMap> = {
      sage: [
        [[67, 46, 39], [235, 235, 240]],
        [[106, 72, 52], [190, 190, 200]],
        [[196, 60, 60], [70, 160, 110]],
        [[136, 46, 46], [40, 110, 75]],
        [[104, 28, 28], [25, 75, 50]],
        [[101, 101, 155], [140, 110, 70]],
      ],
      gardien: [
        [[196, 60, 60], [70, 100, 180]],
        [[136, 46, 46], [45, 70, 130]],
        [[104, 28, 28], [30, 45, 95]],
        [[101, 101, 155], [90, 90, 90]],
      ],
      marchand: [
        [[196, 60, 60], [217, 149, 40]],
        [[136, 46, 46], [168, 106, 24]],
        [[104, 28, 28], [115, 68, 15]],
        [[101, 101, 155], [95, 65, 50]],
      ],
      forgeron: [
        [[67, 46, 39], [40, 35, 35]],
        [[106, 72, 52], [75, 60, 55]],
        [[196, 60, 60], [150, 82, 45]],
        [[136, 46, 46], [105, 55, 30]],
        [[104, 28, 28], [70, 35, 20]],
      ],
      herboriste: [
        [[67, 46, 39], [145, 65, 45]],
        [[106, 72, 52], [190, 95, 65]],
        [[196, 60, 60], [45, 165, 145]],
        [[136, 46, 46], [30, 115, 105]],
        [[104, 28, 28], [20, 80, 75]],
      ],
      roi: [
        [[67, 46, 39], [245, 195, 60]],
        [[106, 72, 52], [215, 160, 35]],
        [[196, 60, 60], [145, 55, 195]],
        [[136, 46, 46], [100, 35, 145]],
        [[104, 28, 28], [65, 20, 100]],
        [[101, 101, 155], [230, 185, 55]],
      ],
      archiviste: [
        [[67, 46, 39], [205, 215, 235]],
        [[106, 72, 52], [165, 175, 205]],
        [[196, 60, 60], [65, 95, 205]],
        [[136, 46, 46], [45, 65, 155]],
        [[104, 28, 28], [28, 42, 110]],
      ],
      rodeuse: [
        [[67, 46, 39], [60, 95, 50]],
        [[106, 72, 52], [85, 130, 65]],
        [[196, 60, 60], [55, 135, 65]],
        [[136, 46, 46], [38, 95, 45]],
        [[104, 28, 28], [25, 65, 30]],
      ],
    };

    // Note: in Ethynd, NPC sprites are cropped or centered at 32x32 / 64x64; personnage_00 is 64x64 with character in center
    const cropCenter32 = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 36;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(canvas, 16, 14, 32, 36, 0, 0, 32, 36);
      return c;
    };

    const npcs: Record<string, Record<Direction, SpriteCanvas>> = {};
    for (const [npcType, cmap] of Object.entries(npcPalettes)) {
      npcs[npcType] = {
        [Direction.Bas]: cropCenter32(recolorImage(pImgs['00'], cmap)),
        [Direction.Droite]: cropCenter32(recolorImage(pImgs['11'], cmap)),
        [Direction.Haut]: cropCenter32(recolorImage(pImgs['22'], cmap)),
        [Direction.Gauche]: cropCenter32(recolorImage(pImgs['33'], cmap)),
      };
    }

    const makeBatSet = (tint?: { rMul: number; gMul: number; bMul: number }): EntityAnimSet => {
      const tr = (n: string) => (tint ? recolorImage(batImgs[n], [], 32, 32, tint) : batImgs[n]);
      return {
        size: 32,
        walk: {
          [Direction.Bas]: [tr('00'), tr('01'), tr('02'), tr('03')],
          [Direction.Droite]: [tr('04'), tr('05'), tr('06'), tr('07')],
          [Direction.Haut]: [tr('08'), tr('09'), tr('09'), tr('11')],
          [Direction.Gauche]: [tr('12'), tr('13'), tr('14'), tr('15')],
        },
      };
    };

    const makeDragonSet = (
      sz: number,
      tint?: { rMul: number; gMul: number; bMul: number }
    ): EntityAnimSet => {
      const tr = (n: string) =>
        tint || sz !== 56
          ? recolorImage(dragonImgs[n], [], sz, sz, tint)
          : dragonImgs[n];
      return {
        size: sz,
        walk: {
          [Direction.Bas]: [tr('00'), tr('01'), tr('02'), tr('03')],
          [Direction.Gauche]: [tr('04'), tr('05'), tr('06'), tr('07')],
          [Direction.Droite]: [tr('08'), tr('09'), tr('10'), tr('11')],
          [Direction.Haut]: [tr('12'), tr('13'), tr('14'), tr('15')],
        },
      };
    };

    const makeAnimalSet = (
      imgs: Record<string, HTMLImageElement>,
      poussinOrder = false,
      tint?: { rMul: number; gMul: number; bMul: number }
    ): EntityAnimSet => {
      const tr = (n: string) => (tint ? recolorImage(imgs[n], [], 32, 32, tint) : imgs[n]);
      if (poussinOrder) {
        return {
          size: 32,
          walk: {
            [Direction.Haut]: [tr('00'), tr('01'), tr('00'), tr('02')],
            [Direction.Gauche]: [tr('03'), tr('04'), tr('03'), tr('05')],
            [Direction.Droite]: [tr('06'), tr('07'), tr('06'), tr('08')],
            [Direction.Bas]: [tr('09'), tr('10'), tr('09'), tr('11')],
          },
        };
      }
      return {
        size: 32,
        walk: {
          [Direction.Bas]: [tr('00'), tr('01'), tr('00'), tr('02')],
          [Direction.Gauche]: [tr('03'), tr('04'), tr('03'), tr('05')],
          [Direction.Droite]: [tr('06'), tr('07'), tr('06'), tr('08')],
          [Direction.Haut]: [tr('09'), tr('10'), tr('09'), tr('11')],
        },
      };
    };

    const monsters: Record<string, EntityAnimSet> = {
      // Peaceful fauna
      chat: makeAnimalSet(chatImgs, false),
      oiseau: makeAnimalSet(oiseauImgs, false),
      poussin: makeAnimalSet(poussinImgs, true),

      // Bats
      chauve_souris: makeBatSet(),
      chauve_souris_givre: makeBatSet({ rMul: 0.45, gMul: 1.35, bMul: 1.85 }),
      chauve_souris_vampire: makeBatSet({ rMul: 1.8, gMul: 0.35, bMul: 0.55 }),

      // Slimes & Magma
      slime_vert: makeSlimeAnim('#22c55e', '#15803d', '#bbf7d0', '#0f172a'),
      slime_caverne: makeSlimeAnim('#38bdf8', '#0369a1', '#e0f2fe', '#0f172a'),
      magma_vivant: makeSlimeAnim('#f97316', '#9a3412', '#fef08a', '#ffffff'),

      // Beasts
      loup_corrompu: makeAnimalSet(chatImgs, false, { rMul: 0.45, gMul: 0.35, bMul: 0.7 }),

      // Humanoids, Undead & Knights (High-detail 4-directional 16-bit sprites)
      rodeur_ombre: buildBoneKnightSprite({
        boneLight: '#cbd5e1',
        boneMid: '#94a3b8',
        boneShadow: '#475569',
        armorLight: '#64748b',
        armorMid: '#334155',
        armorDark: '#0f172a',
        tabardLight: '#9333ea',
        tabardDark: '#581c87',
        eyeGlow: '#f43f5e',
        eyeCore: '#fda4af',
        bladeLight: '#e2e8f0',
        bladeMid: '#64748b',
        horned: false,
        crestedShield: false,
      }),
      squelette: buildBoneKnightSprite({
        boneLight: '#f8fafc',
        boneMid: '#cbd5e1',
        boneShadow: '#64748b',
        armorLight: '#94a3b8',
        armorMid: '#475569',
        armorDark: '#1e293b',
        tabardLight: '#475569',
        tabardDark: '#1e293b',
        eyeGlow: '#ef4444',
        eyeCore: '#fca5a5',
        bladeLight: '#e2e8f0',
        bladeMid: '#94a3b8',
        horned: false,
        crestedShield: false,
      }),
      chevalier_os: buildBoneKnightSprite({
        boneLight: '#f8fafc',
        boneMid: '#cbd5e1',
        boneShadow: '#64748b',
        armorLight: '#cbd5e1',
        armorMid: '#64748b',
        armorDark: '#1e293b',
        tabardLight: '#dc2626',
        tabardDark: '#7f1d1d',
        eyeGlow: '#38bdf8',
        eyeCore: '#e0f2fe',
        bladeLight: '#f8fafc',
        bladeMid: '#94a3b8',
        horned: true,
        crestedShield: true,
      }),
      chevalier_dechu_elite: buildBoneKnightSprite({
        boneLight: '#fde047',
        boneMid: '#d97706',
        boneShadow: '#78350f',
        armorLight: '#818cf8',
        armorMid: '#312e81',
        armorDark: '#1e1b4b',
        tabardLight: '#ef4444',
        tabardDark: '#991b1b',
        eyeGlow: '#f59e0b',
        eyeCore: '#fef9c3',
        bladeLight: '#e9d5ff',
        bladeMid: '#9333ea',
        horned: true,
        crestedShield: true,
      }),

      // Wraiths, Elementals & Eclipse Archmage (4-directional casters)
      spectre_ombre: buildCasterSprite({
        robeLight: '#6b21a8',
        robeMid: '#3b0764',
        robeDark: '#1e1b4b',
        trimGold: '#a855f7',
        trimBright: '#e9d5ff',
        innerVoid: '#090514',
        eyeGlow: '#c084fc',
        orbCore: '#1e1b4b',
        orbRing: '#c084fc',
        staffWood: '#312e81',
        eclipseCrest: false,
      }),
      elementaire_eau: buildCasterSprite({
        robeLight: '#38bdf8',
        robeMid: '#0284c7',
        robeDark: '#0c4a6e',
        trimGold: '#7dd3fc',
        trimBright: '#f0f9ff',
        innerVoid: '#082f49',
        eyeGlow: '#e0f2fe',
        orbCore: '#0369a1',
        orbRing: '#7dd3fc',
        staffWood: '#0ea5e9',
        eclipseCrest: false,
      }),
      mage_eclipse: buildCasterSprite({
        robeLight: '#991b1b',
        robeMid: '#450a0a',
        robeDark: '#18181b',
        trimGold: '#f59e0b',
        trimBright: '#fde047',
        innerVoid: '#09090b',
        eyeGlow: '#f59e0b',
        orbCore: '#09090b',
        orbRing: '#f97316',
        staffWood: '#78350f',
        eclipseCrest: true,
      }),

      // Golems (36x36 faceted stone & molten obsidian colossi)
      golem_rune: buildGolemSprite(
        {
          rockHighlight: '#e2e8f0',
          rockMid: '#94a3b8',
          rockDark: '#475569',
          rockDeep: '#1e293b',
          veinOuter: '#0284c7',
          veinMid: '#38bdf8',
          veinCore: '#e0f2fe',
          obsidianSpikes: false,
        },
        36
      ),
      golem_obsidienne: buildGolemSprite(
        {
          rockHighlight: '#71717a',
          rockMid: '#27272a',
          rockDark: '#18181b',
          rockDeep: '#09090b',
          veinOuter: '#dc2626',
          veinMid: '#f97316',
          veinCore: '#fef08a',
          obsidianSpikes: true,
        },
        36
      ),

      // Serpents, Drakes & Endgame Dragon Vanguard
      vouivre_azur: makeHydraSerpentAnim('#0284c7', '#bae6fd', '#67e8f9', '#f8fafc', 36),
      vouivre_obsidienne: makeHydraSerpentAnim('#27272a', '#9a3412', '#f97316', '#fde047', 38),
      dragon_garde: makeDragonSet(48, { rMul: 0.92, gMul: 0.62, bMul: 0.52 }),

      // 5 GRAND BOSSES (True Red Dragon reserved exclusively for the Final Boss of Act V!)
      reine_caverne: buildMorvathBroodmotherSprite(),
      chevalier_dechu: buildSirMalakorSprite(),
      leviathanis: makeHydraSerpentAnim('#0369a1', '#7dd3fc', '#38bdf8', '#fde047', 54),
      archiliche_vorgath: buildArchlichVorgathSprite(),
      dragon_rouge: makeDragonSet(56),
      pyraxis: makeDragonSet(56),
    };

    const items = buildItemIcons();
    const throne = drawPixelGrid(
      [
        '..........KKKK..........',
        '.........KYYYYK.........',
        '........KYWRRWYK........',
        '.....KKKYYGGGGYYKKK.....',
        '....KYYYGGGGGGGGYYYK....',
        '...KYGKKKKKKKKKKKKGYK...',
        '...KYGKRRRRRRRRRRKGYK...',
        '...KYGKRCRRRRRRCRKGYK...',
        '...KYGKRRRRRRRRRRKGYK...',
        '...KYGKRRRRSSRRRRKGYK...',
        '...KYGKRRRSSSSRRRKGYK...',
        '...KYGKRRRRSSRRRRKGYK...',
        '..KKYGKKKKKKKKKKKKGYKK..',
        '.KYYYYGRRRRRRRRRRGYYYYK.',
        '.KYGGYGRRRRRRRRRRGYYGGK.',
        '.KYGGYGCCRRRRRRCCGYYGGK.',
        '.KYYYYKKKKKKKKKKKKYYYYK.',
        '..KKKKGGGGGGGGGGGGKKKK..',
        '..KYYKRRRRRRRRRRRRKYYK..',
        '..KGGKRRRRRRRRRRRRKGGK..',
        '..KGGKCCCCCCCCCCCCKGGK..',
        '..KKKKGGGGGGGGGGGGKKKK..',
        '...KKGGGGGGGGGGGGGGKK...',
        '...KYYKKKKKKKKKKKKYYK...',
      ],
      {
        K: '#14141c',
        Y: '#fde047',
        G: '#d97706',
        W: '#fef9c3',
        R: '#b91c1c',
        C: '#7f1d1d',
        S: '#f59e0b',
      },
      2
    );

    const flamePalette = {
      K: '#291509',
      R: '#dc2626',
      O: '#f97316',
      Y: '#fde047',
      W: '#fef9c3',
      I: '#1e293b',
      S: '#64748b',
      G: '#d97706',
    };

    // Controlled flame + glowing embers sitting inside tile 2573's pot mouth (x=6..21, y=10..15).
    // Rows 8..15 remain 100% transparent so the front lip and rounded belly of pot 2573 stay completely visible!
    const brazierFlame: HTMLCanvasElement[] = [
      drawPixelGrid(
        [
          '......KK........',
          '.....KOYK.......',
          '....KOYWYK......',
          '...KORYWWOK.....',
          '...KOYWWYOK.....',
          '...KROYYORK.....',
          '....KROORK......',
          '...KKRRRRKK.....',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
        ],
        flamePalette,
        2
      ),
      drawPixelGrid(
        [
          '.......KK.......',
          '......KYOK......',
          '....KKYWYOK.....',
          '...KOYWWWYK.....',
          '...KROYWYOK.....',
          '...KROYYORK.....',
          '....KROORK......',
          '...KKRRRRKK.....',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
        ],
        flamePalette,
        2
      ),
      drawPixelGrid(
        [
          '.....KK.........',
          '....KOYK........',
          '....KYWYKK......',
          '...KYWWWYOK.....',
          '...KOYWYORK.....',
          '...KROYYORK.....',
          '....KROORK......',
          '...KKRRRRKK.....',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
        ],
        flamePalette,
        2
      ),
      drawPixelGrid(
        [
          '......KK........',
          '.....KYWK.......',
          '....KOYWYK......',
          '...KROWWYOK.....',
          '...KORYWYRK.....',
          '...KROYYORK.....',
          '....KROORK......',
          '...KKRRRRKK.....',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
          '................',
        ],
        flamePalette,
        2
      ),
    ];

    // Wrought-iron & gilded brass standing castle torch (16x20 @ 2x = 32x40)
    const makeTorchFrame = (tipRow0: string, tipRow1: string, tipRow2: string) =>
      drawPixelGrid(
        [
          tipRow0,
          tipRow1,
          tipRow2,
          '.....KOYWYK.....',
          '.....KROYYRK....',
          '....KKRRRRKK....',
          '....KGGGGGGK....',
          '.....KISSIK.....',
          '......KGGK......',
          '......KISK......',
          '......KISK......',
          '......KGGK......',
          '......KISK......',
          '......KISK......',
          '.....KGGGGK.....',
          '....KISSSSIK....',
          '...KIIKIIKIIK...',
          '...KK..KK..KK...',
          '................',
          '................',
        ],
        flamePalette,
        2
      );

    const torchStand: HTMLCanvasElement[] = [
      makeTorchFrame('.......KK.......', '......KOYK......', '.....KYWWYK.....'),
      makeTorchFrame('........KK......', '......KKYOK.....', '.....KOYWYK.....'),
      makeTorchFrame('......KK........', '.....KOYKK......', '.....KYWYOK.....'),
      makeTorchFrame('.......KK.......', '......KYWK......', '.....KOYWYK.....'),
    ];

    // Full 2-tile Treasure Chest sprites extracted from tileset.png:
    // Closed chest spans tiles 2569 + 2570 -> pixel rect (298, 2048, 40, 28)
    // Open chest spans tiles 2571 + 2572   -> pixel rect (362, 2048, 40, 28)
    const extractChestCanvas = (sx: number): HTMLCanvasElement => {
      const c = document.createElement('canvas');
      c.width = 40;
      c.height = 32;
      const cctx = c.getContext('2d')!;
      cctx.imageSmoothingEnabled = false;
      cctx.drawImage(tileset, sx, 2048, 40, 28, 0, 2, 40, 28);
      return c;
    };
    const chestClosed = extractChestCanvas(298);
    const chestOpen = extractChestCanvas(362);

    return {
      tileset,
      heart,
      throne,
      chestClosed,
      chestOpen,
      brazierFlame,
      torchStand,
      player,
      npcs,
      monsters,
      items,
    };
  })();

  return cachedPromise;
}
