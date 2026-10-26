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

// Flags de progression narrative (alignés à 100 % sur world_expanded.json)
#define FLAG_TALKED_SAGE       (1u << 0) // talked_sage   -> Ouvre Grotte de l'Aube
#define FLAG_ACT1_DONE         (1u << 1) // act1_done     -> Les gardes du Château partent
#define FLAG_TALKED_ROI        (1u << 2) // talked_roi    -> Ouvre Oubliettes Royales
#define FLAG_ACT2_STARTED      (1u << 3) // act2_started  -> Les gardes de Sylvebrume partent
#define FLAG_TALKED_ELOWEN     (1u << 4) // talked_elowen -> Les gardes du Temple partent
#define FLAG_ACT3_DONE         (1u << 5) // act3_done     -> Les gardes de la Crypte partent
#define FLAG_ACT4_DONE         (1u << 6) // act4_done     -> Les gardes des Terres Ardentes partent
#define FLAG_BOSS_PYRAXIS      (1u << 7) // boss_pyraxis  -> Victoire finale
