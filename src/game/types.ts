export enum Direction {
  Bas = 'bas',
  Haut = 'haut',
  Gauche = 'gauche',
  Droite = 'droite',
}

export enum EquipSlot {
  Weapon = 'weapon',
  Armor = 'armor',
  Shield = 'shield',
  Relic = 'relic',
}

export type LangCode = 'fr' | 'en';

export type NavTab = 'play' | 'maps' | 'equipment' | 'quests' | 'bestiary' | 'codex' | 'tests';

export type GamePhase = 'title' | 'playing' | 'victory' | 'gameover';

export interface DoorDef {
  x: number;
  y: number;
  w: number;
  h: number;
  map: string;
  dx: number;
  dy: number;
  reqFlag: string | null;
  denyDlg: string | null;
}

export interface SpawnDef {
  type: string;
  x: number;
  y: number;
  hp: number;
  atk: number;
  xp: number;
  gold: number;
  ai: 'passive' | 'wander' | 'chase' | 'ranged' | 'boss';
  radius?: number;
  bossId?: string;
  ranged?: 'fireball' | 'frostbolt' | 'shadowbolt' | 'poison_dart';
}

export interface NpcDef {
  id: string;
  type: string;
  x: number;
  y: number;
  dir: Direction;
  dialogue: string;
  shop?: 'market' | 'forge' | 'alchemy';
  openX?: number;
  openY?: number;
  blockUntilFlag?: string;
}

export interface MapItemDef {
  id: string;
  x: number;
  y: number;
  afterFlag: string | null;
}

export interface ChestDef {
  id: string;
  x: number;
  y: number;
  gold: number;
  equip: string | null;
  item: string | null;
}

export interface SteleDef {
  id: string;
  x: number;
  y: number;
  tile: number;
}

export interface MapData {
  name: string;
  titleFr: string;
  titleEn: string;
  region: string;
  w: number;
  h: number;
  music: string;
  bgColor: [number, number, number];
  layers: number[][][];
  spawns: SpawnDef[];
  npcs: NpcDef[];
  doors: DoorDef[];
  items: MapItemDef[];
  chests: ChestDef[];
  steles: SteleDef[];
}

export interface WorldBundle {
  start: { map: string; x: number; y: number; dir: Direction };
  tileCols: number;
  anim: Record<string, number>;
  masks: Record<string, string>;
  maps: MapData[];
}

export interface EquipmentDef {
  id: string;
  slot: EquipSlot;
  tier: number;
  nameFr: string;
  nameEn: string;
  descFr: string;
  descEn: string;
  price: number;
  atkBonus: number;
  defBonus: number;
  hpBonus: number;
  critBonus: number;
  speedBonus: number;
  arcaneBonus: number;
  lifesteal?: number;
  slashColor?: string;
  upgradeMat?: string;
}

export interface ItemCatalogDef {
  id: string;
  nameFr: string;
  nameEn: string;
  descFr: string;
  descEn: string;
  category: 'consumable' | 'material' | 'key';
  heal: number;
  price?: number;
  icon: string;
}

export interface BestiaryEntryDef {
  id: string;
  nameFr: string;
  nameEn: string;
  roleFr: string;
  roleEn: string;
  habitatFr: string;
  habitatEn: string;
  loreFr: string;
  loreEn: string;
  baseHp: number;
  baseAtk: number;
  xp: number;
  isBoss?: boolean;
  isPassive?: boolean;
  spriteSize: number;
}

export interface QuestDef {
  id: string;
  act: number;
  isSide?: boolean;
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
  regionFr: string;
  regionEn: string;
  prereqFlag?: string;
  rewardXp: number;
  rewardGold: number;
  rewardItem?: string;
  rewardEquip?: string;
  check: {
    kind: 'flag' | 'map' | 'kill' | 'item' | 'lore_count';
    target: string;
    count?: number;
  };
}

export interface LoreEntryDef {
  id: string;
  chapter: number;
  titleFr: string;
  titleEn: string;
  locationFr: string;
  locationEn: string;
  eraFr: string;
  eraEn: string;
  textFr: string[];
  textEn: string[];
}

export interface PlayerAttributes {
  vitality: number;
  strength: number;
  agility: number;
  arcane: number;
}

export interface PlayerProgress {
  level: number;
  xp: number;
  gold: number;
  hp: number;
  statPoints: number;
  attrs: PlayerAttributes;
  equipped: Record<EquipSlot, string | null>;
  ownedEquip: string[];
  upgrades: Record<string, number>;
  inventory: Record<string, number>;
  flags: Record<string, boolean>;
  kills: Record<string, number>;
  encountered: Record<string, boolean>;
  completedQuests: Record<string, boolean>;
  openedChests: Record<string, boolean>;
  takenMapItems: Record<string, boolean>;
  unlockedLore: Record<string, boolean>;
  visitedMaps: Record<string, boolean>;
  currentMap: string;
  wx: number;
  wy: number;
  dir: Direction;
  playSeconds: number;
}

export interface DialogueChoice {
  labelFr: string;
  labelEn: string;
  action: 'close' | 'open_shop' | 'heal_inn' | 'turn_in_siderite' | 'turn_in_moonflower' | 'turn_in_badge' | 'turn_in_steles';
}

export interface ActiveDialogue {
  speakerFr: string;
  speakerEn: string;
  linesFr: string[];
  linesEn: string[];
  choices?: DialogueChoice[];
  shopType?: 'market' | 'forge' | 'alchemy';
}
