/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { BestiaryView } from './components/BestiaryView';
import { CodexView } from './components/CodexView';
import { EquipmentView } from './components/EquipmentView';
import { GameViewport } from './components/GameViewport';
import { MapsAtlasView } from './components/MapsAtlasView';
import { QuestsView } from './components/QuestsView';
import { TestSuiteView } from './components/TestSuiteView';
import { TitleScreen } from './components/TitleScreen';
import { TopBar } from './components/TopBar';
import { assetUrl } from './game/assetUrl';
import { audioEngine } from './game/audioEngine';
import { computeDerivedStats, createInitialProgress } from './game/content';
import { SpriteBank, loadSpriteBank } from './game/spriteBank';
import { parseAndValidateSave } from './game/testSuite';
import {
  Direction,
  GamePhase,
  LangCode,
  NavTab,
  PlayerProgress,
  WorldBundle,
} from './game/types';

const SAVE_STORAGE_KEY = 'ethynd_chronicles_save_v1';
const LANG_STORAGE_KEY = 'ethynd_chronicles_lang_v1';

function readSavedProgress(): PlayerProgress | null {
  try {
    return parseAndValidateSave(localStorage.getItem(SAVE_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeSavedProgress(progress: PlayerProgress) {
  try {
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors in restricted frames
  }
}

function readSavedLang(): LangCode {
  try {
    const val = localStorage.getItem(LANG_STORAGE_KEY);
    return val === 'en' ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}

export default function App() {
  const [lang, setLang] = useState<LangCode>(() => readSavedLang());
  const [defaultWorld, setDefaultWorld] = useState<WorldBundle | null>(null);
  const [world, setWorld] = useState<WorldBundle | null>(null);
  const [sprites, setSprites] = useState<SpriteBank | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [savedProgress, setSavedProgress] = useState<PlayerProgress | null>(() =>
    readSavedProgress()
  );
  const [progress, setProgress] = useState<PlayerProgress>(
    () => readSavedProgress() || createInitialProgress()
  );
  const [phase, setPhase] = useState<GamePhase>('title');
  const [activeTab, setActiveTab] = useState<NavTab>('play');
  const [selectedAtlasMap, setSelectedAtlasMap] = useState<string>('aventure');
  const [sessionKey, setSessionKey] = useState(1);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoadError(null);
    try {
      const [worldRes, loadedSprites] = await Promise.all([
        fetch(assetUrl('ethynd/world_expanded.json')).then(async (res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return (await res.json()) as WorldBundle;
        }),
        loadSpriteBank(),
      ]);
      setDefaultWorld(structuredClone(worldRes));
      setWorld(worldRes);
      setSprites(loadedSprites);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Impossible de charger les ressources du royaume.'
      );
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleToggleLang = useCallback((nextLang: LangCode) => {
    setLang(nextLang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, nextLang);
    } catch {
      // Ignore storage error
    }
  }, []);

  const handleProgressChange = useCallback((next: PlayerProgress) => {
    setProgress(next);
    setSavedProgress(next);
    writeSavedProgress(next);
  }, []);

  const handleLoadProgressIntoGame = useCallback(
    (next: PlayerProgress, switchToPlay: boolean) => {
      const cloned = structuredClone(next);
      const stats = computeDerivedStats(cloned);
      if (cloned.hp <= 0 || cloned.hp > stats.maxHp) {
        cloned.hp = stats.maxHp;
      }
      audioEngine.playOriginalSfx('selection_menu');
      setProgress(cloned);
      setSavedProgress(cloned);
      writeSavedProgress(cloned);
      setSessionKey((k) => k + 1);
      setPhase('playing');
      if (switchToPlay) {
        setActiveTab('play');
      }
    },
    []
  );

  const handleTeleportToMap = useCallback(
    (mapName: string, wx: number, wy: number) => {
      const next = structuredClone(progress);
      next.currentMap = mapName;
      next.wx = wx;
      next.wy = wy;
      next.visitedMaps[mapName] = true;
      const stats = computeDerivedStats(next);
      if (next.hp <= 0) next.hp = stats.maxHp;
      audioEngine.playOriginalSfx('selection_menu');
      setProgress(next);
      setSavedProgress(next);
      writeSavedProgress(next);
      setSessionKey((k) => k + 1);
      setPhase('playing');
      setActiveTab('play');
    },
    [progress]
  );

  const handleOpenMapInAtlas = useCallback((mapName: string) => {
    audioEngine.playOriginalSfx('selection_menu');
    setSelectedAtlasMap(mapName);
    setPhase('playing');
    setActiveTab('maps');
  }, []);

  const handleUpdateWorld = useCallback((nextWorld: WorldBundle) => {
    setWorld(nextWorld);
  }, []);

  const handleStartNew = useCallback(() => {
    const fresh = createInitialProgress();
    audioEngine.playOriginalSfx('selection_menu');
    setProgress(fresh);
    setSavedProgress(fresh);
    writeSavedProgress(fresh);
    setSessionKey((k) => k + 1);
    setActiveTab('play');
    setPhase('playing');
  }, []);

  const handleContinue = useCallback(() => {
    const base = savedProgress ? structuredClone(savedProgress) : createInitialProgress();
    const stats = computeDerivedStats(base);
    if (base.hp <= 0) {
      base.hp = stats.maxHp;
      base.currentMap = 'maison';
      base.wx = 306;
      base.wy = 160;
      base.dir = Direction.Bas;
    }
    audioEngine.playOriginalSfx('selection_menu');
    setProgress(base);
    setSavedProgress(base);
    writeSavedProgress(base);
    setSessionKey((k) => k + 1);
    setActiveTab('play');
    setPhase('playing');
  }, [savedProgress]);

  const handleRestartAfterDeath = useCallback(() => {
    const revived = structuredClone(progress);
    const stats = computeDerivedStats(revived);
    revived.hp = stats.maxHp;
    revived.currentMap = 'maison';
    revived.wx = 306;
    revived.wy = 160;
    revived.dir = Direction.Bas;
    audioEngine.playHeal();
    setProgress(revived);
    setSavedProgress(revived);
    writeSavedProgress(revived);
    setSessionKey((k) => k + 1);
    setActiveTab('play');
    setPhase('playing');
  }, [progress]);

  const handleReturnTitle = useCallback(() => {
    audioEngine.playOriginalSfx('selection_menu');
    audioEngine.playMusic('menu');
    setPhase('title');
  }, []);

  const handleSelectTab = useCallback(
    (tab: NavTab) => {
      audioEngine.playOriginalSfx('selection_menu');
      if (phase === 'title') {
        if (tab === 'play') {
          if (savedProgress) {
            handleContinue();
          } else {
            handleStartNew();
          }
          return;
        }
        const initial = savedProgress ? structuredClone(savedProgress) : createInitialProgress();
        const stats = computeDerivedStats(initial);
        if (initial.hp <= 0) {
          initial.hp = stats.maxHp;
          initial.currentMap = 'maison';
          initial.wx = 306;
          initial.wy = 160;
          initial.dir = Direction.Bas;
        }
        setProgress(initial);
        setSessionKey((k) => k + 1);
        setPhase('playing');
      }
      setActiveTab(tab);
    },
    [phase, savedProgress, handleContinue, handleStartNew]
  );

  const handlePrimaryAction = useCallback(() => {
    if (phase === 'title') {
      if (savedProgress) {
        handleContinue();
      } else {
        handleStartNew();
      }
      return;
    }
    audioEngine.playOriginalSfx('selection_menu');
    writeSavedProgress(progress);
    setSavedProgress(progress);
    setSaveFeedback(true);
    window.setTimeout(() => setSaveFeedback(false), 1800);
  }, [phase, savedProgress, progress, handleContinue, handleStartNew]);

  const handlePhaseChange = useCallback((nextPhase: GamePhase) => {
    if (nextPhase === 'title') {
      audioEngine.playMusic('menu');
    }
    setPhase(nextPhase);
  }, []);

  return (
    <div className="min-h-screen bg-[#0e1117] text-slate-100 flex flex-col">
      <TopBar
        phase={phase}
        activeTab={activeTab}
        lang={lang}
        unspentPoints={phase === 'title' ? savedProgress?.statPoints || 0 : progress.statPoints}
        saveFeedback={saveFeedback}
        onSelectTab={handleSelectTab}
        onPrimaryAction={handlePrimaryAction}
        onReturnTitle={handleReturnTitle}
      />

      {loadError ? (
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full p-8 rounded-2xl bg-[#141a24] border border-slate-800 text-center">
            <h1 className="font-display text-xl font-bold text-rose-400 mb-2">
              {lang === 'fr' ? 'Chargement interrompu' : 'Failed to Load Realm'}
            </h1>
            <p className="text-sm text-slate-300 mb-6">{loadError}</p>
            <button
              type="button"
              onClick={loadAssets}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer"
            >
              {lang === 'fr' ? 'Réessayer' : 'Retry'}
            </button>
          </div>
        </main>
      ) : !world || !sprites ? (
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full p-8 rounded-2xl bg-[#141a24] border border-slate-800 text-center">
            <p className="font-display text-lg font-bold text-amber-300 mb-2">
              {lang === 'fr'
                ? "Chargement des Chroniques d'Ethynd..."
                : 'Loading the Chronicles of Ethynd...'}
            </p>
            <p className="text-xs text-slate-400">
              {lang === 'fr'
                ? 'Préparation des 11 régions, du bestiaire et des stèles anciennes'
                : 'Preparing 11 regions, bestiary sprites, and ancient steles'}
            </p>
          </div>
        </main>
      ) : phase === 'title' ? (
        <TitleScreen
          lang={lang}
          savedProgress={savedProgress}
          onToggleLang={handleToggleLang}
          onStartNew={handleStartNew}
          onContinue={handleContinue}
          onBrowseTab={handleSelectTab}
        />
      ) : (
        <div className="flex-1">
          <div className={activeTab === 'play' ? 'block' : 'hidden'}>
            <GameViewport
              key={sessionKey}
              lang={lang}
              world={world}
              sprites={sprites}
              progress={progress}
              phase={phase}
              paused={activeTab !== 'play'}
              onProgressChange={handleProgressChange}
              onPhaseChange={handlePhaseChange}
              onNavigateTab={handleSelectTab}
              onToggleLang={handleToggleLang}
              onRestartAfterDeath={handleRestartAfterDeath}
            />
          </div>

          {activeTab === 'maps' && (
            <MapsAtlasView
              lang={lang}
              world={world}
              defaultWorld={defaultWorld || world}
              sprites={sprites}
              progress={progress}
              selectedMapName={selectedAtlasMap}
              onSelectMapName={setSelectedAtlasMap}
              onUpdateWorld={handleUpdateWorld}
              onTeleportToMap={handleTeleportToMap}
              onBackToPlay={() => handleSelectTab('play')}
            />
          )}

          {activeTab === 'equipment' && (
            <EquipmentView
              lang={lang}
              progress={progress}
              sprites={sprites}
              onSelectTab={handleSelectTab}
              onUpdateProgress={handleProgressChange}
              onBackToPlay={() => handleSelectTab('play')}
            />
          )}

          {activeTab === 'quests' && (
            <QuestsView
              lang={lang}
              progress={progress}
              world={world}
              onSelectTab={handleSelectTab}
              onOpenMap={handleOpenMapInAtlas}
              onBackToPlay={() => handleSelectTab('play')}
            />
          )}

          {activeTab === 'bestiary' && (
            <BestiaryView
              lang={lang}
              progress={progress}
              sprites={sprites}
              world={world}
              onOpenMap={handleOpenMapInAtlas}
              onBackToPlay={() => handleSelectTab('play')}
            />
          )}

          {activeTab === 'codex' && (
            <CodexView
              lang={lang}
              progress={progress}
              onSelectTab={handleSelectTab}
              onBackToPlay={() => handleSelectTab('play')}
            />
          )}

          {activeTab === 'tests' && (
            <TestSuiteView
              lang={lang}
              world={world}
              sprites={sprites}
              progress={progress}
              onLoadProgressIntoGame={handleLoadProgressIntoGame}
              onBackToPlay={() => handleSelectTab('play')}
            />
          )}
        </div>
      )}
    </div>
  );
}
