# Ethynd : Les Chroniques de l'Éclat — Version Console Gamebuino AKA (320×240)

Ce dossier restaure et maintient la **cible matérielle d'origine Gamebuino AKA** (ESP32-S3 · écran TFT `320×240` RGB565 · carte MicroSD) en synchronisation directe avec l'éditeur de niveaux HTML et les 11 cartes du royaume.

## 1. Architecture Matérielle Ciblée
- **Écran** : `320×240` pixels en couleurs 16-bit **RGB565** (`10 × 7,5` tuiles de `32×32 px` à l'échelle native `1:1`, cadence `30 FPS`).
- **Mémoire & Streaming MicroSD** :
  - `/ETHYND/WORLD.BIN` : Archive binaire compacte (`ETHW` v1) regroupant les **11 cartes** (4 couches `L0..L3`), les **masques de collision 1-bit pixel-par-pixel** (`128 octets/tuile`), les passages verrouillés, les gardes de route dynamiques, les coffres complets 2-tuiles et les monstres/boss (dont la nouvelle version 48×48 4-directions de **Morvath, Reine de la Caverne**).
  - `/ETHYND/TILESET.565` : Planche `tileset.png` pré-découpée en blocs contigus de `2048 octets` (`32×32 × 2 octets` RGB565 little-endian, transparence `0xF81F`), permettant un accès `fseek` instantané `O(1)` avec cache LRU en PSRAM/SRAM.
  - `/ETHYND/SPRITES.565` : Banque binaire RGB565 de tous les sprites (Héros, PNJ, Coffres, Objets et les 23 Monstres & Boss).
  - `/ETHYND/SAVE.BIN` : Sauvegarde persistante sur MicroSD.

## 2. Contrôles sur la Console Gamebuino AKA
| Bouton AKA | Action en jeu |
| :--- | :--- |
| **Croix (D-Pad)** | Déplacement 4 directions + navigation dans les dialogues/boutiques |
| **Bouton A** | Coup d'épée · Parler aux PNJ · Ouvrir un coffre · Lire une stèle · Valider |
| **Bouton B** | Fermer un dialogue ou quitter une boutique |
| **Bouton X** | Lancer l'Onde prismatique d'Astrelya |
| **Bouton Y** | Boire une potion de soin rapide |
| **Bouton MENU** | Sauvegarder immédiatement la partie sur `/ETHYND/SAVE.BIN` |

## 3. Générer les fichiers MicroSD après édition d'un niveau
Deux méthodes au choix :
1. **Depuis l'application Web ou l'Atlas** : cliquez sur **« Exporter Pack Gamebuino AKA (.zip) »**. L'archive générée contient à la fois le firmware Arduino/PlatformIO et le dossier `SD_CARD/ETHYND/` (`WORLD.BIN`, `TILESET.565`, `SPRITES.565`) compilé à la volée avec vos dernières modifications de cartes et de sprites !
2. **Depuis l'éditeur HTML autonome (`public/ethynd/editeur_niveaux.html`)** : cliquez sur **« Exporter WORLD.BIN (Gamebuino AKA) »**, ou lancez `python3 gamebuino_aka/tools/pack_aka_sd.py`.

## 4. Compilation & Flash (Arduino IDE ou PlatformIO)
- **Copie MicroSD** : copiez le dossier `ETHYND` à la racine d'une carte MicroSD formatée en FAT32 (`/ETHYND/WORLD.BIN`, `/ETHYND/TILESET.565`, `/ETHYND/SPRITES.565`).
- **PlatformIO** : ouvrez ce dossier `gamebuino_aka/` dans VS Code + PlatformIO et exécutez `pio run -t upload`.
- **Arduino IDE** : ouvrez `ethynd_aka.ino` avec le support **ESP32S3 Dev Module** (PSRAM OPI activée) et la bibliothèque `Gamebuino-AKA` (ou `TFT_eSPI`), puis téléversez.
