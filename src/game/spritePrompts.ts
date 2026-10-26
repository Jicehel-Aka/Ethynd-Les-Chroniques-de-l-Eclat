export interface MonsterPixelPrompt {
  id: string;
  titleFr: string;
  sizeSpec: string;
  sheetSpecFr: string;
  palette: Array<{ label: string; hex: string }>;
  promptFr: string;
  promptEn: string;
}

export const MONSTER_PIXEL_PROMPTS: Record<string, MonsterPixelPrompt> = {
  chevalier_os: {
    id: 'chevalier_os',
    titleFr: "Chevalier d'Os (Champion de la Nécropole)",
    sizeSpec: '32×32 px par frame (planche 128×128 px : 4 lignes × 4 frames)',
    sheetSpecFr:
      'Ligne 1 : Face (Bas) · Ligne 2 : Profil Gauche · Ligne 3 : Profil Droite · Ligne 4 : Dos (Haut)',
    palette: [
      { label: 'Contour', hex: '#0B0D14' },
      { label: 'Ivoire clair', hex: '#F8FAFC' },
      { label: 'Os ombré', hex: '#CBD5E1' },
      { label: 'Acier terni', hex: '#64748B' },
      { label: 'Tabard cramoisi', hex: '#991B1B' },
      { label: 'Flamme âme', hex: '#38BDF8' },
    ],
    promptFr:
      "Sprite sheet pixel art 16-bit style SNES Action-RPG (Zelda: A Link to the Past / Chrono Trigger), vue top-down 3/4, grille 4x4 de 32x32 pixels par frame (total 128x128 px) sur fond transparent, contour net 1px #0B0D14 sans anti-aliasing. Sujet : Chevalier d'Os mort-vivant d'élite, crâne d'ivoire (#F8FAFC, #CBD5E1) sous un heaume nasal fissuré à deux cornes recourbées, yeux creux illuminés d'une flamme cyan (#38BDF8), spallières d'acier ancien (#64748B), côtes apparentes sous un tabard royal cramoisi déchiré (#991B1B), tenant une épée large d'os crantée et un écu à emblème de crâne. Ligne 1 marche face, Ligne 2 marche gauche, Ligne 3 marche droite, Ligne 4 marche dos montrant la cape déchiquetée.",
    promptEn:
      '16-bit SNES Action-RPG pixel art sprite sheet (A Link to the Past / Chrono Trigger style), 3/4 top-down view, 4x4 grid of 32x32 px frames (128x128 px total), transparent background, crisp 1px dark outline (#0B0D14), zero anti-aliasing. Subject: Undead Bone Knight champion, ivory skull (#F8FAFC, #CBD5E1) beneath a horned nasal helm, glowing cyan soul-fire eyes (#38BDF8), weathered steel pauldrons (#64748B), exposed ribs over a tattered crimson royal tabard (#991B1B), wielding a notched bone broadsword and skull-crested heater shield. Row 1 walk down, Row 2 walk left, Row 3 walk right, Row 4 walk up.',
  },
  mage_eclipse: {
    id: 'mage_eclipse',
    titleFr: "Archimage de l'Éclipse (Occultiste du Néant)",
    sizeSpec: '32×32 px par frame (planche 128×128 px : 4 lignes × 4 frames)',
    sheetSpecFr:
      'Ligne 1 : Face (Bas) · Ligne 2 : Profil Gauche · Ligne 3 : Profil Droite · Ligne 4 : Dos (Haut)',
    palette: [
      { label: 'Contour', hex: '#0B0D14' },
      { label: 'Pourpre sombre', hex: '#450A0A' },
      { label: 'Écarlate rituel', hex: '#991B1B' },
      { label: 'Obsidienne', hex: '#18181B' },
      { label: 'Or solaire', hex: '#F59E0B' },
      { label: 'Couronne ardente', hex: '#FDE047' },
    ],
    promptFr:
      "Sprite sheet pixel art 16-bit style SNES RPG, vue top-down 3/4, grille 4x4 de 32x32 pixels par frame (total 128x128 px), fond transparent, contour net 1px #0B0D14 sans flou. Sujet : Archimage de l'Ordre de l'Éclipse flottant légèrement au-dessus du sol, ample robe cérémonielle rouge sang sombre et obsidienne (#450A0A, #991B1B, #18181B) bordée de runes solaires dorées (#F59E0B), capuche pointue plongeant le visage dans le noir avec deux yeux d'ambre incandescents (#FDE047), médaillon d'éclipse sur le torse, tenant un grand bâton noueux surmonté d'un soleil noir en lévitation entouré d'un anneau de feu doré. 4 directions (face, gauche, droite, dos avec blason d'éclipse brodé) × 4 frames.",
    promptEn:
      '16-bit SNES RPG pixel art sprite sheet, 3/4 top-down view, 4x4 grid of 32x32 px frames (128x128 px total), transparent background, crisp 1px outline (#0B0D14), no anti-aliasing. Subject: Eclipse Order Archmage hovering slightly, layered dark crimson and obsidian vestments (#450A0A, #991B1B, #18181B) trimmed with gold solar runes (#F59E0B), deep pointed hood in shadow with twin burning amber eyes (#FDE047), eclipse medallion on chest, wielding a gnarled staff topped with a levitating black-sun ring of fire and a floating ember mote. 4 directions × 4 frames.',
  },
  golem_obsidienne: {
    id: 'golem_obsidienne',
    titleFr: "Golem d'Obsidienne (Colosse de Pyra)",
    sizeSpec: '36×36 px ou 48×48 px par frame (planche 4 lignes × 4 frames)',
    sheetSpecFr:
      'Ligne 1 : Face (Bas) · Ligne 2 : Profil Gauche · Ligne 3 : Profil Droite · Ligne 4 : Dos (Haut)',
    palette: [
      { label: 'Noir basalte', hex: '#09090B' },
      { label: 'Obsidienne', hex: '#27272A' },
      { label: 'Reflet vitreux', hex: '#71717A' },
      { label: 'Braise rouge', hex: '#DC2626' },
      { label: 'Magma vif', hex: '#F97316' },
      { label: 'Cœur fusion', hex: '#FEF08A' },
    ],
    promptFr:
      "Sprite sheet pixel art 16-bit SNES Action-RPG, vue top-down 3/4, grille 4x4 de 48x48 pixels par frame (total 192x192 px), fond transparent, pixels nets sans anti-aliasing. Sujet : Golem d'Obsidienne massif et asymétrique taillé dans du verre volcanique noir à facettes brillantes (#09090B, #27272A, reflets nets #71717A), pointes d'obsidienne sur les épaules, poings de basalte géants, tête encastrée à visière cyclopéenne incandescente, cœur de magma en fusion (#DC2626, #F97316, #FEF08A) pulsant à travers les fissures de la poitrine et des bras. Marche lourde sur 4 directions (face, gauche, droite, dos avec cheminées dorsales volcaniques) × 4 frames.",
    promptEn:
      '16-bit SNES Action-RPG pixel art sprite sheet, 3/4 top-down view, 4x4 grid of 48x48 px frames (192x192 px total), transparent background, sharp pixel edges, no anti-aliasing. Subject: Hulking asymmetrical Obsidian Golem carved from glossy faceted black volcanic glass (#09090B, #27272A, sharp #71717A specular facets), jagged shoulder spires, oversized boulder fists, low-set monolith head with glowing furnace visor, molten magma core (#DC2626, #F97316, #FEF08A) shining through chest cracks and arm fissures. Heavy stomp walk in 4 directions × 4 frames.',
  },
  chevalier_dechu: {
    id: 'chevalier_dechu',
    titleFr: 'Sire Malakor, Chevalier Déchu (Boss — Acte II)',
    sizeSpec: '48×48 px par frame (planche Boss 192×192 px : 4 lignes × 4 frames)',
    sheetSpecFr:
      'Ligne 1 : Face (Bas) · Ligne 2 : Profil Gauche · Ligne 3 : Profil Droite · Ligne 4 : Dos (Haut)',
    palette: [
      { label: 'Acier sombre', hex: '#1E293B' },
      { label: 'Reflet acier', hex: '#94A3B8' },
      { label: 'Or royal terni', hex: '#D97706' },
      { label: 'Cape royale', hex: '#B91C1C' },
      { label: 'Visière ardente', hex: '#F59E0B' },
      { label: 'Rune Éclipse', hex: '#C084FC' },
    ],
    promptFr:
      "Sprite sheet Boss pixel art 16-bit style SNES (Chrono Trigger / Terranigma), vue top-down 3/4, grille 4x4 de 48x48 pixels par frame (total 192x192 px), fond transparent, contour 1px #090B10. Sujet : Sire Malakor, imposant Chevalier Déchu en harnois d'acier noirci (#1E293B, #475569, reflets #94A3B8) rehaussé d'or royal terni (#D97706), grand heaume ailé à visière en T embrasée d'une lueur ambrée (#F59E0B), Éclat de Fer corrompu enchâssé sur le plastron, longue cape royale cramoisie déchirée (#B91C1C) flottant au vent, maniant une colossale épée à deux mains gravée de runes violettes (#C084FC) et un pavois royal. 4 orientations complètes (face, profil gauche, profil droite, dos montrant la cape armoriée) × 4 frames.",
    promptEn:
      '16-bit SNES Boss pixel art sprite sheet (Chrono Trigger / Terranigma style), 3/4 top-down view, 4x4 grid of 48x48 px frames (192x192 px total), transparent background, crisp 1px #090B10 outline. Subject: Sir Malakor, towering Fallen Royal Champion in blackened steel plate (#1E293B, #475569, #94A3B8 highlights) with tarnished gold trim (#D97706), winged greathelm with burning amber T-visor (#F59E0B), corrupted shard set into breastplate, billowing torn crimson royal cape (#B91C1C), wielding a colossal violet-runed greatsword (#C084FC) and royal tower shield. 4 directions × 4 frames.',
  },
  archiliche_vorgath: {
    id: 'archiliche_vorgath',
    titleFr: "Vorgath, Archiliche de l'Éclipse (Boss — Acte IV)",
    sizeSpec: '48×48 px par frame (planche Boss 192×192 px : 4 lignes × 4 frames)',
    sheetSpecFr:
      'Ligne 1 : Face (Bas) · Ligne 2 : Profil Gauche · Ligne 3 : Profil Droite · Ligne 4 : Dos (Haut)',
    palette: [
      { label: 'Pourpre impérial', hex: '#6B21A8' },
      { label: 'Nuit nécropole', hex: '#090514' },
      { label: 'Os ancien', hex: '#F8FAFC' },
      { label: 'Couronne d’or', hex: '#FDE047' },
      { label: 'Phylactère', hex: '#C084FC' },
      { label: 'Éclat améthyste', hex: '#F0ABFC' },
    ],
    promptFr:
      "Sprite sheet Boss pixel art 16-bit style SNES (Final Fantasy VI / Secret of Mana), vue top-down 3/4, grille 4x4 de 48x48 pixels par frame (total 192x192 px), fond transparent, contour net 1px #090514. Sujet : Vorgath, Archiliche souveraine en lévitation au-dessus d'un vortex d'ombre améthyste, crâne sculpté d'ivoire (#F8FAFC) aux orbites flamboyantes or et violet (#FDE047, #F0ABFC), haute couronne d'or à cinq pointes flottant au-dessus du front, grand col gothique et robes impériales pourpres et noires (#6B21A8, #3B0764, #090514) révélant une cage thoracique dorée, tenant un sceptre à double croissant d'éclipse dans la main droite et un orbe phylactère d'améthyste (#C084FC) lévitant au-dessus de sa main gauche squelettique. 4 orientations × 4 frames.",
    promptEn:
      '16-bit SNES Boss pixel art sprite sheet (Final Fantasy VI / Secret of Mana style), 3/4 top-down view, 4x4 grid of 48x48 px frames (192x192 px total), transparent background, crisp 1px #090514 outline. Subject: Archlich Vorgath levitating over a dark amethyst vortex, sculpted ivory skull (#F8FAFC) with blazing gold-violet eyes (#FDE047, #F0ABFC), floating five-spired golden crown, high gothic collar and imperial purple-and-void robes (#6B21A8, #3B0764, #090514) with gilded ribcage, wielding a twin-crescent Eclipse scepter in his right hand and a levitating amethyst phylactery orb (#C084FC) in his left skeletal hand. 4 directions × 4 frames.',
  },
  reine_caverne: {
    id: 'reine_caverne',
    titleFr: 'Morvath, Reine de la Caverne (Boss — Acte I)',
    sizeSpec: '48×48 px par frame (planche Boss 192×192 px : 4 lignes × 4 frames)',
    sheetSpecFr:
      'Ligne 1 : Face (Bas) · Ligne 2 : Profil Gauche · Ligne 3 : Profil Droite · Ligne 4 : Dos (Haut)',
    palette: [
      { label: 'Chitine abyssale', hex: '#17153B' },
      { label: 'Carapace indigo', hex: '#433D8B' },
      { label: 'Reflet chitine', hex: '#818CF8' },
      { label: 'Cristal améthyste', hex: '#E879F9' },
      { label: 'Éclat de l’Aube', hex: '#FDE047' },
      { label: 'Venin émeraude', hex: '#4ADE80' },
    ],
    promptFr:
      "Sprite sheet Boss pixel art 16-bit style SNES Action-RPG (Secret of Mana / Chrono Trigger), vue top-down 3/4, grille 4x4 de 48x48 pixels par frame (total 192x192 px), fond transparent, contour net 1px #090514 sans anti-aliasing. Sujet : Morvath, Reine Arachnide géante de la Grotte Cristalline, carapace segmentée en chitine indigo et violet profond (#17153B, #2E236C, #433D8B, arêtes brillantes #818CF8), abdomen massif hérissé de pointes cristallines d'améthyste et d'éclats dorés de l'Aube (#E879F9, #FDE047), huit pattes articulées à jointures violettes en marche tétrapode alternée, céphalothorax blindé percé de six yeux chasseurs vert émeraude lumineux (#4ADE80, #DCFCE7) et de deux chélicères d'ivoire crantées perlant de venin. 4 directions distinctes (face, profil gauche, profil droite, dos) × 4 frames.",
    promptEn:
      '16-bit SNES Action-RPG Boss pixel art sprite sheet (Secret of Mana / Chrono Trigger style), 3/4 top-down view, 4x4 grid of 48x48 px frames (192x192 px total), transparent background, crisp 1px #090514 outline, no anti-aliasing. Subject: Morvath, Giant Crystal Cavern Broodmother Queen, segmented deep indigo-violet chitin carapace (#17153B, #433D8B, #818CF8 specular ridges), massive brood-abdomen crowned with glowing amethyst and golden Dawn-Shard crystal spires (#E879F9, #FDE047), eight articulated arachnid legs in alternating tetrapod gait, armored cephalothorax with six glowing emerald hunter eyes (#4ADE80) and serrated venom-dripping ivory chelicerae. 4 distinct directions × 4 frames.',
  },
};

