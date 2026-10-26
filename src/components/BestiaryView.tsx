import { useEffect, useMemo, useRef, useState } from 'react';
import { BESTIARY_CATALOG } from '../game/content';
import { SpriteBank } from '../game/spriteBank';
import { MONSTER_PIXEL_PROMPTS } from '../game/spritePrompts';
import { Direction, LangCode, PlayerProgress, WorldBundle } from '../game/types';

interface BestiaryViewProps {
  lang: LangCode;
  progress: PlayerProgress;
  sprites: SpriteBank | null;
  world: WorldBundle;
  onOpenMap: (mapName: string) => void;
  onBackToPlay: () => void;
}

function AnimatedSpriteBox({
  monsterId,
  sprites,
  dir = Direction.Bas,
  sizePx = 64,
  animate = true,
}: {
  monsterId: string;
  sprites: SpriteBank | null;
  dir?: Direction;
  sizePx?: number;
  animate?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !sprites) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const anim = sprites.monsters[monsterId];
    if (!anim) return;
    const frames = anim.walk[dir] || anim.walk[Direction.Bas];
    let frameIdx = 0;

    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      const spr = frames[frameIdx % frames.length];
      const pad = Math.round(sizePx * 0.12);
      const drawSz = sizePx - pad * 2;
      ctx.drawImage(spr, pad, pad, drawSz, drawSz);
    };

    draw();
    if (!animate) return;
    const timer = window.setInterval(() => {
      frameIdx = (frameIdx + 1) % frames.length;
      draw();
    }, 180);

    return () => window.clearInterval(timer);
  }, [monsterId, sprites, dir, sizePx, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={sizePx}
      height={sizePx}
      className="rounded-lg bg-[#0d121a] border border-slate-800 pixel-canvas shrink-0"
    />
  );
}

export function BestiaryView({
  lang,
  progress,
  sprites,
  world,
  onOpenMap,
  onBackToPlay,
}: BestiaryViewProps) {
  const [filter, setFilter] = useState<'all' | 'bosses' | 'monsters' | 'fauna'>('all');
  const [selectedId, setSelectedId] = useState<string>('chevalier_os');
  const [copiedLang, setCopiedLang] = useState<'fr' | 'en' | null>(null);

  const discoveredCount = BESTIARY_CATALOG.filter(
    (b) => progress.encountered[b.id] || (progress.kills[b.id] || 0) > 0
  ).length;

  // Map spawn occurrences across all 11 maps
  const spawnInfoByType = useMemo(() => {
    const out: Record<
      string,
      {
        maps: Array<{ name: string; titleFr: string; titleEn: string; count: number }>;
        aiSet: Set<string>;
        rangedSet: Set<string>;
      }
    > = {};
    for (const m of world.maps) {
      const counts: Record<string, number> = {};
      for (const sp of m.spawns) {
        counts[sp.type] = (counts[sp.type] || 0) + 1;
        if (!out[sp.type]) {
          out[sp.type] = { maps: [], aiSet: new Set(), rangedSet: new Set() };
        }
        out[sp.type].aiSet.add(sp.ai);
        if (sp.ranged) out[sp.type].rangedSet.add(sp.ranged);
      }
      for (const [t, count] of Object.entries(counts)) {
        out[t].maps.push({ name: m.name, titleFr: m.titleFr, titleEn: m.titleEn, count });
      }
    }
    return out;
  }, [world.maps]);

  const list = BESTIARY_CATALOG.filter((b) => {
    if (filter === 'bosses') return Boolean(b.isBoss);
    if (filter === 'fauna') return Boolean(b.isPassive);
    if (filter === 'monsters') return !b.isBoss && !b.isPassive;
    return true;
  });

  const activeEntry =
    BESTIARY_CATALOG.find((b) => b.id === selectedId) || list[0] || BESTIARY_CATALOG[0];
  const activeSpawnInfo = spawnInfoByType[activeEntry.id];
  const activePromptSpec = MONSTER_PIXEL_PROMPTS[activeEntry.id] || null;

  const copyPromptText = (text: string, targetLang: 'fr' | 'en') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedLang(targetLang);
    window.setTimeout(() => setCopiedLang(null), 1800);
  };

  const rangedLabel = (r: string) => {
    if (lang === 'fr') {
      if (r === 'fireball') return 'Boule de feu';
      if (r === 'frostbolt') return 'Trait de givre';
      if (r === 'shadowbolt') return "Éclair d'ombre";
      if (r === 'poison_dart') return 'Dard venimeux';
    }
    return r;
  };

  const totalCount = BESTIARY_CATALOG.length;
  const bossCount = BESTIARY_CATALOG.filter((b) => b.isBoss).length;
  const faunaCount = BESTIARY_CATALOG.filter((b) => b.isPassive).length;
  const monsterCount = totalCount - bossCount - faunaCount;

  return (
    <main className="max-w-[1360px] mx-auto px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {lang === 'fr'
              ? `Bestiaire Illustré d'Ethynd (${totalCount} Créatures & ${bossCount} Boss)`
              : `Illustrated Bestiary of Ethynd (${totalCount} Creatures & ${bossCount} Bosses)`}
          </h1>
          <p className="text-sm text-slate-400 mt-1 tabular-nums">
            {discoveredCount}/{totalCount}{' '}
            {lang === 'fr' ? 'rencontrées en jeu' : 'encountered in play'} ·{' '}
            {Object.values(progress.kills).reduce((a, b) => a + b, 0)}{' '}
            {lang === 'fr' ? 'ennemis vaincus' : 'total foes vanquished'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#141a24] rounded-lg border border-slate-800">
            {(
              [
                { id: 'all', fr: `Tous (${totalCount})`, en: `All (${totalCount})` },
                { id: 'bosses', fr: `Grands Boss (${bossCount})`, en: `Bosses (${bossCount})` },
                { id: 'monsters', fr: `Monstres (${monsterCount})`, en: `Monsters (${monsterCount})` },
                { id: 'fauna', fr: `Faune (${faunaCount})`, en: `Fauna (${faunaCount})` },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === t.id
                    ? 'bg-slate-800 text-amber-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'fr' ? t.fr : t.en}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onBackToPlay}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {lang === 'fr' ? 'Retour au jeu' : 'Return to Game'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Spotlight Inspector: Live Animated 4-Direction Showcase */}
        <aside className="lg:col-span-5 p-6 rounded-xl bg-[#141a24] border border-slate-800/90 space-y-6">
          <div className="flex items-start gap-5">
            <AnimatedSpriteBox
              monsterId={activeEntry.id}
              sprites={sprites}
              dir={Direction.Bas}
              sizePx={96}
              animate
            />
            <div className="space-y-1.5">
              <p className="text-xs text-amber-300 font-medium">
                {lang === 'fr' ? activeEntry.roleFr : activeEntry.roleEn}
              </p>
              <h2 className="font-display text-xl font-bold text-white">
                {lang === 'fr' ? activeEntry.nameFr : activeEntry.nameEn}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'fr' ? activeEntry.habitatFr : activeEntry.habitatEn}
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-200/90 leading-relaxed">
            {lang === 'fr' ? activeEntry.loreFr : activeEntry.loreEn}
          </p>

          {/* 4-Direction Sprite Sheet Preview */}
          <div className="pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-400 mb-3">
              {lang === 'fr'
                ? 'Animations directionnelles (4 orientations)'
                : 'Directional Walk Cycle (4 Orientations)'}
            </h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              {(
                [
                  { d: Direction.Bas, fr: 'Face', en: 'Down' },
                  { d: Direction.Gauche, fr: 'Gauche', en: 'Left' },
                  { d: Direction.Droite, fr: 'Droite', en: 'Right' },
                  { d: Direction.Haut, fr: 'Dos', en: 'Up' },
                ] as const
              ).map((item) => (
                <div key={item.d} className="flex flex-col items-center gap-1.5">
                  <AnimatedSpriteBox
                    monsterId={activeEntry.id}
                    sprites={sprites}
                    dir={item.d}
                    sizePx={56}
                    animate
                  />
                  <span className="text-[11px] text-slate-400">
                    {lang === 'fr' ? item.fr : item.en}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats & Combat Behavior */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="grid grid-cols-4 gap-3 text-xs font-mono tabular-nums">
              <div>
                <span className="block text-slate-500">PV Base</span>
                <span className="text-base font-semibold text-white">{activeEntry.baseHp}</span>
              </div>
              <div>
                <span className="block text-slate-500">ATQ</span>
                <span className="text-base font-semibold text-white">{activeEntry.baseAtk}</span>
              </div>
              <div>
                <span className="block text-slate-500">XP</span>
                <span className="text-base font-semibold text-amber-300">+{activeEntry.xp}</span>
              </div>
              <div>
                <span className="block text-slate-500">
                  {lang === 'fr' ? 'Vaincus' : 'Slain'}
                </span>
                <span className="text-base font-semibold text-emerald-400">
                  {progress.kills[activeEntry.id] || 0}
                </span>
              </div>
            </div>

            {activeSpawnInfo && (
              <div className="text-xs text-slate-300 space-y-1">
                <p>
                  <span className="text-slate-400">Comportement IA : </span>
                  <span className="font-mono">{Array.from(activeSpawnInfo.aiSet).join(', ')}</span>
                  {activeSpawnInfo.rangedSet.size > 0 && (
                    <>
                      {' · '}
                      <span className="text-sky-300">
                        {Array.from(activeSpawnInfo.rangedSet).map(rangedLabel).join(', ')}
                      </span>
                    </>
                  )}
                </p>
                {activeEntry.isBoss && (
                  <p className="text-rose-300">
                    {lang === 'fr'
                      ? 'Phase Enragée (< 50 % PV) : Vitesse ×1,35 et salve triple de projectiles élémentaires.'
                      : 'Enraged Phase (< 50% HP): 1.35× move speed and triple elemental volley.'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Exact Map Spawns + Direct Link to Atlas */}
          {activeSpawnInfo && activeSpawnInfo.maps.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80">
              <h3 className="text-xs font-semibold text-slate-400 mb-2">
                {lang === 'fr'
                  ? 'Présence sur les cartes du Royaume'
                  : 'Spawn Locations Across Kingdom'}
              </h3>
              <div className="divide-y divide-slate-800/70 text-xs">
                {activeSpawnInfo.maps.map((m) => (
                  <div key={m.name} className="py-2 flex items-center justify-between gap-2">
                    <span className="text-slate-200 tabular-nums">
                      {lang === 'fr' ? m.titleFr : m.titleEn} ({m.count})
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenMap(m.name)}
                      className="text-amber-300 hover:underline font-medium cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {lang === 'fr' ? 'Voir la carte' : 'View on Map'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pixel-Art Sprite Sheet Prompt & Hex Palette Specification */}
          {activePromptSpec && (
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-amber-300">
                  {lang === 'fr'
                    ? 'Fiche Technique & Prompt Pixel-Art (Planche 4×4)'
                    : 'Pixel-Art Sprite Sheet Prompt & Palette (4×4)'}
                </h3>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {activePromptSpec.sizeSpec}
                </span>
              </div>

              <p className="text-[11px] text-slate-400">{activePromptSpec.sheetSpecFr}</p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-mono text-slate-300">
                {activePromptSpec.palette.map((sw) => (
                  <span key={sw.hex} className="inline-flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-sm border border-slate-600 inline-block shrink-0"
                      style={{ backgroundColor: sw.hex }}
                    />
                    <span>{sw.hex}</span>
                  </span>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-[#0d121a] border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono select-all">
                {lang === 'fr' ? activePromptSpec.promptFr : activePromptSpec.promptEn}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyPromptText(activePromptSpec.promptFr, 'fr')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 text-amber-300 hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedLang === 'fr' ? 'Prompt FR copié !' : 'Copier le prompt FR'}
                </button>
                <button
                  type="button"
                  onClick={() => copyPromptText(activePromptSpec.promptEn, 'en')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedLang === 'en' ? 'EN Prompt Copied!' : 'Copier le prompt EN'}
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Right List: All Filtered Creatures */}
        <section className="lg:col-span-7 p-6 rounded-xl bg-[#141a24] border border-slate-800/90">
          <div className="divide-y divide-slate-800/70">
            {list.map((entry) => {
              const kills = progress.kills[entry.id] || 0;
              const seen = Boolean(progress.encountered[entry.id] || kills > 0);
              const isSelected = entry.id === activeEntry.id;
              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  className={`py-4 px-3 -mx-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors cursor-pointer ${
                    isSelected ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <AnimatedSpriteBox
                      monsterId={entry.id}
                      sprites={sprites}
                      sizePx={56}
                      animate={isSelected}
                    />
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className={entry.isBoss ? 'text-amber-400 font-semibold' : ''}>
                          {lang === 'fr' ? entry.roleFr : entry.roleEn}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{lang === 'fr' ? entry.habitatFr : entry.habitatEn}</span>
                        {seen && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-400">
                              {lang === 'fr' ? 'Rencontré' : 'Encountered'}
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white">
                        {lang === 'fr' ? entry.nameFr : entry.nameEn}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-xs font-mono text-slate-300 tabular-nums shrink-0">
                    {!entry.isPassive ? (
                      <>
                        <span>PV {entry.baseHp}</span>
                        <span>ATQ {entry.baseAtk}</span>
                        <span className="text-amber-300">+{entry.xp} XP</span>
                      </>
                    ) : (
                      <span className="text-slate-400">
                        {lang === 'fr' ? 'Pacifique' : 'Peaceful'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
