#!/usr/bin/env tsx
/**
 * ============================================================================
 * ETHYND : LES CHRONIQUES DE L'ÉCLAT — GÉNÉRATEUR AUTOMATIQUE MULTI-VERSIONS
 * ============================================================================
 * Génère et vérifie automatiquement toutes les éditions du jeu :
 *   1. Audit & Suite de tests automatisés des 5 Actes (--target=verify)
 *   2. Simulation HTML5 autonome monofichier FR & EN (--target=html)
 *   3. Éditeur de niveaux HTML5 autonome monofichier (--target=html)
 *   4. Pack Console Gamebuino AKA : MicroSD (WORLD.BIN, TILESET.565, SPRITES.565)
 *      + Sources Arduino/PlatformIO + Firmware ESP32-S3 compilé si présent (--target=aka)
 *   5. Application Web complète SPA prête pour GitHub Pages / serveur statique (--target=web)
 *
 * Usage :
 *   npx tsx scripts/build-editions.ts --target=all
 */

import { REPO_ROOT } from './register-headless';
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  buildAkaSprites565,
  buildAkaTileset565,
  buildAkaWorldBinary,
  buildZipBytes,
} from '../src/game/akaBinaryCore';
import { createInitialProgress } from '../src/game/content';
import { exportStandaloneEditorHtml } from '../src/game/editorHtmlExporter';
import { buildStandaloneSimulationHtmlDocument } from '../src/game/htmlExporter';
import { loadSpriteBank } from '../src/game/spriteBank';
import { runFullAutomatedSuite } from '../src/game/testSuite';
import { WorldBundle } from '../src/game/types';

type BuildTarget = 'all' | 'verify' | 'html' | 'aka' | 'web';

interface ArtifactEntry {
  edition: string;
  relativePath: string;
  sizeBytes: number;
  sha256: string;
}

function parseArgs(): { target: BuildTarget; outDir: string; syncPublicEditor: boolean } {
  let target: BuildTarget = 'all';
  let outDir = path.join(REPO_ROOT, 'release-builds');
  let syncPublicEditor = false;

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--target=')) {
      const val = arg.slice('--target='.length) as BuildTarget;
      if (['all', 'verify', 'html', 'aka', 'web'].includes(val)) {
        target = val;
      } else {
        throw new Error(`Cible inconnue "${val}". Valeurs acceptées : all, verify, html, aka, web`);
      }
    } else if (arg.startsWith('--out-dir=')) {
      outDir = path.resolve(REPO_ROOT, arg.slice('--out-dir='.length));
    } else if (arg === '--sync-public-editor') {
      syncPublicEditor = true;
    }
  }

  return { target, outDir, syncPublicEditor };
}

function sha256Hex(bytes: Uint8Array | Buffer): string {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  }
  return `${(bytes / 1024).toFixed(1)} Ko`;
}

function collectDirectoryFiles(
  rootDir: string,
  prefix = ''
): Array<{ path: string; data: Uint8Array }> {
  const entries: Array<{ path: string; data: Uint8Array }> = [];
  for (const item of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const abs = path.join(rootDir, item.name);
    const rel = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) {
      entries.push(...collectDirectoryFiles(abs, rel));
    } else if (item.isFile()) {
      entries.push({ path: rel, data: new Uint8Array(fs.readFileSync(abs)) });
    }
  }
  return entries;
}

function recordArtifact(
  manifest: ArtifactEntry[],
  outDir: string,
  edition: string,
  absFile: string
) {
  const buf = fs.readFileSync(absFile);
  manifest.push({
    edition,
    relativePath: path.relative(outDir, absFile).replace(/\\/g, '/'),
    sizeBytes: buf.byteLength,
    sha256: sha256Hex(buf),
  });
}

async function main() {
  const startedAt = Date.now();
  const { target, outDir, syncPublicEditor } = parseArgs();

  console.log('======================================================================');
  console.log(" ETHYND : LES CHRONIQUES DE L'ÉCLAT — PIPELINE MULTI-VERSIONS");
  console.log(` Cible : ${target.toUpperCase()} | Dossier de sortie : ${path.relative(REPO_ROOT, outDir) || '.'}`);
  console.log('======================================================================');

  const worldPath = path.join(REPO_ROOT, 'public', 'ethynd', 'world_expanded.json');
  const world = JSON.parse(fs.readFileSync(worldPath, 'utf-8')) as WorldBundle;
  console.log(`[1/5] Chargement du royaume (${world.maps.length} cartes) et génération procédurale des sprites...`);
  const sprites = await loadSpriteBank();
  console.log(
    `      Banque chargée : ${Object.keys(sprites.monsters).length} monstres/boss, ${Object.keys(sprites.npcs).length} PNJ, ${Object.keys(sprites.items).length} objets.`
  );

  // 1. Automated QA & World Integrity Verification (always runs to guarantee broken worlds never ship!)
  console.log('[2/5] Exécution de la suite de tests automatisés des 5 Actes & barrages routiers...');
  const suiteSummary = await runFullAutomatedSuite(world, sprites);
  console.log(
    `      Résultat QA : ${suiteSummary.passed}/${suiteSummary.total} tests réussis en ${suiteSummary.durationMs.toFixed(0)} ms.`
  );
  if (suiteSummary.failed > 0) {
    console.error('\n[ERREUR] Échec de validation sur un ou plusieurs tests automatisés :');
    for (const r of suiteSummary.results.filter((t) => !t.passed)) {
      console.error(`  - [${r.id}] ${r.nameFr} : ${r.detailFr}`);
    }
    process.exit(1);
  }

  if (target === 'verify') {
    console.log('\n[OK] Vérification complète terminée avec succès.');
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });
  const manifest: ArtifactEntry[] = [];

  // 2. Standalone HTML5 Editions (Playable Simulation + Level Editor)
  if (target === 'all' || target === 'html' || target === 'web') {
    console.log('[3/5] Génération des éditions HTML5 autonomes monofichiers...');
    const htmlDir = path.join(outDir, 'html-autonome');
    fs.mkdirSync(htmlDir, { recursive: true });

    const simFr = buildStandaloneSimulationHtmlDocument(world, sprites, createInitialProgress(), 'fr');
    const simFrPath = path.join(htmlDir, 'simulation_ethynd.html');
    fs.writeFileSync(simFrPath, simFr, 'utf-8');
    recordArtifact(manifest, outDir, 'Jeu HTML5 Autonome (FR)', simFrPath);

    const simEn = buildStandaloneSimulationHtmlDocument(world, sprites, createInitialProgress(), 'en');
    const simEnPath = path.join(htmlDir, 'simulation_ethynd_en.html');
    fs.writeFileSync(simEnPath, simEn, 'utf-8');
    recordArtifact(manifest, outDir, 'Jeu HTML5 Autonome (EN)', simEnPath);

    const editorHtml = exportStandaloneEditorHtml(world, sprites, 'fr');
    const editorPath = path.join(htmlDir, 'editeur_niveaux.html');
    fs.writeFileSync(editorPath, editorHtml, 'utf-8');
    recordArtifact(manifest, outDir, 'Éditeur de Niveaux HTML5 Autonome', editorPath);

    if (syncPublicEditor) {
      const pubEditorPath = path.join(REPO_ROOT, 'public', 'ethynd', 'editeur_niveaux.html');
      fs.writeFileSync(pubEditorPath, editorHtml, 'utf-8');
      console.log('      Synchronisé : public/ethynd/editeur_niveaux.html');
    }

    const htmlZipBytes = buildZipBytes([
      { path: 'simulation_ethynd.html', data: new Uint8Array(Buffer.from(simFr, 'utf-8')) },
      { path: 'simulation_ethynd_en.html', data: new Uint8Array(Buffer.from(simEn, 'utf-8')) },
      { path: 'editeur_niveaux.html', data: new Uint8Array(Buffer.from(editorHtml, 'utf-8')) },
    ]);
    const htmlZipPath = path.join(outDir, 'ethynd-html-autonome-pack.zip');
    fs.writeFileSync(htmlZipPath, htmlZipBytes);
    recordArtifact(manifest, outDir, 'Archive HTML5 Autonome (Jeu + Éditeur)', htmlZipPath);

    console.log(
      `      Généré : simulation_ethynd.html (${formatBytes(Buffer.byteLength(simFr))}) & editeur_niveaux.html (${formatBytes(Buffer.byteLength(editorHtml))})`
    );
  }

  // 3. Gamebuino AKA Edition (MicroSD RGB565 binaries + Arduino/PlatformIO source + compiled ESP32-S3 firmware if built)
  if (target === 'all' || target === 'aka') {
    console.log('[4/5] Génération du Pack Console Gamebuino AKA (320x240 RGB565 + ESP32-S3)...');
    const akaOutDir = path.join(outDir, 'gamebuino-aka');
    const akaSdDir = path.join(akaOutDir, 'SD_CARD', 'ETHYND');
    const akaFwSrcDir = path.join(akaOutDir, 'firmware', 'ethynd_aka');
    fs.mkdirSync(akaSdDir, { recursive: true });
    fs.mkdirSync(akaFwSrcDir, { recursive: true });

    const worldBin = buildAkaWorldBinary(world);
    const tileset565 = buildAkaTileset565(sprites.tileset, world.tileCols);
    const sprites565 = buildAkaSprites565(sprites);

    fs.writeFileSync(path.join(akaSdDir, 'WORLD.BIN'), worldBin);
    fs.writeFileSync(path.join(akaSdDir, 'TILESET.565'), tileset565);
    fs.writeFileSync(path.join(akaSdDir, 'SPRITES.565'), sprites565);

    const fwSourceFiles = ['ethynd_aka.ino', 'config_aka.h', 'aka_data.h', 'platformio.ini'];
    for (const fName of fwSourceFiles) {
      fs.copyFileSync(
        path.join(REPO_ROOT, 'gamebuino_aka', fName),
        path.join(akaFwSrcDir, fName)
      );
    }
    fs.copyFileSync(
      path.join(REPO_ROOT, 'gamebuino_aka', 'README_AKA.md'),
      path.join(akaOutDir, 'README_AKA.md')
    );

    // Check if PlatformIO compiled ESP32-S3 firmware binaries exist (.pio/build/gamebuino_aka_esp32s3/)
    const pioBuildDir = path.join(
      REPO_ROOT,
      'gamebuino_aka',
      '.pio',
      'build',
      'gamebuino_aka_esp32s3'
    );
    const compiledBins = ['firmware.bin', 'firmware.elf', 'bootloader.bin', 'partitions.bin'];
    let hasCompiledFirmware = false;
    if (fs.existsSync(pioBuildDir)) {
      const akaBinOutDir = path.join(akaOutDir, 'firmware-bin-esp32s3');
      for (const binName of compiledBins) {
        const srcBin = path.join(pioBuildDir, binName);
        if (fs.existsSync(srcBin)) {
          fs.mkdirSync(akaBinOutDir, { recursive: true });
          fs.copyFileSync(srcBin, path.join(akaBinOutDir, binName));
          hasCompiledFirmware = true;
        }
      }
    }

    const akaZipEntries = collectDirectoryFiles(akaOutDir);
    const akaZipBytes = buildZipBytes(akaZipEntries);
    const akaZipPath = path.join(outDir, 'ethynd-gamebuino-aka-pack.zip');
    fs.writeFileSync(akaZipPath, akaZipBytes);
    recordArtifact(
      manifest,
      outDir,
      hasCompiledFirmware
        ? 'Pack Gamebuino AKA Complet (MicroSD + Sources + Firmware .bin ESP32-S3)'
        : 'Pack Gamebuino AKA (MicroSD RGB565 + Sources Firmware)',
      akaZipPath
    );

    console.log(
      `      Généré : WORLD.BIN (${formatBytes(worldBin.byteLength)}), TILESET.565 (${formatBytes(tileset565.byteLength)}), SPRITES.565 (${formatBytes(sprites565.byteLength)})${
        hasCompiledFirmware ? ' + firmware.bin ESP32-S3 compilé !' : ''
      }`
    );
  }

  // 4. Full Web SPA Edition (Vite production build + downloadable releases embedded for GitHub Pages)
  if (target === 'all' || target === 'web') {
    console.log("[5/5] Compilation de l'Application Web complète (Vite SPA / GitHub Pages)...");
    execSync('npx vite build', {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        VITE_BASE_PATH: process.env.VITE_BASE_PATH || './',
      },
    });

    const distDir = path.join(REPO_ROOT, 'dist');
    const distReleasesDir = path.join(distDir, 'releases');
    fs.mkdirSync(distReleasesDir, { recursive: true });

    // Bundle standalone HTML files & Gamebuino AKA pack inside dist/releases/ for direct web/GitHub Pages download
    const simFrCandidate = path.join(outDir, 'html-autonome', 'simulation_ethynd.html');
    const editorCandidate = path.join(outDir, 'html-autonome', 'editeur_niveaux.html');
    const akaZipCandidate = path.join(outDir, 'ethynd-gamebuino-aka-pack.zip');

    if (fs.existsSync(simFrCandidate)) {
      fs.copyFileSync(simFrCandidate, path.join(distReleasesDir, 'simulation_ethynd.html'));
    }
    if (fs.existsSync(editorCandidate)) {
      fs.copyFileSync(editorCandidate, path.join(distReleasesDir, 'editeur_niveaux.html'));
      // Ensure dist/ethynd/editeur_niveaux.html is also freshly up-to-date
      fs.copyFileSync(editorCandidate, path.join(distDir, 'ethynd', 'editeur_niveaux.html'));
    }
    if (fs.existsSync(akaZipCandidate)) {
      fs.copyFileSync(akaZipCandidate, path.join(distReleasesDir, 'ethynd-gamebuino-aka-pack.zip'));
    }

    // Add .nojekyll for GitHub Pages compatibility
    fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf-8');

    // Mirror dist/ into release-builds/web-spa/ and create ethynd-web-spa.zip
    const webOutDir = path.join(outDir, 'web-spa');
    fs.rmSync(webOutDir, { recursive: true, force: true });
    fs.cpSync(distDir, webOutDir, { recursive: true });

    const webZipBytes = buildZipBytes(collectDirectoryFiles(webOutDir));
    const webZipPath = path.join(outDir, 'ethynd-web-spa.zip');
    fs.writeFileSync(webZipPath, webZipBytes);
    recordArtifact(manifest, outDir, 'Application Web Complète (SPA Statique / GitHub Pages)', webZipPath);
    console.log(`      Généré : ethynd-web-spa.zip (${formatBytes(webZipBytes.byteLength)})`);
  }

  // Write manifest & release notes
  const manifestData = {
    project: "Ethynd : Les Chroniques de l'Éclat",
    generatedAt: new Date().toISOString(),
    qaPassed: `${suiteSummary.passed}/${suiteSummary.total}`,
    mapCount: world.maps.length,
    artifacts: manifest,
  };
  fs.writeFileSync(
    path.join(outDir, 'BUILD_MANIFEST.json'),
    JSON.stringify(manifestData, null, 2),
    'utf-8'
  );

  const summaryMdLines = [
    "# Ethynd : Les Chroniques de l'Éclat — Récapitulatif des Versions Générées",
    '',
    `- **Tests automatisés QA** : \`${suiteSummary.passed}/${suiteSummary.total}\` validés sur les ${world.maps.length} régions & donjons`,
    `- **Date de génération** : \`${manifestData.generatedAt}\``,
    '',
    '## Éditions disponibles',
    '',
    '| Édition | Fichier | Taille | Empreinte SHA-256 |',
    '| :--- | :--- | ---: | :--- |',
    ...manifest.map(
      (a) =>
        `| ${a.edition} | \`${a.relativePath}\` | ${formatBytes(a.sizeBytes)} | \`${a.sha256.slice(0, 16)}…\` |`
    ),
    '',
    '## Guide rapide par version',
    '- **Application Web (`ethynd-web-spa.zip`)** : décompressez sur tout hébergeur statique (GitHub Pages, Netlify, Apache/Nginx) ; inclut le jeu complet, le bestiaire, le codex, la suite de tests et les exports.',
    '- **Simulation HTML5 Autonome (`simulation_ethynd.html`)** : double-cliquez simplement sur le fichier dans n’importe quel navigateur moderne (100 % hors-ligne, zéro serveur requis).',
    '- **Éditeur de Niveaux HTML5 (`editeur_niveaux.html`)** : éditeur autonome avec palette thématique, aperçu visuel des formes, auto-tiling des forêts et export direct `world_expanded.json` + `WORLD.BIN`.',
    '- **Pack Console Gamebuino AKA (`ethynd-gamebuino-aka-pack.zip`)** : copiez le dossier `SD_CARD/ETHYND` à la racine d’une carte MicroSD FAT32 (`/ETHYND/WORLD.BIN`, `/ETHYND/TILESET.565`, `/ETHYND/SPRITES.565`) et flashez `firmware-bin-esp32s3/firmware.bin` (ou compilez `firmware/ethynd_aka/` sous PlatformIO / Arduino IDE).',
    '',
  ];
  fs.writeFileSync(path.join(outDir, 'LISEZMOI_VERSIONS.md'), summaryMdLines.join('\n'), 'utf-8');

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log('\n======================================================================');
  console.log(` TERMINÉ EN ${elapsedSec}s — ${manifest.length} artefact(s) prêts dans ${path.relative(REPO_ROOT, outDir)}`);
  console.log('======================================================================');
}

main().catch((err) => {
  console.error('\n[ERREUR FATALE BUILD]', err);
  process.exit(1);
});
