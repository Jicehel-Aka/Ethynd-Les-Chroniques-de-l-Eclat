import { AUTOTILE_BRUSHES, AutotileBrushDef, AutotileZoneId } from './autotile';
import { SpriteBank } from './spriteBank';

export interface PrefabCell {
  dx: number;
  dy: number;
  layer: 0 | 1 | 2 | 3;
  tid: number;
}

export type EditorThemeId =
  | 'autotile'
  | 'forest_nature'
  | 'bridges_water'
  | 'castle_sanctuary'
  | 'statues_monuments'
  | 'dungeon_volcano';

export interface EditorThemeDef {
  id: EditorThemeId;
  nameFr: string;
  nameEn: string;
}

export const EDITOR_THEMES: EditorThemeDef[] = [
  { id: 'autotile', nameFr: 'Zones Auto-Tilées', nameEn: 'Auto-Tiled Zones' },
  { id: 'forest_nature', nameFr: 'Forêt & Nature', nameEn: 'Forest & Nature' },
  { id: 'bridges_water', nameFr: 'Ponts, Routes & Eau', nameEn: 'Bridges, Roads & Water' },
  { id: 'castle_sanctuary', nameFr: 'Château & Sanctuaire', nameEn: 'Castle & Sanctuary' },
  { id: 'statues_monuments', nameFr: 'Statues & Colonnes', nameEn: 'Statues & Columns' },
  { id: 'dungeon_volcano', nameFr: 'Donjons & Volcan', nameEn: 'Dungeons & Volcano' },
];

export interface PrefabStamp {
  id: string;
  theme: EditorThemeId;
  nameFr: string;
  nameEn: string;
  w: number;
  h: number;
  cells: PrefabCell[];
}

export interface ThematicTileItem {
  id: string;
  theme: EditorThemeId;
  nameFr: string;
  nameEn: string;
  tid: number;
  recommendedLayer: 0 | 1 | 2 | 3;
}

export const PREFAB_STAMPS: PrefabStamp[] = [
  // --- FORÊT & NATURE ---
  {
    id: 'tree_oak',
    theme: 'forest_nature',
    nameFr: 'Arbre Sylvestre à Tronc A (2×2)',
    nameEn: 'Trunked Sylvan Oak A (2×2)',
    w: 2,
    h: 2,
    cells: [
      { dx: 0, dy: 0, layer: 3, tid: 3050 },
      { dx: 1, dy: 0, layer: 3, tid: 3051 },
      { dx: 0, dy: 1, layer: 2, tid: 3090 },
      { dx: 1, dy: 1, layer: 2, tid: 3091 },
    ],
  },
  {
    id: 'tree_emerald',
    theme: 'forest_nature',
    nameFr: 'Chêne Sylvebrume à Tronc B (2×2)',
    nameEn: 'Sylvebrume Trunked Tree B (2×2)',
    w: 2,
    h: 2,
    cells: [
      { dx: 0, dy: 0, layer: 3, tid: 3052 },
      { dx: 1, dy: 0, layer: 3, tid: 3053 },
      { dx: 0, dy: 1, layer: 2, tid: 3092 },
      { dx: 1, dy: 1, layer: 2, tid: 3093 },
    ],
  },
  {
    id: 'tree_round',
    theme: 'forest_nature',
    nameFr: 'Arbre Feuillu à Tronc C (2×2)',
    nameEn: 'Leafy Trunked Tree C (2×2)',
    w: 2,
    h: 2,
    cells: [
      { dx: 0, dy: 0, layer: 3, tid: 3054 },
      { dx: 1, dy: 0, layer: 3, tid: 3055 },
      { dx: 0, dy: 1, layer: 2, tid: 3094 },
      { dx: 1, dy: 1, layer: 2, tid: 3095 },
    ],
  },
  {
    id: 'tree_pine',
    theme: 'forest_nature',
    nameFr: 'Pin Forestier à Tronc D (2×2)',
    nameEn: 'Forest Trunked Pine D (2×2)',
    w: 2,
    h: 2,
    cells: [
      { dx: 0, dy: 0, layer: 3, tid: 3056 },
      { dx: 1, dy: 0, layer: 3, tid: 3057 },
      { dx: 0, dy: 1, layer: 2, tid: 3096 },
      { dx: 1, dy: 1, layer: 2, tid: 3097 },
    ],
  },
  {
    id: 'bush_round_2x2',
    theme: 'forest_nature',
    nameFr: 'Bosquet / Buisson Rond Complet (2×2)',
    nameEn: 'Complete Round Bush Copse (2×2)',
    w: 2,
    h: 2,
    cells: [
      { dx: 0, dy: 0, layer: 3, tid: 645 },
      { dx: 1, dy: 0, layer: 3, tid: 646 },
      { dx: 0, dy: 1, layer: 2, tid: 685 },
      { dx: 1, dy: 1, layer: 2, tid: 686 },
    ],
  },
  {
    id: 'log_horizontal',
    theme: 'forest_nature',
    nameFr: 'Tronc Couché Moussu (2×1)',
    nameEn: 'Mossy Fallen Log (2×1)',
    w: 2,
    h: 1,
    cells: [
      { dx: 0, dy: 0, layer: 2, tid: 3130 },
      { dx: 1, dy: 0, layer: 2, tid: 3131 },
    ],
  },
  {
    id: 'stump_forest',
    theme: 'forest_nature',
    nameFr: "Souche d'Arbre Coupé (2×2)",
    nameEn: 'Cut Tree Stump (2×2)',
    w: 2,
    h: 2,
    cells: [
      { dx: 0, dy: 0, layer: 2, tid: 3132 },
      { dx: 1, dy: 0, layer: 2, tid: 3133 },
      { dx: 0, dy: 1, layer: 2, tid: 3172 },
      { dx: 1, dy: 1, layer: 2, tid: 3173 },
    ],
  },

  // --- PONTS, ROUTES & EAU ---
  {
    id: 'bridge_ns_90',
    theme: 'bridges_water',
    nameFr: 'Pont Nord-Sud 90° Complet (3×4)',
    nameEn: 'Vertical Bridge 90° Complete (3×4)',
    w: 3,
    h: 4,
    cells: [
      { dx: 0, dy: 0, layer: 2, tid: 245 },
      { dx: 1, dy: 0, layer: 1, tid: 286 },
      { dx: 1, dy: 0, layer: 2, tid: 246 },
      { dx: 2, dy: 0, layer: 2, tid: 247 },
      { dx: 0, dy: 1, layer: 2, tid: 285 },
      { dx: 1, dy: 1, layer: 1, tid: 286 },
      { dx: 1, dy: 1, layer: 2, tid: -1 },
      { dx: 2, dy: 1, layer: 2, tid: 287 },
      { dx: 0, dy: 2, layer: 2, tid: 285 },
      { dx: 1, dy: 2, layer: 1, tid: 286 },
      { dx: 1, dy: 2, layer: 2, tid: -1 },
      { dx: 2, dy: 2, layer: 2, tid: 287 },
      { dx: 0, dy: 3, layer: 2, tid: 325 },
      { dx: 1, dy: 3, layer: 1, tid: 286 },
      { dx: 1, dy: 3, layer: 2, tid: 326 },
      { dx: 2, dy: 3, layer: 2, tid: 327 },
    ],
  },
  {
    id: 'bridge_ns_span',
    theme: 'bridges_water',
    nameFr: 'Travée Pont Nord-Sud 90° (3×1)',
    nameEn: 'Vertical Bridge Span 90° (3×1)',
    w: 3,
    h: 1,
    cells: [
      { dx: 0, dy: 0, layer: 2, tid: 285 },
      { dx: 1, dy: 0, layer: 1, tid: 286 },
      { dx: 1, dy: 0, layer: 2, tid: -1 },
      { dx: 2, dy: 0, layer: 2, tid: 287 },
    ],
  },
  {
    id: 'bridge_ew',
    theme: 'bridges_water',
    nameFr: 'Pont Est-Ouest Complet (4×4)',
    nameEn: 'Horizontal Bridge Complete (4×4)',
    w: 4,
    h: 4,
    cells: [
      { dx: 0, dy: 0, layer: 2, tid: 248 },
      { dx: 1, dy: 0, layer: 2, tid: 249 },
      { dx: 2, dy: 0, layer: 2, tid: 249 },
      { dx: 3, dy: 0, layer: 2, tid: 250 },
      { dx: 0, dy: 1, layer: 1, tid: 289 },
      { dx: 0, dy: 1, layer: 2, tid: 288 },
      { dx: 1, dy: 1, layer: 1, tid: 289 },
      { dx: 1, dy: 1, layer: 2, tid: -1 },
      { dx: 2, dy: 1, layer: 1, tid: 289 },
      { dx: 2, dy: 1, layer: 2, tid: -1 },
      { dx: 3, dy: 1, layer: 1, tid: 289 },
      { dx: 3, dy: 1, layer: 2, tid: 290 },
      { dx: 0, dy: 2, layer: 1, tid: 289 },
      { dx: 0, dy: 2, layer: 2, tid: 288 },
      { dx: 1, dy: 2, layer: 1, tid: 289 },
      { dx: 1, dy: 2, layer: 2, tid: -1 },
      { dx: 2, dy: 2, layer: 1, tid: 289 },
      { dx: 2, dy: 2, layer: 2, tid: -1 },
      { dx: 3, dy: 2, layer: 1, tid: 289 },
      { dx: 3, dy: 2, layer: 2, tid: 290 },
      { dx: 0, dy: 3, layer: 2, tid: 328 },
      { dx: 1, dy: 3, layer: 2, tid: 329 },
      { dx: 2, dy: 3, layer: 2, tid: 329 },
      { dx: 3, dy: 3, layer: 2, tid: 330 },
    ],
  },

  // --- CHÂTEAU & SANCTUAIRE ---
  {
    id: 'carpet_royal',
    theme: 'castle_sanctuary',
    nameFr: 'Tapis Royal Bordé 9-Slice (3×3)',
    nameEn: 'Bordered Royal Carpet (3×3)',
    w: 3,
    h: 3,
    cells: [
      { dx: 0, dy: 0, layer: 1, tid: 2120 },
      { dx: 1, dy: 0, layer: 1, tid: 2121 },
      { dx: 2, dy: 0, layer: 1, tid: 2122 },
      { dx: 0, dy: 1, layer: 1, tid: 2160 },
      { dx: 1, dy: 1, layer: 1, tid: 2161 },
      { dx: 2, dy: 1, layer: 1, tid: 2162 },
      { dx: 0, dy: 2, layer: 1, tid: 2200 },
      { dx: 1, dy: 2, layer: 1, tid: 2201 },
      { dx: 2, dy: 2, layer: 1, tid: 2202 },
    ],
  },
  {
    id: 'stone_court',
    theme: 'castle_sanctuary',
    nameFr: 'Dallage Pierre Bordé (3×3)',
    nameEn: 'Bordered Stone Court (3×3)',
    w: 3,
    h: 3,
    cells: [
      { dx: 0, dy: 0, layer: 1, tid: 22 },
      { dx: 1, dy: 0, layer: 1, tid: 23 },
      { dx: 2, dy: 0, layer: 1, tid: 24 },
      { dx: 0, dy: 1, layer: 1, tid: 62 },
      { dx: 1, dy: 1, layer: 1, tid: 63 },
      { dx: 2, dy: 1, layer: 1, tid: 64 },
      { dx: 0, dy: 2, layer: 1, tid: 102 },
      { dx: 1, dy: 2, layer: 1, tid: 103 },
      { dx: 2, dy: 2, layer: 1, tid: 104 },
    ],
  },
  {
    id: 'rune_medallion',
    theme: 'castle_sanctuary',
    nameFr: 'Médaillon Runique Obsidienne (2×2)',
    nameEn: 'Obsidian Rune Medallion (2×2)',
    w: 2,
    h: 2,
    cells: [
      { dx: 0, dy: 0, layer: 1, tid: 2163 },
      { dx: 1, dy: 0, layer: 1, tid: 2164 },
      { dx: 0, dy: 1, layer: 1, tid: 2203 },
      { dx: 1, dy: 1, layer: 1, tid: 2204 },
    ],
  },
  {
    id: 'banner_wall',
    theme: 'castle_sanctuary',
    nameFr: 'Bannière Murale Royale (1×2)',
    nameEn: 'Royal Wall Banner (1×2)',
    w: 1,
    h: 2,
    cells: [
      { dx: 0, dy: 0, layer: 2, tid: 1085 },
      { dx: 0, dy: 1, layer: 2, tid: 1125 },
    ],
  },
  {
    id: 'brazier_fire',
    theme: 'castle_sanctuary',
    nameFr: 'Brasero de Pierre Animé (1×1)',
    nameEn: 'Animated Stone Brazier (1×1)',
    w: 1,
    h: 1,
    cells: [{ dx: 0, dy: 0, layer: 2, tid: 2573 }],
  },
  {
    id: 'torch_royal',
    theme: 'castle_sanctuary',
    nameFr: 'Torche Royale sur Pied (1×1)',
    nameEn: 'Standing Royal Torch (1×1)',
    w: 1,
    h: 1,
    cells: [{ dx: 0, dy: 0, layer: 2, tid: 2576 }],
  },

  // --- STATUES & COLONNES ---
  {
    id: 'col_fluted',
    theme: 'statues_monuments',
    nameFr: 'Colonne Cannelée Antique (1×3)',
    nameEn: 'Fluted Temple Column (1×3)',
    w: 1,
    h: 3,
    cells: [
      { dx: 0, dy: 0, layer: 3, tid: 2205 },
      { dx: 0, dy: 1, layer: 3, tid: 2245 },
      { dx: 0, dy: 2, layer: 2, tid: 2285 },
    ],
  },
  {
    id: 'statue_astrelya',
    theme: 'statues_monuments',
    nameFr: "Statue Marbre d'Astrelya (2×3)",
    nameEn: 'Astrelya Marble Statue (2×3)',
    w: 2,
    h: 3,
    cells: [
      { dx: 0, dy: 0, layer: 3, tid: 1248 },
      { dx: 1, dy: 0, layer: 3, tid: 1249 },
      { dx: 0, dy: 1, layer: 2, tid: 1288 },
      { dx: 1, dy: 1, layer: 2, tid: 1289 },
      { dx: 0, dy: 2, layer: 2, tid: 1328 },
      { dx: 1, dy: 2, layer: 2, tid: 1329 },
    ],
  },
  {
    id: 'statue_winged',
    theme: 'statues_monuments',
    nameFr: 'Idole Ailée du Temple (2×2)',
    nameEn: 'Winged Sanctuary Idol (2×2)',
    w: 2,
    h: 2,
    cells: [
      { dx: 0, dy: 0, layer: 3, tid: 1486 },
      { dx: 1, dy: 0, layer: 3, tid: 1487 },
      { dx: 0, dy: 1, layer: 2, tid: 1526 },
      { dx: 1, dy: 1, layer: 2, tid: 1527 },
    ],
  },
  {
    id: 'statue_eclipse',
    theme: 'statues_monuments',
    nameFr: "Idole Cornue de l'Éclipse (2×2)",
    nameEn: 'Horned Eclipse Idol (2×2)',
    w: 2,
    h: 2,
    cells: [
      { dx: 0, dy: 0, layer: 3, tid: 1488 },
      { dx: 1, dy: 0, layer: 3, tid: 1489 },
      { dx: 0, dy: 1, layer: 2, tid: 1528 },
      { dx: 1, dy: 1, layer: 2, tid: 1529 },
    ],
  },
  {
    id: 'statue_knight',
    theme: 'statues_monuments',
    nameFr: 'Statue Chevalier Sentinelle (1×3)',
    nameEn: 'Knight Sentinel Statue (1×3)',
    w: 1,
    h: 3,
    cells: [
      { dx: 0, dy: 0, layer: 3, tid: 930 },
      { dx: 0, dy: 1, layer: 2, tid: 970 },
      { dx: 0, dy: 2, layer: 2, tid: 1010 },
    ],
  },

  // --- DONJONS & VOLCAN ---
  {
    id: 'boulder_rock_2x2',
    theme: 'dungeon_volcano',
    nameFr: 'Rocher Massif (2×2)',
    nameEn: 'Massive Boulder (2×2)',
    w: 2,
    h: 2,
    cells: [
      { dx: 0, dy: 0, layer: 2, tid: 533 },
      { dx: 1, dy: 0, layer: 2, tid: 534 },
      { dx: 0, dy: 1, layer: 2, tid: 573 },
      { dx: 1, dy: 1, layer: 2, tid: 574 },
    ],
  },
];

export const THEMATIC_TILES: ThematicTileItem[] = [
  // Forêt & Nature
  { id: 'tile_grass_0', theme: 'forest_nature', nameFr: 'Herbe Prairie (L0)', nameEn: 'Meadow Grass (L0)', tid: 0, recommendedLayer: 0 },
  { id: 'tile_flowers_w', theme: 'forest_nature', nameFr: 'Fleurs Blanches (L0)', nameEn: 'Wild White Flowers (L0)', tid: 212, recommendedLayer: 0 },
  { id: 'tile_flowers_y', theme: 'forest_nature', nameFr: 'Touffe Herbe Fleurie (L0)', nameEn: 'Flowering Grass Tuft (L0)', tid: 252, recommendedLayer: 0 },
  { id: 'tile_tall_grass', theme: 'forest_nature', nameFr: 'Herbe Haute (L1)', nameEn: 'Tall Grass (L1)', tid: 368, recommendedLayer: 1 },
  { id: 'tile_pebble', theme: 'forest_nature', nameFr: 'Petit Caillou (L0)', nameEn: 'Small Pebble (L0)', tid: 405, recommendedLayer: 0 },
  { id: 'tile_forest_fill', theme: 'forest_nature', nameFr: 'Canopée Dense Centre (#642)', nameEn: 'Dense Forest Fill (#642)', tid: 642, recommendedLayer: 2 },
  { id: 'tile_forest_nw', theme: 'forest_nature', nameFr: 'Angle Externe Forêt NO (#645)', nameEn: 'Forest Outer NW (#645)', tid: 645, recommendedLayer: 2 },
  { id: 'tile_forest_ne', theme: 'forest_nature', nameFr: 'Angle Externe Forêt NE (#646)', nameEn: 'Forest Outer NE (#646)', tid: 646, recommendedLayer: 2 },
  { id: 'tile_forest_sw', theme: 'forest_nature', nameFr: 'Angle Externe Forêt SO (#685)', nameEn: 'Forest Outer SW (#685)', tid: 685, recommendedLayer: 2 },
  { id: 'tile_forest_se', theme: 'forest_nature', nameFr: 'Angle Externe Forêt SE (#686)', nameEn: 'Forest Outer SE (#686)', tid: 686, recommendedLayer: 2 },

  // Ponts, Routes & Eau
  { id: 'tile_road_fill', theme: 'bridges_water', nameFr: 'Terre Battue Centre (#161)', nameEn: 'Dirt Road Fill (#161)', tid: 161, recommendedLayer: 0 },
  { id: 'tile_water_fill', theme: 'bridges_water', nameFr: 'Eau Profonde (#283)', nameEn: 'Deep Water (#283)', tid: 283, recommendedLayer: 1 },
  { id: 'tile_plank_ns', theme: 'bridges_water', nameFr: 'Tablier Pont Nord-Sud (#286)', nameEn: 'Vertical Bridge Deck (#286)', tid: 286, recommendedLayer: 1 },
  { id: 'tile_plank_ew', theme: 'bridges_water', nameFr: 'Tablier Pont Est-Ouest (#289)', nameEn: 'Horizontal Bridge Deck (#289)', tid: 289, recommendedLayer: 1 },

  // Château & Sanctuaire
  { id: 'tile_castle_floor', theme: 'castle_sanctuary', nameFr: 'Dalle Château Claire (#63)', nameEn: 'Castle Stone Tile (#63)', tid: 63, recommendedLayer: 0 },
  { id: 'tile_carpet_mid', theme: 'castle_sanctuary', nameFr: 'Tapis Royal Centre (#2161)', nameEn: 'Royal Carpet Center (#2161)', tid: 2161, recommendedLayer: 1 },
  { id: 'tile_crate', theme: 'castle_sanctuary', nameFr: 'Caisse de Bois (#2560)', nameEn: 'Wooden Crate (#2560)', tid: 2560, recommendedLayer: 2 },
  { id: 'tile_signpost', theme: 'castle_sanctuary', nameFr: 'Panneau Indicateur (#2564)', nameEn: 'Wooden Signpost (#2564)', tid: 2564, recommendedLayer: 2 },

  // Statues & Colonnes
  { id: 'tile_stele_rune', theme: 'statues_monuments', nameFr: 'Stèle Runique du Codex (#1050)', nameEn: 'Runic Lore Stele (#1050)', tid: 1050, recommendedLayer: 2 },

  // Donjons & Volcan
  { id: 'tile_dungeon_floor', theme: 'dungeon_volcano', nameFr: 'Dalle Sombre Donjon (#18)', nameEn: 'Dark Dungeon Floor (#18)', tid: 18, recommendedLayer: 0 },
  { id: 'tile_crypt_floor', theme: 'dungeon_volcano', nameFr: 'Pavé Crypte Ancienne (#58)', nameEn: 'Ancient Crypt Tile (#58)', tid: 58, recommendedLayer: 0 },
  { id: 'tile_lava_bright', theme: 'dungeon_volcano', nameFr: 'Magma Ardent (#443)', nameEn: 'Molten Magma (#443)', tid: 443, recommendedLayer: 0 },
  { id: 'tile_skull_bone', theme: 'dungeon_volcano', nameFr: 'Crâne d’Ossements (#2612)', nameEn: 'Skeletal Skull Prop (#2612)', tid: 2612, recommendedLayer: 2 },
];

export type UnifiedCatalogSelection =
  | { kind: 'autotile'; zone: AutotileZoneId; brush: AutotileBrushDef }
  | { kind: 'stamp'; stamp: PrefabStamp }
  | { kind: 'tile'; item: ThematicTileItem };

export function getAllCatalogSelections(): UnifiedCatalogSelection[] {
  const out: UnifiedCatalogSelection[] = [];
  for (const b of AUTOTILE_BRUSHES) {
    out.push({ kind: 'autotile', zone: b.id, brush: b });
  }
  for (const st of PREFAB_STAMPS) {
    out.push({ kind: 'stamp', stamp: st });
  }
  for (const t of THEMATIC_TILES) {
    out.push({ kind: 'tile', item: t });
  }
  return out;
}

/**
 * Renders the exact visual pixel-art shape of an Autotile Zone (3x3 island),
 * Multi-Layer Prefab Stamp (w x h), or Single Tile onto a preview <canvas>.
 */
export function renderShapePreviewCanvas(
  canvas: HTMLCanvasElement,
  sel: UnifiedCatalogSelection | { kind: 'raw_tile'; tid: number },
  sprites: SpriteBank,
  tileCols: number,
  maxBoxPx = 56
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const drawSingleTid = (tid: number, dx: number, dy: number, sz: number) => {
    if (tid < 0) return;
    if (tid === 2576 && sprites.torchStand[0]) {
      ctx.drawImage(sprites.torchStand[0], dx, dy, sz, sz);
      return;
    }
    const sx = (tid % tileCols) * 32;
    const sy = Math.floor(tid / tileCols) * 32;
    ctx.drawImage(sprites.tileset, sx, sy, 32, 32, dx, dy, sz, sz);
    if (tid === 2573 && sprites.brazierFlame[0]) {
      ctx.drawImage(sprites.brazierFlame[0], dx, dy, sz, sz);
    }
  };

  let gridW = 1;
  let gridH = 1;
  if (sel.kind === 'autotile') {
    gridW = 3;
    gridH = 3;
  } else if (sel.kind === 'stamp') {
    gridW = sel.stamp.w;
    gridH = sel.stamp.h;
  }

  const cellPx = Math.max(12, Math.min(32, Math.floor(maxBoxPx / Math.max(gridW, gridH))));
  const wPx = gridW * cellPx;
  const hPx = gridH * cellPx;
  canvas.width = wPx;
  canvas.height = hPx;

  ctx.imageSmoothingEnabled = false;
  // Subtle dark checkerboard backdrop so transparent edges & rounded corners are unmistakably visible!
  const half = Math.max(4, Math.floor(cellPx / 2));
  for (let y = 0; y < hPx; y += half) {
    for (let x = 0; x < wPx; x += half) {
      ctx.fillStyle = ((x / half + y / half) & 1) === 0 ? '#0d131f' : '#162032';
      ctx.fillRect(x, y, half, half);
    }
  }

  if (sel.kind === 'autotile') {
    const bgTid = sel.brush.groundTile;
    for (let gy = 0; gy < 3; gy++) {
      for (let gx = 0; gx < 3; gx++) {
        if (bgTid !== undefined) {
          drawSingleTid(bgTid, gx * cellPx, gy * cellPx, cellPx);
        }
        drawSingleTid(sel.brush.preview3x3[gy][gx], gx * cellPx, gy * cellPx, cellPx);
      }
    }
    return;
  }

  if (sel.kind === 'stamp') {
    // Draw sorted by layer 0..3 so canopy/statue tops composite cleanly over trunks/decks
    const sorted = [...sel.stamp.cells].sort((a, b) => a.layer - b.layer);
    for (const c of sorted) {
      if (c.tid >= 0) {
        drawSingleTid(c.tid, c.dx * cellPx, c.dy * cellPx, cellPx);
      }
    }
    return;
  }

  const tid = sel.kind === 'tile' ? sel.item.tid : sel.tid;
  drawSingleTid(tid, 0, 0, cellPx);
}
