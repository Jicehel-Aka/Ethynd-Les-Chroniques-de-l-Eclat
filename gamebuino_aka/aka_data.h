#pragma once
#include <stdint.h>
#include "config_aka.h"

#pragma pack(push, 1)

// En-tête global de /ETHYND/WORLD.BIN ("ETHW" v1)
struct AkaWorldFileHeader {
  char     magic[4];      // "ETHW"
  uint16_t version;       // 1
  uint16_t mapCount;      // 11 régions interconnectées
  uint16_t tileCols;      // 40 colonnes dans tileset.png
  uint16_t maskCount;     // Nombre de masques de collision 1-bit 32x32
};

// Entrée masque de collision 1-bit (128 octets = 32 lignes × 4 octets MSB-first)
struct AkaTileMaskEntry {
  uint16_t tid;
  uint8_t  bits[128];
};

struct AkaDoorDef {
  int16_t  x;
  int16_t  y;
  int16_t  w;
  int16_t  h;
  uint16_t targetMapIdx;
  int16_t  dx;
  int16_t  dy;
  uint16_t reqFlagMask;   // 0 = ouvert, sinon bitmask FLAG_*
  uint16_t reserved[2];
};

struct AkaChestDef {
  uint16_t chestBitIdx;   // Index de sauvegarde (0..63)
  int16_t  x;
  int16_t  y;
  uint16_t gold;
  uint8_t  itemId;
  uint8_t  equipId;
};

struct AkaNpcDef {
  uint8_t  npcType;       // 0=Sage, 1=Roi, 2=Garde, 3=Forgeron, 4=Marchand, 5=Herboriste
  uint8_t  dir;           // 0=Bas, 1=Gauche, 2=Droite, 3=Haut
  int16_t  x;
  int16_t  y;
  uint16_t blockUntilMask;// Si != 0 : garde bloque la route tant que le flag n'est pas acquis, puis part !
  uint8_t  dlgId;
  uint8_t  shopType;      // 0=Aucun, 1=Marché, 2=Forge, 3=Herboristerie
};

struct AkaSpawnDef {
  uint8_t  monsterType;   // Inclut Morvath (reine_caverne 48x48), Malakor, Léviathanis, Vorgath, Pyraxis
  uint8_t  aiKind;        // 0=passive, 1=wander, 2=chase, 3=ranged, 4=boss
  int16_t  x;
  int16_t  y;
  uint16_t hp;
  uint16_t atk;
  uint16_t xp;
  uint16_t gold;
  uint8_t  spriteSize;    // 32, 36, 48 ou 56 px
  uint8_t  bossFlagBit;   // Bit débloqué à la mort du boss
};

struct AkaMapHeader {
  char     name[24];
  uint16_t w;
  uint16_t h;
  uint8_t  bgR;
  uint8_t  bgG;
  uint8_t  bgB;
  uint8_t  musicId;
};

// Sauvegarde persistante sur carte SD (/ETHYND/SAVE.BIN)
struct AkaSaveData {
  char     magic[4];      // "ESAV"
  uint16_t version;       // 1
  uint16_t mapIdx;
  int16_t  wx;
  int16_t  wy;
  uint16_t hp;
  uint16_t maxHp;
  uint16_t level;
  uint32_t xp;
  uint32_t gold;
  uint32_t flags;
  uint64_t openedChests;
  uint8_t  potions;
  uint8_t  weaponTier;
  uint8_t  armorTier;
  uint8_t  checksum;
};

#pragma pack(pop)
