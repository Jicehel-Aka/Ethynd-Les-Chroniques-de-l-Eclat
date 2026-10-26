import { useEffect, useState } from 'react';
import { audioEngine } from '../game/audioEngine';
import {
  EQUIPMENT_CATALOG,
  ITEM_CATALOG,
  computeDerivedStats,
  xpRequiredForLevel,
} from '../game/content';
import { SpriteBank } from '../game/spriteBank';
import { EquipSlot, LangCode, NavTab, PlayerAttributes, PlayerProgress } from '../game/types';
import { ProgressionSubNav } from './ProgressionSubNav';

interface EquipmentViewProps {
  lang: LangCode;
  progress: PlayerProgress;
  sprites: SpriteBank;
  onSelectTab: (tab: NavTab) => void;
  onUpdateProgress: (next: PlayerProgress) => void;
  onBackToPlay: () => void;
}

export function EquipmentView({
  lang,
  progress,
  sprites,
  onSelectTab,
  onUpdateProgress,
  onBackToPlay,
}: EquipmentViewProps) {
  const [slotFilter, setSlotFilter] = useState<'all' | EquipSlot>('all');
  const stats = computeDerivedStats(progress);
  const xpReq = xpRequiredForLevel(progress.level);
  const isAtForge = progress.currentMap === 'forge';

  // Exit Inventory / Equipment view on AKA Bouton B (Gamepad B / Start) or Keyboard B / Escape / Backspace / I
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'Backspace' || e.code === 'KeyB' || e.code === 'KeyI') {
        e.preventDefault();
        onBackToPlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    let raf = 0;
    let prevExitPressed = true; // Avoid immediate trigger if button was held on entry
    const pollGamepad = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = pads[0] || pads[1] || pads[2] || pads[3];
      if (gp) {
        const exitPressed = Boolean(gp.buttons[1]?.pressed || gp.buttons[9]?.pressed);
        if (exitPressed && !prevExitPressed) {
          onBackToPlay();
          return;
        }
        prevExitPressed = exitPressed;
      } else {
        prevExitPressed = false;
      }
      raf = requestAnimationFrame(pollGamepad);
    };
    raf = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      cancelAnimationFrame(raf);
    };
  }, [onBackToPlay]);

  const allocatePoint = (attr: keyof PlayerAttributes) => {
    if (progress.statPoints <= 0) return;
    const next = structuredClone(progress);
    next.statPoints -= 1;
    next.attrs[attr] += 1;
    const nextStats = computeDerivedStats(next);
    if (attr === 'vitality') {
      next.hp = Math.min(nextStats.maxHp, next.hp + 4);
    }
    audioEngine.playOriginalSfx('selection_menu');
    onUpdateProgress(next);
  };

  const equipItem = (eqId: string, slot: EquipSlot) => {
    const next = structuredClone(progress);
    next.equipped[slot] = next.equipped[slot] === eqId ? null : eqId;
    const nextStats = computeDerivedStats(next);
    if (next.hp > nextStats.maxHp) next.hp = nextStats.maxHp;
    audioEngine.playOriginalSfx('selection_menu');
    onUpdateProgress(next);
  };

  const upgradeEquip = (eqId: string) => {
    if (progress.currentMap !== 'forge') return;
    const def = EQUIPMENT_CATALOG.find((e) => e.id === eqId);
    if (!def) return;
    const curUpg = progress.upgrades[eqId] || 0;
    if (curUpg >= 3) return;
    const matKey = curUpg >= 2 ? 'ecaille_dragon' : def.upgradeMat || 'siderite';
    const goldCost = (curUpg + 1) * 60;
    if (progress.gold < goldCost || (progress.inventory[matKey] || 0) < 1) return;

    const next = structuredClone(progress);
    next.gold -= goldCost;
    next.inventory[matKey] -= 1;
    next.upgrades[eqId] = curUpg + 1;
    audioEngine.playForgeClang();
    onUpdateProgress(next);
  };

  const consumeItem = (itemId: string) => {
    const def = ITEM_CATALOG.find((i) => i.id === itemId);
    if (!def || def.heal <= 0 || (progress.inventory[itemId] || 0) <= 0) return;
    if (progress.hp >= stats.maxHp) return;
    const next = structuredClone(progress);
    next.inventory[itemId] -= 1;
    next.hp = Math.min(stats.maxHp, next.hp + def.heal + next.attrs.vitality);
    audioEngine.playHeal();
    onUpdateProgress(next);
  };

  const ownedGear = EQUIPMENT_CATALOG.filter(
    (e) =>
      progress.ownedEquip.includes(e.id) &&
      (slotFilter === 'all' || e.slot === slotFilter)
  );

  const slotLabel = (slot: EquipSlot) => {
    if (lang === 'fr') {
      return slot === EquipSlot.Weapon
        ? 'Arme'
        : slot === EquipSlot.Armor
        ? 'Armure'
        : slot === EquipSlot.Shield
        ? 'Bouclier'
        : 'Relique';
    }
    return slot === EquipSlot.Weapon
      ? 'Weapon'
      : slot === EquipSlot.Armor
      ? 'Armor'
      : slot === EquipSlot.Shield
      ? 'Shield'
      : 'Relic';
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {lang === 'fr' ? 'Personnage, Aptitudes & Arsenal' : 'Character, Attributes & Arsenal'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 tabular-nums">
            {lang === 'fr' ? `Niveau ${progress.level}` : `Level ${progress.level}`} · XP {progress.xp}/{xpReq} · {progress.gold} {lang === 'fr' ? 'Or' : 'Gold'} · {progress.ownedEquip.length}/24 {lang === 'fr' ? 'équipements découverts' : 'gear pieces unlocked'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToPlay}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {lang === 'fr' ? 'Retour au jeu [B / Échap]' : 'Return to Game [B / Esc]'}
        </button>
      </div>

      <ProgressionSubNav
        lang={lang}
        activeTab="equipment"
        progress={progress}
        onSelectTab={onSelectTab}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Stats & Attributes */}
        <section className="lg:col-span-5 p-6 rounded-xl bg-[#141a24] border border-slate-800/90 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white mb-4">
              {lang === 'fr' ? 'Caractéristiques de Combat' : 'Combat Statistics'}
            </h2>
            <dl className="divide-y divide-slate-800/70 text-sm tabular-nums">
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-slate-400">{lang === 'fr' ? 'Points de Vie (PV)' : 'Hit Points (HP)'}</dt>
                <dd className="font-mono font-semibold text-emerald-400">
                  {progress.hp} / {stats.maxHp}
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-slate-400">{lang === 'fr' ? "Attaque d'Épée" : 'Sword Attack'}</dt>
                <dd className="font-mono font-semibold text-slate-100">{stats.attack}</dd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-slate-400">{lang === 'fr' ? 'Défense Totale' : 'Total Defense'}</dt>
                <dd className="font-mono font-semibold text-slate-100">{stats.defense}</dd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-slate-400">{lang === 'fr' ? 'Onde de Lumière [E]' : 'Arcane Wave [E]'}</dt>
                <dd className="font-mono font-semibold text-sky-300">
                  {stats.arcanePower} {lang === 'fr' ? 'dégâts' : 'dmg'} ({(stats.skillCooldownTicks / 30).toFixed(1)}s)
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-slate-400">{lang === 'fr' ? 'Chance Critique' : 'Critical Chance'}</dt>
                <dd className="font-mono font-semibold text-amber-300">{stats.critChance}%</dd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-slate-400">{lang === 'fr' ? 'Drain de Vie par coup' : 'Life Drain on Hit'}</dt>
                <dd className="font-mono font-semibold text-purple-300">+{stats.lifesteal} PV</dd>
              </div>
            </dl>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">
                {lang === 'fr' ? "Points d'Aptitude" : 'Attribute Points'}
              </h2>
              <span className="text-xs font-mono text-amber-400 tabular-nums">
                {progress.statPoints} {lang === 'fr' ? 'disponible(s)' : 'available'}
              </span>
            </div>

            <div className="divide-y divide-slate-800/70">
              {(
                [
                  {
                    key: 'vitality',
                    fr: 'Vitalité',
                    en: 'Vitality',
                    subFr: '+4 PV max & efficacité des potions',
                    subEn: '+4 Max HP & potion potency',
                  },
                  {
                    key: 'strength',
                    fr: 'Force',
                    en: 'Strength',
                    subFr: "+2 Attaque d'arme",
                    subEn: '+2 Sword Attack',
                  },
                  {
                    key: 'agility',
                    fr: 'Agilité',
                    en: 'Agility',
                    subFr: '+3% Critique & vitesse de marche',
                    subEn: '+3% Crit & movement speed',
                  },
                  {
                    key: 'arcane',
                    fr: 'Arcane',
                    en: 'Arcane',
                    subFr: "+4 Dégâts d'Onde [E] & recharge réduite",
                    subEn: '+4 Wave Damage [E] & faster cooldown',
                  },
                ] as const
              ).map((row) => (
                <div key={row.key} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {lang === 'fr' ? row.fr : row.en}{' '}
                      <span className="font-mono text-amber-300 tabular-nums">({progress.attrs[row.key]})</span>
                    </p>
                    <p className="text-xs text-slate-400">{lang === 'fr' ? row.subFr : row.subEn}</p>
                  </div>
                  <button
                    type="button"
                    disabled={progress.statPoints <= 0}
                    onClick={() => allocatePoint(row.key)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      progress.statPoints > 0
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer'
                        : 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    +1
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <h2 className="text-base font-semibold text-white mb-3">
              {lang === 'fr' ? 'Sacoche & Éclats Sacrés' : 'Satchel & Sacred Shards'}
            </h2>
            <div className="divide-y divide-slate-800/70">
              {ITEM_CATALOG.filter((it) => (progress.inventory[it.id] || 0) > 0).map((it) => {
                const iconCanvas = sprites.items[it.icon];
                return (
                  <div key={it.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {iconCanvas && (
                        <img
                          src={iconCanvas.toDataURL()}
                          alt={lang === 'fr' ? it.nameFr : it.nameEn}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 pixel-canvas shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-100 truncate">
                          {lang === 'fr' ? it.nameFr : it.nameEn}{' '}
                          <span className="font-mono text-xs text-slate-400 tabular-nums">
                            ×{progress.inventory[it.id]}
                          </span>
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {lang === 'fr' ? it.descFr : it.descEn}
                        </p>
                      </div>
                    </div>
                    {it.heal > 0 && (
                      <button
                        type="button"
                        disabled={progress.hp >= stats.maxHp}
                        onClick={() => consumeItem(it.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                          progress.hp < stats.maxHp
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {lang === 'fr' ? 'Boire' : 'Drink'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Column: 4-Slot Loadout + Owned Gear & Forge Upgrade */}
        <section className="lg:col-span-7 p-6 rounded-xl bg-[#141a24] border border-slate-800/90 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-white">
              {lang === 'fr' ? 'Équipement & Trempe Runique' : 'Equipment & Runic Tempering'}
            </h2>
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
              {(
                [
                  { id: 'all', fr: 'Tout', en: 'All' },
                  { id: EquipSlot.Weapon, fr: 'Armes', en: 'Weapons' },
                  { id: EquipSlot.Armor, fr: 'Armures', en: 'Armor' },
                  { id: EquipSlot.Shield, fr: 'Boucliers', en: 'Shields' },
                  { id: EquipSlot.Relic, fr: 'Reliques', en: 'Relics' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSlotFilter(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    slotFilter === tab.id
                      ? 'bg-slate-800 text-amber-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang === 'fr' ? tab.fr : tab.en}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-400 tabular-nums">
              {lang === 'fr'
                ? `Matériaux de forge en sac : Sidérite ×${progress.inventory.siderite || 0} · Écaille Draconique ×${
                    progress.inventory.ecaille_dragon || 0
                  }`
                : `Smithing materials owned: Siderite ×${progress.inventory.siderite || 0} · Dragon Scale ×${
                    progress.inventory.ecaille_dragon || 0
                  }`}
            </p>
            <div
              className={`px-3.5 py-2.5 rounded-lg border text-xs leading-relaxed ${
                isAtForge
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}
            >
              {isAtForge
                ? lang === 'fr'
                  ? "Enclume active (La Forge d'Airain) — Vous êtes auprès du fourneau de Maître Brom : la trempe runique (+1/+2/+3) est déverrouillée."
                  : 'Anvil Active (Brazen Forge) — You stand beside Master Brom’s furnace: runic tempering (+1/+2/+3) is unlocked.'
                : lang === 'fr'
                ? "Trempe réservée à la Forge — Vous pouvez changer d'équipement partout, mais l'amélioration (+1/+2/+3) nécessite d'être à l'intérieur de La Forge d'Airain (près du Marché de la Vallée)."
                : 'Tempering requires the Forge — You may swap gear anywhere, but upgrading (+1/+2/+3) requires standing inside the Brazen Forge (near the Valley Market).'}
            </div>
          </div>

          <div className="divide-y divide-slate-800/70">
            {ownedGear.map((eq) => {
              const isEquipped = progress.equipped[eq.slot] === eq.id;
              const upg = progress.upgrades[eq.id] || 0;
              const matKey = upg >= 2 ? 'ecaille_dragon' : eq.upgradeMat || 'siderite';
              const goldCost = (upg + 1) * 60;
              const canUpgrade =
                isAtForge &&
                Boolean(eq.upgradeMat) &&
                upg < 3 &&
                progress.gold >= goldCost &&
                (progress.inventory[matKey] || 0) >= 1;

              const statParts: string[] = [];
              if (eq.atkBonus > 0 || (eq.slot === EquipSlot.Weapon && upg > 0)) {
                statParts.push(`+${eq.atkBonus + (eq.slot === EquipSlot.Weapon ? upg * 3 : 0)} ATQ`);
              }
              if (eq.defBonus > 0 || ((eq.slot === EquipSlot.Armor || eq.slot === EquipSlot.Shield) && upg > 0)) {
                statParts.push(
                  `+${eq.defBonus + (eq.slot === EquipSlot.Armor || eq.slot === EquipSlot.Shield ? upg * 2 : 0)} DÉF`
                );
              }
              if (eq.hpBonus > 0 || upg > 0) {
                statParts.push(`+${eq.hpBonus + (eq.slot === EquipSlot.Armor ? upg * 6 : upg * 2)} PV`);
              }
              if (eq.critBonus > 0) statParts.push(`+${eq.critBonus + upg}% CRIT`);
              if (eq.arcaneBonus > 0) statParts.push(`+${eq.arcaneBonus} ARC`);
              if (eq.lifesteal) statParts.push(`+${eq.lifesteal} Drain`);

              return (
                <div key={eq.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{slotLabel(eq.slot)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {lang === 'fr' ? `Rang ${eq.tier}` : `Tier ${eq.tier}`}
                      </span>
                      {isEquipped && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-400 font-semibold">
                            {lang === 'fr' ? 'Équipé' : 'Equipped'}
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      {lang === 'fr' ? eq.nameFr : eq.nameEn}{' '}
                      {upg > 0 && <span className="text-amber-300 font-mono">+{upg}</span>}
                    </h3>
                    <p className="text-xs text-slate-400">{lang === 'fr' ? eq.descFr : eq.descEn}</p>
                    <p className="text-xs font-mono text-emerald-300/90 tabular-nums">
                      {statParts.join(' · ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {eq.upgradeMat && upg < 3 && (
                      <button
                        type="button"
                        disabled={!canUpgrade}
                        onClick={() => upgradeEquip(eq.id)}
                        title={
                          !isAtForge
                            ? lang === 'fr'
                              ? "Rendez-vous dans La Forge d'Airain pour améliorer cet équipement"
                              : 'Visit the Brazen Forge to temper this item'
                            : matKey === 'ecaille_dragon'
                            ? `${goldCost} Or + 1 Écaille Draconique`
                            : `${goldCost} Or + 1 Sidérite`
                        }
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                          canUpgrade
                            ? 'bg-slate-800 text-amber-300 border border-amber-500/40 hover:bg-slate-700 cursor-pointer'
                            : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        {!isAtForge
                          ? lang === 'fr'
                            ? `À la Forge +${upg + 1} (${goldCost} Or)`
                            : `At Forge +${upg + 1} (${goldCost}g)`
                          : lang === 'fr'
                          ? `Forger +${upg + 1} (${goldCost} Or)`
                          : `Forge +${upg + 1} (${goldCost}g)`}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => equipItem(eq.id, eq.slot)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isEquipped
                          ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                          : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      }`}
                    >
                      {isEquipped
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
        </section>
      </div>
    </main>
  );
}
