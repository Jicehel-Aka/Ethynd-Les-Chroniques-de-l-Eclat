import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Package, Volume2, VolumeX } from 'lucide-react';
import { audioEngine } from '../game/audioEngine';
import {
  EQUIPMENT_CATALOG,
  ITEM_CATALOG,
  computeDerivedStats,
  createInitialProgress,
  xpRequiredForLevel,
} from '../game/content';
import { EngineSnapshot, EthyndEngine, VIEW_H, VIEW_W } from '../game/engine';
import { exportStandaloneSimulationHtml } from '../game/htmlExporter';
import { SpriteBank } from '../game/spriteBank';
import {
  SavePresetId,
  TestCaseResult,
  TestSuiteSummary,
  VisualAutopilotRunner,
  VisualScenarioId,
  buildPresetProgress,
  parseAndValidateSave,
  runFullAutomatedSuite,
} from '../game/testSuite';
import {
  ActiveDialogue,
  DialogueChoice,
  Direction,
  EquipSlot,
  LangCode,
  LoreEntryDef,
  PlayerAttributes,
  PlayerProgress,
  WorldBundle,
} from '../game/types';

interface TestSuiteViewProps {
  lang: LangCode;
  world: WorldBundle;
  sprites: SpriteBank;
  progress: PlayerProgress;
  onLoadProgressIntoGame: (next: PlayerProgress, switchToPlay: boolean) => void;
  onBackToPlay: () => void;
}

const BACKUP_SLOT_KEY = 'ethynd_creator_backup_v1';

export function TestSuiteView({
  lang,
  world,
  sprites,
  progress,
  onLoadProgressIntoGame,
  onBackToPlay,
}: TestSuiteViewProps) {
  const [runningSuite, setRunningSuite] = useState(false);
  const [summary, setSummary] = useState<TestSuiteSummary | null>(null);
  const [catFilter, setCatFilter] = useState<
    'all' | 'failure_handling' | TestCaseResult['category']
  >('all');

  // Simulator Canvas & Mode ('manual' keyboard live engine vs 'bot' automated visual runner)
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const manualEngineRef = useRef<EthyndEngine | null>(null);
  const botRunnerRef = useRef<VisualAutopilotRunner | null>(null);

  const [simMode, setSimMode] = useState<'manual' | 'bot'>('manual');
  const [simProgress, setSimProgress] = useState<PlayerProgress>(() =>
    structuredClone(progress)
  );
  const [simSnapshot, setSimSnapshot] = useState<EngineSnapshot>({
    skillCooldownRatio: 0,
    activeBoss: null,
    toast: null,
    nearbyPrompt: null,
  });

  // Modals inside Simulator (Inventory [I], NPC Dialogues, Lore Steles, Shops, Phase)
  const [simInventoryOpen, setSimInventoryOpen] = useState(false);
  const [invSlotFilter, setInvSlotFilter] = useState<'all' | EquipSlot>('all');
  const [simDialogue, setSimDialogue] = useState<ActiveDialogue | null>(null);
  const [simDlgLineIdx, setSimDlgLineIdx] = useState(0);
  const [simLore, setSimLore] = useState<{ lore: LoreEntryDef; isNew: boolean } | null>(null);
  const [simShop, setSimShop] = useState<'market' | 'forge' | 'alchemy' | null>(null);
  const [simPhase, setSimPhase] = useState<'playing' | 'gameover' | 'victory'>('playing');

  // Keyboard visual state indicator
  const [pressedKeys, setPressedKeys] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    skill: false,
    potion: false,
  });

  // Bot controls
  const [scenario, setScenario] = useState<VisualScenarioId>('walkthrough_5_acts');
  const [botSpeed, setBotSpeed] = useState<1 | 4 | 8>(4);
  const [botLogs, setBotLogs] = useState<string[]>([]);
  const [botStepTitle, setBotStepTitle] = useState('');
  const [botOutcome, setBotOutcome] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');

  // Teleport & Audio & Export state
  const [teleportMap, setTeleportMap] = useState<string>(progress.currentMap || 'chateau');
  const [muted, setMuted] = useState(audioEngine.isMuted());
  const [musicMode, setMusicMode] = useState(audioEngine.getMusicMode());
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  // Save/Restore Inspector state
  const [hasBackup, setHasBackup] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(BACKUP_SLOT_KEY));
    } catch {
      return false;
    }
  });
  const [jsonDraft, setJsonDraft] = useState<string>(() => JSON.stringify(progress, null, 2));
  const [saveStatusMsg, setSaveStatusMsg] = useState<string | null>(null);

  // Build / rebuild Manual Interactive Engine helper
  const initManualEngine = useCallback(
    (initialState: PlayerProgress) => {
      const cloned = structuredClone(initialState);
      const st = computeDerivedStats(cloned);
      if (cloned.hp <= 0 || cloned.hp > st.maxHp) {
        cloned.hp = st.maxHp;
      }
      const eng = new EthyndEngine(world, sprites, cloned, {
        onProgressChange: (nextP) => {
          setSimProgress(structuredClone(nextP));
        },
        onOpenDialogue: (dlg) => {
          setSimDlgLineIdx(0);
          setSimDialogue(dlg);
        },
        onOpenLore: (lore, isNew) => {
          setSimLore({ lore, isNew });
        },
        onPhaseChange: (ph) => {
          setSimPhase(ph);
        },
      });
      eng.setLanguage(lang);
      manualEngineRef.current = eng;
      setSimProgress(structuredClone(eng.progress));
      setTeleportMap(eng.progress.currentMap);
      setSimPhase('playing');
    },
    [world, sprites, lang]
  );

  useEffect(() => {
    initManualEngine(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, sprites]);

  useEffect(() => {
    manualEngineRef.current?.setLanguage(lang);
  }, [lang]);

  const executeAllTests = useCallback(async () => {
    if (runningSuite) return;
    setRunningSuite(true);
    const res = await runFullAutomatedSuite(world, sprites);
    setSummary(res);
    setRunningSuite(false);
  }, [runningSuite, world, sprites]);

  useEffect(() => {
    executeAllTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setJsonDraft(JSON.stringify(progress, null, 2));
  }, [progress]);

  // Apply Inventory / Attribute / Forge updates directly to active Simulation
  const applySimProgressMutation = useCallback((next: PlayerProgress) => {
    const cloned = structuredClone(next);
    setSimProgress(cloned);
    if (manualEngineRef.current) {
      manualEngineRef.current.syncExternalProgress(cloned, true);
    }
    if (botRunnerRef.current) {
      botRunnerRef.current.engine.syncExternalProgress(cloned, true);
    }
  }, []);

  const startVisualBot = (sc: VisualScenarioId = scenario) => {
    setSimInventoryOpen(false);
    setSimDialogue(null);
    setSimShop(null);
    setSimLore(null);
    const runner = new VisualAutopilotRunner(world, sprites, sc, lang, (p) => {
      setSimProgress(structuredClone(p));
    });
    botRunnerRef.current = runner;
    setSimProgress(structuredClone(runner.engine.progress));
    setBotStepTitle(lang === 'fr' ? runner.stepTitleFr : runner.stepTitleEn);
    setBotLogs(runner.logs);
    setBotOutcome('running');
    setSimMode('bot');
  };

  const switchToManualControl = () => {
    const takeoverState = botRunnerRef.current
      ? structuredClone(botRunnerRef.current.engine.progress)
      : structuredClone(simProgress);
    botRunnerRef.current = null;
    setBotOutcome('idle');
    setSimMode('manual');
    initManualEngine(takeoverState);
  };

  const simModalOpen =
    simInventoryOpen ||
    Boolean(simDialogue) ||
    Boolean(simLore) ||
    Boolean(simShop) ||
    simPhase !== 'playing';

  // Keyboard Listeners for Simulator (ZQSD / WASD / Arrows + Space/X + E + R + I)
  useEffect(() => {
    const isFormField = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };

    const handleKey = (e: KeyboardEvent, down: boolean) => {
      if (isFormField(e.target)) return;

      if (down && e.code === 'KeyI') {
        e.preventDefault();
        setSimInventoryOpen((open) => !open);
        return;
      }

      if (down && e.code === 'Escape') {
        setSimInventoryOpen(false);
        setSimDialogue(null);
        setSimLore(null);
        setSimShop(null);
        return;
      }

      if (simModalOpen) {
        if (
          down &&
          (e.code === 'Space' || e.code === 'Enter') &&
          simDialogue &&
          !simShop &&
          !simInventoryOpen
        ) {
          e.preventDefault();
          const lines = lang === 'fr' ? simDialogue.linesFr : simDialogue.linesEn;
          if (simDlgLineIdx < lines.length - 1) {
            setSimDlgLineIdx((i) => i + 1);
          } else if (!simDialogue.choices || simDialogue.choices.length === 0) {
            setSimDialogue(null);
          }
        }
        if (manualEngineRef.current) {
          const k = manualEngineRef.current.keys;
          k.up = k.down = k.left = k.right = k.attack = k.skill = k.potion = false;
        }
        setPressedKeys({
          up: false,
          down: false,
          left: false,
          right: false,
          attack: false,
          skill: false,
          potion: false,
        });
        return;
      }

      // If user presses movement/combat keys while Bot is running, smoothly hand over to Manual Keyboard!
      const gameKeyCodes = [
        'ArrowUp',
        'KeyW',
        'KeyZ',
        'ArrowDown',
        'KeyS',
        'ArrowLeft',
        'KeyA',
        'KeyQ',
        'ArrowRight',
        'KeyD',
        'Space',
        'KeyX',
        'KeyE',
        'KeyC',
        'KeyR',
      ];
      if (down && simMode === 'bot' && gameKeyCodes.includes(e.code)) {
        const snap = botRunnerRef.current
          ? structuredClone(botRunnerRef.current.engine.progress)
          : structuredClone(simProgress);
        botRunnerRef.current = null;
        setBotOutcome('idle');
        setSimMode('manual');
        initManualEngine(snap);
      }

      const eng = manualEngineRef.current;
      if (!eng) return;

      let mapped: keyof EthyndEngine['keys'] | null = null;
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
        case 'KeyZ':
          mapped = 'up';
          break;
        case 'ArrowDown':
        case 'KeyS':
          mapped = 'down';
          break;
        case 'ArrowLeft':
        case 'KeyA':
        case 'KeyQ':
          mapped = 'left';
          break;
        case 'ArrowRight':
        case 'KeyD':
          mapped = 'right';
          break;
        case 'Space':
        case 'KeyX':
        case 'Enter':
          mapped = 'attack';
          break;
        case 'KeyE':
        case 'KeyC':
          mapped = 'skill';
          break;
        case 'KeyR':
          mapped = 'potion';
          break;
      }

      if (mapped) {
        e.preventDefault();
        eng.keys[mapped] = down;
        setPressedKeys((prev) => (prev[mapped!] === down ? prev : { ...prev, [mapped!]: down }));
      }
    };

    const onDown = (e: KeyboardEvent) => handleKey(e, true);
    const onUp = (e: KeyboardEvent) => handleKey(e, false);
    const onBlur = () => {
      if (manualEngineRef.current) {
        const k = manualEngineRef.current.keys;
        k.up = k.down = k.left = k.right = k.attack = k.skill = k.potion = false;
      }
      setPressedKeys({
        up: false,
        down: false,
        left: false,
        right: false,
        attack: false,
        skill: false,
        potion: false,
      });
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [simModalOpen, simDialogue, simShop, simInventoryOpen, simDlgLineIdx, lang, simMode, simProgress, initManualEngine]);

  // Unified 30Hz Simulation Loop (drives either Manual Keyboard Engine or Visual Bot Runner)
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let acc = 0;
    const STEP_MS = 1000 / 30;
    let frame = 0;

    const loop = (now: number) => {
      const dt = Math.min(100, now - lastTime);
      lastTime = now;
      acc += dt;

      if (simMode === 'bot') {
        const runner = botRunnerRef.current;
        if (runner) {
          if (!simInventoryOpen && runner.outcome === 'running') {
            while (acc >= STEP_MS) {
              for (let i = 0; i < botSpeed; i++) {
                runner.stepTick();
                if (runner.outcome !== 'running') break;
              }
              acc -= STEP_MS;
            }
          } else {
            acc = 0;
          }

          const c = simCanvasRef.current;
          if (c) {
            const ctx = c.getContext('2d');
            if (ctx) runner.engine.render(ctx);
          }

          frame++;
          if (frame % 5 === 0 || runner.outcome !== 'running') {
            setBotStepTitle(lang === 'fr' ? runner.stepTitleFr : runner.stepTitleEn);
            setBotLogs([...runner.logs]);
            setSimProgress(structuredClone(runner.engine.progress));
            setSimSnapshot(runner.engine.getSnapshot());
            if (runner.outcome !== 'running' && botOutcome === 'running') {
              setBotOutcome(runner.outcome);
            }
          }
        }
      } else {
        const eng = manualEngineRef.current;
        if (eng) {
          while (acc >= STEP_MS) {
            eng.tick(simModalOpen);
            acc -= STEP_MS;
          }
          const c = simCanvasRef.current;
          if (c) {
            const ctx = c.getContext('2d');
            if (ctx) eng.render(ctx);
          }
          frame++;
          if (frame % 6 === 0) {
            setSimSnapshot(eng.getSnapshot());
          }
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [simMode, botSpeed, simModalOpen, simInventoryOpen, lang, botOutcome]);

  const setVirtualSimKey = (key: keyof EthyndEngine['keys'], val: boolean) => {
    if (simMode === 'bot' && val) {
      switchToManualControl();
    }
    if (manualEngineRef.current) {
      manualEngineRef.current.keys[key] = val;
    }
    setPressedKeys((prev) => ({ ...prev, [key]: val }));
  };

  const handleTeleportInSim = (targetMapName: string) => {
    const m = world.maps.find((x) => x.name === targetMapName);
    if (!m) return;
    let tx = Math.floor((m.w * 32) / 2);
    let ty = Math.floor((m.h * 32) / 2);
    let dir = Direction.Bas;

    if (targetMapName === 'maison') {
      tx = 306;
      ty = 160;
    } else if (targetMapName === 'chateau') {
      // Spawn right on the bordered Royal Carpet facing King Edward IV's Throne!
      tx = 560;
      ty = 304;
      dir = Direction.Haut;
    } else if (targetMapName === 'citadelle') {
      tx = 640;
      ty = 880;
      dir = Direction.Haut;
    } else {
      for (const other of world.maps) {
        const inc = other.doors.find((d) => d.map === targetMapName);
        if (inc) {
          tx = inc.dx;
          ty = inc.dy;
          break;
        }
      }
    }

    const next = structuredClone(simProgress);
    next.currentMap = targetMapName;
    next.wx = tx;
    next.wy = ty;
    next.dir = dir;
    next.visitedMaps[targetMapName] = true;
    setSimMode('manual');
    botRunnerRef.current = null;
    setBotOutcome('idle');
    initManualEngine(next);
  };

  const handleSimDialogueChoice = (choice: DialogueChoice) => {
    const eng = manualEngineRef.current;
    if (!eng) return;

    if (choice.action === 'close') {
      setSimDialogue(null);
      return;
    }
    if (choice.action === 'open_shop' && simDialogue?.shopType) {
      setSimShop(simDialogue.shopType);
      setSimDialogue(null);
      return;
    }

    const next = structuredClone(eng.progress);
    if (choice.action === 'turn_in_siderite' && (next.inventory.siderite || 0) >= 2) {
      next.inventory.siderite -= 2;
      next.flags.sq_siderite_done = true;
      applySimProgressMutation(next);
      setSimDialogue(null);
      return;
    }
    if (choice.action === 'turn_in_moonflower' && (next.inventory.fleur_lune || 0) >= 3) {
      next.inventory.fleur_lune -= 3;
      next.flags.sq_moonflower_done = true;
      applySimProgressMutation(next);
      setSimDialogue(null);
      return;
    }
    if (choice.action === 'turn_in_badge' && (next.inventory.insigne_garde || 0) >= 1) {
      next.inventory.insigne_garde -= 1;
      next.flags.sq_patrol_done = true;
      applySimProgressMutation(next);
      setSimDialogue(null);
    }
  };

  // Inventory, Attribute, Consumable & Forge handlers inside Simulation
  const simStats = computeDerivedStats(simProgress);
  const simXpReq = xpRequiredForLevel(simProgress.level);
  const currentSimMap =
    world.maps.find((m) => m.name === simProgress.currentMap) || world.maps[0];
  const scoreInfo = audioEngine.getScoreMetrics(currentSimMap.music || 'maison');

  const allocateSimPoint = (attr: keyof PlayerAttributes) => {
    if (simProgress.statPoints <= 0) return;
    const next = structuredClone(simProgress);
    next.statPoints -= 1;
    next.attrs[attr] += 1;
    const ns = computeDerivedStats(next);
    if (attr === 'vitality') next.hp = Math.min(ns.maxHp, next.hp + 4);
    audioEngine.playOriginalSfx('selection_menu');
    applySimProgressMutation(next);
  };

  const toggleSimEquip = (eqId: string, slot: EquipSlot) => {
    const next = structuredClone(simProgress);
    next.equipped[slot] = next.equipped[slot] === eqId ? null : eqId;
    const ns = computeDerivedStats(next);
    if (next.hp > ns.maxHp) next.hp = ns.maxHp;
    audioEngine.playOriginalSfx('selection_menu');
    applySimProgressMutation(next);
  };

  const upgradeSimEquip = (eqId: string) => {
    const def = EQUIPMENT_CATALOG.find((e) => e.id === eqId);
    if (!def) return;
    const curUpg = simProgress.upgrades[eqId] || 0;
    if (curUpg >= 3) return;
    const matKey = curUpg >= 2 ? 'ecaille_dragon' : def.upgradeMat || 'siderite';
    const goldCost = (curUpg + 1) * 60;
    if (simProgress.gold < goldCost || (simProgress.inventory[matKey] || 0) < 1) return;

    const next = structuredClone(simProgress);
    next.gold -= goldCost;
    next.inventory[matKey] -= 1;
    next.upgrades[eqId] = curUpg + 1;
    audioEngine.playForgeClang();
    applySimProgressMutation(next);
  };

  const drinkSimItem = (itemId: string) => {
    const def = ITEM_CATALOG.find((i) => i.id === itemId);
    if (!def || def.heal <= 0 || (simProgress.inventory[itemId] || 0) <= 0) return;
    if (simProgress.hp >= simStats.maxHp) return;
    const next = structuredClone(simProgress);
    next.inventory[itemId] -= 1;
    next.hp = Math.min(simStats.maxHp, next.hp + def.heal + next.attrs.vitality);
    audioEngine.playHeal();
    applySimProgressMutation(next);
  };

  const grantTesterPack = () => {
    const next = structuredClone(simProgress);
    next.gold += 500;
    next.statPoints += 2;
    next.inventory.potion = (next.inventory.potion || 0) + 3;
    next.inventory.elixir = (next.inventory.elixir || 0) + 1;
    next.inventory.siderite = (next.inventory.siderite || 0) + 3;
    next.inventory.ecaille_dragon = (next.inventory.ecaille_dragon || 0) + 2;
    for (const eq of ['sword_iron', 'sword_solar', 'armor_draconic', 'shield_prismatic', 'relic_prism']) {
      if (!next.ownedEquip.includes(eq)) next.ownedEquip.push(eq);
    }
    audioEngine.playForgeClang();
    applySimProgressMutation(next);
  };

  const handleExportHtml = () => {
    const file = exportStandaloneSimulationHtml(world, sprites, simProgress, lang);
    setExportMsg(
      lang === 'fr'
        ? `Page autonome « ${file} » générée et téléchargée (clavier + inventaire [I] + 11 cartes + musique 80s inclus).`
        : `Standalone page "${file}" exported (keyboard + [I] inventory + 11 maps + 80s music embedded).`
    );
  };

  const handleBackupCurrent = () => {
    try {
      localStorage.setItem(BACKUP_SLOT_KEY, JSON.stringify(progress));
      setHasBackup(true);
      setSaveStatusMsg(
        lang === 'fr'
          ? 'Sauvegarde de secours enregistrée dans le slot isolé.'
          : 'Backup snapshot stored in isolated slot.'
      );
    } catch {
      setSaveStatusMsg(lang === 'fr' ? 'Erreur de stockage local.' : 'Local storage error.');
    }
  };

  const handleRestoreBackup = () => {
    try {
      const raw = localStorage.getItem(BACKUP_SLOT_KEY);
      const parsed = parseAndValidateSave(raw);
      if (!parsed) {
        setSaveStatusMsg(
          lang === 'fr' ? 'Aucune sauvegarde de secours valide trouvée.' : 'No valid backup found.'
        );
        return;
      }
      onLoadProgressIntoGame(parsed, false);
      initManualEngine(parsed);
      setSaveStatusMsg(
        lang === 'fr'
          ? `Sauvegarde restaurée avec succès (Niveau ${parsed.level}, carte ${parsed.currentMap}).`
          : `Backup restored (Level ${parsed.level}, map ${parsed.currentMap}).`
      );
    } catch {
      setSaveStatusMsg(lang === 'fr' ? 'Échec de restauration.' : 'Restore failed.');
    }
  };

  const handleImportJson = () => {
    const parsed = parseAndValidateSave(jsonDraft);
    if (!parsed) {
      setSaveStatusMsg(
        lang === 'fr'
          ? 'Échec : JSON invalide ou champs obligatoires manquants (rejeté par le validateur).'
          : 'Failed: Invalid JSON or missing required fields (rejected cleanly).'
      );
      return;
    }
    onLoadProgressIntoGame(parsed, false);
    setSimMode('manual');
    initManualEngine(parsed);
    setSaveStatusMsg(
      lang === 'fr'
        ? `État JSON importé dans la simulation et la partie (Niveau ${parsed.level}, ${parsed.gold} Or).`
        : `JSON state validated and imported (Level ${parsed.level}, ${parsed.gold} Gold).`
    );
  };

  const handleLoadPreset = (presetId: SavePresetId, jumpToMainTab: boolean) => {
    if (!hasBackup) {
      try {
        localStorage.setItem(BACKUP_SLOT_KEY, JSON.stringify(progress));
        setHasBackup(true);
      } catch {
        // ignore
      }
    }
    const built = buildPresetProgress(presetId, world);
    setSimMode('manual');
    botRunnerRef.current = null;
    initManualEngine(built);
    onLoadProgressIntoGame(built, jumpToMainTab);
    setSaveStatusMsg(
      lang === 'fr'
        ? `Chapitre « ${presetId} » chargé dans le simulateur (Niveau ${built.level}, carte ${built.currentMap}).`
        : `Preset "${presetId}" loaded into simulator (Level ${built.level}, map ${built.currentMap}).`
    );
  };

  const visibleResults = (summary?.results || []).filter((r) => {
    if (catFilter === 'all') return true;
    if (catFilter === 'failure_handling') return r.kind === 'failure_handling';
    return r.category === catFilter;
  });

  const ownedSimGear = EQUIPMENT_CATALOG.filter(
    (e) =>
      simProgress.ownedEquip.includes(e.id) &&
      (invSlotFilter === 'all' || e.slot === invSlotFilter)
  );

  return (
    <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
      {/* Header + HTML Export CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {lang === 'fr'
              ? 'Simulateur Interactif (Clavier & Inventaire), Bot & Suite QA'
              : 'Interactive Game Simulator (Keyboard & Inventory), Bot & QA Suite'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {lang === 'fr'
              ? 'Pilotez au clavier (ZQSD/Flèches, Espace, E, R), ouvrez l’Inventaire & Forge [I], lancez le Bot 5 Actes ou exportez la simulation en page HTML autonome.'
              : 'Play directly with keyboard (WASD/Arrows, Space, E, R), open Inventory & Forge [I], run the 5-Act Bot, or export as a standalone HTML file.'}
          </p>
          {exportMsg && <p className="text-xs text-emerald-400 mt-1.5 font-medium">{exportMsg}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportHtml}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {lang === 'fr'
                ? 'Exporter en page HTML (.html)'
                : 'Export Standalone HTML (.html)'}
            </span>
          </button>

          <button
            type="button"
            onClick={executeAllTests}
            disabled={runningSuite}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {runningSuite
              ? lang === 'fr'
                ? 'Vérification...'
                : 'Running...'
              : lang === 'fr'
              ? 'Relancer les tests'
              : 'Re-run Suite'}
          </button>

          <button
            type="button"
            onClick={onBackToPlay}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {lang === 'fr' ? 'Retour au jeu' : 'Return to Game'}
          </button>
        </div>
      </div>

      {/* Section 1: Interactive Simulator (Keyboard + Inventory [I] + Bot) & Save/Preset Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-7 p-6 rounded-xl bg-[#141a24] border border-slate-800/90 space-y-4">
          {/* Simulator Top Mode & Inventory Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={switchToManualControl}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  simMode === 'manual'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {lang === 'fr' ? 'Pilotage Clavier (Live)' : 'Keyboard Control (Live)'}
              </button>
              <button
                type="button"
                onClick={() => startVisualBot(scenario)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  simMode === 'bot'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {lang === 'fr' ? 'Bot Automatique' : 'Automated Bot'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSimInventoryOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  simInventoryOpen
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-900 border-amber-500/50 text-amber-300 hover:bg-slate-800'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>
                  {lang === 'fr'
                    ? `Inventaire & Forge [I]${
                        simProgress.statPoints > 0 ? ` (+${simProgress.statPoints})` : ''
                      }`
                    : `Inventory & Forge [I]${
                        simProgress.statPoints > 0 ? ` (+${simProgress.statPoints})` : ''
                      }`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextMode = musicMode === 'evolved' ? 'classic' : 'evolved';
                  audioEngine.setMusicMode(nextMode);
                  setMusicMode(nextMode);
                }}
                title={`${scoreInfo.titleFr} — ${scoreInfo.bars} mesures (${scoreInfo.cycleDurationSec}s)`}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {musicMode === 'evolved'
                  ? `♫ ${scoreInfo.cycleDurationSec}s`
                  : lang === 'fr'
                  ? '♫ Classique'
                  : '♫ Classic'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextM = !muted;
                  audioEngine.setMuted(nextM);
                  setMuted(nextM);
                }}
                aria-label={muted ? 'Activer le son' : 'Couper le son'}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Live HUD Metrics + Quick Map Teleporter */}
          <div className="px-3.5 py-2.5 rounded-lg bg-[#0d121b] border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs tabular-nums">
            <div className="flex flex-wrap items-center gap-3 text-slate-300">
              <span>
                PV{' '}
                <strong className="font-mono text-emerald-400">
                  {simProgress.hp}/{simStats.maxHp}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Niv. <strong className="font-mono text-white">{simProgress.level}</strong> (
                {simProgress.xp}/{simXpReq} XP)
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="font-mono text-amber-300">{simProgress.gold}</strong> Or
              </span>
              <span aria-hidden="true">·</span>
              <span>
                ATQ/DÉF{' '}
                <strong className="font-mono text-white">
                  {simStats.attack}/{simStats.defense}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={teleportMap}
                onChange={(e) => {
                  setTeleportMap(e.target.value);
                  handleTeleportInSim(e.target.value);
                }}
                aria-label={lang === 'fr' ? 'Téléporter vers une carte' : 'Teleport to map'}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {world.maps.map((m) => (
                  <option key={m.name} value={m.name}>
                    {lang === 'fr' ? m.titleFr : m.titleEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bot Scenario Sub-Toolbar (shown when Bot mode is selected or user wants a scenario) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  {
                    id: 'walkthrough_5_acts',
                    fr: 'Bot : Actes I → V (Dragon Final)',
                    en: 'Bot: Acts I → V (Final Dragon)',
                  },
                  {
                    id: 'death_and_revive',
                    fr: 'Bot : Mort & Résurrection',
                    en: 'Bot: Death & Revival',
                  },
                  {
                    id: 'locked_doors_check',
                    fr: 'Bot : Porte verrouillée & Sage',
                    en: 'Bot: Locked Door & Sage',
                  },
                ] as const
              ).map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setScenario(sc.id);
                    startVisualBot(sc.id);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    simMode === 'bot' && scenario === sc.id
                      ? 'bg-slate-800 border-amber-500/60 text-amber-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang === 'fr' ? sc.fr : sc.en}
                </button>
              ))}
            </div>

            {simMode === 'bot' && (
              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                {([1, 4, 8] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setBotSpeed(spd)}
                    className={`px-2 py-0.5 text-xs font-mono rounded cursor-pointer whitespace-nowrap shrink-0 ${
                      botSpeed === spd ? 'bg-slate-800 text-amber-300' : 'text-slate-400'
                    }`}
                  >
                    {spd}×
                  </button>
                ))}
              </div>
            )}
          </div>

          {simMode === 'bot' && botStepTitle && (
            <p className="text-xs text-amber-300 font-medium">{botStepTitle}</p>
          )}

          {/* Live Game Canvas + Interactive Overlays (Inventory [I], Dialogues, Shops, Steles) */}
          <div className="relative rounded-lg border border-slate-800 bg-[#090d14] overflow-hidden flex justify-center">
            <canvas
              ref={simCanvasRef}
              width={VIEW_W}
              height={VIEW_H}
              className="w-full max-w-[680px] aspect-[768/528] pixel-canvas block"
            />

            {/* Boss Health Bar */}
            {simSnapshot.activeBoss && !simInventoryOpen && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-72 max-w-[90%] px-3.5 py-1.5 rounded-lg bg-slate-950/90 border border-rose-500/50 pointer-events-none">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-200 mb-1 tabular-nums">
                  <span className="truncate">
                    {lang === 'fr'
                      ? simSnapshot.activeBoss.nameFr
                      : simSnapshot.activeBoss.nameEn}
                  </span>
                  <span className="font-mono">
                    {simSnapshot.activeBoss.hp}/{simSnapshot.activeBoss.maxHp}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-transform duration-100 origin-left"
                    style={{
                      transform: `scaleX(${Math.max(
                        0,
                        simSnapshot.activeBoss.hp / simSnapshot.activeBoss.maxHp
                      )})`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Toast Notification */}
            {simSnapshot.toast && !simModalOpen && (
              <div className="absolute top-14 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-lg bg-slate-950/90 border border-amber-500/40 text-xs font-medium text-amber-200 pointer-events-none whitespace-nowrap">
                {simSnapshot.toast}
              </div>
            )}

            {/* Nearby Interaction Prompt */}
            {simSnapshot.nearbyPrompt && !simModalOpen && simMode === 'manual' && (
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-slate-950/90 border border-slate-700 text-[11px] font-mono text-amber-300 pointer-events-none">
                {simSnapshot.nearbyPrompt}
              </div>
            )}

            {/* NPC Dialogue Overlay */}
            {simDialogue && !simInventoryOpen && (
              <div className="absolute inset-x-3 bottom-3 p-4 rounded-xl bg-slate-950/95 border border-amber-500/50">
                <p className="font-display text-xs font-bold text-amber-300 mb-1">
                  {lang === 'fr' ? simDialogue.speakerFr : simDialogue.speakerEn}
                </p>
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed min-h-[2.5rem]">
                  {(lang === 'fr' ? simDialogue.linesFr : simDialogue.linesEn)[simDlgLineIdx]}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {simDialogue.choices &&
                  simDlgLineIdx >=
                    (lang === 'fr' ? simDialogue.linesFr : simDialogue.linesEn).length - 1 ? (
                    simDialogue.choices.map((ch, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSimDialogueChoice(ch)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                          idx === 0
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        {lang === 'fr' ? ch.labelFr : ch.labelEn}
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const lines =
                          lang === 'fr' ? simDialogue.linesFr : simDialogue.linesEn;
                        if (simDlgLineIdx < lines.length - 1) setSimDlgLineIdx((i) => i + 1);
                        else setSimDialogue(null);
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-amber-500 text-slate-950 hover:bg-amber-400 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {lang === 'fr' ? 'Continuer [Espace]' : 'Continue [Space]'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Lore Stele Modal */}
            {simLore && !simInventoryOpen && (
              <div className="absolute inset-4 p-5 rounded-xl bg-slate-950/95 border border-amber-500/40 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-2">
                  <p className="text-xs text-amber-300">
                    {simLore.isNew ? '+35 XP · +20 Or' : 'Codex'}
                  </p>
                  <h3 className="font-display text-base font-bold text-white">
                    {lang === 'fr' ? simLore.lore.titleFr : simLore.lore.titleEn}
                  </h3>
                  {(lang === 'fr' ? simLore.lore.textFr : simLore.lore.textEn).map((p, i) => (
                    <p key={i} className="text-xs text-slate-200 leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSimLore(null)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {lang === 'fr' ? 'Fermer' : 'Close'}
                  </button>
                </div>
              </div>
            )}

            {/* Shop Overlay inside Simulator */}
            {simShop && !simInventoryOpen && (
              <div className="absolute inset-3 p-4 rounded-xl bg-slate-950/96 border border-slate-700 overflow-y-auto space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-display text-sm font-bold text-white">
                    {simShop === 'forge'
                      ? lang === 'fr'
                        ? `Armurerie de Brom (${simProgress.gold} Or)`
                        : `Brom's Armory (${simProgress.gold}g)`
                      : simShop === 'alchemy'
                      ? lang === 'fr'
                        ? `Herboristerie de Lysa (${simProgress.gold} Or)`
                        : `Lysa's Apothecary (${simProgress.gold}g)`
                      : lang === 'fr'
                      ? `Marché (${simProgress.gold} Or)`
                      : `Market (${simProgress.gold}g)`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSimShop(null)}
                    className="px-3 py-1 text-xs font-semibold rounded bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {lang === 'fr' ? 'Fermer' : 'Close'}
                  </button>
                </div>
                <div className="divide-y divide-slate-800/70">
                  {ITEM_CATALOG.filter((it) => Boolean(it.price)).map((it) => (
                    <div key={it.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-semibold text-white">
                          {lang === 'fr' ? it.nameFr : it.nameEn}
                        </span>{' '}
                        <span className="font-mono text-slate-400">
                          (×{simProgress.inventory[it.id] || 0})
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={simProgress.gold < (it.price || 999)}
                        onClick={() => {
                          const next = structuredClone(simProgress);
                          next.gold -= it.price || 0;
                          next.inventory[it.id] = (next.inventory[it.id] || 0) + 1;
                          audioEngine.playOriginalSfx('selection_menu');
                          applySimProgressMutation(next);
                        }}
                        className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-semibold disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {it.price} Or
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Game Over / Victory inside Simulator */}
            {simPhase !== 'playing' && !simInventoryOpen && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
                <h3 className="font-display text-2xl font-bold text-amber-300 mb-2">
                  {simPhase === 'victory'
                    ? lang === 'fr'
                      ? 'Victoire Finale sur Pyraxis !'
                      : 'Final Victory over Pyraxis!'
                    : lang === 'fr'
                    ? 'Héros tombé au combat'
                    : 'Hero Fallen'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const next = structuredClone(simProgress);
                    next.hp = computeDerivedStats(next).maxHp;
                    if (simPhase === 'gameover') {
                      next.currentMap = 'maison';
                      next.wx = 306;
                      next.wy = 160;
                    }
                    setSimPhase('playing');
                    initManualEngine(next);
                  }}
                  className="mt-3 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {simPhase === 'victory'
                    ? lang === 'fr'
                      ? 'Continuer à explorer'
                      : 'Continue Exploring'
                    : lang === 'fr'
                    ? 'Ressusciter chez le Sage'
                    : 'Revive at Cottage'}
                </button>
              </div>
            )}

            {/* FULL INTERACTIVE INVENTORY, ATTRIBUTES & FORGE [I] OVERLAY */}
            {simInventoryOpen && (
              <div className="absolute inset-2.5 sm:inset-4 p-4 sm:p-5 rounded-xl bg-slate-950/96 border border-amber-500/40 overflow-y-auto space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-display text-base font-bold text-white">
                      {lang === 'fr'
                        ? 'Inventaire, Équipement & Forge Runique [I]'
                        : 'Inventory, Equipment & Runic Forge [I]'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono tabular-nums">
                      Niv.{simProgress.level} · {simProgress.gold} Or · Sidérite ×
                      {simProgress.inventory.siderite || 0} · Écaille ×
                      {simProgress.inventory.ecaille_dragon || 0}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={grantTesterPack}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-emerald-300 hover:bg-slate-700 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {lang === 'fr' ? '+ Pack Test Forge' : '+ Tester Pack'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onLoadProgressIntoGame(simProgress, false)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-amber-300 hover:bg-slate-700 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {lang === 'fr' ? 'Appliquer à ma partie' : 'Sync to Main Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimInventoryOpen(false)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {lang === 'fr' ? 'Fermer [I]' : 'Close [I]'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Left: Attributes + Satchel */}
                  <div className="md:col-span-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-xs font-semibold text-amber-300">
                          {lang === 'fr' ? 'Aptitudes' : 'Attributes'}
                        </h4>
                        <span className="text-xs font-mono text-slate-300 tabular-nums">
                          {simProgress.statPoints} pt(s)
                        </span>
                      </div>
                      <div className="divide-y divide-slate-800/70 text-xs">
                        {(
                          [
                            { k: 'vitality', fr: 'Vitalité (+4 PV)', en: 'Vitality (+4 HP)' },
                            { k: 'strength', fr: 'Force (+2 ATQ)', en: 'Strength (+2 ATK)' },
                            { k: 'agility', fr: 'Agilité (+CRIT)', en: 'Agility (+CRIT)' },
                            { k: 'arcane', fr: 'Arcane (+Onde [E])', en: 'Arcane (+Wave [E])' },
                          ] as const
                        ).map((row) => (
                          <div key={row.k} className="py-1.5 flex items-center justify-between">
                            <span className="text-slate-200">
                              {lang === 'fr' ? row.fr : row.en}{' '}
                              <strong className="font-mono text-amber-300">
                                ({simProgress.attrs[row.k]})
                              </strong>
                            </span>
                            <button
                              type="button"
                              disabled={simProgress.statPoints <= 0}
                              onClick={() => allocateSimPoint(row.k)}
                              className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-semibold disabled:opacity-35 cursor-pointer"
                            >
                              +1
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80">
                      <h4 className="text-xs font-semibold text-amber-300 mb-1.5">
                        {lang === 'fr' ? 'Sacoche & Éclats' : 'Satchel & Shards'}
                      </h4>
                      <div className="divide-y divide-slate-800/70 text-xs">
                        {ITEM_CATALOG.filter((it) => (simProgress.inventory[it.id] || 0) > 0).map(
                          (it) => (
                            <div
                              key={it.id}
                              className="py-1.5 flex items-center justify-between gap-2"
                            >
                              <span className="text-slate-200 truncate">
                                {lang === 'fr' ? it.nameFr : it.nameEn}{' '}
                                <span className="font-mono text-slate-400">
                                  ×{simProgress.inventory[it.id]}
                                </span>
                              </span>
                              {it.heal > 0 && (
                                <button
                                  type="button"
                                  disabled={simProgress.hp >= simStats.maxHp}
                                  onClick={() => drinkSimItem(it.id)}
                                  className="px-2 py-0.5 rounded bg-emerald-600 text-white font-medium disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                                >
                                  {lang === 'fr' ? 'Boire' : 'Drink'}
                                </button>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: 4-Slot Equipment & Forge +1/+2/+3 */}
                  <div className="md:col-span-7 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-amber-300">
                        {lang === 'fr'
                          ? `Équipements (${simProgress.ownedEquip.length}/24)`
                          : `Equipment (${simProgress.ownedEquip.length}/24)`}
                      </h4>
                      <div className="flex items-center gap-1">
                        {(
                          [
                            { id: 'all', fr: 'Tout', en: 'All' },
                            { id: EquipSlot.Weapon, fr: 'Armes', en: 'Weapons' },
                            { id: EquipSlot.Armor, fr: 'Armures', en: 'Armor' },
                            { id: EquipSlot.Shield, fr: 'Boucliers', en: 'Shields' },
                            { id: EquipSlot.Relic, fr: 'Reliques', en: 'Relics' },
                          ] as const
                        ).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setInvSlotFilter(t.id)}
                            className={`px-2 py-0.5 text-[11px] rounded cursor-pointer whitespace-nowrap shrink-0 ${
                              invSlotFilter === t.id
                                ? 'bg-slate-800 text-amber-300 font-semibold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {lang === 'fr' ? t.fr : t.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="divide-y divide-slate-800/70 max-h-64 overflow-y-auto pr-1">
                      {ownedSimGear.map((eq) => {
                        const isEq = simProgress.equipped[eq.slot] === eq.id;
                        const upg = simProgress.upgrades[eq.id] || 0;
                        const matKey = upg >= 2 ? 'ecaille_dragon' : eq.upgradeMat || 'siderite';
                        const cost = (upg + 1) * 60;
                        const canUpg =
                          Boolean(eq.upgradeMat) &&
                          upg < 3 &&
                          simProgress.gold >= cost &&
                          (simProgress.inventory[matKey] || 0) >= 1;

                        return (
                          <div
                            key={eq.id}
                            className="py-2 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">
                                {lang === 'fr' ? eq.nameFr : eq.nameEn}{' '}
                                {upg > 0 && <span className="font-mono text-amber-300">+{upg}</span>}{' '}
                                {isEq && (
                                  <span className="text-amber-400 font-normal">
                                    · {lang === 'fr' ? 'Équipé' : 'Equipped'}
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {lang === 'fr' ? eq.descFr : eq.descEn}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {eq.upgradeMat && upg < 3 && (
                                <button
                                  type="button"
                                  disabled={!canUpg}
                                  onClick={() => upgradeSimEquip(eq.id)}
                                  className="px-2 py-1 rounded bg-slate-800 text-amber-300 border border-amber-500/30 disabled:opacity-35 cursor-pointer whitespace-nowrap"
                                >
                                  +{upg + 1} ({cost} Or)
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleSimEquip(eq.id, eq.slot)}
                                className={`px-2.5 py-1 rounded font-semibold cursor-pointer whitespace-nowrap ${
                                  isEq
                                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                                    : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                }`}
                              >
                                {isEq
                                  ? lang === 'fr'
                                    ? 'Retirer'
                                    : 'Unequip'
                                  : lang === 'fr'
                                  ? 'Équiper'
                                  : 'Equip'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Keyboard Key-Press Indicators & Touch / Mouse Gamepad */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { k: 'left', label: '←' },
                  { k: 'up', label: '↑' },
                  { k: 'down', label: '↓' },
                  { k: 'right', label: '→' },
                ] as const
              ).map((btn) => (
                <button
                  key={btn.k}
                  type="button"
                  onPointerDown={() => setVirtualSimKey(btn.k, true)}
                  onPointerUp={() => setVirtualSimKey(btn.k, false)}
                  onPointerLeave={() => setVirtualSimKey(btn.k, false)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold select-none cursor-pointer transition-colors ${
                    pressedKeys[btn.k]
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {btn.label}
                </button>
              ))}

              <button
                type="button"
                onPointerDown={() => setVirtualSimKey('attack', true)}
                onPointerUp={() => setVirtualSimKey('attack', false)}
                onPointerLeave={() => setVirtualSimKey('attack', false)}
                className={`px-3 h-9 rounded-lg text-xs font-semibold select-none cursor-pointer whitespace-nowrap shrink-0 ${
                  pressedKeys.attack
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                }`}
              >
                {lang === 'fr' ? 'Espace · Épée / Parler' : 'Space · Sword / Talk'}
              </button>

              <button
                type="button"
                onPointerDown={() => setVirtualSimKey('skill', true)}
                onPointerUp={() => setVirtualSimKey('skill', false)}
                onPointerLeave={() => setVirtualSimKey('skill', false)}
                className={`px-3 h-9 rounded-lg text-xs font-semibold select-none cursor-pointer whitespace-nowrap shrink-0 ${
                  pressedKeys.skill
                    ? 'bg-sky-400 text-slate-950'
                    : 'bg-slate-800 text-sky-300 hover:bg-slate-700'
                }`}
              >
                {lang === 'fr' ? 'E · Onde' : 'E · Wave'}
              </button>

              <button
                type="button"
                onClick={() => manualEngineRef.current?.useQuickPotion()}
                className="px-3 h-9 rounded-lg bg-slate-800 text-emerald-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                R · Soin ×{(simProgress.inventory.potion || 0) + (simProgress.inventory.elixir || 0)}
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              {lang === 'fr'
                ? 'Clavier : ZQSD/Flèches · Espace/X · E · R · I (Inventaire)'
                : 'Keys: WASD/Arrows · Space/X · E · R · I (Inventory)'}
            </span>
          </div>

          {botLogs.length > 0 && simMode === 'bot' && (
            <div className="max-h-32 overflow-y-auto pt-3 border-t border-slate-800/80 space-y-1 font-mono text-xs text-slate-300">
              {botLogs.map((l, idx) => (
                <p key={idx}>{l}</p>
              ))}
            </div>
          )}
        </section>

        {/* Right: Save / Restore / Presets & Corrupted JSON Tester */}
        <aside className="lg:col-span-5 p-6 rounded-xl bg-[#141a24] border border-slate-800/90 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              {lang === 'fr'
                ? 'Sauvegardes, Restauration & États de Chapitres'
                : 'Save, Restore & Chapter Presets'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'fr'
                ? 'Chargez instantanément un chapitre dans le simulateur ci-contre (Salle du Trône, Sylvebrume, Dragon Rouge Pyraxis) ou testez les sauvegardes.'
                : 'Load any chapter directly into the live simulator on the left (Throne Room, Sylvebrume, Red Dragon Pyraxis) or test JSON saves.'}
            </p>
          </div>

          {saveStatusMsg && <p className="text-xs font-medium text-amber-300">{saveStatusMsg}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleBackupCurrent}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 cursor-pointer whitespace-nowrap shrink-0"
            >
              {lang === 'fr' ? 'Créer copie de secours' : 'Save Backup Slot'}
            </button>
            <button
              type="button"
              onClick={handleRestoreBackup}
              disabled={!hasBackup}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-emerald-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
            >
              {lang === 'fr' ? 'Restaurer la copie' : 'Restore Backup'}
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <h3 className="text-xs font-semibold text-slate-300">
              {lang === 'fr'
                ? 'Charger un chapitre dans le Simulateur (avec Clavier & Inventaire [I])'
                : 'Load Chapter into Simulator (with Keyboard & Inventory [I])'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(
                [
                  {
                    id: 'act1_start',
                    fr: 'Acte I · Maison du Sage (Musique 80s)',
                    en: 'Act I · Cottage (80s Score)',
                  },
                  {
                    id: 'act2_castle',
                    fr: 'Acte II · Salle du Trône Royale',
                    en: 'Act II · Royal Throne Room',
                  },
                  {
                    id: 'act3_forest',
                    fr: 'Acte III · Forêt de Sylvebrume',
                    en: 'Act III · Sylvebrume Forest',
                  },
                  {
                    id: 'act5_pyraxis',
                    fr: 'Acte V · Dragon Rouge Pyraxis',
                    en: 'Act V · Red Dragon Pyraxis',
                  },
                  {
                    id: 'complete_100',
                    fr: '100 % Terminé (Niv.20 · Tout +3)',
                    en: '100% Complete (Lv.20 · All +3)',
                  },
                ] as const
              ).map((pr) => (
                <button
                  key={pr.id}
                  type="button"
                  onClick={() => handleLoadPreset(pr.id, false)}
                  className="px-3 py-2 text-xs text-left rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:border-amber-500/60 hover:text-amber-300 transition-colors cursor-pointer truncate"
                >
                  {lang === 'fr' ? pr.fr : pr.en}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="save-json-box" className="text-xs font-semibold text-slate-300">
                {lang === 'fr' ? 'Inspecteur JSON de Sauvegarde' : 'Save JSON Inspector'}
              </label>
              <button
                type="button"
                onClick={() => setJsonDraft('{ "corrupted": true, "level": "erreur" ')}
                className="text-[11px] text-rose-300 hover:underline cursor-pointer"
              >
                {lang === 'fr' ? 'Injecter JSON invalide (tester rejet)' : 'Inject Invalid JSON'}
              </button>
            </div>
            <textarea
              id="save-json-box"
              value={jsonDraft}
              onChange={(e) => setJsonDraft(e.target.value)}
              rows={6}
              className="w-full p-2.5 rounded-lg bg-[#090d14] border border-slate-800 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-amber-500"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleImportJson}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer whitespace-nowrap shrink-0"
              >
                {lang === 'fr' ? 'Valider & Restaurer ce JSON' : 'Validate & Restore JSON'}
              </button>
              <button
                type="button"
                onClick={() => setJsonDraft(JSON.stringify(simProgress, null, 2))}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer whitespace-nowrap shrink-0"
              >
                {lang === 'fr' ? 'Lire depuis le simulateur' : 'Read from Simulator'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Section 2: Complete Automated Assertion Results Table */}
      <section className="p-6 rounded-xl bg-[#141a24] border border-slate-800/90">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-800/80">
          <div>
            <h2 className="text-base font-semibold text-white">
              {lang === 'fr'
                ? 'Rapport détaillé des Vérifications Automatisées (Réussites & Gestion des Échecs)'
                : 'Automated Verification Report (Success Paths & Failure Handling)'}
            </h2>
            {summary && (
              <p className="text-xs text-slate-300 mt-1 font-mono tabular-nums">
                <span className="text-emerald-400 font-semibold">
                  {summary.passed}/{summary.total} {lang === 'fr' ? 'VALIDÉS' : 'PASSED'}
                </span>
                {' · '}
                <span
                  className={
                    summary.failed > 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'
                  }
                >
                  {summary.failed} {lang === 'fr' ? 'ÉCHECS INATTENDUS' : 'FAILURES'}
                </span>
                {' · '}
                <span>{summary.durationMs} ms</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
            {(
              [
                { id: 'all', fr: 'Tous', en: 'All' },
                {
                  id: 'failure_handling',
                  fr: 'Tests d’échec / rejet',
                  en: 'Failure / Rejection Checks',
                },
                { id: 'maps', fr: 'Cartes & BFS', en: 'Maps & BFS' },
                { id: 'doors', fr: 'Portes', en: 'Doors' },
                { id: 'dialogues', fr: 'Dialogues', en: 'Dialogues' },
                { id: 'combat', fr: 'Combat & Mort', en: 'Combat & Death' },
                { id: 'story', fr: 'Histoire & Dragon', en: 'Story & Dragon' },
                { id: 'progression', fr: 'Inventaire & Musique', en: 'Inventory & Music' },
                { id: 'persistence', fr: 'Sauvegardes', en: 'Saves' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCatFilter(f.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  catFilter === f.id
                    ? 'bg-slate-800 text-amber-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'fr' ? f.fr : f.en}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-800/70">
          {visibleResults.map((r) => (
            <div
              key={r.id}
              className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span
                    className={`font-mono font-semibold ${
                      r.passed ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {r.passed
                      ? lang === 'fr'
                        ? '✓ VALIDÉ'
                        : '✓ PASS'
                      : lang === 'fr'
                      ? '✗ ÉCHEC'
                      : '✗ FAIL'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {r.kind === 'failure_handling'
                      ? lang === 'fr'
                        ? 'Vérification de cas d’échec / blocage'
                        : 'Failure / Rejection Case'
                      : lang === 'fr'
                      ? 'Parcours nominal'
                      : 'Nominal Path'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-500">{r.category}</span>
                </div>

                <h3 className="text-sm font-semibold text-white">
                  {lang === 'fr' ? r.nameFr : r.nameEn}
                </h3>
                <p className="text-xs text-slate-300/90 leading-relaxed">
                  {lang === 'fr' ? r.detailFr : r.detailEn}
                </p>
              </div>

              <span className="text-xs font-mono text-slate-400 tabular-nums shrink-0">
                {r.durationMs} ms
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
