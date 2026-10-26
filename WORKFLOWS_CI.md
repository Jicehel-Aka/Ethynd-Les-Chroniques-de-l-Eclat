# Workflows CI/CD — Génération Automatique des Versions d'Ethynd

Trois workflows GitHub Actions (`.github/workflows/`) permettent de compiler, tester et empaqueter automatiquement toutes les versions d'**Ethynd : Les Chroniques de l'Éclat** à la demande ou lors de vos publications.

---

## 1. Workflow Principal : Toutes les versions + GitHub Release
**Fichier** : `.github/workflows/build-versions.yml`  
**Nom dans GitHub Actions** : `Générer toutes les versions (Web, HTML, Éditeur & Gamebuino AKA)`

### Comment le lancer manuellement :
1. Sur votre dépôt GitHub, ouvrez l'onglet **Actions**.
2. Sélectionnez **`Générer toutes les versions (Web, HTML, Éditeur & Gamebuino AKA)`** dans la colonne de gauche.
3. Cliquez sur le bouton **`Run workflow`** (à droite) :
   - Cochez les versions souhaitées (**Web SPA**, **HTML5 autonome + Éditeur**, **Console Gamebuino AKA** — toutes activées par défaut).
   - *(Optionnel)* Cochez **`Publier automatiquement une GitHub Release`** et indiquez un tag (ex. `v1.0.0`) pour publier toutes les archives directement dans l'onglet **Releases** du dépôt.
4. *(Automatique)* Pousser un tag Git commençant par `v` (`git tag v1.0.0 && git push origin v1.0.0`) déclenche automatiquement ce workflow et publie la Release complète.

### Artefacts générés à chaque exécution :
- `ethynd-1-jeu-html-autonome` : `simulation_ethynd.html` (FR) et `simulation_ethynd_en.html` (EN) — jeu complet monofichier jouable hors-ligne par simple double-clic.
- `ethynd-2-editeur-niveaux-html` : `editeur_niveaux.html` — éditeur de niveaux HTML5 autonome (palette par thème, aperçu de forme des tuiles, auto-tiling des forêts, export JSON & `WORLD.BIN`).
- `ethynd-3-console-gamebuino-aka` : `ethynd-gamebuino-aka-pack.zip` réunissant :
  - `SD_CARD/ETHYND/WORLD.BIN`, `TILESET.565` et `SPRITES.565` (prêts à copier sur carte MicroSD FAT32),
  - `firmware-bin-esp32s3/firmware.bin` & `firmware.elf` (compilés automatiquement via PlatformIO pour l'ESP32-S3),
  - `firmware/ethynd_aka/` (code source C++/Arduino/PlatformIO complet).
- `ethynd-4-application-web-spa` : `ethynd-web-spa.zip` — build Vite complet prêt à héberger sur n'importe quel serveur web statique.

---

## 2. Déploiement Automatique sur GitHub Pages
**Fichier** : `.github/workflows/deploy-github-pages.yml`  
**Nom dans GitHub Actions** : `Déployer sur GitHub Pages (Jeu Web, Éditeur HTML & Packs)`

### Activation initiale unique dans GitHub (obligatoire la 1re fois) :
Par sécurité, GitHub interdit au jeton automatique `GITHUB_TOKEN` d'initialiser GitHub Pages sur un dépôt où Pages n'a jamais été activé :
1. Vérifiez que le dépôt est **Public** *(requis sur les comptes GitHub gratuits pour disposer de GitHub Pages)*.
2. Ouvrez l'onglet **Settings** de votre dépôt → menu **Pages** (colonne de gauche).
3. Sous **Build and deployment → Source**, remplacez *Deploy from a branch* par **`GitHub Actions`** *(l'enregistrement est immédiat)*.

### Fonctionnement :
- Se lance automatiquement à chaque `push` sur `main` ou manuellement via **`Run workflow`**.
- **Si GitHub Pages n'est pas encore activé**, le workflow ne plante plus : il compile et valide tout de même toutes les éditions, dépose le site prêt à héberger dans l'artefact `ethynd-site-web-pret-a-publier`, et affiche un rappel d'activation dans le résumé de l'exécution.
- **Une fois activé**, votre site est publié automatiquement sur `https://<votre-compte>.github.io/<votre-depot>/` :
  - `/` : Application Web complète (Jeu, Atlas des 11 cartes, Bestiaire, Quêtes, Suite de tests),
  - `/releases/simulation_ethynd.html` : Jeu HTML5 monofichier autonome,
  - `/releases/editeur_niveaux.html` : Éditeur de niveaux HTML5 autonome,
  - `/releases/ethynd-gamebuino-aka-pack.zip` : Pack MicroSD + Sources Gamebuino AKA.

---

## 3. Workflow Dédié Console Gamebuino AKA
**Fichier** : `.github/workflows/build-gamebuino-aka.yml`  
**Nom dans GitHub Actions** : `Compiler Console Gamebuino AKA (Firmware ESP32-S3 & MicroSD)`

- Se lance manuellement via **`Run workflow`** ou automatiquement dès que vous modifiez `gamebuino_aka/**`, `public/ethynd/world_expanded.json` ou `public/ethynd/tileset.png`.
- Recompile le firmware ESP32-S3 (`firmware.bin`) sous PlatformIO et régénère les binaires MicroSD RGB565 (`WORLD.BIN`, `TILESET.565`, `SPRITES.565`).

---

## 4. Commandes Locales Équivalentes (Ligne de commande)
Vous pouvez générer exactement les mêmes versions en local dans le dossier `release-builds/` :

```bash
# Exécuter uniquement la suite de tests automatisés des 5 Actes (sans écriture disque)
npm run verify:world

# Générer toutes les versions d'un seul coup (HTML autonome + Éditeur + Pack AKA + Web SPA)
npm run build:all

# Ou générer une édition spécifique :
npm run build:html   # -> simulation_ethynd.html + editeur_niveaux.html
npm run build:aka    # -> SD_CARD/ETHYND/{WORLD.BIN,TILESET.565,SPRITES.565} + .zip
npm run build:web    # -> dist/ + ethynd-web-spa.zip
```
