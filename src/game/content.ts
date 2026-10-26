import {
  ActiveDialogue,
  BestiaryEntryDef,
  Direction,
  EquipSlot,
  EquipmentDef,
  ItemCatalogDef,
  LoreEntryDef,
  PlayerProgress,
  QuestDef,
} from './types';

export const EQUIPMENT_CATALOG: EquipmentDef[] = [
  // --- WEAPONS (6) ---
  {
    id: 'sword_wood',
    slot: EquipSlot.Weapon,
    tier: 1,
    nameFr: "Épée d'Apprenti d'Ethynd",
    nameEn: "Ethynd Apprentice Sword",
    descFr: "Lame d'entraînement équilibrée remise aux jeunes veilleurs du village.",
    descEn: "Balanced training blade entrusted to young village watchmen.",
    price: 0,
    atkBonus: 3,
    defBonus: 0,
    hpBonus: 0,
    critBonus: 4,
    speedBonus: 0,
    arcaneBonus: 0,
    slashColor: '#e2e8f0',
    upgradeMat: 'siderite',
  },
  {
    id: 'sword_iron',
    slot: EquipSlot.Weapon,
    tier: 2,
    nameFr: "Lame de Fer Forgé",
    nameEn: "Wrought Iron Blade",
    descFr: "Acier trempé par Maître Brom, capable de fendre la carapace des monstres cavernicoles.",
    descEn: "Tempered steel forged by Master Brom, capable of cleaving cavern beasts.",
    price: 85,
    atkBonus: 6,
    defBonus: 0,
    hpBonus: 0,
    critBonus: 7,
    speedBonus: 0,
    arcaneBonus: 1,
    slashColor: '#93c5fd',
    upgradeMat: 'siderite',
  },
  {
    id: 'sword_royal',
    slot: EquipSlot.Weapon,
    tier: 3,
    nameFr: "Glaive de la Garde Royale",
    nameEn: "Royal Guard Glaive",
    descFr: "Épée d'ordonnance des chevaliers d'Édouard IV, gravée du sceau de la Couronne.",
    descEn: "ceremonial combat sword of King Edward IV's knights, bearing the Crown seal.",
    price: 190,
    atkBonus: 10,
    defBonus: 1,
    hpBonus: 4,
    critBonus: 10,
    speedBonus: 0,
    arcaneBonus: 2,
    slashColor: '#fbbf24',
    upgradeMat: 'siderite',
  },
  {
    id: 'sword_astrelya',
    slot: EquipSlot.Weapon,
    tier: 4,
    nameFr: "Sabre Ondoyant d'Astrelya",
    nameEn: "Tideblade of Astrelya",
    descFr: "Forgée dans le corail stellaire du Temple Englouti ; vibre d'une onde pure.",
    descEn: "Forged from starlit coral in the Sunken Temple; hums with pure arcane resonance.",
    price: 340,
    atkBonus: 15,
    defBonus: 1,
    hpBonus: 6,
    critBonus: 13,
    speedBonus: 5,
    arcaneBonus: 5,
    slashColor: '#38bdf8',
    upgradeMat: 'ecaille_dragon',
  },
  {
    id: 'sword_silver',
    slot: EquipSlot.Weapon,
    tier: 5,
    nameFr: "Faucheuse Runique d'Argent",
    nameEn: "Runic Silver Reaper",
    descFr: "Bénie pour bannir les spectres de la Nécropole. Draine la vigueur des ténèbres.",
    descEn: "Consecrated to banish Necropolis wraiths. Siphons vitality on hit.",
    price: 520,
    atkBonus: 21,
    defBonus: 2,
    hpBonus: 8,
    critBonus: 16,
    speedBonus: 5,
    arcaneBonus: 6,
    lifesteal: 1,
    slashColor: '#c084fc',
    upgradeMat: 'ecaille_dragon',
  },
  {
    id: 'sword_solar',
    slot: EquipSlot.Weapon,
    tier: 6,
    nameFr: "Lame Solaire du Prisme",
    nameEn: "Solar Blade of the Prism",
    descFr: "Arme mythique unifiant l'éclat des Quatre Cristaux d'Ethynd contre le Néant.",
    descEn: "Mythic blade uniting the radiance of Ethynd's Four Shards against the Void.",
    price: 850,
    atkBonus: 29,
    defBonus: 3,
    hpBonus: 15,
    critBonus: 22,
    speedBonus: 8,
    arcaneBonus: 10,
    lifesteal: 2,
    slashColor: '#fde047',
    upgradeMat: 'ecaille_dragon',
  },

  // --- ARMORS (6) ---
  {
    id: 'armor_tunic',
    slot: EquipSlot.Armor,
    tier: 1,
    nameFr: "Tunique de Lin du Bourg",
    nameEn: "Village Linen Tunic",
    descFr: "Vêtement souple tissé au village d'Ethynd, léger mais peu protecteur.",
    descEn: "Supple linen garment woven in Ethynd village, light yet modest in defense.",
    price: 0,
    atkBonus: 0,
    defBonus: 1,
    hpBonus: 0,
    critBonus: 0,
    speedBonus: 0,
    arcaneBonus: 0,
    upgradeMat: 'siderite',
  },
  {
    id: 'armor_leather',
    slot: EquipSlot.Armor,
    tier: 2,
    nameFr: "Gambison de Cuir Bouilli",
    nameEn: "Boiled Leather Gambeson",
    descFr: "Renforcé de boucles d'airain pour amortir les griffes et crocs.",
    descEn: "Reinforced with brass buckles to absorb claws and fangs.",
    price: 75,
    atkBonus: 0,
    defBonus: 3,
    hpBonus: 8,
    critBonus: 0,
    speedBonus: 2,
    arcaneBonus: 0,
    upgradeMat: 'siderite',
  },
  {
    id: 'armor_chain',
    slot: EquipSlot.Armor,
    tier: 3,
    nameFr: "Cotte de Mailles Royale",
    nameEn: "Royal Chainmail Hauberk",
    descFr: "Anneaux d'acier rivetés portés par les sentinelles de la Citadelle.",
    descEn: "Riveted steel rings worn by sentinels of the Royal Citadel.",
    price: 180,
    atkBonus: 0,
    defBonus: 6,
    hpBonus: 16,
    critBonus: 0,
    speedBonus: 0,
    arcaneBonus: 1,
    upgradeMat: 'siderite',
  },
  {
    id: 'armor_sylvan',
    slot: EquipSlot.Armor,
    tier: 4,
    nameFr: "Cuirasse Sylvestre d'Émeraude",
    nameEn: "Sylvan Emerald Cuirass",
    descFr: "Tressée par les rôdeurs de Sylvebrume ; confère agilité et endurance.",
    descEn: "Crafted by Sylvebrume rangers; grants swift footwork and resilience.",
    price: 320,
    atkBonus: 1,
    defBonus: 9,
    hpBonus: 26,
    critBonus: 4,
    speedBonus: 8,
    arcaneBonus: 3,
    upgradeMat: 'ecaille_dragon',
  },
  {
    id: 'armor_ancient',
    slot: EquipSlot.Armor,
    tier: 5,
    nameFr: "Harnois des Rois Oubliés",
    nameEn: "Plate of Forgotten Kings",
    descFr: "Armure funéraire sanctifiée issue des caveaux royaux de l'Est.",
    descEn: "Sanctified royal plate recovered from the eastern dynastic vaults.",
    price: 490,
    atkBonus: 2,
    defBonus: 13,
    hpBonus: 38,
    critBonus: 4,
    speedBonus: 2,
    arcaneBonus: 4,
    upgradeMat: 'ecaille_dragon',
  },
  {
    id: 'armor_draconic',
    slot: EquipSlot.Armor,
    tier: 6,
    nameFr: "Armure Draconique de l'Aube",
    nameEn: "Draconic Dawn Plate",
    descFr: "Forgée à partir d'écailles ignifugées de Pyra ; résiste aux flammes du Néant.",
    descEn: "Forged from fireproof scales of Pyra; withstands the Void's hottest flames.",
    price: 780,
    atkBonus: 4,
    defBonus: 18,
    hpBonus: 54,
    critBonus: 6,
    speedBonus: 5,
    arcaneBonus: 6,
    upgradeMat: 'ecaille_dragon',
  },

  // --- SHIELDS (6) ---
  {
    id: 'shield_bark',
    slot: EquipSlot.Shield,
    tier: 1,
    nameFr: "Rondache de Chêne",
    nameEn: "Oak Buckler",
    descFr: "Petit bouclier cerclé de fer trouvé au bord du lac d'Ethynd.",
    descEn: "Compact iron-rimmed buckler found along Lake Ethynd.",
    price: 45,
    atkBonus: 0,
    defBonus: 2,
    hpBonus: 4,
    critBonus: 0,
    speedBonus: 0,
    arcaneBonus: 0,
    upgradeMat: 'siderite',
  },
  {
    id: 'shield_bronze',
    slot: EquipSlot.Shield,
    tier: 2,
    nameFr: "Écu d'Airain",
    nameEn: "Brazen Heater Shield",
    descFr: "Bouclier solide martelé à la forge du bourg.",
    descEn: "Sturdy heater shield hammered at the village forge.",
    price: 110,
    atkBonus: 0,
    defBonus: 4,
    hpBonus: 8,
    critBonus: 0,
    speedBonus: 0,
    arcaneBonus: 0,
    upgradeMat: 'siderite',
  },
  {
    id: 'shield_bastion',
    slot: EquipSlot.Shield,
    tier: 3,
    nameFr: "Pavois du Bastion",
    nameEn: "Bastion Tower Shield",
    descFr: "Lourd bouclier des Oubliettes, conçu pour dévier les traits d'ombre.",
    descEn: "Heavy dungeon shield engineered to deflect shadow bolts.",
    price: 220,
    atkBonus: 0,
    defBonus: 7,
    hpBonus: 14,
    critBonus: 0,
    speedBonus: 0,
    arcaneBonus: 1,
    upgradeMat: 'siderite',
  },
  {
    id: 'shield_tide',
    slot: EquipSlot.Shield,
    tier: 4,
    nameFr: "Miroir des Marées",
    nameEn: "Mirror of the Tides",
    descFr: "Surface nacrée d'Astrelya réfléchissant le givre et l'énergie arcanique.",
    descEn: "Nacreous shield of Astrelya that reflects frost and arcane blasts.",
    price: 350,
    atkBonus: 0,
    defBonus: 10,
    hpBonus: 20,
    critBonus: 0,
    speedBonus: 3,
    arcaneBonus: 4,
    upgradeMat: 'ecaille_dragon',
  },
  {
    id: 'shield_sanctified',
    slot: EquipSlot.Shield,
    tier: 5,
    nameFr: "Égide Sanctifiée",
    nameEn: "Sanctified Aegis",
    descFr: "Relique défensive gravée de prières solaires contre l'Archiliche.",
    descEn: "Defensive relic engraved with solar wards against the Archlich.",
    price: 510,
    atkBonus: 1,
    defBonus: 14,
    hpBonus: 28,
    critBonus: 2,
    speedBonus: 3,
    arcaneBonus: 5,
    upgradeMat: 'ecaille_dragon',
  },
  {
    id: 'shield_prismatic',
    slot: EquipSlot.Shield,
    tier: 6,
    nameFr: "Rempart Prismatique",
    nameEn: "Prismatic Bulwark",
    descFr: "Bouclier cristallin indestructible trouvé au Sanctuaire de l'Éclipse.",
    descEn: "Unyielding crystalline bulwark from the Sanctum of the Eclipse.",
    price: 800,
    atkBonus: 2,
    defBonus: 19,
    hpBonus: 38,
    critBonus: 5,
    speedBonus: 5,
    arcaneBonus: 7,
    upgradeMat: 'ecaille_dragon',
  },

  // --- RELICS (6) ---
  {
    id: 'relic_sage',
    slot: EquipSlot.Relic,
    tier: 1,
    nameFr: "Amulette d'Aldric",
    nameEn: "Aldric's Amulet",
    descFr: "Médaillon runique aiguisant l'esprit et l'onde arcanique.",
    descEn: "Runic medallion sharpening the mind and arcane wave.",
    price: 65,
    atkBonus: 1,
    defBonus: 1,
    hpBonus: 6,
    critBonus: 3,
    speedBonus: 3,
    arcaneBonus: 3,
  },
  {
    id: 'relic_falcon',
    slot: EquipSlot.Relic,
    tier: 2,
    nameFr: "Anneau du Faucon Sylvestre",
    nameEn: "Sylvan Falcon Ring",
    descFr: "Accélère le pas et guide la lame vers les points vitaux.",
    descEn: "Quickens footsteps and guides strikes to vital openings.",
    price: 160,
    atkBonus: 2,
    defBonus: 0,
    hpBonus: 6,
    critBonus: 10,
    speedBonus: 10,
    arcaneBonus: 2,
  },
  {
    id: 'relic_regen',
    slot: EquipSlot.Relic,
    tier: 3,
    nameFr: "Talisman de Sève Vive",
    nameEn: "Living Sap Talisman",
    descFr: "Infusé de Fleurs de Lune : renforce grandement la vitalité.",
    descEn: "Infused with Moonflowers: greatly bolsters vitality and endurance.",
    price: 240,
    atkBonus: 1,
    defBonus: 3,
    hpBonus: 24,
    critBonus: 4,
    speedBonus: 4,
    arcaneBonus: 4,
    lifesteal: 1,
  },
  {
    id: 'relic_astrelya',
    slot: EquipSlot.Relic,
    tier: 4,
    nameFr: "Larme d'Astrelya",
    nameEn: "Tear of Astrelya",
    descFr: "Perle céleste amplifiant considérablement l'Onde de Lumière [E].",
    descEn: "Celestial pearl dramatically amplifying the Arcane Blade Wave [E].",
    price: 380,
    atkBonus: 3,
    defBonus: 3,
    hpBonus: 16,
    critBonus: 6,
    speedBonus: 6,
    arcaneBonus: 10,
  },
  {
    id: 'relic_smith',
    slot: EquipSlot.Relic,
    tier: 5,
    nameFr: "Sceau Igné des Forgerons",
    nameEn: "Fiery Seal of the Smiths",
    descFr: "Emblème ardent des maîtres de Pyra conférant une force colossale.",
    descEn: "Blazing emblem of Pyra's master smiths granting tremendous strength.",
    price: 480,
    atkBonus: 8,
    defBonus: 4,
    hpBonus: 18,
    critBonus: 8,
    speedBonus: 4,
    arcaneBonus: 4,
  },
  {
    id: 'relic_prism',
    slot: EquipSlot.Relic,
    tier: 6,
    nameFr: "Cœur Éternel d'Ethynd",
    nameEn: "Eternal Heart of Ethynd",
    descFr: "Fragment originel du Prisme élevant toutes les facultés du porteur.",
    descEn: "Primordial shard of the Prism elevating every attribute of its bearer.",
    price: 750,
    atkBonus: 9,
    defBonus: 7,
    hpBonus: 32,
    critBonus: 12,
    speedBonus: 10,
    arcaneBonus: 12,
    lifesteal: 1,
  },
];

export const ITEM_CATALOG: ItemCatalogDef[] = [
  {
    id: 'potion',
    nameFr: 'Potion de Soin',
    nameEn: 'Healing Potion',
    descFr: 'Décoction vermeille restaurant 12 PV instantanément (Touche R).',
    descEn: 'Crimson brew restoring 12 HP immediately (Key R).',
    category: 'consumable',
    heal: 12,
    price: 22,
    icon: 'potion',
  },
  {
    id: 'elixir',
    nameFr: 'Élixir Royal',
    nameEn: 'Royal Elixir',
    descFr: 'Philtre alchimique supérieur restaurant 36 PV en combat.',
    descEn: 'Superior alchemical draught restoring 36 HP in battle.',
    category: 'consumable',
    heal: 36,
    price: 65,
    icon: 'elixir',
  },
  {
    id: 'siderite',
    nameFr: 'Minerai de Sidérite',
    nameEn: 'Siderite Ore',
    descFr: 'Métal étoilé recherché par le forgeron Brom pour améliorer armes et armures.',
    descEn: 'Star-metal prized by Blacksmith Brom to upgrade weapons and armor.',
    category: 'material',
    heal: 0,
    price: 55,
    icon: 'siderite',
  },
  {
    id: 'ecaille_dragon',
    nameFr: 'Écaille Draconique',
    nameEn: 'Dragon Scale',
    descFr: 'Écaille incandescente permettant les améliorations de rang maître (+2 / +3).',
    descEn: 'Incandescent scale enabling master-tier forge upgrades (+2 / +3).',
    category: 'material',
    heal: 0,
    price: 130,
    icon: 'ecaille_dragon',
  },
  {
    id: 'fleur_lune',
    nameFr: 'Fleur de Lune',
    nameEn: 'Moonflower',
    descFr: "Plante bioluminescente de Sylvebrume étudiée par l'herboriste Lysa.",
    descEn: 'Bioluminescent Sylvebrume blossom studied by Herbalist Lysa.',
    category: 'key',
    heal: 0,
    icon: 'fleur_lune',
  },
  {
    id: 'insigne_garde',
    nameFr: 'Insigne de la Patrouille',
    nameEn: 'Lost Patrol Insignia',
    descFr: 'Médaillon des soldats disparus dans les Oubliettes du Château.',
    descEn: 'Medallion belonging to soldiers lost in the Royal Dungeons.',
    category: 'key',
    heal: 0,
    icon: 'insigne_garde',
  },
  {
    id: 'crystal_aube',
    nameFr: "Éclat de l'Aube",
    nameEn: 'Shard of Dawn',
    descFr: "Premier fragment du Prisme d'Ethynd, arraché au repaire d'Ignis.",
    descEn: 'First fragment of the Prism of Ethynd, reclaimed from Ignis.',
    category: 'key',
    heal: 0,
    icon: 'crystal_aube',
  },
  {
    id: 'crystal_fer',
    nameFr: 'Éclat de Fer',
    nameEn: 'Shard of Iron',
    descFr: 'Deuxième fragment du Prisme, repris à Sire Malakor dans les Oubliettes.',
    descEn: 'Second fragment of the Prism, reclaimed from Sir Malakor in the Dungeons.',
    category: 'key',
    heal: 0,
    icon: 'crystal_fer',
  },
  {
    id: 'crystal_azur',
    nameFr: "Éclat d'Azur",
    nameEn: 'Shard of Azure',
    descFr: "Troisième fragment du Prisme, purifié dans le Temple Englouti d'Astrelya.",
    descEn: 'Third fragment of the Prism, purified in the Sunken Temple of Astrelya.',
    category: 'key',
    heal: 0,
    icon: 'crystal_azur',
  },
  {
    id: 'crystal_amethyste',
    nameFr: "Éclat d'Améthyste",
    nameEn: 'Shard of Amethyst',
    descFr: "Quatrième fragment du Prisme, libéré de l'emprise de l'Archiliche Vorgath.",
    descEn: "Fourth fragment of the Prism, freed from Archlich Vorgath's grasp.",
    category: 'key',
    heal: 0,
    icon: 'crystal_amethyste',
  },
];

export const BESTIARY_CATALOG: BestiaryEntryDef[] = [
  {
    id: 'chauve_souris',
    nameFr: 'Chauve-souris des Grottes',
    nameEn: 'Cavern Bat',
    roleFr: 'Éclaireur nocturne',
    roleEn: 'Nocturnal Scout',
    habitatFr: "Grotte de l'Aube",
    habitatEn: 'Dawn Cavern',
    loreFr: "Agitées par le souffle d'Ignis, ces chauves-souris ont dérobé le Cristal du village à la faveur de l'ombre.",
    loreEn: "Agitated by Ignis's fiery breath, these bats stole the village's Crystal under cover of darkness.",
    baseHp: 16,
    baseAtk: 4,
    xp: 14,
    spriteSize: 32,
  },
  {
    id: 'slime_caverne',
    nameFr: 'Gelée Cristalline',
    nameEn: 'Crystalline Slime',
    roleFr: 'Prédateur minéral',
    roleEn: 'Mineral Predator',
    habitatFr: "Grotte de l'Aube",
    habitatEn: 'Dawn Cavern',
    loreFr: "Organisme gélatineux nourri de poussière de quartz dans les nappes souterraines.",
    loreEn: 'Gelatinous organism fed on quartz dust in subterranean pools.',
    baseHp: 22,
    baseAtk: 4,
    xp: 18,
    spriteSize: 32,
  },
  {
    id: 'slime_vert',
    nameFr: 'Gelée Sylvestre',
    nameEn: 'Sylvan Slime',
    roleFr: 'Créature des clairières',
    roleEn: 'Glade Creature',
    habitatFr: "Vallée d'Ethynd & Sylvebrume",
    habitatEn: 'Ethynd Valley & Sylvebrume',
    loreFr: "Jadis paisibles, les gelées d'herbe deviennent agressives lorsque l'équilibre du Prisme vacille.",
    loreEn: 'Once docile, moss slimes grow aggressive whenever the Prism weakens.',
    baseHp: 26,
    baseAtk: 5,
    xp: 22,
    spriteSize: 32,
  },
  {
    id: 'rodeur_ombre',
    nameFr: "Rôdeur de l'Éclipse",
    nameEn: 'Eclipse Stalker',
    roleFr: 'Éclaireur sectaire',
    roleEn: 'Cultist Scout',
    habitatFr: 'Plaines du Sud & Sylvebrume',
    habitatEn: 'Southern Plains & Sylvebrume',
    loreFr: "Mercenaire voué à l'Ordre de l'Éclipse, embusqué le long des routes marchandes.",
    loreEn: 'Mercenary sworn to the Eclipse Order, ambushing travelers along trade roads.',
    baseHp: 38,
    baseAtk: 7,
    xp: 36,
    spriteSize: 32,
  },
  {
    id: 'chauve_souris_givre',
    nameFr: 'Chauve-souris de Givre',
    nameEn: 'Frostwing Bat',
    roleFr: 'Chasseur des caves',
    roleEn: 'Vault Hunter',
    habitatFr: 'Oubliettes Royales',
    habitatEn: 'Royal Dungeons',
    loreFr: "Ses ailes glacées absorbent la chaleur des torches dans les canaux sous le Château.",
    loreEn: 'Its rime-coated wings drain warmth from torches in the flooded palace vaults.',
    baseHp: 30,
    baseAtk: 6,
    xp: 26,
    spriteSize: 32,
  },
  {
    id: 'squelette',
    nameFr: 'Garde Squelette',
    nameEn: 'Skeletal Guard',
    roleFr: 'Sentinelle réanimée',
    roleEn: 'Reanimated Sentinel',
    habitatFr: 'Oubliettes & Cimetière',
    habitatEn: 'Royal Dungeons & Cemetery',
    loreFr: "Ancien soldat de la couronne relevé par les runes nécromantiques de Vorgath.",
    loreEn: 'Former crown soldier raised by Vorgath’s necromantic runes.',
    baseHp: 42,
    baseAtk: 7,
    xp: 35,
    spriteSize: 32,
  },
  {
    id: 'spectre_ombre',
    nameFr: "Spectre d'Ombre",
    nameEn: 'Shadow Wraith',
    roleFr: 'Lanceur de traits noirs',
    roleEn: 'Shadowcaster',
    habitatFr: 'Oubliettes Royales',
    habitatEn: 'Royal Dungeons',
    loreFr: "Esprit tourmenté projetant des sphères d'ombre à travers les grilles des geôles.",
    loreEn: 'Tormented spirit hurling orbs of darkness down dungeon corridors.',
    baseHp: 46,
    baseAtk: 8,
    xp: 44,
    spriteSize: 32,
  },
  {
    id: 'loup_corrompu',
    nameFr: 'Fauve de Brume',
    nameEn: 'Mist Stalker Beast',
    roleFr: 'Prédateur véloce',
    roleEn: 'Swift Predator',
    habitatFr: 'Forêt de Sylvebrume',
    habitatEn: 'Sylvebrume Forest',
    loreFr: "Bête sylvestre aux yeux d'ambre, rendue furieuse par la corruption du Temple Englouti.",
    loreEn: 'Amber-eyed forest beast driven into frenzy by the Sunken Temple’s taint.',
    baseHp: 52,
    baseAtk: 9,
    xp: 46,
    spriteSize: 32,
  },
  {
    id: 'golem_rune',
    nameFr: 'Golem de Rune',
    nameEn: 'Runestone Golem',
    roleFr: 'Automate antique',
    roleEn: 'Ancient Automaton',
    habitatFr: 'Sylvebrume & Temple Englouti',
    habitatEn: 'Sylvebrume & Sunken Temple',
    loreFr: "Colosse taillé par les prêtres d'Astrelya pour défendre les sanctuaires sacrés contre tout intrus.",
    loreEn: 'Monolithic guardian carved by Astrelya’s priests to bar intruders from sacred halls.',
    baseHp: 78,
    baseAtk: 10,
    xp: 65,
    spriteSize: 36,
  },
  {
    id: 'elementaire_eau',
    nameFr: 'Élémentaire des Abysses',
    nameEn: 'Abyssal Elemental',
    roleFr: 'Tisseur de givre',
    roleEn: 'Frost Weaver',
    habitatFr: "Temple Englouti d'Astrelya",
    habitatEn: 'Sunken Temple of Astrelya',
    loreFr: "Tourbillon d'eau glacée animé par la colère de Léviathanis, projetant des éclats de givre.",
    loreEn: 'Vortex of frigid water animated by Leviathanis, firing shards of ice.',
    baseHp: 58,
    baseAtk: 9,
    xp: 52,
    spriteSize: 32,
  },
  {
    id: 'vouivre_azur',
    nameFr: 'Serpent des Marées',
    nameEn: 'Tide Serpent',
    roleFr: 'Reptile abyssal',
    roleEn: 'Abyssal Reptile',
    habitatFr: "Temple Englouti d'Astrelya",
    habitatEn: 'Sunken Temple of Astrelya',
    loreFr: "Serpent aquatique des bassins sacrés dont le souffle glacé fige l'acier imprudent.",
    loreEn: 'Sacred basin serpent whose freezing mist chills tempered steel.',
    baseHp: 92,
    baseAtk: 11,
    xp: 78,
    spriteSize: 36,
  },
  {
    id: 'chauve_souris_vampire',
    nameFr: 'Noctule Sanguinaire',
    nameEn: 'Crimson Noctule',
    roleFr: 'Chasseur des cryptes',
    roleEn: 'Crypt Hunter',
    habitatFr: 'Cimetière & Nécropole',
    habitatEn: 'Cemetery & Necropolis',
    loreFr: 'Chauve-souris géante nichant sous les voûtes des tombeaux royaux.',
    loreEn: 'Giant crimson bat nesting beneath royal sepulcher vaults.',
    baseHp: 62,
    baseAtk: 10,
    xp: 56,
    spriteSize: 32,
  },
  {
    id: 'chevalier_os',
    nameFr: "Chevalier d'Os",
    nameEn: 'Bone Knight',
    roleFr: 'Champion déchu',
    roleEn: 'Undying Champion',
    habitatFr: 'Nécropole des Rois Oubliés',
    habitatEn: 'Necropolis of Forgotten Kings',
    loreFr: "Garde d'honneur enseveli avec les premiers monarques, maniant encore l'épée avec discipline.",
    loreEn: 'Honor guard entombed alongside the first monarchs, still wielding steel with precision.',
    baseHp: 96,
    baseAtk: 12,
    xp: 82,
    spriteSize: 32,
  },
  {
    id: 'mage_eclipse',
    nameFr: "Archimage de l'Éclipse",
    nameEn: 'Eclipse Archmage',
    roleFr: 'Occultiste du Néant',
    roleEn: 'Void Occultist',
    habitatFr: "Nécropole & Sanctuaire de l'Éclipse",
    habitatEn: 'Necropolis & Eclipse Sanctum',
    loreFr: "Érudit ayant trahi le Conseil des Sages pour préparer l'éveil du Grand Dragon Rouge.",
    loreEn: 'Scholar who betrayed the Council of Sages to hasten the Great Red Dragon’s awakening.',
    baseHp: 92,
    baseAtk: 14,
    xp: 100,
    spriteSize: 32,
  },
  {
    id: 'magma_vivant',
    nameFr: 'Magma Vivant',
    nameEn: 'Living Magma',
    roleFr: 'Fusion volcanique',
    roleEn: 'Volcanic Core',
    habitatFr: 'Terres Ardentes de Pyra',
    habitatEn: 'Scorched Lands of Pyra',
    loreFr: 'Amas de roche en fusion né des failles ardentes au pied du mont Pyra.',
    loreEn: 'Molten rock mass born from the blazing fissures at Mount Pyra’s base.',
    baseHp: 88,
    baseAtk: 13,
    xp: 80,
    spriteSize: 32,
  },
  {
    id: 'golem_obsidienne',
    nameFr: "Golem d'Obsidienne",
    nameEn: 'Obsidian Golem',
    roleFr: 'Rempart volcanique',
    roleEn: 'Volcanic Bulwark',
    habitatFr: 'Terres Ardentes de Pyra',
    habitatEn: 'Scorched Lands of Pyra',
    loreFr: 'Verre noir animé par un cœur de braise, quasi insensible aux lames ordinaires.',
    loreEn: 'Volcanic glass animated by an ember core, nearly impervious to common blades.',
    baseHp: 125,
    baseAtk: 15,
    xp: 105,
    spriteSize: 36,
  },
  {
    id: 'vouivre_obsidienne',
    nameFr: 'Basilic des Cendres',
    nameEn: 'Cinder Basilisk',
    roleFr: 'Cracheur de braises',
    roleEn: 'Ember Spitter',
    habitatFr: 'Terres Ardentes & Sanctuaire',
    habitatEn: 'Scorched Lands & Sanctum',
    loreFr: 'Reptile cuirassé de basalte patrouillant les ponts ardents du sud.',
    loreEn: 'Basalt-armored reptile patrolling the southern volcanic bridges.',
    baseHp: 140,
    baseAtk: 16,
    xp: 130,
    spriteSize: 38,
  },
  {
    id: 'chevalier_dechu_elite',
    nameFr: "Prétorien de l'Éclipse",
    nameEn: 'Eclipse Praetorian',
    roleFr: 'Garde noire du Sanctuaire',
    roleEn: 'Sanctum Blackguard',
    habitatFr: "Sanctuaire de l'Éclipse",
    habitatEn: 'Sanctum of the Eclipse',
    loreFr: "Guerrier d'élite revêtu d'acier maudit, dernier rempart humain devant l'antre draconique.",
    loreEn: 'Elite warrior clad in cursed steel, the final mortal bulwark before the dragon’s lair.',
    baseHp: 140,
    baseAtk: 16,
    xp: 130,
    spriteSize: 32,
  },
  {
    id: 'dragon_garde',
    nameFr: 'Ignis, Dragon des Cendres',
    nameEn: 'Ignis, Cinder Dragon',
    roleFr: 'Avant-garde draconique (Acte V)',
    roleEn: 'Draconic Vanguard (Act V)',
    habitatFr: 'Terres Ardentes de Pyra',
    habitatEn: 'Scorched Lands of Pyra',
    loreFr: "Premier grand dragon rencontré à la fin du voyage : il garde le pont de basalte menant au Sanctuaire de Pyraxis.",
    loreEn: 'First true dragon encountered near the journey’s end, guarding the basalt bridge to Pyraxis’s Sanctum.',
    baseHp: 210,
    baseAtk: 17,
    xp: 190,
    spriteSize: 48,
  },

  // --- 5 GRAND BOSSES ---
  {
    id: 'reine_caverne',
    nameFr: 'Morvath, la Couveuse des Profondeurs',
    nameEn: 'Morvath, Cavern Broodmother',
    roleFr: 'Boss — Acte I',
    roleEn: 'Boss — Act I',
    habitatFr: "Grotte de l'Aube",
    habitatEn: 'Dawn Cavern',
    loreFr: "Créature souterraine à carapace cristalline excitée par l'Ordre de l'Éclipse pour dérober le Cristal du village.",
    loreEn: 'Crystal-shelled subterranean creature roused by the Eclipse Order to hoard the village’s stolen Crystal.',
    baseHp: 72,
    baseAtk: 6,
    xp: 95,
    isBoss: true,
    spriteSize: 48,
  },
  {
    id: 'chevalier_dechu',
    nameFr: 'Sire Malakor, Chevalier Déchu',
    nameEn: 'Sir Malakor, Fallen Knight',
    roleFr: 'Boss — Acte II',
    roleEn: 'Boss — Act II',
    habitatFr: 'Oubliettes Royales',
    habitatEn: 'Royal Dungeons',
    loreFr: "Jadis champion du Roi Édouard III, il succomba aux murmures de l'Éclat de Fer en voulant le protéger seul.",
    loreEn: 'Once champion of King Edward III, he succumbed to whispers in the dungeons while guarding the Iron Shard.',
    baseHp: 185,
    baseAtk: 10,
    xp: 220,
    isBoss: true,
    spriteSize: 48,
  },
  {
    id: 'leviathanis',
    nameFr: 'Léviathanis, Hydre des Abysses',
    nameEn: 'Leviathanis, Hydra of the Deep',
    roleFr: 'Boss — Acte III',
    roleEn: 'Boss — Act III',
    habitatFr: "Temple Englouti d'Astrelya",
    habitatEn: 'Sunken Temple of Astrelya',
    loreFr: "Ancienne souveraine marine des eaux sacrées, rendue furieuse par le fiel noir versé dans la nef d'Astrelya.",
    loreEn: 'Ancient sea-serpent guardian of the sacred waters, maddened by dark venom poured into Astrelya’s nave.',
    baseHp: 280,
    baseAtk: 13,
    xp: 360,
    isBoss: true,
    spriteSize: 54,
  },
  {
    id: 'archiliche_vorgath',
    nameFr: "Vorgath, Archiliche de l'Éclipse",
    nameEn: 'Vorgath, Archlich of the Eclipse',
    roleFr: 'Boss — Acte IV',
    roleEn: 'Boss — Act IV',
    habitatFr: 'Nécropole des Rois Oubliés',
    habitatEn: 'Necropolis of Forgotten Kings',
    loreFr: "Fondateur de l'Ordre de l'Éclipse ayant trompé la mort pour briser le Prisme et réveiller le Grand Dragon Rouge.",
    loreEn: 'Founder of the Eclipse Order who defied death to shatter the Prism and awaken the Great Red Dragon.',
    baseHp: 390,
    baseAtk: 16,
    xp: 500,
    isBoss: true,
    spriteSize: 48,
  },
  {
    id: 'dragon_rouge',
    nameFr: 'Pyraxis, le Grand Dragon Rouge',
    nameEn: 'Pyraxis, the Great Red Dragon',
    roleFr: 'Boss Final Suprême — Acte V',
    roleEn: 'Supreme Final Boss — Act V',
    habitatFr: "Sanctuaire de l'Éclipse",
    habitatEn: 'Sanctum of the Eclipse',
    loreFr: "Le plus puissant monstre d'Ethynd : Dragon Primordial scellé il y a mille ans par les Quatre Éclats au cœur des terres volcaniques.",
    loreEn: 'The mightiest terror of Ethynd: the Primordial Red Dragon sealed a millennium ago by the Four Shards.',
    baseHp: 600,
    baseAtk: 20,
    xp: 1000,
    isBoss: true,
    spriteSize: 56,
  },

  // --- PEACEFUL FAUNA (3) ---
  {
    id: 'chat',
    nameFr: 'Chat du Sage',
    nameEn: "Sage's Cat",
    roleFr: 'Compagnon paisible',
    roleEn: 'Peaceful Companion',
    habitatFr: 'Maison du Sage Aldric',
    habitatEn: "Sage Aldric's Cottage",
    loreFr: "Veille fidèlement sur les parchemins d'Aldric et ronronne près de l'âtre.",
    loreEn: 'Watches faithfully over Aldric’s scrolls and purrs beside the hearth.',
    baseHp: 9999,
    baseAtk: 0,
    xp: 0,
    isPassive: true,
    spriteSize: 32,
  },
  {
    id: 'oiseau',
    nameFr: 'Merle Azuré',
    nameEn: 'Azure Songbird',
    roleFr: 'Faune de la Vallée',
    roleEn: 'Valley Fauna',
    habitatFr: 'Vallée & Sylvebrume',
    habitatEn: 'Valley & Sylvebrume',
    loreFr: 'Son chant annonce le retour de la lumière partout où le Prisme rayonne encore.',
    loreEn: 'Its song heralds the return of daylight wherever the Prism still shines.',
    baseHp: 9999,
    baseAtk: 0,
    xp: 0,
    isPassive: true,
    spriteSize: 32,
  },
  {
    id: 'poussin',
    nameFr: 'Poussin Doré',
    nameEn: 'Golden Chick',
    roleFr: 'Faune villageoise',
    roleEn: 'Village Fauna',
    habitatFr: "Vallée d'Ethynd",
    habitatEn: 'Valley of Ethynd',
    loreFr: 'Picore paisiblement autour des fermes et du marché du bourg.',
    loreEn: 'Pecks peacefully around the village farms and market square.',
    baseHp: 9999,
    baseAtk: 0,
    xp: 0,
    isPassive: true,
    spriteSize: 32,
  },
];

export const QUEST_CATALOG: QuestDef[] = [
  // === ACTE I : L'ECLAT VOLE ===
  {
    id: 'q1_talk_sage',
    act: 1,
    titleFr: 'L’Appel du Sage Aldric',
    titleEn: 'Sage Aldric’s Summons',
    descFr: "Parlez au Sage Aldric dans sa maison au sommet de la falaise d'Ethynd.",
    descEn: 'Speak with Sage Aldric inside his cliffside cottage in Ethynd.',
    regionFr: 'Maison du Sage',
    regionEn: "Sage's Cottage",
    rewardXp: 20,
    rewardGold: 15,
    check: { kind: 'flag', target: 'talked_sage' },
  },
  {
    id: 'q1_enter_cave',
    act: 1,
    prereqFlag: 'talked_sage',
    titleFr: 'Sous les Racines de la Falaise',
    titleEn: 'Beneath the Cliff Roots',
    descFr: "Descendez l'escalier de la cave pour pénétrer dans la Grotte de l'Aube.",
    descEn: 'Descend the cellar stairs to enter the Dawn Cavern.',
    regionFr: "Grotte de l'Aube",
    regionEn: 'Dawn Cavern',
    rewardXp: 25,
    rewardGold: 15,
    check: { kind: 'map', target: 'grotte' },
  },
  {
    id: 'q1_kill_bats',
    act: 1,
    prereqFlag: 'talked_sage',
    titleFr: 'Nuée dans les Ténèbres',
    titleEn: 'Swarm in the Dark',
    descFr: 'Éliminez 4 chauves-souris des grottes qui ont dérobé le Cristal.',
    descEn: 'Defeat 4 cavern bats that stole the village Crystal.',
    regionFr: "Grotte de l'Aube",
    regionEn: 'Dawn Cavern',
    rewardXp: 45,
    rewardGold: 30,
    check: { kind: 'kill', target: 'chauve_souris', count: 4 },
  },
  {
    id: 'q1_kill_morvath',
    act: 1,
    prereqFlag: 'talked_sage',
    titleFr: 'La Couveuse des Profondeurs',
    titleEn: 'The Cavern Broodmother',
    descFr: "Terrassez Morvath, la Couveuse cristalline tapie au sud-ouest de la Grotte de l'Aube.",
    descEn: 'Vanquish Morvath, the crystal-shelled Broodmother lurking in southwest Dawn Cavern.',
    regionFr: "Grotte de l'Aube",
    regionEn: 'Dawn Cavern',
    rewardXp: 80,
    rewardGold: 55,
    check: { kind: 'flag', target: 'boss_morvath_dead' },
  },
  {
    id: 'q1_take_dawn_shard',
    act: 1,
    prereqFlag: 'boss_morvath_dead',
    titleFr: "L'Éclat de l'Aube",
    titleEn: 'The Shard of Dawn',
    descFr: "Ramassez l'Éclat de l'Aube derrière le nid de Morvath.",
    descEn: "Pick up the Shard of Dawn behind Morvath's nest.",
    regionFr: "Grotte de l'Aube",
    regionEn: 'Dawn Cavern',
    rewardXp: 40,
    rewardGold: 25,
    check: { kind: 'item', target: 'crystal_aube', count: 1 },
  },
  {
    id: 'q1_return_sage',
    act: 1,
    prereqFlag: 'boss_morvath_dead',
    titleFr: 'La Fissure du Prisme',
    titleEn: 'The Fractured Prism',
    descFr: "Rapportez l'Éclat de l'Aube au Sage Aldric pour découvrir ce qui menace réellement le royaume.",
    descEn: 'Bring the Shard of Dawn back to Sage Aldric to uncover the true threat facing the realm.',
    regionFr: 'Maison du Sage',
    regionEn: "Sage's Cottage",
    rewardXp: 90,
    rewardGold: 60,
    rewardItem: 'potion',
    check: { kind: 'flag', target: 'act1_done' },
  },

  // === ACTE II : L'OMBRE SOUS LA COURONNE ===
  {
    id: 'q2_enter_castle',
    act: 2,
    prereqFlag: 'act1_done',
    titleFr: 'Les Portes de la Couronne',
    titleEn: 'Gates of the Crown',
    descFr: 'Traversez la grotte vers la Vallée et franchissez enfin la grande porte du Château Royal au nord-est.',
    descEn: 'Enter the Valley and pass through the newly unlocked Royal Castle gates to the northeast.',
    regionFr: "Vallée & Château d'Ethynd",
    regionEn: 'Valley & Royal Castle',
    rewardXp: 60,
    rewardGold: 40,
    check: { kind: 'map', target: 'chateau' },
  },
  {
    id: 'q2_talk_king',
    act: 2,
    prereqFlag: 'act1_done',
    titleFr: 'Audience Royale',
    titleEn: 'Royal Audience',
    descFr: "Présentez le Sceau du Conseil au Roi Édouard IV dans la Salle du Trône.",
    descEn: 'Present the Council Seal to King Edward IV in the Throne Room.',
    regionFr: "Château Royal d'Ethynd",
    regionEn: 'Royal Castle of Ethynd',
    rewardXp: 75,
    rewardGold: 50,
    check: { kind: 'flag', target: 'talked_roi' },
  },
  {
    id: 'q2_enter_oubliettes',
    act: 2,
    prereqFlag: 'talked_roi',
    titleFr: 'Descente aux Oubliettes',
    titleEn: 'Descent into the Dungeons',
    descFr: "Empruntez l'escalier de l'aile est du Château vers les Oubliettes Royales.",
    descEn: 'Take the east-wing stairwell down into the Royal Dungeons.',
    regionFr: 'Oubliettes Royales',
    regionEn: 'Royal Dungeons',
    rewardXp: 65,
    rewardGold: 40,
    check: { kind: 'map', target: 'oubliettes' },
  },
  {
    id: 'q2_kill_malakor',
    act: 2,
    prereqFlag: 'talked_roi',
    titleFr: "Le Serment Brisé de Malakor",
    titleEn: "Malakor's Broken Oath",
    descFr: "Triomphez de Sire Malakor au fond des Oubliettes et récupérez l'Éclat de Fer.",
    descEn: 'Defeat Sir Malakor in the depths of the Royal Dungeons and claim the Shard of Iron.',
    regionFr: 'Oubliettes Royales',
    regionEn: 'Royal Dungeons',
    rewardXp: 160,
    rewardGold: 110,
    check: { kind: 'item', target: 'crystal_fer', count: 1 },
  },
  {
    id: 'q2_report_king',
    act: 2,
    prereqFlag: 'boss_malakor_dead',
    titleFr: 'Décret vers Sylvebrume',
    titleEn: 'Decree to Sylvebrume',
    descFr: "Montrez l'Éclat de Fer au Roi Édouard IV pour ouvrir la route de l'Ouest.",
    descEn: 'Show the Shard of Iron to King Edward IV to unlock the western road to Sylvebrume.',
    regionFr: "Château Royal d'Ethynd",
    regionEn: 'Royal Castle of Ethynd',
    rewardXp: 120,
    rewardGold: 90,
    rewardItem: 'elixir',
    check: { kind: 'flag', target: 'act2_started' },
  },

  // === ACTE III : LE CHANT DE SYLVEBRUME ===
  {
    id: 'q3_enter_forest',
    act: 3,
    prereqFlag: 'act2_started',
    titleFr: "À l'Ouest de la Vallée",
    titleEn: 'West of the Valley',
    descFr: 'Suivez le grand chemin ouest de la Vallée pour entrer dans la Forêt de Sylvebrume.',
    descEn: 'Follow the western road of the Valley into Sylvebrume Forest.',
    regionFr: 'Forêt de Sylvebrume',
    regionEn: 'Sylvebrume Forest',
    rewardXp: 90,
    rewardGold: 60,
    check: { kind: 'map', target: 'foret' },
  },
  {
    id: 'q3_talk_elowen',
    act: 3,
    prereqFlag: 'act2_started',
    titleFr: 'La Sentinelle des Bois',
    titleEn: 'Sentinel of the Woods',
    descFr: 'Trouvez la rôdeuse Élowen à son campement au cœur de Sylvebrume.',
    descEn: 'Locate Ranger Elowen at her clearing camp in Sylvebrume.',
    regionFr: 'Forêt de Sylvebrume',
    regionEn: 'Sylvebrume Forest',
    rewardXp: 100,
    rewardGold: 70,
    check: { kind: 'flag', target: 'talked_elowen' },
  },
  {
    id: 'q3_kill_leviathan',
    act: 3,
    prereqFlag: 'talked_elowen',
    titleFr: "Les Eaux Profanées d'Astrelya",
    titleEn: 'Defiled Waters of Astrelya',
    descFr: "Explorez le Temple Englouti au nord-ouest de la forêt, vainquez Léviathanis et saisissez l'Éclat d'Azur.",
    descEn: 'Enter the Sunken Temple in northwest Sylvebrume, defeat Leviathanis, and recover the Azure Shard.',
    regionFr: "Temple Englouti d'Astrelya",
    regionEn: 'Sunken Temple of Astrelya',
    rewardXp: 260,
    rewardGold: 180,
    check: { kind: 'item', target: 'crystal_azur', count: 1 },
  },
  {
    id: 'q3_unlock_crypt',
    act: 3,
    prereqFlag: 'boss_leviathan_dead',
    titleFr: "La Clé d'Argent Royal",
    titleEn: 'The Royal Silver Key',
    descFr: "Rapportez la nouvelle à Élowen ou au Roi Édouard IV pour recevoir la clé de la Nécropole de l'Est.",
    descEn: 'Report back to Elowen or King Edward IV to receive the key to the Eastern Necropolis.',
    regionFr: 'Sylvebrume / Château',
    regionEn: 'Sylvebrume / Castle',
    rewardXp: 150,
    rewardGold: 110,
    check: { kind: 'flag', target: 'act3_done' },
  },

  // === ACTE IV : LES CENDRES DES PREMIERS ROIS ===
  {
    id: 'q4_enter_crypt',
    act: 4,
    prereqFlag: 'act3_done',
    titleFr: 'Le Cimetière Maudit',
    titleEn: 'The Cursed Cemetery',
    descFr: 'Traversez le bois clôturé au sud-est de la Vallée et pénétrez dans la Nécropole des Rois Oubliés.',
    descEn: 'Cross the fenced cemetery in southeast Ethynd Valley and enter the Necropolis of Forgotten Kings.',
    regionFr: 'Nécropole Royale',
    regionEn: 'Royal Necropolis',
    rewardXp: 140,
    rewardGold: 95,
    check: { kind: 'map', target: 'crypte' },
  },
  {
    id: 'q4_kill_vorgath',
    act: 4,
    prereqFlag: 'act3_done',
    titleFr: "Le Maître de l'Éclipse",
    titleEn: 'Master of the Eclipse',
    descFr: "Bannissez l'Archiliche Vorgath au nord de la Nécropole et emparez-vous de l'Éclat d'Améthyste.",
    descEn: 'Banish Archlich Vorgath in the northern Necropolis and claim the Shard of Amethyst.',
    regionFr: 'Nécropole Royale',
    regionEn: 'Royal Necropolis',
    rewardXp: 360,
    rewardGold: 250,
    check: { kind: 'item', target: 'crystal_amethyste', count: 1 },
  },
  {
    id: 'q4_reforge_prism',
    act: 4,
    prereqFlag: 'boss_vorgath_dead',
    titleFr: "L'Union des Quatre Éclats",
    titleEn: 'Union of the Four Shards',
    descFr: 'Présentez les Quatre Éclats au Sage Aldric ou au Roi Édouard IV pour reformer le Prisme et ouvrir la route du Sud.',
    descEn: 'Present all Four Shards to Sage Aldric or King Edward IV to reforge the Prism and unseal the southern pass.',
    regionFr: 'Maison du Sage / Château',
    regionEn: "Sage's Cottage / Castle",
    rewardXp: 240,
    rewardGold: 180,
    rewardItem: 'elixir',
    check: { kind: 'flag', target: 'act4_done' },
  },

  // === ACTE V : LE CREPUSCULE DE PYRAXIS ===
  {
    id: 'q5_enter_pyra',
    act: 5,
    prereqFlag: 'act4_done',
    titleFr: 'Au-delà de la Barrière de Cendre',
    titleEn: 'Beyond the Ash Barrier',
    descFr: 'Empruntez la grande route du Sud de la Vallée vers les Terres Ardentes de Pyra.',
    descEn: 'March down the southern road of the Valley into the Scorched Lands of Pyra.',
    regionFr: 'Terres Ardentes de Pyra',
    regionEn: 'Scorched Lands of Pyra',
    rewardXp: 180,
    rewardGold: 120,
    check: { kind: 'map', target: 'terres_ardentes' },
  },
  {
    id: 'q5_enter_sanctum',
    act: 5,
    prereqFlag: 'act4_done',
    titleFr: "Le Seuil de l'Obsidienne",
    titleEn: 'Threshold of Obsidian',
    descFr: "Franchissez les failles volcaniques de Pyra jusqu'au Sanctuaire de l'Éclipse.",
    descEn: 'Cross the volcanic chasms of Pyra to breach the Sanctum of the Eclipse.',
    regionFr: "Sanctuaire de l'Éclipse",
    regionEn: 'Sanctum of the Eclipse',
    rewardXp: 220,
    rewardGold: 150,
    check: { kind: 'map', target: 'citadelle' },
  },
  {
    id: 'q5_kill_pyraxis',
    act: 5,
    prereqFlag: 'act4_done',
    titleFr: "Le Grand Dragon Rouge d'Ethynd",
    titleEn: 'The Great Red Dragon of Ethynd',
    descFr: "Terrassez Pyraxis, le Grand Dragon Rouge, au sommet du Sanctuaire de l'Éclipse pour sauver le royaume !",
    descEn: 'Slay Pyraxis, the Great Red Dragon, atop the Sanctum of the Eclipse to save the realm!',
    regionFr: "Sanctuaire de l'Éclipse",
    regionEn: 'Sanctum of the Eclipse',
    rewardXp: 800,
    rewardGold: 500,
    check: { kind: 'flag', target: 'boss_pyraxis_dead' },
  },

  // === MISSIONS SECONDAIRES (6) ===
  {
    id: 'sq_forge_siderite',
    act: 2,
    isSide: true,
    titleFr: 'Le Métal des Étoiles',
    titleEn: 'Star-Fallen Metal',
    descFr: 'Remettez 2 minerais de Sidérite au Maître Forgeron Brom dans sa forge près du marché.',
    descEn: 'Deliver 2 Siderite Ores to Master Blacksmith Brom at his forge near the market.',
    regionFr: "Forge d'Airain",
    regionEn: 'Brazen Forge',
    rewardXp: 110,
    rewardGold: 90,
    rewardEquip: 'shield_bronze',
    check: { kind: 'flag', target: 'sq_siderite_done' },
  },
  {
    id: 'sq_lysa_moonflowers',
    act: 3,
    isSide: true,
    titleFr: "L'Herbier Lunaire de Lysa",
    titleEn: "Lysa's Lunar Herbarium",
    descFr: "Cueillez 3 Fleurs de Lune en Sylvebrume et rapportez-les à l'herboriste Lysa à la Forge.",
    descEn: 'Gather 3 Moonflowers in Sylvebrume and deliver them to Herbalist Lysa at the Forge.',
    regionFr: 'Sylvebrume & Forge',
    regionEn: 'Sylvebrume & Forge',
    rewardXp: 150,
    rewardGold: 100,
    rewardEquip: 'relic_regen',
    check: { kind: 'flag', target: 'sq_moonflower_done' },
  },
  {
    id: 'sq_vane_patrol',
    act: 2,
    isSide: true,
    titleFr: 'Honneur aux Disparus',
    titleEn: 'Honor the Fallen Watch',
    descFr: "Retrouvez l'Insigne de la Patrouille dans les Oubliettes et remettez-le au Capitaine Vane dans la cour du Château.",
    descEn: 'Recover the Lost Patrol Insignia in the Royal Dungeons and return it to Captain Vane.',
    regionFr: 'Château & Oubliettes',
    regionEn: 'Castle & Dungeons',
    rewardXp: 140,
    rewardGold: 120,
    rewardItem: 'elixir',
    check: { kind: 'flag', target: 'sq_patrol_done' },
  },
  {
    id: 'sq_valley_hunt',
    act: 2,
    isSide: true,
    titleFr: 'Sécuriser les Routes Marchandes',
    titleEn: 'Securing the Trade Roads',
    descFr: "Éliminez 3 Rôdeurs de l'Éclipse qui menacent les voyageurs du royaume.",
    descEn: 'Eliminate 3 Eclipse Stalkers threatening travelers across the realm.',
    regionFr: "Vallée d'Ethynd & Sylvebrume",
    regionEn: 'Valley & Sylvebrume',
    rewardXp: 130,
    rewardGold: 110,
    check: { kind: 'kill', target: 'rodeur_ombre', count: 3 },
  },
  {
    id: 'sq_undead_purge',
    act: 4,
    isSide: true,
    titleFr: 'Le Repos des Anciens Gardes',
    titleEn: 'Rest for the Ancient Watch',
    descFr: 'Libérez 5 Gardes Squelettes de leur malédiction nécromantique.',
    descEn: 'Release 5 Skeletal Guards from their necromantic curse.',
    regionFr: 'Oubliettes & Cimetière',
    regionEn: 'Dungeons & Cemetery',
    rewardXp: 170,
    rewardGold: 140,
    check: { kind: 'kill', target: 'squelette', count: 5 },
  },
  {
    id: 'sq_lore_scholar',
    act: 3,
    isSide: true,
    titleFr: "Mémoire d'Ethynd (Archiviste Sélène)",
    titleEn: 'Memory of Ethynd (Archivist Selene)',
    descFr: 'Déchiffrez au moins 8 Stèles ou Grimoires anciens à travers le royaume.',
    descEn: 'Decipher at least 8 ancient Steles or Grimoires across the kingdom.',
    regionFr: "Tout le Royaume d'Ethynd",
    regionEn: 'All across Ethynd',
    rewardXp: 250,
    rewardGold: 200,
    rewardItem: 'ecaille_dragon',
    check: { kind: 'lore_count', target: 'any', count: 8 },
  },
  {
    id: 'sq_lore_master',
    act: 5,
    isSide: true,
    titleFr: 'Grand Chroniqueur du Prisme',
    titleEn: 'Grand Chronicler of the Prism',
    descFr: 'Déchiffrez la totalité des 16 Stèles et Grimoires des Chroniques d’Ethynd.',
    descEn: 'Decipher all 16 Steles and Grimoires of the Chronicles of Ethynd.',
    regionFr: "Tout le Royaume d'Ethynd",
    regionEn: 'All across Ethynd',
    rewardXp: 450,
    rewardGold: 350,
    rewardItem: 'elixir',
    check: { kind: 'lore_count', target: 'any', count: 16 },
  },
];

export const LORE_CODEX: LoreEntryDef[] = [
  {
    id: 'lore_1_prisme',
    chapter: 1,
    titleFr: "I. Le Grimoire d'Aldric : Le Prisme Originel",
    titleEn: "I. Aldric's Grimoire: The Primordial Prism",
    locationFr: 'Maison du Sage Aldric',
    locationEn: "Sage Aldric's Cottage",
    eraFr: 'Âge de la Fondation',
    eraEn: 'Age of Foundation',
    textFr: [
      "Avant la fondation du bourg d'Ethynd, le ciel était déchiré par les cendres de Pyraxis, l'Empereur Écarlate.",
      "Les Premiers Sages forgèrent le Prisme d'Éclat pour sceller la bête sous les montagnes du Sud, puis divisèrent ce sceau en Quatre Cristaux : l'Aube, le Fer, l'Azur et l'Améthyste.",
      "Celui que notre village appelle humblement le « Cristal de lumière » n'est autre que le premier de ces quatre verrous sacrés.",
    ],
    textEn: [
      'Before Ethynd village was founded, the skies choked under the ash of Pyraxis, the Crimson Emperor.',
      'The First Sages forged the Radiant Prism to bind the beast beneath the southern peaks, dividing its seal into Four Shards: Dawn, Iron, Azure, and Amethyst.',
      'What our villagers humbly call the "Crystal of Light" is in truth the first of those four sacred locks.',
    ],
  },
  {
    id: 'lore_2_fondation',
    chapter: 2,
    titleFr: 'II. Stèle de la Fontaine : Le Pacte Royal',
    titleEn: 'II. Fountain Stele: The Royal Compact',
    locationFr: "Vallée d'Ethynd — Place de la Fontaine",
    locationEn: 'Valley of Ethynd — Fountain Square',
    eraFr: 'Règne d’Édouard Ier',
    eraEn: 'Reign of Edward I',
    textFr: [
      "Ici fut scellée l'alliance entre la Couronne d'Ethynd, les Rôdeurs de Sylvebrume et le Cercle des Sages.",
      "Tant que l'eau claire chante dans cette vasque de marbre, le Sceau du Sud tient bon. Si la source se trouble, que les gardiens ouvrent les portes de la Citadelle au porteur de l'Aube.",
    ],
    textEn: [
      'Here stood sealed the compact uniting the Crown of Ethynd, the Rangers of Sylvebrume, and the Circle of Sages.',
      'So long as clear water sings in this marble basin, the Southern Seal endures. Should it falter, let the citadel gates open to the bearer of Dawn.',
    ],
  },
  {
    id: 'lore_3_cimetiere',
    chapter: 3,
    titleFr: 'III. Borne Funéraire : Le Clos des Rois',
    titleEn: 'III. Funerary Marker: The Kingswood Close',
    locationFr: "Vallée d'Ethynd — Cimetière de l'Est",
    locationEn: 'Valley of Ethynd — Eastern Cemetery',
    eraFr: 'Troisième Siècle',
    eraEn: 'Third Century',
    textFr: [
      "Au-delà de cette palissade reposent les souverains des trois premières dynasties et leurs chevaliers liges.",
      "Nul ne peut franchir l'arche souterraine de la Nécropole sans la Clé d'Argent Royal, de peur d'éveiller ceux qui montent la garde sur l'Éclat d'Améthyste.",
    ],
    textEn: [
      'Beyond this fence rest the monarchs of the first three dynasties and their sworn knights.',
      'None may pass the subterranean arch of the Necropolis without the Royal Silver Key, lest those guarding the Amethyst Shard be disturbed.',
    ],
  },
  {
    id: 'lore_4_morvath',
    chapter: 4,
    titleFr: "IV. Tablette de la Grotte : Le Nid de Morvath",
    titleEn: "IV. Cavern Tablet: Morvath's Brood",
    locationFr: "Grotte de l'Aube",
    locationEn: 'Dawn Cavern',
    eraFr: 'Chronique Récente',
    eraEn: 'Recent Chronicle',
    textFr: [
      "Des silhouettes marquées d'un soleil noirci sont venues dans cette caverne trois nuits avant le vol du Cristal.",
      "Elles ont versé une fiole d'ombre sur la carapace de Morvath, la vieille couveuse souterraine, afin qu'elle garde l'Éclat volé pendant que l'Ordre prépare l'éveil du Grand Dragon Rouge dans le Sud.",
    ],
    textEn: [
      'Cloaked figures bearing the sigil of a blackened sun entered this cavern three nights prior to the theft.',
      'They poured shadow-ichor upon Morvath, the subterranean broodmother, binding her to guard the stolen Shard while the Order prepares the Great Red Dragon’s awakening in the South.',
    ],
  },
  {
    id: 'lore_5_siderite',
    chapter: 5,
    titleFr: 'V. Traité de Maître Brom : La Sidérite',
    titleEn: "V. Master Brom's Treatise: Star-Siderite",
    locationFr: "Forge d'Airain",
    locationEn: 'Brazen Forge',
    eraFr: 'Manuel de Forge',
    eraEn: "Smith's Manual",
    textFr: [
      "Le fer commun s'émousse contre la pierre animée et les écailles anciennes. Seule la Sidérite, tombée des cieux lors du Grand Scellement, retient la lumière dans le fil d'une épée.",
      "Pour hisser une arme au sommet de son art, il faut mêler la Sidérite à la chaleur d'une véritable Écaille Draconique.",
    ],
    textEn: [
      'Common iron dulls against animated stone and elder scales. Only Siderite, fallen from the heavens during the Great Sealing, holds radiance along a blade’s edge.',
      'To elevate a weapon to masterwork perfection, Siderite must be tempered alongside a true Dragon Scale.',
    ],
  },
  {
    id: 'lore_6_couronne',
    chapter: 6,
    titleFr: 'VI. Annales Royales : Le Siège Silencieux',
    titleEn: 'VI. Royal Annals: The Silent Siege',
    locationFr: 'Château Royal — Archives',
    locationEn: 'Royal Castle — Archives',
    eraFr: 'Règne d’Édouard IV',
    eraEn: 'Reign of Edward IV',
    textFr: [
      "Lorsque des bruits de chaînes retentirent sous la Salle du Trône, le Roi Édouard IV fit verrouiller les portes extérieures du Château afin d'épargner le village.",
      "Trois escouades descendirent dans les Oubliettes pour vérifier le coffre de l'Éclat de Fer ; aucune n'est remontée.",
    ],
    textEn: [
      'When clanking chains echoed beneath the Throne Room, King Edward IV ordered the outer castle gates barred to shield the village.',
      'Three squads marched down into the Dungeons to inspect the Iron Shard vault; none returned.',
    ],
  },
  {
    id: 'lore_7_ordre_eclipse',
    chapter: 7,
    titleFr: "VII. Codex Interdit : L'Ordre de l'Éclipse",
    titleEn: 'VII. Forbidden Codex: Order of the Eclipse',
    locationFr: 'Château Royal — Bibliothèque',
    locationEn: 'Royal Castle — Library',
    eraFr: 'Deuxième Siècle',
    eraEn: 'Second Century',
    textFr: [
      "Vorgath était autrefois le plus brillant astronome du Conseil. Convaincu que la lumière du Prisme affaiblissait la magie des hommes, il fonda en secret l'Ordre de l'Éclipse.",
      "Banni par ses pairs, il jura de corrompre chacun des quatre gardiens élémentaires pour briser la prison de Pyraxis.",
    ],
    textEn: [
      'Vorgath was once the brightest astronomer of the Council. Convinced the Prism’s light fettered mortal sorcery, he secretly founded the Order of the Eclipse.',
      'Banished by his peers, he vowed to corrupt all four guardians and shatter Pyraxis’s prison.',
    ],
  },
  {
    id: 'lore_8_malakor',
    chapter: 8,
    titleFr: 'VIII. Journal de Garde : La Veille de Malakor',
    titleEn: "VIII. Watch Log: Malakor's Vigil",
    locationFr: 'Oubliettes Royales — Entrée',
    locationEn: 'Royal Dungeons — Entrance',
    eraFr: 'Il y a dix ans',
    eraEn: 'Ten Years Ago',
    textFr: [
      "Sire Malakor refusa d'être relevé de sa garde devant l'Éclat de Fer. « Nul autre bras n'est assez pur », répétait-il dans l'humidité des canaux.",
      "Mais l'isolement et les spectres envoyés par Vorgath rongèrent son serment jusqu'à ne laisser qu'une armure habitée par la fureur.",
    ],
    textEn: [
      'Sir Malakor refused relief from his post before the Iron Shard. "No other arm is steadfast enough," he repeated down in the damp canals.',
      'Yet isolation and Vorgath’s wraiths eroded his vow until only wrath-filled armor remained.',
    ],
  },
  {
    id: 'lore_9_serment',
    chapter: 9,
    titleFr: 'IX. Serment Gravé : Dernières Paroles',
    titleEn: 'IX. Carved Vow: Final Words',
    locationFr: 'Oubliettes Royales — Canal Sud',
    locationEn: 'Royal Dungeons — South Canal',
    eraFr: 'Semaine Dernière',
    eraEn: 'Last Week',
    textFr: [
      "Inscription griffée à la pointe d'une dague par la patrouille du Capitaine Vane : « Malakor crache désormais des éclairs d'ombre. Visez les ouvertures entre ses volées et ne restez pas figés face à sa lame ! »",
    ],
    textEn: [
      'Scratched with a dagger point by Captain Vane’s lost patrol: "Malakor now hurls bolts of shadow. Strike between his volleys and never stand still before his charge!"',
    ],
  },
  {
    id: 'lore_10_sylvebrume',
    chapter: 10,
    titleFr: 'X. Chant des Rôdeurs : Sylvebrume',
    titleEn: 'X. Ranger Lay: Sylvebrume',
    locationFr: 'Forêt de Sylvebrume — Clairière',
    locationEn: 'Sylvebrume Forest — Clearing',
    eraFr: 'Tradition Orale',
    eraEn: 'Oral Tradition',
    textFr: [
      "Sous la canopée éternelle de Sylvebrume poussent les Fleurs de Lune, nées des gouttes tombées du manteau d'Astrelya.",
      "Quand les rivières coulent limpides, la forêt guérit toutes les blessures ; quand le Temple pleure du givre noir, mêmes les loups perdent la raison.",
    ],
    textEn: [
      'Beneath Sylvebrume’s eternal canopy bloom the Moonflowers, born from dewdrops off Astrelya’s mantle.',
      'When its rivers run clear, the woods mend every wound; when the Temple weeps black frost, even wolves lose their minds.',
    ],
  },
  {
    id: 'lore_11_astrelya',
    chapter: 11,
    titleFr: "XI. Arche des Brumes : Dame de l'Azur",
    titleEn: 'XI. Mist Arch: Lady of Azure',
    locationFr: 'Forêt de Sylvebrume — Seuil du Temple',
    locationEn: 'Sylvebrume Forest — Temple Threshold',
    eraFr: 'Âge Mythique',
    eraEn: 'Mythic Age',
    textFr: [
      "Astrelya, gardienne des étoiles reflétées sur l'onde, confia son Éclat d'Azur à la grande vouivre Léviathanis.",
      "Durant neuf siècles, la créature veilla en paix dans le sanctuaire englouti, berçant le cristal dans ses anneaux d'écume.",
    ],
    textEn: [
      'Astrelya, keeper of stars mirrored upon water, entrusted her Azure Shard to the great wyvern Leviathanis.',
      'For nine centuries the leviathan slumbered peacefully within the sunken sanctuary, cradling the crystal in coils of foam.',
    ],
  },
  {
    id: 'lore_12_temple',
    chapter: 12,
    titleFr: 'XII. Liturgie des Eaux : Les Deux Îlots',
    titleEn: 'XII. Liturgy of Tides: The Twin Islets',
    locationFr: "Temple Englouti d'Astrelya — Nef",
    locationEn: 'Sunken Temple of Astrelya — Nave',
    eraFr: 'Premier Millénaire',
    eraEn: 'First Millennium',
    textFr: [
      "« À l'ouest repose l'acier des marées ; à l'est sommeille le miroir qui brise le froid ; au nord s'élève l'autel où l'Azur ne doit jamais s'éteindre. »",
    ],
    textEn: [
      '"To the west rests the steel of tides; to the east slumbers the mirror that shatters frost; to the north rises the altar where Azure must never fade."',
    ],
  },
  {
    id: 'lore_13_leviathan',
    chapter: 13,
    titleFr: 'XIII. Complainte de Léviathanis',
    titleEn: 'XIII. Lament of Leviathanis',
    locationFr: "Temple Englouti — Bassin Est",
    locationEn: 'Sunken Temple — East Basin',
    eraFr: 'Ère de l’Éclipse',
    eraEn: 'Era of the Eclipse',
    textFr: [
      "Les mages de l'Éclipse ont brisé les amphores de fiel noir dans les bassins sacrés. Aveuglée par la douleur, Léviathanis prend désormais tout être vivant pour un profanateur.",
      "Seule une lame résolue pourra libérer son esprit et purifier l'Éclat d'Azur.",
    ],
    textEn: [
      'Eclipse mages shattered amphorae of black bile into the sacred basins. Blinded by agony, Leviathanis now mistakes every living soul for a defiler.',
      'Only a resolute blade can free her spirit and cleanse the Azure Shard.',
    ],
  },
  {
    id: 'lore_14_vorgath',
    chapter: 14,
    titleFr: 'XIV. Épitaphe Profanée : Le Rituel de Vorgath',
    titleEn: 'XIV. Defiled Epitaph: Vorgath’s Ritual',
    locationFr: 'Nécropole des Rois Oubliés',
    locationEn: 'Necropolis of Forgotten Kings',
    eraFr: 'Nuit du Scellement Brisé',
    eraEn: 'Night of the Broken Seal',
    textFr: [
      "Ici Vorgath arracha son propre cœur mortel devant le sarcophage d'Édouard Ier, liant son âme à l'Éclat d'Améthyste.",
      "Mais en absorbant le cristal royal, l'Archiliche devint prisonnier de la Nécropole, incapable de porter lui-même la pierre jusqu'à Pyra.",
    ],
    textEn: [
      'Here Vorgath tore out his own mortal heart before Edward I’s sarcophagus, binding his soul to the Amethyst Shard.',
      'Yet by drinking the royal crystal’s power, the Archlich bound himself within the Necropolis, unable to carry it south to Pyra himself.',
    ],
  },
  {
    id: 'lore_15_pyra',
    chapter: 15,
    titleFr: 'XV. Chronique des Veilleurs de Cendre',
    titleEn: 'XV. Chronicle of the Ash Watchers',
    locationFr: 'Terres Ardentes de Pyra',
    locationEn: 'Scorched Lands of Pyra',
    eraFr: 'Garde Éternelle',
    eraEn: 'Eternal Watch',
    textFr: [
      "Nous, derniers Veilleurs du Sud, tenons le col de basalte malgré les pluies d'escarbilles et les drakes d'obsidienne.",
      "Lorsque le porteur du Prisme réunifié franchira nos lignes, l'heure du dernier assaut contre la Citadelle aura sonné.",
    ],
    textEn: [
      'We, last Watchers of the South, hold the basalt pass despite rains of cinder and obsidian drakes.',
      'When the bearer of the reforged Prism crosses our lines, the hour of the final assault upon the Citadel shall strike.',
    ],
  },
  {
    id: 'lore_16_pyraxis',
    chapter: 16,
    titleFr: 'XVI. Prophétie du Sanctuaire : Aube contre Néant',
    titleEn: 'XVI. Sanctum Prophecy: Dawn Against Void',
    locationFr: "Sanctuaire de l'Éclipse",
    locationEn: 'Sanctum of the Eclipse',
    eraFr: 'Fin du Cycle',
    eraEn: 'End of the Cycle',
    textFr: [
      "« Tous les mille ans, la braise primordiale teste le courage des mortels. Si les quatre royaumes demeurent divisés, le Néant règne ; si une seule âme rassemble l'Aube, le Fer, l'Azur et l'Améthyste, Pyraxis retombera en poussière d'étoiles. »",
    ],
    textEn: [
      '"Every thousand years, the primordial ember tests mortal valor. Should the four realms stand divided, Void reigns; should one soul unite Dawn, Iron, Azure, and Amethyst, Pyraxis shall crumble back into stardust."',
    ],
  },
];

export function xpRequiredForLevel(level: number): number {
  return Math.round(45 * Math.pow(level, 1.45));
}

export function computeDerivedStats(p: PlayerProgress) {
  let equipAtk = 0;
  let equipDef = 0;
  let equipHp = 0;
  let equipCrit = 0;
  let equipSpeed = 0;
  let equipArcane = 0;
  let lifesteal = 0;
  let slashColor = '#e2e8f0';

  for (const slot of [EquipSlot.Weapon, EquipSlot.Armor, EquipSlot.Shield, EquipSlot.Relic]) {
    const eqId = p.equipped[slot];
    if (!eqId) continue;
    const def = EQUIPMENT_CATALOG.find((e) => e.id === eqId);
    if (!def) continue;
    const upg = p.upgrades[eqId] || 0;
    equipAtk += def.atkBonus + (def.slot === EquipSlot.Weapon ? upg * 3 : 0);
    equipDef += def.defBonus + (def.slot === EquipSlot.Armor || def.slot === EquipSlot.Shield ? upg * 2 : 0);
    equipHp += def.hpBonus + (def.slot === EquipSlot.Armor ? upg * 6 : upg * 2);
    equipCrit += def.critBonus + upg;
    equipSpeed += def.speedBonus;
    equipArcane += def.arcaneBonus + (def.slot === EquipSlot.Weapon ? upg : 0);
    lifesteal += def.lifesteal || 0;
    if (def.slashColor) slashColor = def.slashColor;
  }

  const maxHp = 12 + (p.level - 1) * 3 + p.attrs.vitality * 4 + equipHp;
  const attack = 2 + Math.floor((p.level - 1) * 0.8) + p.attrs.strength * 2 + equipAtk;
  const defense = Math.floor((p.level - 1) * 0.4) + Math.floor(p.attrs.vitality * 0.5) + equipDef;
  const critChance = Math.min(65, 5 + p.attrs.agility * 3 + equipCrit);
  const moveSpeed = Math.min(4.8, 3.0 + p.attrs.agility * 0.08 + equipSpeed * 0.025);
  const arcanePower = Math.round(attack * 1.45 + p.attrs.arcane * 4 + equipArcane * 2.5);
  const skillCooldownTicks = Math.max(45, 135 - p.attrs.arcane * 5 - equipArcane * 3);

  return {
    maxHp,
    attack,
    defense,
    critChance,
    moveSpeed,
    arcanePower,
    skillCooldownTicks,
    lifesteal,
    slashColor,
  };
}

export function createInitialProgress(): PlayerProgress {
  return {
    level: 1,
    xp: 0,
    gold: 25,
    hp: 16,
    statPoints: 0,
    attrs: {
      vitality: 1,
      strength: 1,
      agility: 1,
      arcane: 1,
    },
    equipped: {
      [EquipSlot.Weapon]: 'sword_wood',
      [EquipSlot.Armor]: 'armor_tunic',
      [EquipSlot.Shield]: null,
      [EquipSlot.Relic]: null,
    },
    ownedEquip: ['sword_wood', 'armor_tunic'],
    upgrades: {},
    inventory: {
      potion: 2,
    },
    flags: {},
    kills: {},
    encountered: { chat: true },
    completedQuests: {},
    openedChests: {},
    takenMapItems: {},
    unlockedLore: {},
    visitedMaps: { maison: true },
    currentMap: 'maison',
    wx: 306,
    wy: 160,
    dir: Direction.Bas,
    playSeconds: 0,
  };
}

export function isFlagUnlocked(p: PlayerProgress, flag?: string | null): boolean {
  if (!flag) return true;
  if (p.flags[flag]) return true;
  switch (flag) {
    case 'talked_sage':
      return Boolean(
        p.visitedMaps.grotte || p.flags.act1_done || (p.inventory.crystal_aube || 0) > 0
      );
    case 'act1_done':
      return Boolean(p.visitedMaps.chateau || p.flags.talked_roi || p.flags.act2_started);
    case 'talked_roi':
      return Boolean(
        p.visitedMaps.oubliettes || (p.inventory.crystal_fer || 0) > 0 || p.flags.act2_started
      );
    case 'act2_started':
      return Boolean(p.visitedMaps.foret || p.flags.talked_elowen || p.flags.act3_done);
    case 'talked_elowen':
      return Boolean(
        p.visitedMaps.temple || (p.inventory.crystal_azur || 0) > 0 || p.flags.act3_done
      );
    case 'act3_done':
      return Boolean(
        p.visitedMaps.crypte || (p.inventory.crystal_amethyste || 0) > 0 || p.flags.act4_done
      );
    case 'act4_done':
      return Boolean(p.visitedMaps.terres_ardentes || p.visitedMaps.citadelle);
    default:
      return false;
  }
}

export function isNpcPresent(
  p: PlayerProgress,
  npc: { blockUntilFlag?: string }
): boolean {
  if (!npc.blockUntilFlag) return true;
  return !isFlagUnlocked(p, npc.blockUntilFlag);
}

export function resolveDoorDenyDialogue(denyKey: string | null): ActiveDialogue {
  switch (denyKey) {
    case 'deny_cave_house':
    case 'deny_cave_village':
      return {
        speakerFr: 'Pensée',
        speakerEn: 'Thought',
        linesFr: [
          "Cet escalier s'enfonce vers la Grotte de l'Aube. Je devrais d'abord écouter les instructions du Sage Aldric.",
        ],
        linesEn: [
          'These steps lead down into the Dawn Cavern. I should speak with Sage Aldric first.',
        ],
      };
    case 'deny_castle':
      return {
        speakerFr: 'Le Gardien Royal',
        speakerEn: 'The Royal Guard',
        linesFr: [
          'Halte ! Le Château Royal est verrouillé sur ordre du Roi Édouard IV.',
          "Seul un porteur du Sceau du Conseil remis par le Sage Aldric peut demander audience.",
        ],
        linesEn: [
          'Halt! The Royal Castle is sealed by decree of King Edward IV.',
          'Only a bearer of the Council Seal granted by Sage Aldric may request an audience.',
        ],
      };
    case 'deny_oubliettes':
      return {
        speakerFr: 'Sentinelle du Palais',
        speakerEn: 'Palace Sentinel',
        linesFr: [
          "L'accès aux Oubliettes Royales est strictement interdit sans l'aval du Roi Édouard IV dans la Salle du Trône.",
        ],
        linesEn: [
          'Access to the Royal Dungeons is strictly forbidden without King Edward IV’s authorization in the Throne Room.',
        ],
      };
    case 'deny_west_forest':
      return {
        speakerFr: 'Barrage Royal',
        speakerEn: 'Royal Barricade',
        linesFr: [
          "La route de Sylvebrume est barrée tant que la crise des Oubliettes du Château n'a pas été résolue auprès du Roi.",
        ],
        linesEn: [
          'The road to Sylvebrume remains closed until the crisis in the Royal Dungeons is resolved with the King.',
        ],
      };
    case 'deny_temple':
      return {
        speakerFr: 'Sceau Sylvestre',
        speakerEn: 'Sylvan Seal',
        linesFr: [
          "Une barrière de brume protège l'entrée du Temple Englouti. La rôdeuse Élowen, au centre de la forêt, connaît le chant d'ouverture.",
        ],
        linesEn: [
          'A veil of mist seals the Sunken Temple entrance. Ranger Elowen at the center of the forest knows the opening chant.',
        ],
      };
    case 'deny_crypt':
      return {
        speakerFr: 'Herse de la Nécropole',
        speakerEn: 'Necropolis Portcullis',
        linesFr: [
          "Une serrure d'argent royal scelle l'entrée de la Nécropole des Rois Oubliés. Terminez votre quête en Sylvebrume pour obtenir la Clé d'Argent.",
        ],
        linesEn: [
          'A royal silver lock seals the Necropolis of Forgotten Kings. Complete your quest in Sylvebrume to obtain the Silver Key.',
        ],
      };
    case 'deny_south_pyra':
      return {
        speakerFr: 'Barrière de Cendre',
        speakerEn: 'Wall of Cinders',
        linesFr: [
          'Un mur de chaleur étouffante bloque le col du Sud. Il vous faut réunir les Quatre Éclats du Prisme avec le Sage ou le Roi pour le traverser !',
        ],
        linesEn: [
          'A searing barrier blocks the southern pass. You must unite all Four Shards of the Prism with the Sage or the King to cross!',
        ],
      };
    default:
      return {
        speakerFr: 'Passage scellé',
        speakerEn: 'Sealed Passage',
        linesFr: ['Ce passage est verrouillé pour le moment.'],
        linesEn: ['This passage is currently locked.'],
      };
  }
}

export function resolveNpcDialogue(npcId: string, p: PlayerProgress): {
  dialogue: ActiveDialogue;
  mutate?: (draft: PlayerProgress) => void;
} {
  const hasDawn = (p.inventory.crystal_aube || 0) > 0;
  const hasIron = (p.inventory.crystal_fer || 0) > 0;
  const hasAzure = (p.inventory.crystal_azur || 0) > 0;
  const hasAmethyst = (p.inventory.crystal_amethyste || 0) > 0;

  if (npcId === 'sage') {
    if (!p.flags.talked_sage) {
      return {
        mutate: (d) => {
          d.flags.talked_sage = true;
        },
        dialogue: {
          speakerFr: 'Le Sage Aldric',
          speakerEn: 'Sage Aldric',
          linesFr: [
            "Ah, te voilà enfin ! Le village d'Ethynd a grand besoin de ton courage, jeune veilleur.",
            "Cette nuit, des chauves-souris des profondeurs ont dérobé notre Cristal de lumière — l'Éclat de l'Aube — et l'ont emporté dans le nid de Morvath, la Couveuse tapie au fond de la grotte.",
            "Emprunte l'escalier de la cave au sud-est de ma maison. Frappe avec [Espace/X], libère ton Onde de Lumière avec [E], et rapporte-moi le Cristal !",
          ],
          linesEn: [
            'Ah, there you are at last! Ethynd village sorely needs your courage, young watchman.',
            'Last night, cavern bats stole our Crystal of Light — the Shard of Dawn — carrying it deep into the nest of Morvath, the Cavern Broodmother.',
            'Take the cellar stairs in the southeast corner of my cottage. Strike with [Space/X], unleash your Arcane Wave with [E], and bring back the Shard!',
          ],
        },
      };
    }

    if (hasDawn && !p.flags.act1_done) {
      return {
        mutate: (d) => {
          d.flags.act1_done = true;
          d.hp = 999;
        },
        dialogue: {
          speakerFr: 'Le Sage Aldric',
          speakerEn: 'Sage Aldric',
          linesFr: [
            "Par les étoiles... Tu as terrassé Morvath et retrouvé l'Éclat de l'Aube ! Mais regarde ses facettes : une fissure noire ronge le cristal !",
            "Ce vol n'était que le premier acte d'un complot : l'Ordre de l'Éclipse veut briser les Quatre Éclats du Prisme pour réveiller Pyraxis, le légendaire Dragon Rouge scellé sous les volcans du Sud !",
            "Prends mon Sceau du Conseil et sors par le sud de la grotte vers la Vallée. Le Gardien t'ouvrira enfin les portes du Château Royal au nord-est !",
          ],
          linesEn: [
            'By the stars... You defeated Morvath and recovered the Shard of Dawn! Yet look closely: a dark fracture runs through its core!',
            'This theft was merely the opening move: the Eclipse Order seeks to shatter all Four Shards of the Prism to awaken Pyraxis, the legendary Great Red Dragon sealed beneath the southern volcanoes!',
            'Take my Council Seal and exit south from the cavern into the Valley. The Guard will now open the Royal Castle gates in the northeast for you!',
          ],
        },
      };
    }

    if (hasDawn && hasIron && hasAzure && hasAmethyst && !p.flags.act4_done) {
      return {
        mutate: (d) => {
          d.flags.act4_done = true;
          d.hp = 999;
        },
        dialogue: {
          speakerFr: 'Le Sage Aldric',
          speakerEn: 'Sage Aldric',
          linesFr: [
            "L'Aube, le Fer, l'Azur et l'Améthyste... Pour la première fois depuis mille ans, les Quatre Éclats d'Ethynd rayonnent à l'unisson !",
            "Le Prisme est reformé ! Sa lumière vient de dissiper la Barrière de Cendre au sud de la Vallée.",
            "Marche vers les Terres Ardentes de Pyra et affronte enfin Pyraxis, le Grand Dragon Rouge, au sommet du Sanctuaire de l'Éclipse !",
          ],
          linesEn: [
            'Dawn, Iron, Azure, and Amethyst... For the first time in a thousand years, all Four Shards of Ethynd shine as one!',
            'The Prism is reforged! Its light has shattered the Wall of Cinders blocking the southern Valley road.',
            'March into the Scorched Lands of Pyra and face Pyraxis, the Great Red Dragon, atop the Sanctum of the Eclipse!',
          ],
        },
      };
    }

    return {
      mutate: (d) => {
        d.hp = 999;
      },
      dialogue: {
        speakerFr: 'Le Sage Aldric',
        speakerEn: 'Sage Aldric',
        linesFr: [
          p.flags.act1_done
            ? "Que la clarté d'Aldric apaise tes blessures (PV restaurés). Rassemble les Quatre Éclats avant que le Grand Dragon Rouge ne s'éveille dans le Sud !"
            : "L'escalier de la cave mène directement à la Grotte de l'Aube. J'ai restauré tes forces : prends garde aux dards venimeux de Morvath !",
        ],
        linesEn: [
          p.flags.act1_done
            ? 'May the light mend your wounds (HP restored). Gather all Four Shards before the Great Red Dragon awakens in the South!'
            : 'The cellar stairs lead straight into Dawn Cavern. I have restored your vitality—watch out for Morvath’s venomous darts!',
        ],
      },
    };
  }

  if (npcId === 'gardien') {
    if (!p.flags.act1_done) {
      return {
        dialogue: {
          speakerFr: 'Le Gardien Royal',
          speakerEn: 'The Royal Guard',
          linesFr: [
            'Halte ! Le Château est fermé ce soir. Les ordres du Roi sont les ordres du Roi.',
            "Si tu cherches la Grotte de l'Aube, son entrée est à l'ouest, au pied de la falaise. Rapporte d'abord le Cristal au Sage Aldric !",
          ],
          linesEn: [
            'Halt! The Castle is closed tonight. The King’s orders are final.',
            'If you seek Dawn Cavern, its entrance lies west at the foot of the cliff. Aid Sage Aldric first!',
          ],
        },
      };
    }
    return {
      dialogue: {
        speakerFr: 'Le Gardien Royal',
        speakerEn: 'The Royal Guard',
        linesFr: [
          "Le Sceau du Sage Aldric ! Pardonnez mon accueil bourru, messire veilleur. La herse du Château Royal est désormais grande ouverte derrière moi.",
          'Le Roi Édouard IV vous attend de toute urgence dans la Salle du Trône.',
        ],
        linesEn: [
          'Sage Aldric’s Council Seal! Forgive my gruffness earlier, Watchman. The Royal Castle portcullis now stands open behind me.',
          'King Edward IV awaits you urgently in the Throne Room.',
        ],
      },
    };
  }

  if (npcId === 'marchand') {
    return {
      dialogue: {
        speakerFr: 'Marchand Anselme',
        speakerEn: 'Merchant Anselm',
        linesFr: [
          "Bienvenue à l'étal du Lac d'Ethynd ! Malgré les monstres qui rôdent au sud, j'ai des potions fraîches, des boucliers et de bonnes lames.",
          'Jette un œil à ma marchandise si ta bourse tinte !',
        ],
        linesEn: [
          'Welcome to the Lake Ethynd Market Stall! Despite monsters prowling the south road, I stock fresh potions, shields, and sturdy steel.',
          'Browse my wares if you have coin to spare!',
        ],
        shopType: 'market',
        choices: [
          { labelFr: 'Ouvrir la boutique du Marché', labelEn: 'Open Market Shop', action: 'open_shop' },
          { labelFr: 'Fermer', labelEn: 'Close', action: 'close' },
        ],
      },
    };
  }

  if (npcId === 'villageoise') {
    return {
      dialogue: {
        speakerFr: 'Claire, Fermière Royale',
        speakerEn: 'Claire, Royal Farmer',
        linesFr: [
          "As-tu visité la Forge d'Airain, juste à l'est de l'étal du marché ? Maître Brom y martèle des armes redoutables.",
          "Et méfie-toi du bois clôturé au sud-est : la nuit, des squelettes se lèvent autour de l'ancienne crypte royale !",
        ],
        linesEn: [
          'Have you visited the Brazen Forge just east of the market stall? Master Brom hammers formidable weapons there.',
          'And beware the fenced woods to the southeast: skeletons rise around the old royal crypt at dusk!',
        ],
      },
    };
  }

  if (npcId === 'forgeron') {
    const canTurnInSiderite = !p.flags.sq_siderite_done && (p.inventory.siderite || 0) >= 2;
    const choices: ActiveDialogue['choices'] = [
      { labelFr: 'Armurerie & Forge (+1/+2/+3)', labelEn: 'Armory & Smithing (+1/+2/+3)', action: 'open_shop' },
    ];
    if (canTurnInSiderite) {
      choices.unshift({
        labelFr: 'Remettre 2 Sidérites (Quête : Métal des Étoiles)',
        labelEn: 'Deliver 2 Siderite Ores (Quest: Star-Fallen Metal)',
        action: 'turn_in_siderite',
      });
    }
    choices.push({ labelFr: 'Fermer', labelEn: 'Close', action: 'close' });
    return {
      dialogue: {
        speakerFr: 'Maître Forgeron Brom',
        speakerEn: 'Master Blacksmith Brom',
        linesFr: [
          "L'acier ne ment jamais, l'ami ! Dans ma forge, tu peux acquérir des armes et armures lourdes, ou renforcer ton équipement jusqu'à +3 avec de la Sidérite et des Écailles.",
          !p.flags.sq_siderite_done
            ? "Si tu déniches 2 morceaux de Minerai de Sidérite dans les grottes ou le cimetière, rapporte-les-moi : je te forgerai un Écu d'Airain gratuitement !"
            : 'Mon fourneau brûle à plein régime grâce à ta Sidérite. Que veux-tu forger ?',
        ],
        linesEn: [
          'Steel never lies, friend! Here you can buy heavy weapons and armor, or temper your gear up to +3 using Siderite and Dragon Scales.',
          !p.flags.sq_siderite_done
            ? 'Bring me 2 Siderite Ores from the caverns or cemetery, and I will forge you a Brazen Heater Shield on the house!'
            : 'My furnace roars hot thanks to your Siderite. What shall we forge today?',
        ],
        shopType: 'forge',
        choices,
      },
    };
  }

  if (npcId === 'herboriste') {
    const canTurnInFlowers = !p.flags.sq_moonflower_done && (p.inventory.fleur_lune || 0) >= 3;
    const choices: ActiveDialogue['choices'] = [
      { labelFr: 'Herboristerie & Élixirs', labelEn: 'Apothecary & Elixirs', action: 'open_shop' },
    ];
    if (canTurnInFlowers) {
      choices.unshift({
        labelFr: 'Remettre 3 Fleurs de Lune (Quête : Herbier Lunaire)',
        labelEn: 'Deliver 3 Moonflowers (Quest: Lunar Herbarium)',
        action: 'turn_in_moonflower',
      });
    }
    choices.push({ labelFr: 'Fermer', labelEn: 'Close', action: 'close' });
    return {
      dialogue: {
        speakerFr: 'Lysa, Maîtresse Herboriste',
        speakerEn: 'Lysa, Master Herbalist',
        linesFr: [
          'Je distille des potions et des Élixirs Royaux pour les gardiens du royaume.',
          !p.flags.sq_moonflower_done
            ? 'Lorsque la route de Sylvebrume sera ouverte, cueille 3 Fleurs de Lune pour mon herbier : je t’offrirai mon Talisman de Sève Vive qui draine la vie en combat !'
            : 'Tes Fleurs de Lune embaument tout mon atelier ! Mes élixirs sont à ta disposition.',
        ],
        linesEn: [
          'I distill healing potions and Royal Elixirs for the realm’s defenders.',
          !p.flags.sq_moonflower_done
            ? 'Once the western road opens to Sylvebrume, gather 3 Moonflowers for my herbarium—I will craft you a Living Sap Talisman with life-drain!'
            : 'Your Moonflowers illuminate my entire workshop! My elixirs are yours to browse.',
        ],
        shopType: 'alchemy',
        choices,
      },
    };
  }

  if (npcId === 'roi') {
    if (!p.flags.talked_roi) {
      return {
        mutate: (d) => {
          d.flags.talked_roi = true;
          d.hp = 999;
        },
        dialogue: {
          speakerFr: 'Roi Édouard IV',
          speakerEn: 'King Edward IV',
          linesFr: [
            "Sois le bienvenu devant le trône d'Ethynd, porteur de l'Aube. Aldric avait donc raison : l'Ordre de l'Éclipse frappe simultanément nos quatre sanctuaires.",
            "Sous nos pieds, dans les Oubliettes Royales, notre ancien champion Sire Malakor a sombré dans la folie et retient l'Éclat de Fer.",
            "Je t'ouvre l'escalier de l'aile est. Terrasse Malakor, rapporte l'Éclat de Fer, et nous ouvrirons la marche vers Sylvebrume !",
          ],
          linesEn: [
            'Welcome before the throne of Ethynd, bearer of Dawn. Aldric spoke true: the Eclipse Order strikes all four sanctuaries at once.',
            'Beneath our feet in the Royal Dungeons, our former champion Sir Malakor has fallen to madness and guards the Shard of Iron.',
            'I grant you access to the east-wing stairwell. Defeat Malakor, recover the Iron Shard, and we shall unseal the road to Sylvebrume!',
          ],
        },
      };
    }

    if (hasIron && !p.flags.act2_started) {
      return {
        mutate: (d) => {
          d.flags.act2_started = true;
          d.hp = 999;
        },
        dialogue: {
          speakerFr: 'Roi Édouard IV',
          speakerEn: 'King Edward IV',
          linesFr: [
            "L'Éclat de Fer brille de nouveau entre tes mains ! Que l'âme de Sire Malakor trouve enfin le repos.",
            "J'ordonne immédiatement la levée du barrage sur la route de l'Ouest : rends-toi dans la Forêt de Sylvebrume et trouve la rôdeuse Élowen pour sauver l'Éclat d'Azur !",
          ],
          linesEn: [
            'The Shard of Iron gleams once more in your grasp! May Sir Malakor’s spirit finally know peace.',
            'I hereby lift the barricade on the western road: journey into Sylvebrume Forest and find Ranger Elowen to save the Azure Shard!',
          ],
        },
      };
    }

    if (hasAzure && !p.flags.act3_done) {
      return {
        mutate: (d) => {
          d.flags.act3_done = true;
          d.hp = 999;
        },
        dialogue: {
          speakerFr: 'Roi Édouard IV',
          speakerEn: 'King Edward IV',
          linesFr: [
            "Tu as purifié le Temple Englouti d'Astrelya ! Trois Éclats sur quatre sont désormais sous ta garde.",
            "Voici la Clé d'Argent Royal de mes ancêtres : elle déverrouille la Nécropole des Rois Oubliés, au cœur du cimetière sud-est de la Vallée, où Vorgath détient l'Éclat d'Améthyste !",
          ],
          linesEn: [
            'You have cleansed the Sunken Temple of Astrelya! Three of the four Shards now rest in your keeping.',
            'Take my ancestors’ Royal Silver Key: it unlocks the Necropolis of Forgotten Kings in the southeastern cemetery, where Vorgath holds the Amethyst Shard!',
          ],
        },
      };
    }

    if (hasDawn && hasIron && hasAzure && hasAmethyst && !p.flags.act4_done) {
      return {
        mutate: (d) => {
          d.flags.act4_done = true;
          d.hp = 999;
        },
        dialogue: {
          speakerFr: 'Roi Édouard IV',
          speakerEn: 'King Edward IV',
          linesFr: [
            "Vorgath est vaincu et les Quatre Éclats rayonnent ensemble sous la voûte royale !",
            "Le Prisme d'Ethynd est restauré : la Barrière de Cendre au sud de la Vallée vient de céder. Va dans les Terres Ardentes de Pyra et anéantis Pyraxis une fois pour toutes !",
          ],
          linesEn: [
            'Vorgath has fallen and all Four Shards blaze together beneath the royal vault!',
            'The Prism of Ethynd is restored: the southern Wall of Cinders has shattered. Ride south into Pyra and end Pyraxis forever!',
          ],
        },
      };
    }

    return {
      mutate: (d) => {
        d.hp = 999;
      },
      dialogue: {
        speakerFr: 'Roi Édouard IV',
        speakerEn: 'King Edward IV',
        linesFr: [
          'La bénédiction de la Couronne restaure tes forces (PV restaurés). Poursuis ta quête avec bravoure, Champion d’Ethynd !',
        ],
        linesEn: [
          'The Crown’s blessing restores your strength (HP restored). Press onward with valor, Champion of Ethynd!',
        ],
      },
    };
  }

  if (npcId === 'archiviste') {
    const loreCount = Object.keys(p.unlockedLore).length;
    return {
      dialogue: {
        speakerFr: 'Archiviste Royale Sélène',
        speakerEn: 'Royal Archivist Selene',
        linesFr: [
          `Tu as actuellement déchiffré ${loreCount} stèle(s) et grimoire(s) sur les 16 que compte le royaume d'Ethynd.`,
          "Consulte l'onglet « Codex » à tout moment pour relire l'histoire secrète du Prisme, de Malakor, d'Astrelya et de l'Ordre de l'Éclipse !",
        ],
        linesEn: [
          `You have deciphered ${loreCount} of the 16 ancient steles and grimoires scattered across Ethynd.`,
          'Open the "Codex" tab anytime to read the full history of the Prism, Malakor, Astrelya, and the Eclipse Order!',
        ],
      },
    };
  }

  if (npcId === 'capitaine') {
    const canTurnInBadge = !p.flags.sq_patrol_done && (p.inventory.insigne_garde || 0) >= 1;
    const choices: ActiveDialogue['choices'] = [];
    if (canTurnInBadge) {
      choices.push({
        labelFr: "Remettre l'Insigne de la Patrouille",
        labelEn: 'Return the Lost Patrol Insignia',
        action: 'turn_in_badge',
      });
    }
    choices.push({ labelFr: 'Fermer', labelEn: 'Close', action: 'close' });
    return {
      dialogue: {
        speakerFr: 'Capitaine Vane',
        speakerEn: 'Captain Vane',
        linesFr: [
          !p.flags.sq_patrol_done
            ? "Mes meilleurs hommes sont descendus dans les Oubliettes Royales la semaine dernière. Si tu retrouves leur Insigne au sud des canaux, rapporte-le-moi afin d'honorer leur mémoire."
            : "Grâce à toi, les familles de ma patrouille ont reçu leurs insignes d'honneur. Ton épée est la fierté de la Citadelle !",
        ],
        linesEn: [
          !p.flags.sq_patrol_done
            ? 'My finest soldiers descended into the Royal Dungeons last week. If you find their Patrol Insignia south of the canals, bring it back so we may honor their sacrifice.'
            : 'Thanks to you, the families of my lost squad received their badges of honor. Your blade is the pride of the Citadel!',
        ],
        choices: choices.length > 1 ? choices : undefined,
      },
    };
  }

  if (npcId === 'elowen') {
    if (!p.flags.talked_elowen) {
      return {
        mutate: (d) => {
          d.flags.talked_elowen = true;
          d.hp = 999;
        },
        dialogue: {
          speakerFr: 'Élowen, Rôdeuse de Sylvebrume',
          speakerEn: 'Elowen, Sylvebrume Ranger',
          linesFr: [
            "Halte, voyageur... Tu portes l'Éclat de l'Aube et l'Éclat de Fer ! Les arbres murmuraient ta venue.",
            "Au nord-ouest, au-delà du pont sur la rivière mystique, s'élève le Temple Englouti d'Astrelya. Les occultistes ont empoisonné ses eaux, rendant folle la grande vouivre Léviathanis.",
            "Je dissipe le sceau de brume du Temple pour toi. Libère Léviathanis et empare-toi de l'Éclat d'Azur !",
          ],
          linesEn: [
            'Stay your blade, traveler... You carry the Shards of Dawn and Iron! The ancient trees whispered of your arrival.',
            'Northwest beyond the river bridge stands the Sunken Temple of Astrelya. Cultists poisoned its waters, driving the great wyvern Leviathanis mad.',
            'I have lifted the mist seal on the Temple gate. Free Leviathanis and reclaim the Shard of Azure!',
          ],
        },
      };
    }

    if (hasAzure && !p.flags.act3_done) {
      return {
        mutate: (d) => {
          d.flags.act3_done = true;
          d.hp = 999;
        },
        dialogue: {
          speakerFr: 'Élowen, Rôdeuse de Sylvebrume',
          speakerEn: 'Elowen, Sylvebrume Ranger',
          linesFr: [
            "L'eau de la rivière redevient limpide... Tu as apaisé Léviathanis et reconquis l'Éclat d'Azur !",
            "Un messager du Roi Édouard IV m'a confié cette Clé d'Argent Royal pour toi : elle ouvre la Nécropole des Rois Oubliés, dans le cimetière clôturé au sud-est de la Vallée d'Ethynd !",
          ],
          linesEn: [
            'The river runs crystal clear once again... You calmed Leviathanis and reclaimed the Azure Shard!',
            'A royal courier entrusted me with this Royal Silver Key for you: it unlocks the Necropolis of Forgotten Kings in the southeastern cemetery of Ethynd Valley!',
          ],
        },
      };
    }

    return {
      mutate: (d) => {
        d.hp = 999;
      },
      dialogue: {
        speakerFr: 'Élowen, Rôdeuse de Sylvebrume',
        speakerEn: 'Elowen, Sylvebrume Ranger',
        linesFr: [
          "Repose-toi près de mon feu de camp (PV restaurés). N'oublie pas de cueillir des Fleurs de Lune dans les clairières pour l'herboriste Lysa !",
        ],
        linesEn: [
          'Rest beside my campfire (HP restored). Remember to gather Moonflowers in the clearings for Herbalist Lysa!',
        ],
      },
    };
  }

  if (npcId === 'veilleur') {
    return {
      mutate: (d) => {
        d.hp = 999;
      },
      dialogue: {
        speakerFr: 'Kael, Veilleur des Cendres',
        speakerEn: 'Kael, Watcher of Cinders',
        linesFr: [
          "Le Prisme rayonne entre tes mains ! Depuis des mois nous contenons les golems et les vouivres d'obsidienne à l'entrée de ce défilé.",
          "Prends garde sur le pont de basalte : Ignis, le premier Dragon des Cendres, en défend l'accès.",
          "Au sud, au sommet du Sanctuaire de l'Éclipse, t'attend enfin Pyraxis, le Grand Dragon Rouge. J'ai pansé tes blessures : va écrire la légende d'Ethynd !",
        ],
        linesEn: [
          'The Prism blazes in your hands! For months we have held back obsidian golems and wyverns at this canyon mouth.',
          'Beware the basalt bridge ahead: Ignis, the Cinder Dragon, guards the crossing.',
          'Beyond rises the Sanctum of the Eclipse, where Pyraxis, the Great Red Dragon, awaits at last. I have tended your wounds—go forge the legend of Ethynd!',
        ],
      },
    };
  }

  if (
    npcId === 'garde_trone_g' ||
    npcId === 'garde_trone_d' ||
    npcId === 'sentinelle_salle_g' ||
    npcId === 'sentinelle_salle_d'
  ) {
    return {
      dialogue: {
        speakerFr: 'Garde d’Honneur du Trône',
        speakerEn: 'Royal Throne Guard',
        linesFr: [
          p.flags.act4_done
            ? "Le Prisme brille à nouveau ! Toute la Garde Royale salue ta bravoure avant ton départ vers l'antre du Grand Dragon Rouge."
            : p.flags.boss_malakor_dead
            ? "Tu as libéré les Oubliettes de la folie de Sire Malakor ! Le Roi Édouard IV te tient désormais pour le premier champion d'Ethynd."
            : "Longue vie au Roi Édouard IV ! Inclinez-vous devant l'estrade royale pour recevoir les ordres de la Couronne.",
        ],
        linesEn: [
          p.flags.act4_done
            ? 'The Prism shines once more! The entire Royal Guard salutes your valor before you face the Great Red Dragon.'
            : p.flags.boss_malakor_dead
            ? 'You freed the Royal Dungeons from Sir Malakor’s madness! King Edward IV hails you as Champion of Ethynd.'
            : 'Long live King Edward IV! Approach the royal dais to receive the Crown’s decree.',
        ],
      },
    };
  }

  if (npcId.startsWith('barrage_foret')) {
    const unlocked = isFlagUnlocked(p, 'act2_started');
    return {
      dialogue: {
        speakerFr: 'Garde du Barrage de l’Ouest',
        speakerEn: 'Western Road Sentinel',
        linesFr: unlocked
          ? [
              "Par décret du Roi Édouard IV, le barrage est levé ! La route de la Forêt de Sylvebrume est ouverte, messire veilleur.",
            ]
          : [
              'Halte ! Sur ordre du Roi Édouard IV, personne ne franchit la lisière de Sylvebrume tant que la crise des Oubliettes Royales n’est pas résolue.',
              "Rendez-vous d'abord au Château Royal, au nord-est de la Vallée !",
            ],
        linesEn: unlocked
          ? [
              'By decree of King Edward IV, the barricade is lifted! The road into Sylvebrume Forest stands open, Watchman.',
            ]
          : [
              'Halt! By order of King Edward IV, none may enter Sylvebrume until the crisis in the Royal Dungeons is resolved.',
              'Report to the Royal Castle in the northeast Valley first!',
            ],
      },
    };
  }

  if (npcId.startsWith('barrage_chateau')) {
    const unlocked = isFlagUnlocked(p, 'act1_done');
    return {
      dialogue: {
        speakerFr: 'Lancier de la Porte Royale',
        speakerEn: 'Royal Gate Pikeman',
        linesFr: unlocked
          ? [
              "Porteur du Sceau d'Aldric, la herse est levée ! Entrez dans la Salle du Trône.",
            ]
          : [
              'Halte ! La grande porte du Château Royal est consignée. Seul le Sceau du Conseil remis par le Sage Aldric autorise le passage.',
            ],
        linesEn: unlocked
          ? [
              "Bearer of Aldric's Seal, the portcullis is raised! Enter the Throne Room.",
            ]
          : [
              'Halt! The Royal Castle gate is sealed. Only the Council Seal granted by Sage Aldric permits entry.',
            ],
      },
    };
  }

  if (npcId.startsWith('barrage_crypte')) {
    const unlocked = isFlagUnlocked(p, 'act3_done');
    return {
      dialogue: {
        speakerFr: 'Garde de la Nécropole Royale',
        speakerEn: 'Royal Necropolis Sentinel',
        linesFr: unlocked
          ? [
              "Vous portez la Clé d'Argent Royal ! Le passage vers la Nécropole des Rois Oubliés est dégagé.",
            ]
          : [
              "Halte ! La Nécropole des Rois Oubliés est scellée par ordre de la Couronne pour contenir les légions de Vorgath.",
              "Seul le porteur de la Clé d'Argent Royal, remise après la purification de Sylvebrume, peut franchir cette grille !",
            ],
        linesEn: unlocked
          ? [
              'You bear the Royal Silver Key! The way into the Necropolis of Forgotten Kings stands open.',
            ]
          : [
              'Halt! The Necropolis of Forgotten Kings is sealed by Royal decree to contain Vorgath’s legions.',
              'Only the bearer of the Royal Silver Key, granted after cleansing Sylvebrume, may pass!',
            ],
      },
    };
  }

  if (npcId.startsWith('barrage_pyra')) {
    const unlocked = isFlagUnlocked(p, 'act4_done');
    return {
      dialogue: {
        speakerFr: 'Sentinelle du Col du Sud',
        speakerEn: 'Southern Pass Sentinel',
        linesFr: unlocked
          ? [
              'Le Prisme reformé a dissipé les flammes du col ! Bonne chasse dans les Terres Ardentes de Pyra, Champion !',
            ]
          : [
              "N'avancez pas ! Une barrière de cendre ardente consume tout au sud de ce défilé.",
              'Il faut réunir les Quatre Éclats du Prisme auprès du Roi ou du Sage Aldric avant de pouvoir franchir ce col !',
            ],
        linesEn: unlocked
          ? [
              'The reforged Prism has parted the wall of flame! Good hunting in the Scorched Lands of Pyra, Champion!',
            ]
          : [
              'Step back! A searing wall of cinders consumes all who cross this southern pass.',
              'You must unite all Four Shards of the Prism with the King or Sage Aldric before marching south!',
            ],
      },
    };
  }

  if (npcId.startsWith('barrage_temple')) {
    const unlocked = isFlagUnlocked(p, 'talked_elowen');
    return {
      dialogue: {
        speakerFr: 'Sentinelle Sylvestre',
        speakerEn: 'Sylvan Warden',
        linesFr: unlocked
          ? [
              "Élowen a chanté l'ouverture des brumes : le seuil du Temple Englouti d'Astrelya t'est ouvert !",
            ]
          : [
              "Halte, voyageur ! Le Temple Englouti est scellé par les brumes d'Astrelya et infesté d'élémentaires déchaînés.",
              'Parle d’abord au chef de camp Élowen, au centre de la forêt, pour recevoir sa bénédiction.',
            ],
        linesEn: unlocked
          ? [
              "Elowen has sung the mist-parting chant: the threshold of Astrelya's Sunken Temple stands open!",
            ]
          : [
              "Hold, traveler! The Sunken Temple is sealed by Astrelya's mists and crawling with frenzied elementals.",
              'Speak first with Ranger Elowen at her central forest camp to lift the seal.',
            ],
      },
    };
  }

  return {
    dialogue: {
      speakerFr: 'Habitant',
      speakerEn: 'Villager',
      linesFr: ['Que la lumière du Prisme guide tes pas.'],
      linesEn: ['May the Prism’s light guide your steps.'],
    },
  };
}
