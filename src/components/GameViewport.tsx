import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { audioEngine } from '../game/audioEngine';
import {
  EQUIPMENT_CATALOG,
  ITEM_CATALOG,
  QUEST_CATALOG,
  computeDerivedStats,
  xpRequiredForLevel,
} from '../game/content';
import { EngineSnapshot, EthyndEngine, VIEW_H, VIEW_W } from '../game/engine';
import { SpriteBank } from '../game/spriteBank';
import {
  ActiveDialogue,
  DialogueChoice,
  GamePhase,
  LangCode,
  LoreEntryDef,
  NavTab,
  PlayerProgress,
  WorldBundle,
} from '../game/types';

interface GameViewportProps {
  lang: LangCode;
  world: WorldBundle;
  sprites: SpriteBank;
  progress: PlayerProgress;
  phase: GamePhase;
  paused?: boolean;
  onProgressChange: (p: PlayerProgress) => void;
  onPhaseChange: (phase: GamePhase) => void;
  onNavigateTab: (tab: NavTab) => void;
  onToggleLang: (lang: LangCode) => void;
  onRestartAfterDeath: () => void;
}

export function GameViewport({
  lang,
  world,
  sprites,
  progress,
  phase,
  paused = false,
  onProgressChange,
  onPhaseChange,
  onNavigateTab,
  onToggleLang,
  onRestartAfterDeath,
}: GameViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<EthyndEngine | null>(null);
  const lastEmittedRef = useRef<PlayerProgress | null>(progress);

  const [dialogue, setDialogue] = useState<ActiveDialogue | null>(null);
  const [dlgLineIdx, setDlgLineIdx] = useState(0);
  const [choiceCursor, setChoiceCursor] = useState(0);
  const [activeShop, setActiveShop] = useState<'market' | 'forge' | 'alchemy' | null>(null);
  const [shopCursor, setShopCursor] = useState(0);
  const [readingLore, setReadingLore] = useState<{ lore: LoreEntryDef; isNew: boolean } | null>(null);
  const [muted, setMuted] = useState(audioEngine.isMuted());
  const [musicMode, setMusicMode] = useState(audioEngine.getMusicMode());

  const [snapshot, setSnapshot] = useState<EngineSnapshot>({
    skillCooldownRatio: 0,
    activeBoss: null,
    toast: null,
    nearbyPrompt: null,
  });

  // Initialize Engine once per game session
  useEffect(() => {
    const engine = new EthyndEngine(world, sprites, progress, {
      onProgressChange: (p) => {
        lastEmittedRef.current = p;
        onProgressChange(p);
      },
      onOpenDialogue: (dlg) => {
        setDlgLineIdx(0);
        setChoiceCursor(0);
        setDialogue(dlg);
      },
      onOpenLore: (lore, isNew) => {
        setReadingLore({ lore, isNew });
      },
      onPhaseChange: (nextPhase) => {
        onPhaseChange(nextPhase);
      },
    });
    engine.setLanguage(lang);
    engineRef.current = engine;

    return () => {
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, sprites]);

  useEffect(() => {
    engineRef.current?.setLanguage(lang);
  }, [lang]);

  // Flush exact live position when switching away from Adventure tab
  useEffect(() => {
    const eng = engineRef.current;
    if (!eng) return;
    if (paused) {
      eng.keys.up = false;
      eng.keys.down = false;
      eng.keys.left = false;
      eng.keys.right = false;
      eng.keys.attack = false;
      eng.keys.skill = false;
      eng.keys.potion = false;
      eng.flushProgress();
    }
  }, [paused]);

  // Sync external changes (equipment / stats / consumables) into Engine without loop
  useEffect(() => {
    const eng = engineRef.current;
    if (!eng || progress === lastEmittedRef.current) return;
    eng.syncExternalProgress(progress, true);
  }, [progress]);

  const modalOpen =
    Boolean(dialogue) ||
    Boolean(activeShop) ||
    Boolean(readingLore) ||
    phase === 'gameover' ||
    phase === 'victory';

  const simPaused = paused || modalOpen;

  const handleChoice = (choice: DialogueChoice) => {
    const eng = engineRef.current;
    if (!eng) return;

    if (choice.action === 'close') {
      setDialogue(null);
      return;
    }
    if (choice.action === 'open_shop' && dialogue?.shopType) {
      setShopCursor(0);
      setActiveShop(dialogue.shopType);
      setDialogue(null);
      return;
    }

    const next = structuredClone(eng.progress);
    if (choice.action === 'turn_in_siderite' && (next.inventory.siderite || 0) >= 2) {
      next.inventory.siderite -= 2;
      next.flags.sq_siderite_done = true;
      eng.syncExternalProgress(next);
      setDialogue(null);
      return;
    }
    if (choice.action === 'turn_in_moonflower' && (next.inventory.fleur_lune || 0) >= 3) {
      next.inventory.fleur_lune -= 3;
      next.flags.sq_moonflower_done = true;
      eng.syncExternalProgress(next);
      setDialogue(null);
      return;
    }
    if (choice.action === 'turn_in_badge' && (next.inventory.insigne_garde || 0) >= 1) {
      next.inventory.insigne_garde -= 1;
      next.flags.sq_patrol_done = true;
      eng.syncExternalProgress(next);
      setDialogue(null);
    }
  };

  const buyEquipment = (eqId: string) => {
    const eng = engineRef.current;
    const def = EQUIPMENT_CATALOG.find((e) => e.id === eqId);
    if (!eng || !def) return;
    if (eng.progress.ownedEquip.includes(eqId) || eng.progress.gold < def.price) return;
    const next = structuredClone(eng.progress);
    next.gold -= def.price;
    next.ownedEquip.push(eqId);
    next.equipped[def.slot] = eqId;
    audioEngine.playForgeClang();
    eng.syncExternalProgress(next);
  };

  const buyConsumable = (itemId: string) => {
    const eng = engineRef.current;
    const def = ITEM_CATALOG.find((i) => i.id === itemId);
    if (!eng || !def || !def.price || eng.progress.gold < def.price) return;
    const next = structuredClone(eng.progress);
    next.gold -= def.price;
    next.inventory[itemId] = (next.inventory[itemId] || 0) + 1;
    audioEngine.playOriginalSfx('selection_menu');
    eng.syncExternalProgress(next);
  };

  const upgradeEquipmentInForge = (eqId: string) => {
    const eng = engineRef.current;
    const def = EQUIPMENT_CATALOG.find((e) => e.id === eqId);
    if (!eng || !def || !def.upgradeMat) return;
    if (eng.progress.currentMap !== 'forge') return;
    const curUpg = eng.progress.upgrades[eqId] || 0;
    if (curUpg >= 3) return;
    const reqMat = curUpg >= 2 ? 'ecaille_dragon' : def.upgradeMat;
    const goldCost = (curUpg + 1) * 60;
    if ((eng.progress.inventory[reqMat] || 0) < 1 || eng.progress.gold < goldCost) return;

    const next = structuredClone(eng.progress);
    next.inventory[reqMat] -= 1;
    next.gold -= goldCost;
    next.upgrades[eqId] = curUpg + 1;
    audioEngine.playForgeClang();
    eng.syncExternalProgress(next);
  };

  // Build unified list of interactive rows for the active shop so D-Pad + A/B work identically to mouse
  const shopConsumables = activeShop
    ? ITEM_CATALOG.filter((it) => {
        if (!it.price) return false;
        if (activeShop === 'alchemy') return it.category === 'consumable';
        if (activeShop === 'forge') return it.category === 'material';
        return it.id === 'potion' || it.id === 'siderite';
      })
    : [];

  const shopEquips =
    activeShop && activeShop !== 'alchemy'
      ? EQUIPMENT_CATALOG.filter(
          (eq) =>
            eq.price > 0 &&
            !progress.ownedEquip.includes(eq.id) &&
            (activeShop === 'forge' ? eq.tier <= 5 : eq.tier <= 3)
        )
      : [];

  const forgeTemperables =
    activeShop === 'forge' && progress.currentMap === 'forge'
      ? EQUIPMENT_CATALOG.filter(
          (eq) =>
            progress.ownedEquip.includes(eq.id) &&
            Boolean(eq.upgradeMat) &&
            (progress.upgrades[eq.id] || 0) < 3
        )
      : [];

  const totalShopActions =
    shopConsumables.length + shopEquips.length + forgeTemperables.length + 1; // +1 for explicit "Exit [B]" row

  const triggerShopRowAction = (idx: number) => {
    if (!activeShop) return;
    if (idx < shopConsumables.length) {
      buyConsumable(shopConsumables[idx].id);
      return;
    }
    const eqIdx = idx - shopConsumables.length;
    if (eqIdx < shopEquips.length) {
      buyEquipment(shopEquips[eqIdx].id);
      return;
    }
    const upgIdx = eqIdx - shopEquips.length;
    if (upgIdx < forgeTemperables.length) {
      upgradeEquipmentInForge(forgeTemperables[upgIdx].id);
      return;
    }
    // Last row = Close / Return to game (AKA console friendly)
    setActiveShop(null);
  };

  const closeActiveModal = () => {
    if (activeShop) {
      audioEngine.playOriginalSfx('selection_menu');
      setActiveShop(null);
      return true;
    }
    if (readingLore) {
      audioEngine.playOriginalSfx('selection_menu');
      setReadingLore(null);
      return true;
    }
    if (dialogue) {
      audioEngine.playOriginalSfx('selection_menu');
      setDialogue(null);
      return true;
    }
    return false;
  };

  const confirmActiveModal = () => {
    if (phase === 'gameover') {
      onRestartAfterDeath();
      return;
    }
    if (phase === 'victory') {
      onPhaseChange('playing');
      return;
    }
    if (activeShop) {
      const clamped = Math.max(0, Math.min(totalShopActions - 1, shopCursor));
      triggerShopRowAction(clamped);
      return;
    }
    if (readingLore) {
      setReadingLore(null);
      return;
    }
    if (dialogue) {
      const lines = lang === 'fr' ? dialogue.linesFr : dialogue.linesEn;
      if (dlgLineIdx < lines.length - 1) {
        setDlgLineIdx((i) => i + 1);
      } else if (dialogue.choices && dialogue.choices.length > 0) {
        const chosen =
          dialogue.choices[Math.max(0, Math.min(dialogue.choices.length - 1, choiceCursor))];
        if (chosen) handleChoice(chosen);
      } else {
        setDialogue(null);
      }
    }
  };

  const moveModalCursor = (delta: number) => {
    if (activeShop && totalShopActions > 0) {
      audioEngine.playOriginalSfx('selection_menu');
      setShopCursor((prev) => (prev + delta + totalShopActions) % totalShopActions);
      return;
    }
    if (dialogue && dialogue.choices && dialogue.choices.length > 0) {
      const lines = lang === 'fr' ? dialogue.linesFr : dialogue.linesEn;
      if (dlgLineIdx >= lines.length - 1) {
        const len = dialogue.choices.length;
        audioEngine.playOriginalSfx('selection_menu');
        setChoiceCursor((prev) => (prev + delta + len) % len);
      }
    }
  };

  // Keep latest modal callbacks accessible inside the 60fps Gamepad polling loop
  const modalHandlersRef = useRef({
    modalOpen,
    closeActiveModal,
    confirmActiveModal,
    moveModalCursor,
    openInventory: () => onNavigateTab('equipment'),
  });
  modalHandlersRef.current = {
    modalOpen,
    closeActiveModal,
    confirmActiveModal,
    moveModalCursor,
    openInventory: () => onNavigateTab('equipment'),
  };

  // Keyboard Listeners (WASD / ZQSD / Arrows + Space/X/Enter [A] + KeyB/Escape/Backspace [B] + E/C + R)
  useEffect(() => {
    if (paused) return;
    const handleKey = (e: KeyboardEvent, down: boolean) => {
      const eng = engineRef.current;
      if (!eng) return;

      if (modalOpen) {
        if (down) {
          if (e.code === 'Escape' || e.code === 'Backspace' || e.code === 'KeyB') {
            e.preventDefault();
            closeActiveModal();
          } else if (
            e.code === 'ArrowUp' ||
            e.code === 'KeyW' ||
            e.code === 'KeyZ' ||
            e.code === 'ArrowLeft' ||
            e.code === 'KeyA' ||
            e.code === 'KeyQ'
          ) {
            e.preventDefault();
            moveModalCursor(-1);
          } else if (
            e.code === 'ArrowDown' ||
            e.code === 'KeyS' ||
            e.code === 'ArrowRight' ||
            e.code === 'KeyD'
          ) {
            e.preventDefault();
            moveModalCursor(1);
          } else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyX') {
            e.preventDefault();
            confirmActiveModal();
          }
        }
        eng.keys.up = false;
        eng.keys.down = false;
        eng.keys.left = false;
        eng.keys.right = false;
        eng.keys.attack = false;
        eng.keys.skill = false;
        eng.keys.potion = false;
        return;
      }

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
        case 'KeyZ':
          e.preventDefault();
          eng.keys.up = down;
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          eng.keys.down = down;
          break;
        case 'ArrowLeft':
        case 'KeyA':
        case 'KeyQ':
          e.preventDefault();
          eng.keys.left = down;
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          eng.keys.right = down;
          break;
        case 'Space':
        case 'KeyX':
        case 'Enter':
          e.preventDefault();
          eng.keys.attack = down;
          break;
        case 'KeyE':
        case 'KeyC':
          e.preventDefault();
          eng.keys.skill = down;
          break;
        case 'KeyR':
        case 'KeyB':
          e.preventDefault();
          if (e.code === 'KeyR') eng.keys.potion = down;
          break;
        case 'KeyI':
          if (down) {
            e.preventDefault();
            onNavigateTab('equipment');
          }
          break;
      }
    };

    const onDown = (e: KeyboardEvent) => handleKey(e, true);
    const onUp = (e: KeyboardEvent) => handleKey(e, false);
    const onBlur = () => {
      const eng = engineRef.current;
      if (!eng) return;
      eng.keys.up = eng.keys.down = eng.keys.left = eng.keys.right = false;
      eng.keys.attack = eng.keys.skill = eng.keys.potion = false;
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    paused,
    modalOpen,
    dialogue,
    activeShop,
    readingLore,
    dlgLineIdx,
    shopCursor,
    choiceCursor,
    totalShopActions,
    lang,
    phase,
  ]);

  // Fixed 30Hz Game Loop + 60fps Render + Native Gamepad / AKA Console Input Polling
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let acc = 0;
    const STEP_MS = 1000 / 30;
    let frameCount = 0;
    let prevGpA = false;
    let prevGpB = false;
    let prevGpStart = false;
    let prevGpNav = 0;
    let gpWasDriving = false;

    const frame = (now: number) => {
      const dt = Math.min(100, now - lastTime);
      lastTime = now;
      acc += dt;

      const eng = engineRef.current;

      // Poll Gamepad / Handheld Console (AKA layout: D-Pad + A=0, B=1, X=2, Y=3, Start=9)
      if (!paused && eng && typeof navigator !== 'undefined' && navigator.getGamepads) {
        const pads = navigator.getGamepads();
        const gp = pads ? pads[0] || pads[1] || pads[2] || pads[3] : null;
        if (gp) {
          const deadzone = 0.45;
          const up = Boolean(gp.buttons[12]?.pressed) || (gp.axes[1] ?? 0) < -deadzone;
          const down = Boolean(gp.buttons[13]?.pressed) || (gp.axes[1] ?? 0) > deadzone;
          const left = Boolean(gp.buttons[14]?.pressed) || (gp.axes[0] ?? 0) < -deadzone;
          const right = Boolean(gp.buttons[15]?.pressed) || (gp.axes[0] ?? 0) > deadzone;
          const btnA = Boolean(gp.buttons[0]?.pressed);
          const btnB = Boolean(gp.buttons[1]?.pressed);
          const btnX = Boolean(gp.buttons[2]?.pressed);
          const btnY = Boolean(gp.buttons[3]?.pressed);
          const btnStart = Boolean(gp.buttons[9]?.pressed);

          const mh = modalHandlersRef.current;
          if (mh.modalOpen) {
            const navDir = up || left ? -1 : down || right ? 1 : 0;
            if (navDir !== 0 && navDir !== prevGpNav) {
              mh.moveModalCursor(navDir);
            }
            prevGpNav = navDir;
            if (btnB && !prevGpB) {
              mh.closeActiveModal();
            } else if (btnA && !prevGpA) {
              mh.confirmActiveModal();
            }
            if (gpWasDriving) {
              eng.keys.up = eng.keys.down = eng.keys.left = eng.keys.right = false;
              eng.keys.attack = eng.keys.skill = eng.keys.potion = false;
              gpWasDriving = false;
            }
          } else {
            prevGpNav = 0;
            if (btnStart && !prevGpStart) {
              mh.openInventory();
            } else {
              const anyGp = up || down || left || right || btnA || btnX || btnY;
              if (anyGp || gpWasDriving) {
                eng.keys.up = up;
                eng.keys.down = down;
                eng.keys.left = left;
                eng.keys.right = right;
                eng.keys.attack = btnA;
                eng.keys.skill = btnX;
                eng.keys.potion = btnY;
                gpWasDriving = anyGp;
              }
            }
          }
          prevGpA = btnA;
          prevGpB = btnB;
          prevGpStart = btnStart;
        }
      }

      if (eng) {
        while (acc >= STEP_MS) {
          eng.tick(simPaused);
          acc -= STEP_MS;
        }
        if (!paused) {
          const c = canvasRef.current;
          if (c) {
            const ctx = c.getContext('2d');
            if (ctx) eng.render(ctx);
          }
          frameCount++;
          if (frameCount % 6 === 0) {
            setSnapshot(eng.getSnapshot());
            const mm = minimapRef.current;
            if (mm) {
              const mctx = mm.getContext('2d');
              if (mctx) eng.renderMinimap(mctx, mm.width, mm.height);
            }
          }
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [simPaused, paused]);

  const stats = computeDerivedStats(progress);
  const xpReq = xpRequiredForLevel(progress.level);
  const mapObj = world.maps.find((m) => m.name === progress.currentMap) || world.maps[0];

  const activeQuest = QUEST_CATALOG.find(
    (q) =>
      !progress.completedQuests[q.id] &&
      !q.isSide &&
      (!q.prereqFlag || progress.flags[q.prereqFlag])
  );

  const shardsOwned = [
    { id: 'crystal_aube', fr: 'Aube', en: 'Dawn', color: 'text-amber-300' },
    { id: 'crystal_fer', fr: 'Fer', en: 'Iron', color: 'text-slate-300' },
    { id: 'crystal_azur', fr: 'Azur', en: 'Azure', color: 'text-sky-300' },
    { id: 'crystal_amethyste', fr: 'Améthyste', en: 'Amethyst', color: 'text-purple-300' },
  ];

  const setVirtualKey = (key: keyof EthyndEngine['keys'], val: boolean) => {
    if (engineRef.current) {
      engineRef.current.keys[key] = val;
    }
  };

  const clampedShopCursor = Math.max(0, Math.min(totalShopActions - 1, shopCursor));

  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 py-5">
      {/* Top Unobtrusive HUD Strip */}
      <div className="mb-4 px-5 py-3 rounded-xl bg-[#141a24] border border-slate-800/90 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5 tabular-nums">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>{lang === 'fr' ? 'Santé' : 'Health'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-100 font-semibold">
                {progress.hp}/{stats.maxHp} PV
              </span>
            </div>
            <div className="w-36 h-2 rounded bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-transform duration-150 origin-left"
                style={{ transform: `scaleX(${Math.max(0, Math.min(1, progress.hp / stats.maxHp))})` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>{lang === 'fr' ? `Niv. ${progress.level}` : `Lv. ${progress.level}`}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-amber-300">
                {progress.xp}/{xpReq} XP
              </span>
            </div>
            <div className="w-28 h-2 rounded bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-transform duration-150 origin-left"
                style={{ transform: `scaleX(${Math.max(0, Math.min(1, progress.xp / xpReq))})` }}
              />
            </div>
          </div>

          <div className="text-xs text-slate-300 font-mono">
            <span className="text-slate-500 block">{lang === 'fr' ? 'Bourse' : 'Gold'}</span>
            <span className="text-amber-300 font-semibold">{progress.gold} Or</span>
          </div>

          <div className="text-xs text-slate-300 font-mono">
            <span className="text-slate-500 block">ATQ / DÉF</span>
            <span className="text-slate-100 font-semibold">
              {stats.attack} / {stats.defense}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setVirtualKey('skill', true);
              setTimeout(() => setVirtualKey('skill', false), 60);
            }}
            className="px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700/80 text-sky-300 hover:border-sky-400/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
          >
            {snapshot.skillCooldownRatio > 0
              ? `Onde [E] ${Math.ceil(snapshot.skillCooldownRatio * 4)}s`
              : lang === 'fr'
              ? 'Onde [E] Prête'
              : 'Wave [E] Ready'}
          </button>

          <button
            type="button"
            onClick={() => engineRef.current?.useQuickPotion()}
            className="px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700/80 text-emerald-300 hover:border-emerald-400/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
          >
            {lang === 'fr' ? 'Soin [R]' : 'Heal [R]'} ×
            {(progress.inventory.potion || 0) + (progress.inventory.elixir || 0)}
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('equipment')}
            className="px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700/80 text-amber-300 hover:border-amber-400/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {lang === 'fr' ? 'Inventaire [I]' : 'Inventory [I]'}
          </button>

          <button
            type="button"
            onClick={() => {
              const nextMode = musicMode === 'evolved' ? 'classic' : 'evolved';
              audioEngine.setMusicMode(nextMode);
              setMusicMode(nextMode);
            }}
            title={
              lang === 'fr'
                ? 'Basculer entre les longues compositions régionales (80s) et les boucles MP3 originales'
                : 'Switch between long 80s regional compositions and classic MP3 loops'
            }
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {musicMode === 'evolved'
              ? lang === 'fr'
                ? '♫ Longue'
                : '♫ Long'
              : lang === 'fr'
              ? '♫ Classique'
              : '♫ Classic'}
          </button>

          <button
            type="button"
            onClick={() => {
              const nextMuted = !muted;
              audioEngine.setMuted(nextMuted);
              setMuted(nextMuted);
            }}
            aria-label={muted ? 'Activer le son' : 'Couper le son'}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Split Stage: Game Canvas (Left/Center) + Companion Map & Quest Column (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0a0d13] flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={VIEW_W}
              height={VIEW_H}
              className="w-full h-auto max-h-[68vh] object-contain pixel-canvas block"
            />

            {/* Boss Health Bar Overlay (Unobtrusive Top Center) */}
            {snapshot.activeBoss && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-80 max-w-[90%] px-4 py-2 rounded-lg bg-slate-950/90 border border-rose-500/50 pointer-events-none">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-200 mb-1 tabular-nums">
                  <span className="truncate">
                    {lang === 'fr' ? snapshot.activeBoss.nameFr : snapshot.activeBoss.nameEn}
                  </span>
                  <span className="font-mono">
                    {snapshot.activeBoss.hp}/{snapshot.activeBoss.maxHp}
                  </span>
                </div>
                <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-transform duration-100 origin-left"
                    style={{
                      transform: `scaleX(${Math.max(
                        0,
                        snapshot.activeBoss.hp / snapshot.activeBoss.maxHp
                      )})`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Toast Banner */}
            {snapshot.toast && !dialogue && !readingLore && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg bg-slate-950/90 border border-amber-500/40 text-xs font-medium text-amber-200 pointer-events-none whitespace-nowrap">
                {snapshot.toast}
              </div>
            )}

            {/* Nearby Interaction Hint */}
            {snapshot.nearbyPrompt && !modalOpen && (
              <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-md bg-slate-950/90 border border-slate-700 text-xs font-mono text-amber-300 pointer-events-none">
                {snapshot.nearbyPrompt}
              </div>
            )}

            {/* NPC Dialogue Box Overlay */}
            {dialogue && (
              <div className="absolute inset-x-4 bottom-4 p-5 rounded-xl bg-slate-950/95 border border-amber-500/50 shadow-2xl">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <p className="font-display text-sm font-bold text-amber-300">
                    {lang === 'fr' ? dialogue.speakerFr : dialogue.speakerEn}
                  </p>
                  <span className="text-[11px] font-mono text-slate-400">
                    {lang === 'fr' ? 'A: Valider · B: Fermer' : 'A: Confirm · B: Close'}
                  </span>
                </div>
                <p className="text-sm text-slate-100 leading-relaxed min-h-[3rem]">
                  {(lang === 'fr' ? dialogue.linesFr : dialogue.linesEn)[dlgLineIdx]}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  {dialogue.choices &&
                  dlgLineIdx >=
                    (lang === 'fr' ? dialogue.linesFr : dialogue.linesEn).length - 1 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {dialogue.choices.map((ch, idx) => {
                        const selected = idx === choiceCursor;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onMouseEnter={() => setChoiceCursor(idx)}
                            onClick={() => handleChoice(ch)}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              selected
                                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                            }`}
                          >
                            {selected ? '▸ ' : ''}
                            {lang === 'fr' ? ch.labelFr : ch.labelEn}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const lines = lang === 'fr' ? dialogue.linesFr : dialogue.linesEn;
                        if (dlgLineIdx < lines.length - 1) setDlgLineIdx((i) => i + 1);
                        else setDialogue(null);
                      }}
                      className="px-4 py-1.5 text-xs font-semibold rounded-md bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {dlgLineIdx <
                      (lang === 'fr' ? dialogue.linesFr : dialogue.linesEn).length - 1
                        ? lang === 'fr'
                          ? 'Suivant [A / Espace]'
                          : 'Next [A / Space]'
                        : lang === 'fr'
                        ? 'Continuer [A / B]'
                        : 'Continue [A / B]'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Lore Stele Reader Modal */}
            {readingLore && (
              <div className="absolute inset-4 sm:inset-8 p-6 rounded-xl bg-slate-950/95 border border-amber-500/40 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-3">
                  <p className="text-xs text-amber-300">
                    {readingLore.isNew
                      ? lang === 'fr'
                        ? 'Nouvelle entrée ajoutée au Codex (+35 XP · +20 Or)'
                        : 'New Codex entry deciphered (+35 XP · +20 Gold)'
                      : lang === 'fr'
                      ? 'Archive du Codex'
                      : 'Codex Archive'}
                  </p>
                  <h3 className="font-display text-xl font-bold text-white">
                    {lang === 'fr' ? readingLore.lore.titleFr : readingLore.lore.titleEn}
                  </h3>
                  <div className="space-y-2.5 text-sm text-slate-200 leading-relaxed">
                    {(lang === 'fr' ? readingLore.lore.textFr : readingLore.lore.textEn).map(
                      (p, i) => (
                        <p key={i}>{p}</p>
                      )
                    )}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-slate-400">
                    {lang === 'fr' ? 'AKA : Bouton B ou A pour refermer' : 'AKA: Press B or A to close'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReadingLore(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {lang === 'fr' ? 'Fermer [B / Échap]' : 'Close [B / Esc]'}
                  </button>
                </div>
              </div>
            )}

            {/* Merchant / Blacksmith / Apothecary Shop Modal (AKA D-Pad + A/B Ready) */}
            {activeShop && (
              <div className="absolute inset-3 sm:inset-6 p-5 rounded-xl bg-slate-950/95 border border-slate-700 flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">
                        {activeShop === 'market'
                          ? lang === 'fr'
                            ? "Marché du Lac d'Ethynd"
                            : 'Lake Ethynd Market'
                          : activeShop === 'forge'
                          ? lang === 'fr'
                            ? "Forge d'Airain · Armurerie & Trempe Runique"
                            : "Brass Forge · Armory & Runic Tempering"
                          : lang === 'fr'
                          ? 'Herboristerie de Lysa'
                          : "Lysa's Apothecary"}
                      </h3>
                      <p className="text-xs text-amber-300 font-mono tabular-nums">
                        {lang === 'fr'
                          ? `Or : ${progress.gold} · Sidérite : ${progress.inventory.siderite || 0} · Écaille : ${progress.inventory.ecaille_dragon || 0}`
                          : `Gold: ${progress.gold} · Siderite: ${progress.inventory.siderite || 0} · Scale: ${progress.inventory.ecaille_dragon || 0}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline text-[11px] font-mono text-slate-400">
                        {lang === 'fr' ? '↑/↓ Choisir · A Valider · B Quitter' : '↑/↓ Select · A Confirm · B Exit'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveShop(null)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {lang === 'fr' ? 'Fermer [B / Échap]' : 'Close [B / Esc]'}
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-800/70 mt-2">
                    {shopConsumables.map((it, idx) => {
                      const focused = clampedShopCursor === idx;
                      const affordable = progress.gold >= (it.price || 999);
                      return (
                        <div
                          key={it.id}
                          onMouseEnter={() => setShopCursor(idx)}
                          className={`py-2.5 px-2.5 rounded-lg flex items-center justify-between gap-3 transition-colors ${
                            focused ? 'bg-slate-800/90 border border-amber-500/40' : ''
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-white">
                              {focused ? '▸ ' : ''}
                              {lang === 'fr' ? it.nameFr : it.nameEn}{' '}
                              <span className="text-xs font-mono text-slate-400 tabular-nums">
                                ({lang === 'fr' ? 'En sac' : 'Owned'}: {progress.inventory[it.id] || 0})
                              </span>
                            </p>
                            <p className="text-xs text-slate-400">
                              {lang === 'fr' ? it.descFr : it.descEn}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={!affordable}
                            onClick={() => buyConsumable(it.id)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 tabular-nums ${
                              affordable
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {lang === 'fr' ? `Acheter (${it.price} Or)` : `Buy (${it.price}g)`}
                          </button>
                        </div>
                      );
                    })}

                    {shopEquips.map((eq, i) => {
                      const rowIdx = shopConsumables.length + i;
                      const focused = clampedShopCursor === rowIdx;
                      const affordable = progress.gold >= eq.price;
                      return (
                        <div
                          key={eq.id}
                          onMouseEnter={() => setShopCursor(rowIdx)}
                          className={`py-2.5 px-2.5 rounded-lg flex items-center justify-between gap-3 transition-colors ${
                            focused ? 'bg-slate-800/90 border border-amber-500/40' : ''
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-white">
                              {focused ? '▸ ' : ''}
                              {lang === 'fr' ? eq.nameFr : eq.nameEn}
                            </p>
                            <p className="text-xs text-slate-400">
                              {lang === 'fr' ? eq.descFr : eq.descEn}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={!affordable}
                            onClick={() => buyEquipment(eq.id)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 tabular-nums ${
                              affordable
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {lang === 'fr' ? `Acheter (${eq.price} Or)` : `Buy (${eq.price}g)`}
                          </button>
                        </div>
                      );
                    })}

                    {/* Direct Equipment Tempering inside La Forge d'Airain */}
                    {forgeTemperables.length > 0 && (
                      <div className="pt-3 pb-1">
                        <p className="text-xs font-semibold text-amber-300 mb-1.5 px-1">
                          {lang === 'fr'
                            ? "Enclume de Maître Brom — Tremper votre équipement (+1 / +2 / +3)"
                            : "Master Brom's Anvil — Temper Owned Gear (+1 / +2 / +3)"}
                        </p>
                        <div className="space-y-1">
                          {forgeTemperables.map((eq, i) => {
                            const rowIdx = shopConsumables.length + shopEquips.length + i;
                            const focused = clampedShopCursor === rowIdx;
                            const curUpg = progress.upgrades[eq.id] || 0;
                            const reqMat = curUpg >= 2 ? 'ecaille_dragon' : eq.upgradeMat!;
                            const matDef = ITEM_CATALOG.find((m) => m.id === reqMat);
                            const goldCost = (curUpg + 1) * 60;
                            const canForge =
                              (progress.inventory[reqMat] || 0) >= 1 && progress.gold >= goldCost;

                            return (
                              <div
                                key={`forge_${eq.id}`}
                                onMouseEnter={() => setShopCursor(rowIdx)}
                                className={`py-2 px-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3 transition-colors ${
                                  focused ? 'bg-slate-800/90 border border-amber-500/40' : ''
                                }`}
                              >
                                <div>
                                  <p className="text-sm font-medium text-white">
                                    {focused ? '▸ ' : ''}
                                    {lang === 'fr' ? eq.nameFr : eq.nameEn}{' '}
                                    {curUpg > 0 && (
                                      <span className="text-amber-300 font-mono">+{curUpg}</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-slate-400 font-mono tabular-nums">
                                    {lang === 'fr' ? 'Requis : 1× ' : 'Needs: 1× '}
                                    {matDef ? (lang === 'fr' ? matDef.nameFr : matDef.nameEn) : reqMat}{' '}
                                    · {goldCost} Or
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  disabled={!canForge}
                                  onClick={() => upgradeEquipmentInForge(eq.id)}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 tabular-nums ${
                                    canForge
                                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer'
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  {lang === 'fr'
                                    ? `Forger +${curUpg + 1} (${goldCost} Or)`
                                    : `Forge +${curUpg + 1} (${goldCost}g)`}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Explicit Console/AKA D-Pad Exit Row at bottom of every shop */}
                    {(() => {
                      const exitIdx = totalShopActions - 1;
                      const exitFocused = clampedShopCursor === exitIdx;
                      return (
                        <div
                          onMouseEnter={() => setShopCursor(exitIdx)}
                          className={`mt-2 py-2.5 px-2.5 rounded-lg flex items-center justify-between gap-3 transition-colors ${
                            exitFocused ? 'bg-slate-800/90 border border-amber-500/40' : ''
                          }`}
                        >
                          <span className="text-xs text-slate-300 font-medium">
                            {exitFocused ? '▸ ' : ''}
                            {lang === 'fr'
                              ? 'Quitter la boutique et reprendre la route'
                              : 'Leave shop and return to adventure'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveShop(null)}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                              exitFocused
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                            }`}
                          >
                            {lang === 'fr' ? '← Quitter [Bouton B]' : '← Exit [Button B]'}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Game Over Overlay */}
            {phase === 'gameover' && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-8 text-center">
                <h2 className="font-display text-3xl font-bold text-rose-400 mb-2">
                  {lang === 'fr' ? 'Vous avez succombé' : 'You Have Fallen'}
                </h2>
                <p className="text-sm text-slate-300 max-w-md mb-6">
                  {lang === 'fr'
                    ? "La lumière du Prisme vous rappelle à la Maison du Sage Aldric sans perdre votre niveau, votre or ni votre équipement."
                    : 'The Prism’s light recalls you safely to Sage Aldric’s Cottage with all your levels, gold, and equipment intact.'}
                </p>
                <button
                  type="button"
                  onClick={onRestartAfterDeath}
                  className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {lang === 'fr' ? 'Se relever chez le Sage [A]' : 'Revive at the Cottage [A]'}
                </button>
              </div>
            )}

            {/* Victory Modal */}
            {phase === 'victory' && (
              <div className="absolute inset-0 bg-slate-950/92 flex flex-col items-center justify-center p-8 text-center">
                <p className="text-xs text-amber-300 mb-2">
                  {lang === 'fr' ? 'Acte V Accompli · Le Prisme Triomphe' : 'Act V Complete · The Prism Endures'}
                </p>
                <h2 className="font-display text-3xl font-bold text-white mb-3">
                  {lang === 'fr' ? "L'Aube Éternelle d'Ethynd !" : 'Eternal Dawn Over Ethynd!'}
                </h2>
                <p className="text-sm text-slate-300 max-w-lg leading-relaxed mb-6">
                  {lang === 'fr'
                    ? "Pyraxis, l'Empereur Écarlate, est retourné en poussière d'étoiles. Les Quatre Éclats illuminent à nouveau la Vallée, le Château Royal et Sylvebrume. Vous pouvez continuer à explorer librement le royaume pour compléter toutes les quêtes et les 16 stèles du Codex !"
                    : 'Pyraxis, the Crimson Emperor, has crumbled into stardust. The Four Shards shine once more over the Valley, Royal Castle, and Sylvebrume. Continue exploring freely to complete every side quest and all 16 Codex steles!'}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onPhaseChange('playing')}
                    className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {lang === 'fr' ? "Continuer l'exploration" : 'Continue Exploring'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onPhaseChange('title')}
                    className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {lang === 'fr' ? 'Écran titre' : 'Title Screen'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile / Touch / AKA Console Controls Bar */}
          <div className="mt-4 p-3 rounded-xl bg-[#141a24] border border-slate-800/90 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { k: 'left', label: '←', nav: -1 },
                  { k: 'up', label: '↑', nav: -1 },
                  { k: 'down', label: '↓', nav: 1 },
                  { k: 'right', label: '→', nav: 1 },
                ] as const
              ).map((btn) => (
                <button
                  key={btn.k}
                  type="button"
                  onPointerDown={() => {
                    if (modalOpen) moveModalCursor(btn.nav);
                    else setVirtualKey(btn.k, true);
                  }}
                  onPointerUp={() => setVirtualKey(btn.k, false)}
                  onPointerLeave={() => setVirtualKey(btn.k, false)}
                  className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-sm font-bold text-slate-100 select-none cursor-pointer"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <p className="hidden xl:block text-xs text-slate-400">
              {lang === 'fr'
                ? 'ZQSD / Croix : Déplacer · A / Espace : Épée & Valider · B / Échap : Fermer menu · E : Onde · R : Potion'
                : 'WASD / D-Pad: Move · A / Space: Sword & Confirm · B / Esc: Close Menu · E: Wave · R: Potion'}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onPointerDown={() => {
                  if (modalOpen) confirmActiveModal();
                  else setVirtualKey('attack', true);
                }}
                onPointerUp={() => setVirtualKey('attack', false)}
                onPointerLeave={() => setVirtualKey('attack', false)}
                className="px-4 h-11 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold select-none whitespace-nowrap shrink-0 cursor-pointer"
              >
                {lang === 'fr' ? 'A · Épée / Valider' : 'A · Sword / OK'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (modalOpen) closeActiveModal();
                }}
                className={`px-3.5 h-11 rounded-lg text-xs font-semibold select-none whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  modalOpen
                    ? 'bg-rose-500/25 border border-rose-400/60 text-rose-200 hover:bg-rose-500/35'
                    : 'bg-slate-800/90 border border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {lang === 'fr' ? 'B · Fermer' : 'B · Back'}
              </button>
              <button
                type="button"
                onPointerDown={() => setVirtualKey('skill', true)}
                onPointerUp={() => setVirtualKey('skill', false)}
                onPointerLeave={() => setVirtualKey('skill', false)}
                className="px-4 h-11 rounded-lg bg-sky-500/20 border border-sky-400/50 hover:bg-sky-500/30 text-sky-200 text-xs font-semibold select-none whitespace-nowrap shrink-0 cursor-pointer"
              >
                {lang === 'fr' ? 'E · Onde' : 'E · Wave'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Companion Sidebar: Minimap, Shards, Active Objective & Quick Actions */}
        <aside className="lg:col-span-4 p-5 rounded-xl bg-[#141a24] border border-slate-800/90 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="text-sm font-semibold text-white truncate">
                  {lang === 'fr' ? mapObj.titleFr : mapObj.titleEn}
                </h2>
                <span className="text-xs text-slate-400 shrink-0">{mapObj.region}</span>
              </div>

              <canvas
                ref={minimapRef}
                width={320}
                height={200}
                className="w-full h-44 rounded-lg border border-slate-800 bg-[#0b0f17] pixel-canvas"
              />
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                <span className="text-amber-300">■ {lang === 'fr' ? 'Vous / Coffre' : 'You / Chest'}</span>
                <span className="text-sky-400">■ {lang === 'fr' ? 'Passage' : 'Passage'}</span>
                <span className="text-emerald-400">■ PNJ</span>
                <span className="text-purple-400">■ {lang === 'fr' ? 'Stèle' : 'Stele'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              <h3 className="text-xs font-semibold text-slate-400 mb-2">
                {lang === 'fr' ? 'Objectif Principal Actif' : 'Current Main Objective'}
              </h3>
              {activeQuest ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-300">
                    Acte {activeQuest.act} · {lang === 'fr' ? activeQuest.titleFr : activeQuest.titleEn}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {lang === 'fr' ? activeQuest.descFr : activeQuest.descEn}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-emerald-400">
                  {lang === 'fr'
                    ? 'Épopée principale accomplie ! Explorez librement les quêtes secondaires et le Codex.'
                    : 'Main story completed! Freely explore side contracts and Codex steles.'}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              <h3 className="text-xs font-semibold text-slate-400 mb-2">
                {lang === 'fr' ? "Les Quatre Éclats d'Ethynd" : 'The Four Shards of Ethynd'}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                {shardsOwned.map((sh, i) => {
                  const has = (progress.inventory[sh.id] || 0) > 0;
                  return (
                    <span key={sh.id} className="flex items-center gap-2">
                      {i > 0 && <span className="text-slate-600">·</span>}
                      <span className={has ? `${sh.color} font-semibold` : 'text-slate-600'}>
                        {has ? '◆' : '◇'} {lang === 'fr' ? sh.fr : sh.en}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>

            {progress.statPoints > 0 && (
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <p className="text-xs text-amber-300 font-medium">
                  {lang === 'fr'
                    ? `${progress.statPoints} point(s) d'aptitude à attribuer`
                    : `${progress.statPoints} attribute point(s) ready`}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateTab('equipment')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {lang === 'fr' ? 'Attribuer' : 'Allocate'}
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>{lang === 'fr' ? 'Langue des textes' : 'Language'}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleLang('fr')}
                className={`cursor-pointer ${lang === 'fr' ? 'text-amber-300 font-semibold' : 'hover:text-white'}`}
              >
                FR
              </button>
              <span>/</span>
              <button
                type="button"
                onClick={() => onToggleLang('en')}
                className={`cursor-pointer ${lang === 'en' ? 'text-amber-300 font-semibold' : 'hover:text-white'}`}
              >
                EN
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
