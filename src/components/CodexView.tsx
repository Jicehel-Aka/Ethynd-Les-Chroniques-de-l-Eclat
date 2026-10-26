import { useState } from 'react';
import { LORE_CODEX } from '../game/content';
import { LangCode, NavTab, PlayerProgress } from '../game/types';
import { ProgressionSubNav } from './ProgressionSubNav';

interface CodexViewProps {
  lang: LangCode;
  progress: PlayerProgress;
  onSelectTab: (tab: NavTab) => void;
  onBackToPlay: () => void;
}

export function CodexView({ lang, progress, onSelectTab, onBackToPlay }: CodexViewProps) {
  const unlockedIds = Object.keys(progress.unlockedLore);
  const firstUnlocked = LORE_CODEX.find((l) => progress.unlockedLore[l.id]) || LORE_CODEX[0];
  const [selectedId, setSelectedId] = useState<string>(firstUnlocked.id);
  const [revealAll, setRevealAll] = useState(false);

  const activeEntry = LORE_CODEX.find((l) => l.id === selectedId) || LORE_CODEX[0];
  const isUnlocked = revealAll || Boolean(progress.unlockedLore[activeEntry.id]);

  return (
    <main className="max-w-[1360px] mx-auto px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {lang === 'fr' ? "Codex Historique d'Ethynd" : 'Historical Codex of Ethynd'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 tabular-nums">
            {unlockedIds.length}/{LORE_CODEX.length}{' '}
            {lang === 'fr'
              ? 'stèles et grimoires anciens déchiffrés dans le monde'
              : 'ancient steles and grimoires deciphered across the world'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRevealAll((v) => !v)}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-700 bg-slate-900 text-amber-300 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {revealAll
              ? lang === 'fr'
                ? 'Afficher uniquement mes découvertes'
                : 'Show My Unlocks Only'
              : lang === 'fr'
              ? 'Consulter les 16 textes (Lecture intégrale)'
              : 'Read All 16 Entries'}
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

      <ProgressionSubNav
        lang={lang}
        activeTab="codex"
        progress={progress}
        onSelectTab={onSelectTab}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-5 p-5 rounded-xl bg-[#141a24] border border-slate-800/90 divide-y divide-slate-800/70">
          {LORE_CODEX.map((entry) => {
            const found = Boolean(progress.unlockedLore[entry.id]);
            const selected = entry.id === activeEntry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedId(entry.id)}
                className={`w-full py-3 px-3 text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                  selected ? 'bg-slate-800/70 text-amber-300' : 'text-slate-300 hover:bg-slate-800/35'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {found
                      ? lang === 'fr'
                        ? entry.titleFr
                        : entry.titleEn
                      : `${entry.chapter}. ${lang === 'fr' ? 'Stèle non découverte' : 'Undiscovered Stele'}`}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {lang === 'fr' ? entry.locationFr : entry.locationEn}
                  </p>
                </div>
                <span className={`text-xs font-mono shrink-0 ${found ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {found ? (lang === 'fr' ? 'Lu' : 'Read') : '?'}
                </span>
              </button>
            );
          })}
        </aside>

        <article className="lg:col-span-7 p-8 rounded-xl bg-[#141a24] border border-slate-800/90 space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{lang === 'fr' ? activeEntry.eraFr : activeEntry.eraEn}</span>
            <span aria-hidden="true">·</span>
            <span>{lang === 'fr' ? activeEntry.locationFr : activeEntry.locationEn}</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-white">
            {isUnlocked
              ? lang === 'fr'
                ? activeEntry.titleFr
                : activeEntry.titleEn
              : lang === 'fr'
              ? 'Inscription Scellée'
              : 'Sealed Inscription'}
          </h2>

          {isUnlocked ? (
            <div className="space-y-4 text-base text-slate-200 leading-relaxed">
              {(lang === 'fr' ? activeEntry.textFr : activeEntry.textEn).map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          ) : (
            <div className="py-8 text-sm text-slate-400 space-y-2">
              <p>
                {lang === 'fr'
                  ? "Vous n'avez pas encore déchiffré cette stèle ou ce grimoire au cours de votre exploration."
                  : 'You have not yet deciphered this stele or grimoire during your exploration.'}
              </p>
              <p className="text-amber-300/90">
                {lang === 'fr'
                  ? `Indice d'emplacement : ${activeEntry.locationFr}`
                  : `Location hint: ${activeEntry.locationEn}`}
              </p>
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
