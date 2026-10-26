import { MapData } from './types';

export type AutotileZoneId = 'forest' | 'road' | 'water' | 'stone' | 'carpet';

export interface AutotileBrushDef {
  id: AutotileZoneId;
  nameFr: string;
  nameEn: string;
  descFr: string;
  descEn: string;
  targetLayer: 0 | 1 | 2;
  groundTile?: number;
  memberTiles: number[];
  preview3x3: number[][];
}

export const FOREST_MEMBER_TILES = [
  642, 643, 644, 645, 646, 647, 685, 686, 687, 725, 726, 727, 763, 764, 765,
];
export const ROAD_MEMBER_TILES = [
  120, 121, 122, 160, 161, 162, 200, 201, 202, 240, 241, 280, 281,
];
export const WATER_MEMBER_TILES = [
  242, 243, 244, 282, 283, 284, 322, 323, 324, 362, 363, 402, 403,
];
export const STONE_MEMBER_TILES = [22, 23, 24, 62, 63, 64, 102, 103, 104];
export const CARPET_MEMBER_TILES = [2120, 2121, 2122, 2160, 2161, 2162, 2200, 2201, 2202];

const FOREST_SET = new Set<number>(FOREST_MEMBER_TILES);
const ROAD_SET = new Set<number>(ROAD_MEMBER_TILES);
const WATER_SET = new Set<number>(WATER_MEMBER_TILES);
const STONE_SET = new Set<number>(STONE_MEMBER_TILES);
const CARPET_SET = new Set<number>(CARPET_MEMBER_TILES);

export const AUTOTILE_BRUSHES: AutotileBrushDef[] = [
  {
    id: 'forest',
    nameFr: 'Zone Forêt Dense (15 tuiles · coins int./ext. auto)',
    nameEn: 'Dense Forest Zone (15-tile blob autotile)',
    descFr:
      'Calcule automatiquement les angles externes arrondis (645/646/685/686), bords cardinaux (725/765/726/727), coins rentrants concaves (643/644/763/764) et remplissage (642) sur L2.',
    descEn:
      'Automatically resolves outer convex corners, cardinal edges, inner concave corners, and dense canopy fill on layer L2.',
    targetLayer: 2,
    groundTile: 0,
    memberTiles: FOREST_MEMBER_TILES,
    preview3x3: [
      [645, 725, 646],
      [726, 642, 727],
      [685, 765, 686],
    ],
  },
  {
    id: 'road',
    nameFr: 'Zone Chemin de Terre (13 tuiles · virages & carrefours auto)',
    nameEn: 'Dirt Road Zone (13-tile path autotile)',
    descFr:
      'Dessine des routes et carrefours continus sur L0 avec coins externes (120/122/200/202), bords (121/201/160/162) et coins rentrants (240/241/280/281).',
    descEn:
      'Paints seamless dirt paths and crossroads on L0 with outer corners, straight edges, and inner turn transitions.',
    targetLayer: 0,
    memberTiles: ROAD_MEMBER_TILES,
    preview3x3: [
      [120, 121, 122],
      [160, 161, 162],
      [200, 201, 202],
    ],
  },
  {
    id: 'water',
    nameFr: 'Zone Lac & Rivière (13 tuiles · berges auto)',
    nameEn: 'Lake & River Zone (13-tile water autotile)',
    descFr:
      'Crée lacs et rivières sur L1 avec berges arrondies externes (242/244/322/324), rives droites et anses concaves (362/363/402/403).',
    descEn:
      'Paints lakes and rivers on L1 with rounded outer banks, straight shores, and concave coves.',
    targetLayer: 1,
    groundTile: 0,
    memberTiles: WATER_MEMBER_TILES,
    preview3x3: [
      [242, 243, 244],
      [282, 283, 284],
      [322, 323, 324],
    ],
  },
  {
    id: 'stone',
    nameFr: 'Zone Dallage de Pierre Bordé (9-Slice sur L1)',
    nameEn: 'Bordered Stone Court Zone (9-Slice on L1)',
    descFr:
      'Remplit automatiquement une place pavée avec bordures taillées (22..104) et centre continu (63) sans raccord cassé.',
    descEn:
      'Automatically frames stone plazas and dungeon platforms with clean 9-slice stone borders (22..104).',
    targetLayer: 1,
    memberTiles: STONE_MEMBER_TILES,
    preview3x3: [
      [22, 23, 24],
      [62, 63, 64],
      [102, 103, 104],
    ],
  },
  {
    id: 'carpet',
    nameFr: 'Zone Tapis Royal Bordé (9-Slice sur L1)',
    nameEn: 'Bordered Royal Carpet Zone (9-Slice on L1)',
    descFr:
      'Étend un tapis royal brun/pourpre à frise dorée (2120..2202) de toute taille sans jamais placer de bordure au milieu.',
    descEn:
      'Spans royal carpets of any dimension with gold-trimmed outer edges and seamless woven center (2161).',
    targetLayer: 1,
    memberTiles: CARPET_MEMBER_TILES,
    preview3x3: [
      [2120, 2121, 2122],
      [2160, 2161, 2162],
      [2200, 2201, 2202],
    ],
  },
];

function getZoneSet(zone: AutotileZoneId): { layer: 0 | 1 | 2; set: Set<number>; groundTile?: number } {
  switch (zone) {
    case 'forest':
      return { layer: 2, set: FOREST_SET, groundTile: 0 };
    case 'road':
      return { layer: 0, set: ROAD_SET };
    case 'water':
      return { layer: 1, set: WATER_SET, groundTile: 0 };
    case 'stone':
      return { layer: 1, set: STONE_SET };
    case 'carpet':
      return { layer: 1, set: CARPET_SET };
  }
}

export function resolveAutotileId(
  zone: AutotileZoneId,
  n: boolean,
  s: boolean,
  w: boolean,
  e: boolean,
  nw: boolean,
  ne: boolean,
  sw: boolean,
  se: boolean
): number {
  if (zone === 'forest') {
    // Verified 15-tile Dense Forest Blob Autotile Set in tileset.png (40 cols)
    // Grass (!present) on 2 adjacent cardinal sides -> outer convex corners
    if (!n && !w) return 645;
    if (!n && !e) return 646;
    if (!s && !w) return 685;
    if (!s && !e) return 686;
    // Grass on 1 cardinal side -> straight forest borders
    if (!n) return 725;
    if (!s) return 765;
    if (!w) return 726;
    if (!e) return 727;
    // All 4 cardinals are forest -> check diagonal grass for inner concave corners & saddles
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

  // Royal Carpet 9-slice (2120..2202): inner junctions resolve to center weave 2161 so borders never cut inside!
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

function recomputeAutotileWindow(
  layers: number[][][],
  w: number,
  h: number,
  zone: AutotileZoneId,
  x0: number,
  y0: number,
  x1: number,
  y1: number
) {
  const { layer, set } = getZoneSet(zone);
  const isMember = (x: number, y: number): boolean => {
    if (x < 0 || x >= w || y < 0 || y >= h) {
      // Off-map edges connect seamlessly so map borders never close artificially
      return true;
    }
    return set.has(layers[layer][y][x]);
  };

  const rx0 = Math.max(0, x0 - 1);
  const ry0 = Math.max(0, y0 - 1);
  const rx1 = Math.min(w - 1, x1 + 1);
  const ry1 = Math.min(h - 1, y1 + 1);

  const updates: Array<{ x: number; y: number; tid: number }> = [];
  for (let y = ry0; y <= ry1; y++) {
    for (let x = rx0; x <= rx1; x++) {
      if (!set.has(layers[layer][y][x])) continue;
      const tid = resolveAutotileId(
        zone,
        isMember(x, y - 1),
        isMember(x, y + 1),
        isMember(x - 1, y),
        isMember(x + 1, y),
        isMember(x - 1, y - 1),
        isMember(x + 1, y - 1),
        isMember(x - 1, y + 1),
        isMember(x + 1, y + 1)
      );
      updates.push({ x, y, tid });
    }
  }

  for (const u of updates) {
    layers[layer][u.y][u.x] = u.tid;
  }
}

/**
 * Paints or erases a rectangular region (or 1x1 / 2x2 brush stroke) for an autotiled terrain zone,
 * then automatically recomputes all 8-neighbor edges & outer/inner corners across the affected boundary!
 */
export function applyAutotileRectToLayers(
  sourceLayers: number[][][],
  w: number,
  h: number,
  zone: AutotileZoneId,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  erase = false
): number[][][] {
  const layers = sourceLayers.map((l) => l.map((row) => [...row]));
  const { layer, set, groundTile } = getZoneSet(zone);

  const x0 = Math.max(0, Math.min(ax, bx));
  const y0 = Math.max(0, Math.min(ay, by));
  const x1 = Math.min(w - 1, Math.max(ax, bx));
  const y1 = Math.min(h - 1, Math.max(ay, by));

  const seedTile = resolveAutotileId(zone, true, true, true, true, true, true, true, true);

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (erase) {
        if (layer === 0) {
          if (set.has(layers[0][y][x])) layers[0][y][x] = 0; // revert road to grass
        } else {
          if (set.has(layers[layer][y][x])) layers[layer][y][x] = -1;
          if (zone === 'forest' && set.has(layers[3][y][x])) {
            layers[3][y][x] = -1;
          }
        }
      } else {
        if (groundTile !== undefined && layers[0][y][x] < 0) {
          layers[0][y][x] = groundTile;
        }
        layers[layer][y][x] = seedTile;
        if (zone === 'forest') {
          // Clear any conflicting forest fragments on L1 or L3 so corners stay crisp
          if (set.has(layers[1][y][x])) layers[1][y][x] = -1;
          if (set.has(layers[3][y][x])) layers[3][y][x] = -1;
        }
      }
    }
  }

  recomputeAutotileWindow(layers, w, h, zone, x0, y0, x1, y1);
  return layers;
}

/**
 * One-click full-map autotile repair: normalizes all existing Dense Forest (L2),
 * Dirt Road (L0), Water (L1), Stone Court (L1), and Royal Carpet (L1) zones on a map.
 */
export function repairMapAutotiling(map: MapData): { map: MapData; fixedCount: number } {
  const nextLayers = map.layers.map((l) => l.map((row) => [...row]));
  const zones: AutotileZoneId[] = ['forest', 'road', 'water', 'carpet'];
  let fixedCount = 0;

  for (const zone of zones) {
    const { layer, set } = getZoneSet(zone);
    const before = nextLayers[layer].map((r) => [...r]);
    recomputeAutotileWindow(nextLayers, map.w, map.h, zone, 0, 0, map.w - 1, map.h - 1);
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        if (set.has(before[y][x]) && before[y][x] !== nextLayers[layer][y][x]) {
          fixedCount++;
        }
      }
    }
  }

  return {
    map: { ...map, layers: nextLayers },
    fixedCount,
  };
}
