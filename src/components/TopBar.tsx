import { GamePhase, LangCode, NavTab } from '../game/types';

interface TopBarProps {
  phase: GamePhase;
  activeTab: NavTab;
  lang: LangCode;
  unspentPoints: number;
  saveFeedback: boolean;
  onSelectTab: (tab: NavTab) => void;
  onPrimaryAction: () => void;
  onReturnTitle: () => void;
}

export function TopBar({
  phase,
  activeTab,
  lang,
  unspentPoints,
  saveFeedback,
  onSelectTab,
  onPrimaryAction,
  onReturnTitle,
}: TopBarProps) {
  const navItems: Array<{ id: NavTab; fr: string; en: string; matchTabs?: NavTab[] }> = [
    { id: 'play', fr: 'Aventure', en: 'Adventure' },
    { id: 'maps', fr: 'Cartes', en: 'Maps' },
    {
      id: 'quests',
      fr: unspentPoints > 0 ? `Quêtes (+${unspentPoints})` : 'Quêtes',
      en: unspentPoints > 0 ? `Quests (+${unspentPoints})` : 'Quests',
      matchTabs: ['quests', 'equipment', 'codex'],
    },
    { id: 'bestiary', fr: 'Bestiaire', en: 'Bestiary' },
    { id: 'tests', fr: 'Tests', en: 'Tests' },
  ];

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800/90 bg-[#0e1117]/95 backdrop-blur-sm">
      <button
        type="button"
        onClick={onReturnTitle}
        className="font-display text-lg font-bold tracking-wide text-slate-100 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer"
      >
        Ethynd : Les Chroniques de l&apos;Éclat
      </button>

      <nav className="flex items-center gap-6 overflow-x-auto text-sm font-medium text-slate-400">
        {navItems.map((item) => {
          const matched = item.matchTabs ? item.matchTabs.includes(activeTab) : activeTab === item.id;
          const isActive = phase !== 'title' && matched;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent hover:text-slate-100 hover:border-slate-600'
              }`}
            >
              {lang === 'fr' ? item.fr : item.en}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onPrimaryAction}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {phase === 'title'
            ? lang === 'fr'
              ? 'Jouer'
              : 'Play'
            : saveFeedback
            ? lang === 'fr'
              ? 'Sauvegardé'
              : 'Saved'
            : lang === 'fr'
            ? 'Sauvegarder'
            : 'Save Game'}
        </button>
      </div>
    </header>
  );
}
