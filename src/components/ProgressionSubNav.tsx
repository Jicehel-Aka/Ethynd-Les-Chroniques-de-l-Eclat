import { EQUIPMENT_CATALOG, LORE_CODEX, QUEST_CATALOG } from '../game/content';
import { LangCode, NavTab, PlayerProgress } from '../game/types';

interface ProgressionSubNavProps {
  lang: LangCode;
  activeTab: NavTab;
  progress: PlayerProgress;
  onSelectTab: (tab: NavTab) => void;
}

export function ProgressionSubNav({
  lang,
  activeTab,
  progress,
  onSelectTab,
}: ProgressionSubNavProps) {
  const completedQuests = Object.keys(progress.completedQuests).length;
  const unlockedLore = Object.keys(progress.unlockedLore).length;

  const tabs: Array<{ id: NavTab; fr: string; en: string }> = [
    {
      id: 'quests',
      fr: `Quêtes & Dialogues (${completedQuests}/${QUEST_CATALOG.length})`,
      en: `Quests & Dialogues (${completedQuests}/${QUEST_CATALOG.length})`,
    },
    {
      id: 'equipment',
      fr:
        progress.statPoints > 0
          ? `Équipement & Forge (${progress.ownedEquip.length}/${EQUIPMENT_CATALOG.length} · +${progress.statPoints} pts)`
          : `Équipement & Forge (${progress.ownedEquip.length}/${EQUIPMENT_CATALOG.length})`,
      en:
        progress.statPoints > 0
          ? `Equipment & Forge (${progress.ownedEquip.length}/${EQUIPMENT_CATALOG.length} · +${progress.statPoints} pts)`
          : `Equipment & Forge (${progress.ownedEquip.length}/${EQUIPMENT_CATALOG.length})`,
    },
    {
      id: 'codex',
      fr: `Codex & Stèles (${unlockedLore}/${LORE_CODEX.length})`,
      en: `Lore Codex (${unlockedLore}/${LORE_CODEX.length})`,
    },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#141a24] border border-slate-800/90 w-fit">
      {tabs.map((t) => {
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectTab(t.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
              active
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            {lang === 'fr' ? t.fr : t.en}
          </button>
        );
      })}
    </div>
  );
}
