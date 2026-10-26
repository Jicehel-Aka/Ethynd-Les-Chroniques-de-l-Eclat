import { useState } from 'react';
import bannerImg from '../assets/images/ethynd_valley_banner_1792883208612.jpg';
import { LangCode, NavTab, PlayerProgress } from '../game/types';

interface TitleScreenProps {
  lang: LangCode;
  savedProgress: PlayerProgress | null;
  onToggleLang: (lang: LangCode) => void;
  onStartNew: () => void;
  onContinue: () => void;
  onBrowseTab: (tab: NavTab) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function TitleScreen({
  lang,
  savedProgress,
  onToggleLang,
  onStartNew,
  onContinue,
  onBrowseTab,
}: TitleScreenProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const shardsCount = savedProgress
    ? ['crystal_aube', 'crystal_fer', 'crystal_azur', 'crystal_amethyste'].filter(
        (k) => (savedProgress.inventory[k] || 0) > 0
      ).length
    : 0;

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#161d2b] via-[#121824] to-[#0e1117]">
        {!imgFailed && (
          <img
            src={bannerImg}
            alt="Panorama de la Vallée d'Ethynd, la maison du Sage au bord de la cascade, la grotte cristalline et le Château Royal"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1117] via-[#0e1117]/75 to-[#0e1117]/30" />

        <div className="relative z-10 px-8 py-14 md:px-14 md:py-20 flex flex-col justify-end min-h-[440px]">
          <div className="flex items-center justify-between gap-4 mb-6">
            <p className="text-xs font-medium tracking-wide text-amber-300/90">
              {lang === 'fr'
                ? 'Édition Chroniques Étendues · 5 Actes · 11 Régions & Donjons'
                : 'Expanded Chronicles Edition · 5 Acts · 11 Regions & Dungeons'}
            </p>
            <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-700/70 rounded-lg">
              <button
                type="button"
                onClick={() => onToggleLang('fr')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  lang === 'fr' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                Français
              </button>
              <button
                type="button"
                onClick={() => onToggleLang('en')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  lang === 'en' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight max-w-2xl mb-4">
            {lang === 'fr'
              ? "Ethynd : Les Chroniques de l'Éclat"
              : 'Ethynd: Chronicles of the Prism'}
          </h1>

          <p className="text-base text-slate-200/90 max-w-2xl leading-relaxed mb-8">
            {lang === 'fr'
              ? "Le vol du Cristal de l'Aube dans la grotte de Morvath n'était que le prélude. Franchissez les portes du Château Royal, explorez Sylvebrume, la Nécropole et les Terres Ardentes pour réunir les Quatre Éclats et affronter enfin Pyraxis, le Grand Dragon Rouge."
              : 'The theft of the Dawn Crystal in Morvath’s cavern was only the prelude. Enter the Royal Castle, venture through Sylvebrume, the Necropolis, and the Scorched Lands to reunite all Four Shards before facing Pyraxis, the Great Red Dragon.'}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {savedProgress && (
              <button
                type="button"
                onClick={onContinue}
                className="px-6 py-3 text-sm font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {lang === 'fr' ? 'Continuer la partie' : 'Continue Saved Game'}
              </button>
            )}

            <button
              type="button"
              onClick={onStartNew}
              className={`px-6 py-3 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                savedProgress
                  ? 'bg-slate-800/90 text-slate-100 border border-slate-700 hover:bg-slate-700'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              }`}
            >
              {lang === 'fr' ? 'Nouvelle partie' : 'New Adventure'}
            </button>

            <button
              type="button"
              onClick={() => onBrowseTab('maps')}
              className="px-4 py-3 text-sm font-medium rounded-lg text-slate-200 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {lang === 'fr' ? 'Voir les 11 Cartes' : 'Explore 11 Maps'}
            </button>

            <button
              type="button"
              onClick={() => onBrowseTab('quests')}
              className="px-4 py-3 text-sm font-medium rounded-lg text-slate-200 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {lang === 'fr' ? 'Quêtes & Dialogues' : 'Quests & Dialogues'}
            </button>

            <button
              type="button"
              onClick={() => onBrowseTab('bestiary')}
              className="px-4 py-3 text-sm font-medium rounded-lg text-slate-200 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {lang === 'fr' ? 'Bestiaire (27)' : 'Bestiary (27)'}
            </button>

            <button
              type="button"
              onClick={() => onBrowseTab('tests')}
              className="px-4 py-3 text-sm font-medium rounded-lg text-amber-300 hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {lang === 'fr' ? 'Outil de Test Automatisé' : 'Automated Test Suite'}
            </button>
          </div>

          {savedProgress && (
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs text-slate-300 tabular-nums">
              <span>
                {lang === 'fr' ? 'Sauvegarde active' : 'Active Save'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {lang === 'fr' ? `Niveau ${savedProgress.level}` : `Level ${savedProgress.level}`}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {savedProgress.gold} {lang === 'fr' ? 'Or' : 'Gold'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {shardsCount}/4 {lang === 'fr' ? 'Éclats' : 'Shards'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {Object.keys(savedProgress.unlockedLore).length}/16 Codex
              </span>
              <span aria-hidden="true">·</span>
              <span>{formatDuration(savedProgress.playSeconds)}</span>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl bg-[#141a24] border border-slate-800/90">
          <p className="font-mono text-2xl font-semibold text-amber-400 tabular-nums mb-1">11 Cartes · 5 Donjons</p>
          <h2 className="text-sm font-semibold text-slate-100 mb-2">
            {lang === 'fr' ? 'Royaume Interconnecté' : 'Expanded Kingdom'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {lang === 'fr'
              ? "De la Maison du Sage et la Grotte d'origine jusqu'au Château Royal, les Oubliettes, Sylvebrume, le Temple Englouti, la Nécropole et Pyra."
              : 'From the original Cottage and Dawn Cavern to the Royal Castle, Dungeons, Sylvebrume, Sunken Temple, Necropolis, and Pyra.'}
          </p>
        </div>

        <div className="p-6 rounded-xl bg-[#141a24] border border-slate-800/90">
          <p className="font-mono text-2xl font-semibold text-amber-400 tabular-nums mb-1">27 Créatures · 5 Boss</p>
          <h2 className="text-sm font-semibold text-slate-100 mb-2">
            {lang === 'fr' ? 'Bestiaire & Projectiles' : 'Bestiary & Boss Phases'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {lang === 'fr'
              ? "Affrontez squelettes, golems runiques, vouivres, mages de l'Éclipse et cinq grands boss dotés d'attaques élémentaires et de phases enragées."
              : 'Battle skeletal guards, runic golems, wyverns, Eclipse mages, and five multi-phase bosses with elemental volleys.'}
          </p>
        </div>

        <div className="p-6 rounded-xl bg-[#141a24] border border-slate-800/90">
          <p className="font-mono text-2xl font-semibold text-amber-400 tabular-nums mb-1">24 Équipements · Forge</p>
          <h2 className="text-sm font-semibold text-slate-100 mb-2">
            {lang === 'fr' ? 'Progression & Aptitudes' : 'Gear & Smithing'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {lang === 'fr'
              ? "Montez jusqu'au niveau 20, répartissez vos points (Vitalité, Force, Agilité, Arcane), lancez l'Onde de Lumière [E] et forgez vos armes jusqu'à +3."
              : 'Advance to Level 20, allocate attribute points, unleash the Arcane Wave [E], and upgrade weapons and armor up to +3.'}
          </p>
        </div>

        <div className="p-6 rounded-xl bg-[#141a24] border border-slate-800/90">
          <p className="font-mono text-2xl font-semibold text-amber-400 tabular-nums mb-1">28 Quêtes · 16 Stèles</p>
          <h2 className="text-sm font-semibold text-slate-100 mb-2">
            {lang === 'fr' ? 'Épopée & Lore Complet' : 'Quests & Lore Codex'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {lang === 'fr'
              ? "Cinq actes narratifs, contrats secondaires auprès des artisans et 16 stèles anciennes retraçant l'histoire millénaire du Prisme d'Ethynd."
              : 'Five story acts, artisan side contracts, and 16 ancient steles chronicling the millennial history of the Prism.'}
          </p>
        </div>
      </section>
    </main>
  );
}
