import { useMemo, useState } from 'react';
import {
  EQUIPMENT_CATALOG,
  ITEM_CATALOG,
  QUEST_CATALOG,
  createInitialProgress,
  resolveNpcDialogue,
} from '../game/content';
import { LangCode, NavTab, PlayerProgress, WorldBundle } from '../game/types';
import { ProgressionSubNav } from './ProgressionSubNav';

interface QuestsViewProps {
  lang: LangCode;
  progress: PlayerProgress;
  world: WorldBundle;
  onSelectTab: (tab: NavTab) => void;
  onOpenMap: (mapName: string) => void;
  onBackToPlay: () => void;
}

const NPC_DIRECTORY = [
  { id: 'sage', map: 'maison', labelFr: 'Le Sage Aldric', labelEn: 'Sage Aldric' },
  { id: 'gardien', map: 'aventure', labelFr: 'Le Gardien Royal', labelEn: 'Royal Guard' },
  { id: 'marchand', map: 'aventure', labelFr: 'Marchand itinérant', labelEn: 'Traveling Merchant' },
  { id: 'forgeron', map: 'forge', labelFr: 'Maître Forgeron Brom', labelEn: 'Master Smith Brom' },
  { id: 'herboriste', map: 'forge', labelFr: 'Lysa, Herboriste', labelEn: 'Herbalist Lysa' },
  { id: 'roi', map: 'chateau', labelFr: 'Roi Édouard IV', labelEn: 'King Edward IV' },
  { id: 'archiviste', map: 'chateau', labelFr: 'Archiviste Sélène', labelEn: 'Archivist Selene' },
  { id: 'capitaine', map: 'chateau', labelFr: 'Capitaine Vane', labelEn: 'Captain Vane' },
  { id: 'elowen', map: 'foret', labelFr: 'Élowen de Sylvebrume', labelEn: 'Ranger Elowen' },
  { id: 'veilleur', map: 'terres_ardentes', labelFr: 'Kael, Veilleur', labelEn: 'Watcher Kael' },
];

type DialogueStage = 'live' | 'start' | 'act1' | 'act2' | 'act3' | 'act4';

function buildSimulatedProgress(stage: DialogueStage, live: PlayerProgress): PlayerProgress {
  if (stage === 'live') return live;
  const p = createInitialProgress();
  if (stage === 'start') return p;
  // Act I done (Dawn shard recovered)
  p.flags.talked_sage = true;
  p.inventory.crystal_aube = 1;
  p.inventory.siderite = 2;
  if (stage === 'act1') return p;

  // Act II done (Iron shard recovered)
  p.flags.act1_done = true;
  p.flags.talked_roi = true;
  p.inventory.crystal_fer = 1;
  p.inventory.insigne_garde = 1;
  if (stage === 'act2') return p;

  // Act III done (Azure shard recovered)
  p.flags.act2_done = true;
  p.flags.talked_elowen = true;
  p.inventory.crystal_azur = 1;
  p.inventory.fleur_lune = 3;
  if (stage === 'act3') return p;

  // Act IV done (All 4 shards recovered)
  p.flags.act3_done = true;
  p.inventory.crystal_amethyste = 1;
  p.unlockedLore = {
    lore_1_prisme: true,
    lore_2_fondation: true,
    lore_3_cimetiere: true,
    lore_4_ignis: true,
    lore_5_siderite: true,
    lore_6_couronne: true,
    lore_7_ordre_eclipse: true,
    lore_8_malakor: true,
  };
  return p;
}

export function QuestsView({
  lang,
  progress,
  world,
  onSelectTab,
  onOpenMap,
  onBackToPlay,
}: QuestsViewProps) {
  const [actFilter, setActFilter] = useState<'all' | 1 | 2 | 3 | 4 | 5 | 'side'>('all');
  const [selectedNpc, setSelectedNpc] = useState<string>('sage');
  const [dlgStage, setDlgStage] = useState<DialogueStage>('live');

  const loreCount = Object.keys(progress.unlockedLore).length;
  const completedCount = Object.keys(progress.completedQuests).length;

  const questProgressLabel = (qId: string) => {
    const q = QUEST_CATALOG.find((x) => x.id === qId)!;
    if (progress.completedQuests[q.id]) {
      return lang === 'fr' ? 'Accomplie' : 'Completed';
    }
    if (q.check.kind === 'kill') {
      const cur = Math.min(q.check.count || 1, progress.kills[q.check.target] || 0);
      return `${cur} / ${q.check.count || 1}`;
    }
    if (q.check.kind === 'lore_count') {
      return `${Math.min(q.check.count || 1, loreCount)} / ${q.check.count || 1}`;
    }
    if (q.prereqFlag && !progress.flags[q.prereqFlag]) {
      return lang === 'fr' ? 'À débloquer' : 'Locked';
    }
    return lang === 'fr' ? 'En cours' : 'Active';
  };

  const filteredQuests = QUEST_CATALOG.filter((q) => {
    if (actFilter === 'side') return Boolean(q.isSide);
    if (typeof actFilter === 'number') return !q.isSide && q.act === actFilter;
    return true;
  });

  const previewDialogue = useMemo(() => {
    const sim = buildSimulatedProgress(dlgStage, progress);
    return resolveNpcDialogue(selectedNpc, sim).dialogue;
  }, [selectedNpc, dlgStage, progress]);

  const activeNpcMeta = NPC_DIRECTORY.find((n) => n.id === selectedNpc) || NPC_DIRECTORY[0];

  return (
    <main className="max-w-[1360px] mx-auto px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {lang === 'fr'
              ? "Journal des 28 Quêtes & Arbre des Dialogues d'Ethynd"
              : 'Journal of 28 Quests & NPC Dialogue Inspector'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 tabular-nums">
            {completedCount}/{QUEST_CATALOG.length}{' '}
            {lang === 'fr' ? 'missions accomplies' : 'quests completed'} · 5 Actes narratifs ·{' '}
            {world.maps.length} {lang === 'fr' ? 'régions' : 'regions'}
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToPlay}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {lang === 'fr' ? 'Retour au jeu' : 'Return to Game'}
        </button>
      </div>

      <ProgressionSubNav
        lang={lang}
        activeTab="quests"
        progress={progress}
        onSelectTab={onSelectTab}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Complete 28 Quests Breakdown */}
        <section className="lg:col-span-7 p-6 rounded-xl bg-[#141a24] border border-slate-800/90">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-base font-semibold text-white">
              {lang === 'fr' ? 'Épopée en 5 Actes & Contrats' : '5-Act Storyline & Contracts'}
            </h2>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
              {(
                [
                  { id: 'all', fr: 'Toutes (28)', en: 'All (28)' },
                  { id: 1, fr: 'Acte I', en: 'Act I' },
                  { id: 2, fr: 'Acte II', en: 'Act II' },
                  { id: 3, fr: 'Acte III', en: 'Act III' },
                  { id: 4, fr: 'Acte IV', en: 'Act IV' },
                  { id: 5, fr: 'Acte V', en: 'Act V' },
                  { id: 'side', fr: 'Secondaires (7)', en: 'Side (7)' },
                ] as const
              ).map((t) => (
                <button
                  key={String(t.id)}
                  type="button"
                  onClick={() => setActFilter(t.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    actFilter === t.id
                      ? 'bg-slate-800 text-amber-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang === 'fr' ? t.fr : t.en}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-800/70">
            {filteredQuests.map((q) => {
              const done = Boolean(progress.completedQuests[q.id]);
              const eqReward = q.rewardEquip
                ? EQUIPMENT_CATALOG.find((e) => e.id === q.rewardEquip)
                : null;
              const itemReward = q.rewardItem
                ? ITEM_CATALOG.find((i) => i.id === q.rewardItem)
                : null;

              return (
                <div key={q.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="text-amber-300/90 font-medium">
                        {q.isSide
                          ? lang === 'fr'
                            ? `Contrat · Acte ${q.act}`
                            : `Contract · Act ${q.act}`
                          : lang === 'fr'
                          ? `Acte ${q.act}`
                          : `Act ${q.act}`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{lang === 'fr' ? q.regionFr : q.regionEn}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-500">
                        {q.check.kind}:{q.check.target}
                        {q.check.count ? `(${q.check.count})` : ''}
                      </span>
                    </div>

                    <h3
                      className={`text-sm font-semibold ${
                        done ? 'text-slate-400 line-through' : 'text-white'
                      }`}
                    >
                      {lang === 'fr' ? q.titleFr : q.titleEn}
                    </h3>

                    <p className="text-xs text-slate-300/90 leading-relaxed">
                      {lang === 'fr' ? q.descFr : q.descEn}
                    </p>

                    <p className="text-xs font-mono text-amber-300/90 tabular-nums">
                      +{q.rewardXp} XP · +{q.rewardGold} {lang === 'fr' ? 'Or' : 'Gold'}
                      {eqReward
                        ? ` · ${lang === 'fr' ? eqReward.nameFr : eqReward.nameEn}`
                        : ''}
                      {itemReward
                        ? ` · ${lang === 'fr' ? itemReward.nameFr : itemReward.nameEn}`
                        : ''}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-mono shrink-0 tabular-nums ${
                      done ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {questProgressLabel(q.id)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: Multi-State NPC Dialogue Explorer */}
        <aside className="lg:col-span-5 p-6 rounded-xl bg-[#141a24] border border-slate-800/90 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              {lang === 'fr'
                ? 'Inspecteur des Dialogues PNJ (10 Personnages)'
                : 'NPC Dialogue Inspector (10 Characters)'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'fr'
                ? 'Sélectionnez un habitant et une étape de progression pour vérifier ses répliques, ses boutiques et ses choix de quête.'
                : 'Select any NPC and story stage to preview their lines, shops, and quest turn-in choices.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {NPC_DIRECTORY.map((npc) => (
              <button
                key={npc.id}
                type="button"
                onClick={() => setSelectedNpc(npc.id)}
                className={`px-3 py-2 text-xs text-left rounded-lg border transition-colors cursor-pointer truncate ${
                  selectedNpc === npc.id
                    ? 'bg-slate-800 border-amber-500/60 text-amber-300 font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {lang === 'fr' ? npc.labelFr : npc.labelEn}
              </button>
            ))}
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-2">
              {lang === 'fr' ? 'Étape narrative simulée :' : 'Simulated story state:'}
            </p>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
              {(
                [
                  { id: 'live', fr: 'Partie actuelle', en: 'Live Save' },
                  { id: 'start', fr: 'Début', en: 'Start' },
                  { id: 'act1', fr: 'Fin Acte I', en: 'End Act I' },
                  { id: 'act2', fr: 'Fin Acte II', en: 'End Act II' },
                  { id: 'act3', fr: 'Fin Acte III', en: 'End Act III' },
                  { id: 'act4', fr: '4 Éclats', en: '4 Shards' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setDlgStage(st.id)}
                  className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    dlgStage === st.id
                      ? 'bg-slate-800 text-amber-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang === 'fr' ? st.fr : st.en}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-emerald-300">
                {lang === 'fr' ? previewDialogue.speakerFr : previewDialogue.speakerEn}
              </p>
              <button
                type="button"
                onClick={() => onOpenMap(activeNpcMeta.map)}
                className="text-xs text-amber-300 hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                {lang === 'fr'
                  ? `Voir carte (${activeNpcMeta.map})`
                  : `View map (${activeNpcMeta.map})`}
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-200 leading-relaxed">
              {(lang === 'fr' ? previewDialogue.linesFr : previewDialogue.linesEn).map(
                (line, idx) => (
                  <p key={idx}>« {line} »</p>
                )
              )}
            </div>

            {previewDialogue.choices && previewDialogue.choices.length > 0 && (
              <div className="pt-2 space-y-1 text-xs text-slate-400">
                <p className="font-semibold text-slate-300">
                  {lang === 'fr' ? 'Choix interactifs proposés :' : 'Interactive choices:'}
                </p>
                {previewDialogue.choices.map((c, idx) => (
                  <p key={idx} className="font-mono text-amber-300/90">
                    → {lang === 'fr' ? c.labelFr : c.labelEn} [{c.action}]
                  </p>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
