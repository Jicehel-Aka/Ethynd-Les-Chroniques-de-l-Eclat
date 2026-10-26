#pragma once
#include <stdint.h>

// ============================================================================
// ETHYND : LES CHRONIQUES DE L'ÉCLAT — CIBLE CONSOLE GAMEBUINO AKA (ESP32-S3)
// Résolution matérielle native : 320×240 RGB565 (10×7.5 tuiles de 32×32 px)
// ============================================================================

#define AKA_SCREEN_W       320
#define AKA_SCREEN_H       240
#define AKA_TILE_SIZE      32
#define AKA_FPS            30
#define AKA_FRAME_MS       (1000 / AKA_FPS)

// Couleur clé de transparence RGB565 (Magenta pur #FF00FF -> 0xF81F)
#define AKA_TRANSPARENT_565 0xF81F

// Chemins MicroSD (FAT32)
#define AKA_SD_DIR         "/ETHYND"
#define AKA_PATH_WORLD     "/ETHYND/WORLD.BIN"
#define AKA_PATH_TILESET   "/ETHYND/TILESET.565"
#define AKA_PATH_SPRITES   "/ETHYND/SPRITES.565"
#define AKA_PATH_SAVE      "/ETHYND/SAVE.BIN"

// Cache SRAM/PSRAM de tuiles 32x32 RGB565 (2048 octets par tuile)
#define AKA_TILE_CACHE_SLOTS 192
#define AKA_TILE_BYTES       (AKA_TILE_SIZE * AKA_TILE_SIZE * 2)

// Masque binaire des boutons Gamebuino AKA
#define AKA_BTN_UP     (1 << 0)
#define AKA_BTN_DOWN   (1 << 1)
#define AKA_BTN_LEFT   (1 << 2)
#define AKA_BTN_RIGHT  (1 << 3)
#define AKA_BTN_A      (1 << 4) // Épée / Parler / Ouvrir coffre / Valider
#define AKA_BTN_B      (1 << 5) // Retour / Fermer dialogue ou boutique
#define AKA_BTN_X      (1 << 6) // Onde prismatique d'Astrelya
#define AKA_BTN_Y      (1 << 7) // Potion rapide
#define AKA_BTN_MENU   (1 << 8) // Inventaire & Sauvegarde SD

// Flags de progression narrative (identiques à la version Web / world_expanded.json)
#define FLAG_MET_SAGE          (1u << 0)
#define FLAG_BOSS_GROTTE       (1u << 1) // Morvath vaincue -> Ouvre Château
#define FLAG_SPOKE_KING        (1u << 2) // Audience Roi Édouard IV -> Ouvre Oubliettes
#define FLAG_BOSS_CHATEAU      (1u << 3) // Sire Malakor vaincu -> Ouvre Forêt de Sylvebrume
#define FLAG_BOSS_TEMPLE       (1u << 4) // Léviathanis vaincu -> Ouvre Crypte
#define FLAG_BOSS_CRYPTE       (1u << 5) // Archiliche Vorgath vaincue -> Ouvre Terres Ardentes
#define FLAG_BOSS_CITADELLE    (1u << 6) // Pyraxis vaincu -> Aube Éternelle
