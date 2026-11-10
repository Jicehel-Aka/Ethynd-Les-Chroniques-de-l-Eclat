# Ethynd : Les Chroniques de l'Éclat

RPG d'action-aventure 2D en vue de dessus : un vaste royaume de **11 cartes**, des donjons, un bestiaire de **23 monstres et boss**, une progression d'équipement, des quêtes et un codex de lore. Le jeu existe en plusieurs éditions générées depuis le même code :

| Édition | Pour quoi faire |
|---|---|
| **Application web** | Jouer dans le navigateur, consulter l'atlas des cartes, le bestiaire et les quêtes. |
| **HTML autonome** (`simulation_ethynd.html`, FR et EN) | Un seul fichier, jouable hors ligne par double-clic. |
| **Éditeur de niveaux** (`editeur_niveaux.html`) | Modifier les cartes et exporter `WORLD.BIN` pour la console. |
| **Console Gamebuino AKA** | Firmware ESP32-S3 et fichiers à copier sur la carte microSD. |

## Jouer

- **En ligne** : <https://jicehel-aka.github.io/Ethynd-Les-Chroniques-de-l-Eclat/> (si la page ne s'ouvre pas, active GitHub Pages dans *Settings → Pages → Source : GitHub Actions*).
- **Hors ligne** : télécharge `simulation_ethynd.html` depuis les [Releases](../../releases) ou depuis les artefacts du workflow, puis ouvre-le dans ton navigateur.

## Sur la console Gamebuino AKA

1. Télécharge `ethynd-gamebuino-aka-pack.zip` (Releases ou artefact du workflow).
2. Copie le dossier `ETHYND` (`WORLD.BIN`, `TILESET.565`, `SPRITES.565`) à la racine d'une carte microSD en FAT32.
3. Installe le firmware fourni dans `firmware-bin-esp32s3/firmware.bin`.

| Bouton AKA | Action |
|---|---|
| Croix | Déplacement, navigation dans les dialogues et boutiques |
| A | Coup d'épée, parler, ouvrir un coffre, valider |
| B | Fermer un dialogue ou une boutique |
| X | Onde prismatique d'Astrelya |
| Y | Potion de soin rapide |
| MENU | Sauvegarder (`/ETHYND/SAVE.BIN`) |

Le détail technique de la version console est dans [gamebuino_aka/README_AKA.md](gamebuino_aka/README_AKA.md).

## Développement

```bash
npm install
npm run dev            # serveur local sur http://localhost:3000
npm run build:all      # toutes les éditions (web, html, aka)
npm run verify:world   # vérifie la cohérence du monde
```

Les workflows GitHub Actions qui génèrent les éditions, publient les releases et déploient la page web sont décrits dans [WORKFLOWS_CI.md](WORKFLOWS_CI.md).

## Licence

Création originale de Jicehel (Jean-Charles Lebeau), publiée sous licence **[Creative Commons Attribution - Pas d'Utilisation Commerciale 4.0 (CC BY-NC 4.0)](LICENSE)** : tu peux copier, modifier et partager librement, avec mention de l'auteur, mais pas à des fins commerciales. Le texte complet est dans le fichier [LICENSE](LICENSE). Les bibliothèques et ressources tierces gardent leur propre licence.
