/*
 * ============================================================================
 * ETHYND : LES CHRONIQUES DE L'ÉCLAT — VERSION NATIVE GAMEBUINO AKA
 * Cible : Console portable Gamebuino AKA (ESP32-S3 · TFT 320×240 RGB565 · SD)
 * Auteur : Jean-Charles Lebeau (jicehel) — Architecture Action-RPG 16-bit
 * ============================================================================
 * Contrôles Gamebuino AKA :
 *   - Croix directionnelle (D-Pad) : Déplacer le héros (1:1 en tuiles 32×32)
 *   - Bouton A : Coup d'épée / Parler aux PNJ / Ouvrir coffre / Valider
 *   - Bouton B : Fermer dialogue / Quitter boutique
 *   - Bouton X : Onde prismatique d'Astrelya
 *   - Bouton Y : Boire une potion de soin
 *   - Bouton MENU : Sauvegarder la progression sur /ETHYND/SAVE.BIN
 */

#include <Arduino.h>
#include <SPI.h>
#include <SD.h>
#include "config_aka.h"
#include "aka_data.h"

// Si la bibliothèque officielle Gamebuino AKA est installée, elle fournit l'accès
// direct au framebuffer DMA 320×240 RGB565 et au registre des boutons.
#if __has_include(<Gamebuino-AKA.h>)
  #include <Gamebuino-AKA.h>
  #define HAS_NATIVE_AKA_LIB 1
#else
  #include <TFT_eSPI.h>
  TFT_eSPI tft = TFT_eSPI();
  #define HAS_NATIVE_AKA_LIB 0
#endif

struct TileCacheSlot {
  int32_t  tid;
  uint32_t lastUsed;
  uint16_t pixels[AKA_TILE_SIZE * AKA_TILE_SIZE];
};

static File worldFile;
static File tilesetFile;
static AkaWorldFileHeader worldHdr;
static AkaTileMaskEntry* tileMasks = nullptr;
static TileCacheSlot* tileCache = nullptr;
static uint32_t cacheClock = 1;

// Framebuffer 320×240 RGB565 (153 600 octets en PSRAM / SRAM ESP32-S3)
static uint16_t* frameBuf = nullptr;

// Carte active en mémoire (jusqu'à 90×90 × 4 couches × 2 octets = 64.8 Ko)
static AkaMapHeader curMapHdr;
static uint32_t mapFileOffsets[16];
static int16_t* mapLayers[4] = { nullptr, nullptr, nullptr, nullptr };
static AkaDoorDef curDoors[12];
static uint16_t curDoorCount = 0;
static AkaChestDef curChests[16];
static uint16_t curChestCount = 0;
static AkaNpcDef curNpcs[16];
static uint16_t curNpcCount = 0;
static AkaSpawnDef curSpawns[32];
static uint16_t curSpawnCount = 0;

struct LiveMob {
  bool     alive;
  uint8_t  type;
  uint8_t  ai;
  uint8_t  size;
  uint8_t  bossFlagBit;
  float    wx, wy;
  int16_t  hp, maxHp, atk;
  uint16_t xp, gold;
  uint8_t  dir;
  uint8_t  hurtTicks;
};
static LiveMob liveMobs[32];

// État du joueur
static AkaSaveData playerState;
static uint8_t playerDir = 0;
static uint8_t attackTicks = 0;
static uint8_t skillCooldown = 0;
static uint8_t hurtImmunity = 0;
static const char* bannerToast = nullptr;
static uint8_t bannerTicks = 0;

static inline uint16_t rgb888To565(uint8_t r, uint8_t g, uint8_t b) {
  return ((uint16_t)(r & 0xF8) << 8) | ((uint16_t)(g & 0xFC) << 3) | (b >> 3);
}

// Lecture d'une tuile 32×32 RGB565 depuis /ETHYND/TILESET.565 avec cache LRU
static const uint16_t* getTilePixels565(int16_t tid) {
  if (tid < 0) return nullptr;
  int emptyIdx = -1;
  int oldestIdx = 0;
  uint32_t oldestTick = 0xFFFFFFFFu;

  for (int i = 0; i < AKA_TILE_CACHE_SLOTS; i++) {
    if (tileCache[i].tid == tid) {
      tileCache[i].lastUsed = ++cacheClock;
      return tileCache[i].pixels;
    }
    if (tileCache[i].tid < 0 && emptyIdx < 0) emptyIdx = i;
    if (tileCache[i].lastUsed < oldestTick) {
      oldestTick = tileCache[i].lastUsed;
      oldestIdx = i;
    }
  }

  int slot = (emptyIdx >= 0) ? emptyIdx : oldestIdx;
  tileCache[slot].tid = tid;
  tileCache[slot].lastUsed = ++cacheClock;

  // Format TILESET.565 : en-tête 8 octets ("ET56" + count + reserved), puis blocs contigus de 2048 octets
  uint32_t offset = 8u + (uint32_t)tid * AKA_TILE_BYTES;
  if (tilesetFile && tilesetFile.seek(offset)) {
    tilesetFile.read((uint8_t*)tileCache[slot].pixels, AKA_TILE_BYTES);
  }
  return tileCache[slot].pixels;
}

static void blitTile565(int16_t tid, int screenX, int screenY) {
  if (screenX <= -AKA_TILE_SIZE || screenY <= -AKA_TILE_SIZE ||
      screenX >= AKA_SCREEN_W || screenY >= AKA_SCREEN_H) {
    return;
  }
  const uint16_t* src = getTilePixels565(tid);
  if (!src) return;

  int x0 = screenX < 0 ? -screenX : 0;
  int y0 = screenY < 0 ? -screenY : 0;
  int x1 = (screenX + AKA_TILE_SIZE > AKA_SCREEN_W) ? (AKA_SCREEN_W - screenX) : AKA_TILE_SIZE;
  int y1 = (screenY + AKA_TILE_SIZE > AKA_SCREEN_H) ? (AKA_SCREEN_H - screenY) : AKA_TILE_SIZE;

  for (int ty = y0; ty < y1; ty++) {
    uint16_t* dstRow = &frameBuf[(screenY + ty) * AKA_SCREEN_W + screenX];
    const uint16_t* srcRow = &src[ty * AKA_TILE_SIZE];
    for (int tx = x0; tx < x1; tx++) {
      uint16_t px = srcRow[tx];
      if (px != AKA_TRANSPARENT_565) {
        dstRow[tx] = px;
      }
    }
  }
}

static void fillRect565(int x, int y, int w, int h, uint16_t col) {
  int x0 = max(0, x), y0 = max(0, y);
  int x1 = min(AKA_SCREEN_W, x + w), y1 = min(AKA_SCREEN_H, y + h);
  for (int py = y0; py < y1; py++) {
    uint16_t* row = &frameBuf[py * AKA_SCREEN_W];
    for (int px = x0; px < x1; px++) row[px] = col;
  }
}

// Collision pixel-par-pixel 1-bit identique au moteur Web (maskHitsRect)
static const uint8_t* findMaskBits(int16_t tid) {
  if (tid < 0 || !tileMasks) return nullptr;
  int lo = 0, hi = (int)worldHdr.maskCount - 1;
  while (lo <= hi) {
    int mid = (lo + hi) >> 1;
    if (tileMasks[mid].tid == (uint16_t)tid) return tileMasks[mid].bits;
    if (tileMasks[mid].tid < (uint16_t)tid) lo = mid + 1;
    else hi = mid - 1;
  }
  return nullptr;
}

static bool maskHitsRect(const uint8_t* bits, int rx, int ry, int rw, int rh) {
  int x0 = max(0, rx), y0 = max(0, ry);
  int x1 = min(32, rx + rw), y1 = min(32, ry + rh);
  for (int y = y0; y < y1; y++) {
    int rowOff = y * 4;
    for (int x = x0; x < x1; x++) {
      if ((bits[rowOff + (x >> 3)] >> (7 - (x & 7))) & 1) return true;
    }
  }
  return false;
}

static inline bool isAkaNpcPresent(const AkaNpcDef& n) {
  return !(n.blockUntilMask != 0 && (playerState.flags & n.blockUntilMask) != 0);
}

static bool collidesWorld(int rx, int ry, int rw, int rh) {
  if (rx < 0 || ry < 0 || rx + rw > curMapHdr.w * 32 || ry + rh > curMapHdr.h * 32) return true;
  int tx0 = rx / 32, tx1 = (rx + rw - 1) / 32;
  int ty0 = ry / 32, ty1 = (ry + rh - 1) / 32;

  for (int ty = ty0; ty <= ty1; ty++) {
    for (int tx = tx0; tx <= tx1; tx++) {
      int idx = ty * curMapHdr.w + tx;
      for (int l = 0; l < 3; l++) {
        const uint8_t* bits = findMaskBits(mapLayers[l][idx]);
        if (bits && maskHitsRect(bits, rx - tx * 32, ry - ty * 32, rw, rh)) return true;
      }
    }
  }

  // Gardes bloquant les routes fermées (disparaissent dès que le flag est débloqué !)
  for (uint16_t i = 0; i < curNpcCount; i++) {
    const AkaNpcDef& n = curNpcs[i];
    if (!isAkaNpcPresent(n)) continue;
    if (rx < n.x + 28 && rx + rw > n.x + 2 && ry < n.y + 30 && ry + rh > n.y + 4) return true;
  }
  return false;
}

static bool loadMapByIndex(uint16_t mapIdx) {
  if (!worldFile || mapIdx >= worldHdr.mapCount) return false;
  worldFile.seek(mapFileOffsets[mapIdx]);
  worldFile.read((uint8_t*)&curMapHdr, sizeof(AkaMapHeader));

  size_t cellCount = (size_t)curMapHdr.w * (size_t)curMapHdr.h;
  for (int l = 0; l < 4; l++) {
    if (mapLayers[l]) free(mapLayers[l]);
    mapLayers[l] = (int16_t*)ps_malloc(cellCount * sizeof(int16_t));
    if (!mapLayers[l]) mapLayers[l] = (int16_t*)malloc(cellCount * sizeof(int16_t));
    worldFile.read((uint8_t*)mapLayers[l], cellCount * sizeof(int16_t));
  }

  worldFile.read((uint8_t*)&curDoorCount, 2);
  curDoorCount = min<uint16_t>(curDoorCount, 12);
  worldFile.read((uint8_t*)curDoors, curDoorCount * sizeof(AkaDoorDef));

  worldFile.read((uint8_t*)&curChestCount, 2);
  curChestCount = min<uint16_t>(curChestCount, 16);
  worldFile.read((uint8_t*)curChests, curChestCount * sizeof(AkaChestDef));

  worldFile.read((uint8_t*)&curNpcCount, 2);
  curNpcCount = min<uint16_t>(curNpcCount, 16);
  worldFile.read((uint8_t*)curNpcs, curNpcCount * sizeof(AkaNpcDef));

  worldFile.read((uint8_t*)&curSpawnCount, 2);
  curSpawnCount = min<uint16_t>(curSpawnCount, 32);
  worldFile.read((uint8_t*)curSpawns, curSpawnCount * sizeof(AkaSpawnDef));

  for (uint16_t i = 0; i < curSpawnCount; i++) {
    const AkaSpawnDef& sp = curSpawns[i];
    bool defeatedBoss = (sp.aiKind == 4 && sp.bossFlagBit > 0 && (playerState.flags & (1u << sp.bossFlagBit)));
    liveMobs[i] = {
      !defeatedBoss, sp.monsterType, sp.aiKind, sp.spriteSize, sp.bossFlagBit,
      (float)sp.x, (float)sp.y, (int16_t)sp.hp, (int16_t)sp.hp, (int16_t)sp.atk,
      sp.xp, sp.gold, 0, 0
    };
  }
  playerState.mapIdx = mapIdx;
  return true;
}

static bool indexWorldArchive() {
  worldFile = SD.open(AKA_PATH_WORLD, FILE_READ);
  tilesetFile = SD.open(AKA_PATH_TILESET, FILE_READ);
  if (!worldFile || !tilesetFile) return false;

  worldFile.read((uint8_t*)&worldHdr, sizeof(AkaWorldFileHeader));
  if (strncmp(worldHdr.magic, "ETHW", 4) != 0) return false;

  tileMasks = (AkaTileMaskEntry*)ps_malloc(worldHdr.maskCount * sizeof(AkaTileMaskEntry));
  if (!tileMasks) tileMasks = (AkaTileMaskEntry*)malloc(worldHdr.maskCount * sizeof(AkaTileMaskEntry));
  worldFile.read((uint8_t*)tileMasks, worldHdr.maskCount * sizeof(AkaTileMaskEntry));

  for (uint16_t i = 0; i < worldHdr.mapCount && i < 16; i++) {
    mapFileOffsets[i] = worldFile.position();
    AkaMapHeader mh;
    worldFile.read((uint8_t*)&mh, sizeof(AkaMapHeader));
    worldFile.seek(worldFile.position() + (uint32_t)mh.w * mh.h * 4 * 2);
    uint16_t cnt = 0;
    worldFile.read((uint8_t*)&cnt, 2); worldFile.seek(worldFile.position() + cnt * sizeof(AkaDoorDef));
    worldFile.read((uint8_t*)&cnt, 2); worldFile.seek(worldFile.position() + cnt * sizeof(AkaChestDef));
    worldFile.read((uint8_t*)&cnt, 2); worldFile.seek(worldFile.position() + cnt * sizeof(AkaNpcDef));
    worldFile.read((uint8_t*)&cnt, 2); worldFile.seek(worldFile.position() + cnt * sizeof(AkaSpawnDef));
  }
  return true;
}

static void saveGameToSd() {
  File f = SD.open(AKA_PATH_SAVE, FILE_WRITE);
  if (!f) return;
  memcpy(playerState.magic, "ESAV", 4);
  playerState.version = 1;
  f.write((const uint8_t*)&playerState, sizeof(AkaSaveData));
  f.close();
  bannerToast = "Sauvegarde SD effectuee !";
  bannerTicks = 45;
}

static uint16_t readAkaButtons() {
  uint16_t mask = 0;
#if HAS_NATIVE_AKA_LIB
  if (gb.buttons.repeat(BUTTON_UP, 0))    mask |= AKA_BTN_UP;
  if (gb.buttons.repeat(BUTTON_DOWN, 0))  mask |= AKA_BTN_DOWN;
  if (gb.buttons.repeat(BUTTON_LEFT, 0))  mask |= AKA_BTN_LEFT;
  if (gb.buttons.repeat(BUTTON_RIGHT, 0)) mask |= AKA_BTN_RIGHT;
  if (gb.buttons.pressed(BUTTON_A))       mask |= AKA_BTN_A;
  if (gb.buttons.pressed(BUTTON_B))       mask |= AKA_BTN_B;
  if (gb.buttons.pressed(BUTTON_X))       mask |= AKA_BTN_X;
  if (gb.buttons.pressed(BUTTON_Y))       mask |= AKA_BTN_Y;
  if (gb.buttons.pressed(BUTTON_MENU))    mask |= AKA_BTN_MENU;
#endif
  return mask;
}

static void updateGameTick(uint16_t btns) {
  int dx = 0, dy = 0;
  const int speed = 4;
  if (btns & AKA_BTN_UP)    { dy = -speed; playerDir = 3; }
  if (btns & AKA_BTN_DOWN)  { dy =  speed; playerDir = 0; }
  if (btns & AKA_BTN_LEFT)  { dx = -speed; playerDir = 1; }
  if (btns & AKA_BTN_RIGHT) { dx =  speed; playerDir = 2; }

  if (dx != 0 && !collidesWorld(playerState.wx + dx - 8, playerState.wy - 6, 16, 14)) {
    playerState.wx += dx;
  }
  if (dy != 0 && !collidesWorld(playerState.wx - 8, playerState.wy + dy - 6, 16, 14)) {
    playerState.wy += dy;
  }

  // Passages inter-cartes (11 régions)
  for (uint16_t i = 0; i < curDoorCount; i++) {
    const AkaDoorDef& d = curDoors[i];
    if (playerState.wx >= d.x && playerState.wx <= d.x + d.w &&
        playerState.wy >= d.y && playerState.wy <= d.y + d.h) {
      if (d.reqFlagMask != 0 && (playerState.flags & d.reqFlagMask) == 0) {
        bannerToast = "Passage scelle par la Garde";
        bannerTicks = 35;
      } else {
        int16_t destX = d.dx, destY = d.dy;
        loadMapByIndex(d.targetMapIdx);
        playerState.wx = destX;
        playerState.wy = destY;
        return;
      }
    }
  }

  // Combat à l'épée & Coffres [Bouton A]
  if ((btns & AKA_BTN_A) && attackTicks == 0) {
    attackTicks = 8;
    // Ouverture de coffre proche
    for (uint16_t i = 0; i < curChestCount; i++) {
      const AkaChestDef& c = curChests[i];
      uint64_t bit = (1ULL << c.chestBitIdx);
      if ((playerState.openedChests & bit) == 0 &&
          abs(playerState.wx - (c.x + 16)) < 28 && abs(playerState.wy - (c.y + 16)) < 28) {
        playerState.openedChests |= bit;
        playerState.gold += c.gold;
        if (c.itemId == 1) playerState.potions++;
        bannerToast = "Coffre ouvert !";
        bannerTicks = 45;
      }
    }

    // Dialogue PNJ proche (déverrouille aussi les passages associés)
    for (uint16_t i = 0; i < curNpcCount; i++) {
      const AkaNpcDef& n = curNpcs[i];
      if (!isAkaNpcPresent(n)) continue;
      if (abs(playerState.wx - (n.x + 16)) < 34 && abs(playerState.wy - (n.y + 16)) < 34) {
        if (n.dlgId == 1) {
          playerState.flags |= FLAG_TALKED_SAGE;
          playerState.hp = playerState.maxHp;
          bannerToast = "Aldric: Escalier de la Grotte ouvert !";
          bannerTicks = 60;
        } else if (n.dlgId == 2) {
          playerState.flags |= FLAG_TALKED_ROI;
          playerState.hp = playerState.maxHp;
          bannerToast = "Roi Edouard IV: Oubliettes ouvertes !";
          bannerTicks = 60;
        } else if (n.dlgId == 3) {
          playerState.flags |= FLAG_TALKED_ELOWEN;
          playerState.hp = playerState.maxHp;
          bannerToast = "Elowen: Barrage du Temple leve !";
          bannerTicks = 60;
        } else if (n.blockUntilMask != 0) {
          bannerToast = "Halte ! Ce passage est scelle.";
          bannerTicks = 45;
        }
      }
    }

    // Frappe sur les monstres à portée
    int sx = playerState.wx + (playerDir == 1 ? -22 : playerDir == 2 ? 22 : 0);
    int sy = playerState.wy + (playerDir == 3 ? -22 : playerDir == 0 ? 22 : 0);
    int dmg = 10 + playerState.level * 3 + playerState.weaponTier * 6;
    for (uint16_t i = 0; i < curSpawnCount; i++) {
      LiveMob& m = liveMobs[i];
      if (!m.alive || m.ai == 0) continue;
      int cx = (int)m.wx + m.size / 2;
      int cy = (int)m.wy + m.size / 2;
      if (abs(sx - cx) < m.size / 2 + 16 && abs(sy - cy) < m.size / 2 + 16) {
        m.hp -= dmg;
        m.hurtTicks = 6;
        if (m.hp <= 0) {
          m.alive = false;
          playerState.xp += m.xp;
          playerState.gold += m.gold;
          if (m.bossFlagBit > 0) {
            playerState.flags |= (1u << m.bossFlagBit);
            bannerToast = "Boss vaincu ! Eclat obtenu !";
            bannerTicks = 75;
          }
        }
      }
    }
  }

  // Potion rapide [Bouton Y]
  if ((btns & AKA_BTN_Y) && playerState.potions > 0 && playerState.hp < playerState.maxHp) {
    playerState.potions--;
    playerState.hp = min<uint16_t>(playerState.maxHp, playerState.hp + 45);
    bannerToast = "+45 PV (Potion)";
    bannerTicks = 30;
  }

  // Sauvegarde MicroSD [Bouton MENU]
  if (btns & AKA_BTN_MENU) {
    saveGameToSd();
  }

  if (attackTicks > 0) attackTicks--;
  if (skillCooldown > 0) skillCooldown--;
  if (hurtImmunity > 0) hurtImmunity--;
  if (bannerTicks > 0) bannerTicks--;

  // IA des monstres (poursuite + dégâts)
  for (uint16_t i = 0; i < curSpawnCount; i++) {
    LiveMob& m = liveMobs[i];
    if (!m.alive) continue;
    if (m.hurtTicks > 0) m.hurtTicks--;
    if (m.ai >= 2) {
      float vx = playerState.wx - (m.wx + m.size * 0.5f);
      float vy = playerState.wy - (m.wy + m.size * 0.5f);
      float dist = sqrtf(vx * vx + vy * vy);
      if (dist > 6.0f && dist < 170.0f) {
        m.wx += (vx / dist) * 1.6f;
        m.wy += (vy / dist) * 1.6f;
      }
      if (dist < m.size * 0.45f && hurtImmunity == 0) {
        int hit = max(1, (int)m.atk - (int)playerState.armorTier * 3);
        playerState.hp = (playerState.hp > hit) ? (playerState.hp - hit) : 1;
        hurtImmunity = 22;
      }
    }
  }
}

static void renderAkaFrame() {
  uint16_t bg565 = rgb888To565(curMapHdr.bgR, curMapHdr.bgG, curMapHdr.bgB);
  fillRect565(0, 0, AKA_SCREEN_W, AKA_SCREEN_H, bg565);

  int mapPxW = curMapHdr.w * AKA_TILE_SIZE;
  int mapPxH = curMapHdr.h * AKA_TILE_SIZE;
  int ox = AKA_SCREEN_W / 2 - playerState.wx;
  int oy = AKA_SCREEN_H / 2 - playerState.wy;
  ox = (mapPxW <= AKA_SCREEN_W) ? (AKA_SCREEN_W - mapPxW) / 2 : constrain(ox, AKA_SCREEN_W - mapPxW, 0);
  oy = (mapPxH <= AKA_SCREEN_H) ? (AKA_SCREEN_H - mapPxH) / 2 : constrain(oy, AKA_SCREEN_H - mapPxH, 0);

  int tx0 = max(0, -ox / AKA_TILE_SIZE);
  int tx1 = min((int)curMapHdr.w - 1, (AKA_SCREEN_W - ox) / AKA_TILE_SIZE);
  int ty0 = max(0, -oy / AKA_TILE_SIZE);
  int ty1 = min((int)curMapHdr.h - 1, (AKA_SCREEN_H - oy) / AKA_TILE_SIZE);

  // Couches 0..2
  for (int ty = ty0; ty <= ty1; ty++) {
    int sy = oy + ty * AKA_TILE_SIZE;
    for (int tx = tx0; tx <= tx1; tx++) {
      int sx = ox + tx * AKA_TILE_SIZE;
      int cell = ty * curMapHdr.w + tx;
      for (int l = 0; l <= 2; l++) {
        int16_t tid = mapLayers[l][cell];
        if (tid >= 0) blitTile565(tid, sx, sy);
      }
    }
  }

  // Coffres complets 2 tuiles (2569+2570 fermés, 2571+2572 ouverts)
  for (uint16_t i = 0; i < curChestCount; i++) {
    const AkaChestDef& c = curChests[i];
    bool opened = (playerState.openedChests & (1ULL << c.chestBitIdx)) != 0;
    blitTile565(opened ? 2571 : 2569, ox + c.x - 4, oy + c.y);
    blitTile565(opened ? 2572 : 2570, ox + c.x + 28, oy + c.y);
  }

  // PNJ & Gardes de barrage (disparaissent automatiquement dès que le passage est ouvert)
  for (uint16_t i = 0; i < curNpcCount; i++) {
    const AkaNpcDef& n = curNpcs[i];
    if (!isAkaNpcPresent(n)) continue;
    uint16_t npcCol = (n.blockUntilMask != 0) ? 0x9CF3 : 0x3DDF;
    fillRect565(ox + n.x + 6, oy + n.y + 4, 20, 26, npcCol);
  }

  // Monstres & Boss
  for (uint16_t i = 0; i < curSpawnCount; i++) {
    const LiveMob& m = liveMobs[i];
    if (!m.alive) continue;
    uint16_t col = (m.ai == 4) ? 0xC81F : 0xF986;
    fillRect565(ox + (int)m.wx + 4, oy + (int)m.wy + 4, m.size - 8, m.size - 8, col);
  }

  // Héros (16×22 centré)
  if ((hurtImmunity & 2) == 0) {
    fillRect565(ox + playerState.wx - 8, oy + playerState.wy - 16, 16, 22, 0xFFE0);
  }

  // Couche supérieure 3 (Canopée des arbres & hauts de toits/statues)
  for (int ty = ty0; ty <= ty1; ty++) {
    int sy = oy + ty * AKA_TILE_SIZE;
    for (int tx = tx0; tx <= tx1; tx++) {
      int16_t tid = mapLayers[3][ty * curMapHdr.w + tx];
      if (tid >= 0) blitTile565(tid, ox + tx * AKA_TILE_SIZE, sy);
    }
  }

  // Barre HUD compacte Gamebuino AKA en haut de l'écran (320×14 px)
  fillRect565(0, 0, AKA_SCREEN_W, 14, 0x0862);
  int hpBarW = (int)((uint32_t)playerState.hp * 80u / max<uint16_t>(1, playerState.maxHp));
  fillRect565(6, 3, 80, 8, 0x2124);
  fillRect565(6, 3, hpBarW, 8, 0x2668);

#if HAS_NATIVE_AKA_LIB
  memcpy(gb.display._buffer, frameBuf, AKA_SCREEN_W * AKA_SCREEN_H * 2);
#else
  tft.pushImage(0, 0, AKA_SCREEN_W, AKA_SCREEN_H, frameBuf);
#endif
}

void setup() {
  Serial.begin(115200);
#if HAS_NATIVE_AKA_LIB
  gb.begin();
#else
  tft.init();
  tft.setRotation(1);
#endif

  frameBuf = (uint16_t*)ps_malloc(AKA_SCREEN_W * AKA_SCREEN_H * sizeof(uint16_t));
  if (!frameBuf) frameBuf = (uint16_t*)malloc(AKA_SCREEN_W * AKA_SCREEN_H * sizeof(uint16_t));

  tileCache = (TileCacheSlot*)ps_malloc(AKA_TILE_CACHE_SLOTS * sizeof(TileCacheSlot));
  if (!tileCache) tileCache = (TileCacheSlot*)malloc(AKA_TILE_CACHE_SLOTS * sizeof(TileCacheSlot));
  for (int i = 0; i < AKA_TILE_CACHE_SLOTS; i++) tileCache[i].tid = -1;

  SD.begin();
  playerState = { {'E','S','A','V'}, 1, 0, 306, 160, 85, 85, 1, 0, 40, 0u, 0ULL, 3, 1, 1, 0 };

  if (SD.exists(AKA_PATH_SAVE)) {
    File sf = SD.open(AKA_PATH_SAVE, FILE_READ);
    if (sf && sf.size() == sizeof(AkaSaveData)) {
      sf.read((uint8_t*)&playerState, sizeof(AkaSaveData));
    }
    if (sf) sf.close();
  }

  if (indexWorldArchive()) {
    loadMapByIndex(playerState.mapIdx);
  }
}

void loop() {
  static uint32_t lastFrameMs = 0;
  uint32_t now = millis();
  if (now - lastFrameMs < AKA_FRAME_MS) return;
  lastFrameMs = now;

#if HAS_NATIVE_AKA_LIB
  gb.update();
#endif
  uint16_t btns = readAkaButtons();
  updateGameTick(btns);
  renderAkaFrame();
}
