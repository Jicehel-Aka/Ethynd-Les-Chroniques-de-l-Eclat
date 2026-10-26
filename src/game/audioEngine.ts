export type MusicMode = 'evolved' | 'classic';

type LeadInstrument = 'flute' | 'harp' | 'strings' | 'bell' | 'brass';

interface NoteEvent {
  step: number; // 0 .. totalSteps - 1 (1 step = 1 eighth-note)
  midi: number;
  dur: number; // duration in eighth-notes
  vel?: number;
}

export interface RegionComposition {
  id: string;
  titleFr: string;
  bpm: number;
  bars: number; // 24 or 32 bars (each bar = 8 eighth-notes)
  lead: LeadInstrument;
  arpStyle: 'gentle_up' | 'pendulum' | 'waltz_8' | 'sparse_echo' | 'driving';
  // One chord (array of 3-4 MIDI notes, lowest = bass root) per bar (length === bars)
  barChords: number[][];
  // Expressive multi-bar melodic phrases spanning all 24-32 bars
  melody: NoteEvent[];
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Helper to build a 32-bar or 24-bar score cleanly from 8-bar sections
function buildLongScore(
  id: string,
  titleFr: string,
  bpm: number,
  lead: LeadInstrument,
  arpStyle: RegionComposition['arpStyle'],
  sections: Array<{
    chords: number[][]; // 8 chords (8 bars = 64 eighth-notes)
    notes: Array<[number, number, number, number?]>; // [stepIn64, midi, durEighths, vel?]
  }>
): RegionComposition {
  const barChords: number[][] = [];
  const melody: NoteEvent[] = [];
  let barOffset = 0;

  for (const sec of sections) {
    const stepOffset = barOffset * 8;
    for (const c of sec.chords) {
      barChords.push(c);
    }
    for (const [st, midi, dur, vel] of sec.notes) {
      melody.push({ step: stepOffset + st, midi, dur, vel });
    }
    barOffset += sec.chords.length;
  }

  return {
    id,
    titleFr,
    bpm,
    bars: barChords.length,
    lead,
    arpStyle,
    barChords,
    melody,
  };
}

// Common triads/sevenths in MIDI (C4 = 60, F4 = 65, G4 = 67, A4 = 69)
const CH = {
  // F Major / D Minor family (Maison du Sage)
  Fmaj7: [41, 53, 57, 60, 64],
  Cadd9: [36, 48, 55, 60, 64],
  Dm7: [38, 50, 57, 60, 65],
  Bbmaj7: [46, 53, 58, 62, 65],
  Gm7: [43, 50, 55, 58, 62],
  Am7: [45, 52, 57, 60, 64],
  Csus4: [36, 48, 53, 55, 60],
  C7: [36, 48, 55, 58, 64],
  Asus4: [45, 52, 57, 62, 64],
  A7: [45, 52, 57, 61, 64],

  // G Major / E Minor family (Vallée d'Ethynd & Sylvebrume)
  Gmaj: [43, 50, 55, 59, 62],
  Dmaj: [38, 50, 54, 57, 62],
  Em7: [40, 52, 55, 59, 62],
  Cmaj7: [36, 48, 55, 59, 64],
  Bm7: [47, 54, 59, 62, 66],
  Am9: [45, 52, 57, 60, 67],
  Dsus4: [38, 50, 55, 57, 62],

  // C Major / A Minor / Dorian (Château, Grotte, Forge)
  Cmaj: [36, 48, 55, 60, 64],
  Fmaj: [41, 53, 57, 60, 65],
  G7: [43, 50, 55, 59, 65],
  Amin: [45, 52, 57, 60, 64],
  Emin: [40, 52, 55, 59, 64],
  Dmin: [38, 50, 53, 57, 62],
  E7: [40, 52, 56, 59, 64],

  // Eb / C Minor / D Minor / Phrygian (Temple, Oubliettes, Crypte, Pyra, Citadelle)
  Cm: [36, 48, 55, 60, 63],
  Abmaj7: [44, 51, 56, 60, 63],
  Ebmaj7: [39, 51, 55, 58, 62],
  Bb: [46, 53, 58, 62, 65],
  Fm7: [41, 53, 56, 60, 63],
  Gsus: [43, 50, 55, 60, 62],
  Gmaj_d: [43, 50, 55, 59, 62],
  Em_low: [40, 47, 52, 55, 59],
  F_phryg: [41, 48, 53, 57, 60],
  Bdim: [47, 53, 59, 62, 65],
  Bm: [47, 54, 59, 62, 66],
  Fsharp7: [42, 49, 54, 58, 61],
};

// ============================================================================
// 12 LONG-FORM COMPOSITIONS (24 to 32 bars = 55s to 80s per cycle!)
// ============================================================================
export const COMPOSITIONS: Record<string, RegionComposition> = {
  // 1. MAISON DU SAGE ALDRIC — 32 bars @ 96 BPM = 80.0 seconds full lyrical cycle!
  maison: buildLongScore('maison', 'Le Foyer du Sage Aldric', 96, 'flute', 'gentle_up', [
    // Section A (Bars 1-8): Warm pastoral flute & Celtic harp exposition in F Major
    {
      chords: [CH.Fmaj7, CH.Cadd9, CH.Dm7, CH.Am7, CH.Bbmaj7, CH.Fmaj7, CH.Gm7, CH.Csus4],
      notes: [
        [0, 69, 3], [3, 72, 1], [4, 74, 2], [6, 72, 2], // Bar 1: A4.. C5 D5 C5
        [8, 69, 4], [12, 67, 3], // Bar 2: A4--- G4..
        [16, 65, 3], [19, 69, 1], [20, 72, 2], [22, 74, 2], // Bar 3: F4.. A4 C5 D5
        [24, 76, 5], [30, 72, 2], // Bar 4: E5---- C5
        [32, 74, 3], [35, 72, 1], [36, 69, 2], [38, 65, 2], // Bar 5: D5.. C5 A4 F4
        [40, 69, 4], [44, 72, 4], // Bar 6: A4--- C5---
        [48, 70, 3], [51, 69, 1], [52, 67, 2], [54, 65, 2], // Bar 7: Bb4.. A4 G4 F4
        [56, 67, 6], // Bar 8: G4----- (2 eighth rest)
      ],
    },
    // Section B (Bars 9-16): Soaring consequent phrase into upper register & gentle resolution
    {
      chords: [CH.Fmaj7, CH.Cadd9, CH.Dm7, CH.Bbmaj7, CH.Gm7, CH.Am7, CH.Bbmaj7, CH.Fmaj7],
      notes: [
        [0, 72, 3], [3, 74, 1], [4, 77, 3], [7, 76, 1], // Bar 9: C5.. D5 F5.. E5
        [8, 74, 3], [11, 72, 1], [12, 67, 4], // Bar 10: D5.. C5 G4---
        [16, 69, 2], [18, 72, 2], [20, 77, 3], [23, 76, 1], // Bar 11: A4 C5 F5.. E5
        [24, 74, 6], // Bar 12: D5-----
        [32, 70, 2], [34, 72, 2], [36, 74, 2], [38, 77, 2], // Bar 13: Bb4 C5 D5 F5
        [40, 76, 3], [43, 72, 1], [44, 69, 4], // Bar 14: E5.. C5 A4---
        [48, 70, 3], [51, 69, 1], [52, 67, 2], [54, 64, 2], // Bar 15: Bb4.. A4 G4 E4
        [56, 65, 6], // Bar 16: F4----- (warm tonic cadence)
      ],
    },
    // Section C (Bars 17-24): Contemplative bridge in D Minor / Bb Major (Ancient Grimoires)
    {
      chords: [CH.Dm7, CH.Am7, CH.Bbmaj7, CH.Fmaj7, CH.Gm7, CH.Dm7, CH.Asus4, CH.A7],
      notes: [
        [2, 74, 2], [4, 76, 2], [6, 77, 2], // Bar 17: gentle pickup D5 E5 F5
        [8, 76, 4], [12, 72, 3], // Bar 18: E5--- C5..
        [16, 74, 3], [19, 72, 1], [20, 70, 2], [22, 69, 2], // Bar 19: D5.. C5 Bb4 A4
        [24, 72, 5], [30, 69, 2], // Bar 20: C5---- A4
        [32, 67, 3], [35, 69, 1], [36, 70, 2], [38, 74, 2], // Bar 21: G4.. A4 Bb4 D5
        [40, 69, 4], [44, 65, 4], // Bar 22: A4--- F4---
        [48, 69, 4], [52, 67, 4], // Bar 23: A4--- G4---
        [56, 69, 5], // Bar 24: A4---- (dominant poise)
      ],
    },
    // Section D (Bars 25-32): Peaceful hearth coda + 2 full bars of solo harp breathing rest
    {
      chords: [CH.Bbmaj7, CH.Cadd9, CH.Am7, CH.Dm7, CH.Gm7, CH.C7, CH.Fmaj7, CH.Fmaj7],
      notes: [
        [0, 74, 3], [3, 72, 1], [4, 69, 4], // Bar 25: D5.. C5 A4---
        [8, 72, 3], [11, 69, 1], [12, 67, 4], // Bar 26: C5.. A4 G4---
        [16, 69, 2], [18, 72, 2], [20, 76, 3], [23, 74, 1], // Bar 27: A4 C5 E5.. D5
        [24, 74, 4], [28, 69, 3], // Bar 28: D5--- A4..
        [32, 70, 3], [35, 69, 1], [36, 67, 4], // Bar 29: Bb4.. A4 G4---
        [40, 67, 3], [43, 64, 1], [44, 65, 4], // Bar 30: G4.. E4 F4---
        [48, 65, 6], // Bar 31: F4----- (Bars 31.5-32: pure harp & fireplace stillness!)
      ],
    },
  ]),

  // 2. VALLEE D'ETHYND — 32 bars @ 106 BPM = 72.5 seconds pastoral-heroic overworld!
  aventure: buildLongScore('aventure', "La Grande Vallée d'Ethynd", 106, 'strings', 'pendulum', [
    {
      chords: [CH.Gmaj, CH.Dmaj, CH.Em7, CH.Bm7, CH.Cmaj7, CH.Gmaj, CH.Am9, CH.Dsus4],
      notes: [
        [0, 67, 2], [2, 71, 2], [4, 74, 3], [7, 76, 1],
        [8, 74, 4], [12, 69, 4],
        [16, 71, 3], [19, 74, 1], [20, 79, 4],
        [24, 78, 4], [28, 74, 3],
        [32, 76, 3], [35, 74, 1], [36, 72, 2], [38, 71, 2],
        [40, 74, 4], [44, 67, 4],
        [48, 69, 3], [51, 71, 1], [52, 72, 2], [54, 74, 2],
        [56, 74, 6],
      ],
    },
    {
      chords: [CH.Gmaj, CH.Dmaj, CH.Em7, CH.Cmaj7, CH.Gmaj, CH.Dmaj, CH.Cmaj7, CH.Gmaj],
      notes: [
        [0, 79, 3], [3, 78, 1], [4, 74, 2], [6, 71, 2],
        [8, 74, 4], [12, 76, 4],
        [16, 79, 3], [19, 81, 1], [20, 83, 4],
        [24, 79, 5], [30, 76, 2],
        [32, 74, 2], [34, 71, 2], [36, 74, 2], [38, 79, 2],
        [40, 78, 3], [43, 76, 1], [44, 74, 4],
        [48, 76, 3], [51, 74, 1], [52, 72, 2], [54, 69, 2],
        [56, 67, 6],
      ],
    },
    {
      chords: [CH.Em7, CH.Bm7, CH.Cmaj7, CH.Gmaj, CH.Am9, CH.Em7, CH.Cmaj7, CH.Dmaj],
      notes: [
        [2, 71, 2], [4, 74, 2], [6, 76, 2],
        [8, 74, 4], [12, 71, 3],
        [16, 72, 3], [19, 74, 1], [20, 76, 4],
        [24, 74, 5], [30, 71, 2],
        [32, 69, 3], [35, 71, 1], [36, 72, 2], [38, 76, 2],
        [40, 71, 4], [44, 67, 4],
        [48, 72, 3], [51, 71, 1], [52, 69, 4],
        [56, 74, 5],
      ],
    },
    {
      chords: [CH.Cmaj7, CH.Dmaj, CH.Bm7, CH.Em7, CH.Am9, CH.Dmaj, CH.Gmaj, CH.Gmaj],
      notes: [
        [0, 76, 3], [3, 79, 1], [4, 78, 4],
        [8, 74, 3], [11, 76, 1], [12, 79, 4],
        [16, 78, 3], [19, 74, 1], [20, 71, 4],
        [24, 76, 4], [28, 74, 3],
        [32, 72, 3], [35, 71, 1], [36, 69, 4],
        [40, 69, 2], [42, 71, 2], [44, 74, 4],
        [48, 67, 6], // 1.5 bars gentle breeze rest
      ],
    },
  ]),

  // 3. FORGE D'AIRAIN — 24 bars @ 100 BPM = 57.6s warm Dorian lute/harp ballad
  forge: buildLongScore('forge', "La Forge d'Airain", 100, 'harp', 'waltz_8', [
    {
      chords: [CH.Dmin, CH.Cmaj, CH.Bbmaj7, CH.Amin, CH.Dmin, CH.Fmaj, CH.Cmaj, CH.Dmin],
      notes: [
        [0, 62, 2], [2, 65, 2], [4, 69, 3], [7, 72, 1],
        [8, 72, 3], [11, 69, 1], [12, 67, 4],
        [16, 65, 2], [18, 69, 2], [20, 70, 2], [22, 69, 2],
        [24, 64, 6],
        [32, 62, 2], [34, 65, 2], [36, 69, 2], [38, 74, 2],
        [40, 72, 3], [43, 69, 1], [44, 65, 4],
        [48, 67, 3], [51, 65, 1], [52, 64, 2], [54, 60, 2],
        [56, 62, 6],
      ],
    },
    {
      chords: [CH.Fmaj, CH.Cmaj, CH.Dm7, CH.Am7, CH.Bbmaj7, CH.Cmaj, CH.Dmin, CH.Dmin],
      notes: [
        [0, 77, 3], [3, 76, 1], [4, 72, 4],
        [8, 76, 3], [11, 74, 1], [12, 72, 4],
        [16, 74, 2], [18, 72, 2], [20, 69, 4],
        [24, 72, 5],
        [32, 70, 2], [34, 72, 2], [36, 74, 4],
        [40, 72, 3], [43, 69, 1], [44, 67, 4],
        [48, 69, 6],
      ],
    },
    {
      chords: [CH.Gm7, CH.Amin, CH.Bbmaj7, CH.Cmaj, CH.Dm7, CH.Cmaj, CH.Dmin, CH.Dmin],
      notes: [
        [2, 67, 2], [4, 69, 2], [6, 70, 2],
        [8, 69, 4], [12, 64, 3],
        [16, 65, 3], [19, 67, 1], [20, 69, 4],
        [24, 72, 5],
        [32, 74, 3], [35, 72, 1], [36, 69, 4],
        [40, 67, 3], [43, 65, 1], [44, 64, 4],
        [48, 62, 6],
      ],
    },
  ]),

  // 4. GROTTE DE L'AUBE — 32 bars @ 90 BPM = 85.3s crystalline echoing subterranean theme
  grotte: buildLongScore('grotte', "La Grotte de l'Aube", 90, 'bell', 'sparse_echo', [
    {
      chords: [CH.Amin, CH.Fmaj7, CH.Dm7, CH.Emin, CH.Amin, CH.Cmaj7, CH.Fmaj7, CH.E7],
      notes: [
        [0, 69, 4], [4, 72, 2], [6, 76, 2],
        [8, 76, 5], [14, 72, 2],
        [16, 74, 4], [20, 69, 4],
        [24, 71, 6],
        [32, 69, 3], [35, 72, 1], [36, 76, 4],
        [40, 79, 4], [44, 76, 4],
        [48, 77, 3], [51, 76, 1], [52, 72, 4],
        [56, 71, 6],
      ],
    },
    {
      chords: [CH.Amin, CH.Gmaj, CH.Fmaj7, CH.Cmaj, CH.Dm7, CH.Amin, CH.E7, CH.Amin],
      notes: [
        [0, 81, 4], [4, 79, 2], [6, 76, 2],
        [8, 79, 4], [12, 74, 4],
        [16, 77, 4], [20, 76, 2], [22, 72, 2],
        [24, 76, 6],
        [32, 74, 3], [35, 72, 1], [36, 69, 4],
        [40, 72, 4], [44, 69, 4],
        [48, 68, 3], [51, 71, 1], [52, 76, 4],
        [56, 69, 6],
      ],
    },
    {
      chords: [CH.Fmaj7, CH.Cmaj7, CH.Dm7, CH.Amin, CH.Fmaj7, CH.Emin, CH.Dm7, CH.E7],
      notes: [
        [4, 72, 4], [8, 76, 4], [12, 79, 4],
        [16, 77, 5], [22, 74, 2],
        [24, 72, 6],
        [32, 69, 4], [36, 72, 4],
        [40, 71, 5], [46, 67, 2],
        [48, 69, 4], [52, 74, 4],
        [56, 76, 5],
      ],
    },
    {
      chords: [CH.Amin, CH.Fmaj7, CH.Cmaj7, CH.Gmaj, CH.Dm7, CH.E7, CH.Amin, CH.Amin],
      notes: [
        [0, 81, 3], [3, 76, 1], [4, 72, 4],
        [8, 77, 4], [12, 76, 4],
        [16, 79, 4], [20, 76, 4],
        [24, 74, 6],
        [32, 74, 3], [35, 72, 1], [36, 69, 4],
        [40, 68, 4], [44, 71, 4],
        [48, 69, 6], // Crystalline cavern drip rest
      ],
    },
  ]),

  // 5. CHATEAU ROYAL D'EDOUARD IV — 32 bars @ 98 BPM = 78.3s noble courtly sarabande
  chateau: buildLongScore('chateau', "Le Château Royal d'Ethynd", 98, 'brass', 'waltz_8', [
    {
      chords: [CH.Cmaj, CH.Gmaj, CH.Amin, CH.Emin, CH.Fmaj, CH.Cmaj, CH.Dm7, CH.G7],
      notes: [
        [0, 72, 3], [3, 74, 1], [4, 76, 4],
        [8, 74, 3], [11, 71, 1], [12, 67, 4],
        [16, 72, 3], [19, 76, 1], [20, 81, 4],
        [24, 79, 4], [28, 76, 4],
        [32, 77, 3], [35, 76, 1], [36, 74, 2], [38, 72, 2],
        [40, 76, 4], [44, 72, 4],
        [48, 74, 3], [51, 72, 1], [52, 69, 4],
        [56, 74, 6],
      ],
    },
    {
      chords: [CH.Cmaj, CH.Gmaj, CH.Amin, CH.Fmaj, CH.Cmaj, CH.G7, CH.Cmaj, CH.Cmaj],
      notes: [
        [0, 79, 3], [3, 76, 1], [4, 72, 4],
        [8, 74, 2], [10, 76, 2], [12, 79, 4],
        [16, 81, 3], [19, 79, 1], [20, 76, 4],
        [24, 77, 5], [30, 74, 2],
        [32, 76, 3], [35, 72, 1], [36, 67, 4],
        [40, 74, 3], [43, 72, 1], [44, 71, 4],
        [48, 72, 6],
      ],
    },
    {
      chords: [CH.Amin, CH.Emin, CH.Fmaj, CH.Cmaj, CH.Dm7, CH.Amin, CH.Fmaj, CH.G7],
      notes: [
        [0, 76, 4], [4, 72, 2], [6, 69, 2],
        [8, 71, 4], [12, 76, 4],
        [16, 77, 3], [19, 76, 1], [20, 72, 4],
        [24, 79, 6],
        [32, 74, 3], [35, 76, 1], [36, 77, 4],
        [40, 76, 4], [44, 72, 4],
        [48, 69, 3], [51, 72, 1], [52, 77, 4],
        [56, 74, 5],
      ],
    },
    {
      chords: [CH.Fmaj, CH.Gmaj, CH.Emin, CH.Amin, CH.Dm7, CH.G7, CH.Cmaj, CH.Cmaj],
      notes: [
        [0, 77, 3], [3, 79, 1], [4, 81, 4],
        [8, 79, 3], [11, 76, 1], [12, 74, 4],
        [16, 76, 3], [19, 74, 1], [20, 72, 4],
        [24, 69, 5],
        [32, 74, 3], [35, 76, 1], [36, 77, 4],
        [40, 74, 3], [43, 71, 1], [44, 74, 4],
        [48, 72, 6],
      ],
    },
  ]),

  // 6. OUBLIETTES ROYALES — 24 bars @ 94 BPM = 61.2s brooding dungeon theme in C Minor
  oubliettes: buildLongScore('oubliettes', 'Les Oubliettes Royales', 94, 'strings', 'sparse_echo', [
    {
      chords: [CH.Cm, CH.Abmaj7, CH.Fm7, CH.Gsus, CH.Cm, CH.Ebmaj7, CH.Fm7, CH.Gmaj_d],
      notes: [
        [0, 60, 4], [4, 63, 2], [6, 67, 2],
        [8, 68, 5], [14, 67, 2],
        [16, 65, 4], [20, 63, 4],
        [24, 62, 6],
        [32, 60, 3], [35, 67, 1], [36, 72, 4],
        [40, 70, 4], [44, 67, 4],
        [48, 68, 3], [51, 65, 1], [52, 63, 4],
        [56, 67, 6],
      ],
    },
    {
      chords: [CH.Abmaj7, CH.Ebmaj7, CH.Fm7, CH.Cm, CH.Abmaj7, CH.Fm7, CH.Gmaj_d, CH.Cm],
      notes: [
        [0, 72, 4], [4, 75, 4],
        [8, 74, 4], [12, 70, 4],
        [16, 68, 3], [19, 70, 1], [20, 72, 4],
        [24, 67, 6],
        [32, 68, 3], [35, 67, 1], [36, 65, 4],
        [40, 65, 3], [43, 63, 1], [44, 60, 4],
        [48, 62, 4], [52, 59, 4],
        [56, 60, 6],
      ],
    },
    {
      chords: [CH.Fm7, CH.Cm, CH.Abmaj7, CH.Gsus, CH.Cm, CH.Fm7, CH.Gmaj_d, CH.Cm],
      notes: [
        [4, 65, 4], [8, 67, 4], [12, 63, 4],
        [16, 68, 5], [22, 67, 2],
        [24, 67, 5],
        [32, 72, 4], [36, 67, 4],
        [40, 68, 4], [44, 65, 4],
        [48, 67, 6],
      ],
    },
  ]),

  // 7. FORET DE SYLVEBRUME — 32 bars @ 96 BPM = 80.0s enchanted E Dorian flute & harp
  foret: buildLongScore('foret', 'La Forêt de Sylvebrume', 96, 'flute', 'pendulum', [
    {
      chords: [CH.Em7, CH.Dmaj, CH.Cmaj7, CH.Bm7, CH.Em7, CH.Am9, CH.Cmaj7, CH.Dmaj],
      notes: [
        [0, 64, 3], [3, 67, 1], [4, 71, 3], [7, 74, 1],
        [8, 73, 4], [12, 69, 4],
        [16, 72, 3], [19, 71, 1], [20, 67, 4],
        [24, 71, 6],
        [32, 76, 3], [35, 74, 1], [36, 71, 2], [38, 67, 2],
        [40, 69, 4], [44, 72, 4],
        [48, 71, 3], [51, 69, 1], [52, 67, 4],
        [56, 69, 6],
      ],
    },
    {
      chords: [CH.Em7, CH.Gmaj, CH.Dmaj, CH.Am9, CH.Cmaj7, CH.Bm7, CH.Em7, CH.Em7],
      notes: [
        [0, 76, 3], [3, 79, 1], [4, 78, 4],
        [8, 79, 3], [11, 76, 1], [12, 74, 4],
        [16, 78, 3], [19, 76, 1], [20, 74, 4],
        [24, 72, 5], [30, 69, 2],
        [32, 71, 3], [35, 72, 1], [36, 76, 4],
        [40, 74, 3], [43, 71, 1], [44, 69, 4],
        [48, 64, 6],
      ],
    },
    {
      chords: [CH.Cmaj7, CH.Gmaj, CH.Am9, CH.Em7, CH.Cmaj7, CH.Dmaj, CH.Bm7, CH.Em7],
      notes: [
        [2, 72, 2], [4, 74, 2], [6, 76, 2],
        [8, 79, 5], [14, 74, 2],
        [16, 76, 4], [20, 72, 4],
        [24, 71, 6],
        [32, 72, 3], [35, 74, 1], [36, 76, 4],
        [40, 78, 4], [44, 74, 4],
        [48, 74, 3], [51, 71, 1], [52, 69, 4],
        [56, 71, 5],
      ],
    },
    {
      chords: [CH.Am9, CH.Bm7, CH.Cmaj7, CH.Dmaj, CH.Gmaj, CH.Bm7, CH.Em7, CH.Em7],
      notes: [
        [0, 69, 3], [3, 71, 1], [4, 72, 4],
        [8, 74, 4], [12, 71, 4],
        [16, 76, 4], [20, 79, 4],
        [24, 78, 5],
        [32, 79, 3], [35, 76, 1], [36, 74, 4],
        [40, 71, 3], [43, 69, 1], [44, 67, 4],
        [48, 64, 6],
      ],
    },
  ]),

  // 8. TEMPLE ENGLOUTI D'ASTRELYA — 32 bars @ 88 BPM = 87.2s luminous aquatic chimes & harp
  temple: buildLongScore('temple', "Le Temple Englouti d'Astrelya", 88, 'bell', 'gentle_up', [
    {
      chords: [CH.Ebmaj7, CH.Bb, CH.Cm, CH.Abmaj7, CH.Ebmaj7, CH.Fm7, CH.Abmaj7, CH.Bb],
      notes: [
        [0, 70, 4], [4, 75, 4],
        [8, 74, 4], [12, 70, 4],
        [16, 72, 3], [19, 75, 1], [20, 79, 4],
        [24, 75, 6],
        [32, 79, 4], [36, 77, 2], [38, 75, 2],
        [40, 72, 4], [44, 68, 4],
        [48, 70, 3], [51, 72, 1], [52, 75, 4],
        [56, 74, 6],
      ],
    },
    {
      chords: [CH.Ebmaj7, CH.Bb, CH.Abmaj7, CH.Cm, CH.Fm7, CH.Bb, CH.Ebmaj7, CH.Ebmaj7],
      notes: [
        [0, 82, 4], [4, 79, 4],
        [8, 77, 3], [11, 75, 1], [12, 74, 4],
        [16, 75, 4], [20, 80, 4],
        [24, 79, 6],
        [32, 77, 3], [35, 75, 1], [36, 72, 4],
        [40, 74, 4], [44, 70, 4],
        [48, 75, 6],
      ],
    },
    {
      chords: [CH.Cm, CH.Abmaj7, CH.Ebmaj7, CH.Bb, CH.Cm, CH.Fm7, CH.Gsus, CH.Gmaj_d],
      notes: [
        [2, 72, 2], [4, 75, 4],
        [8, 80, 4], [12, 79, 4],
        [16, 75, 4], [20, 70, 4],
        [24, 74, 6],
        [32, 72, 3], [35, 74, 1], [36, 75, 4],
        [40, 77, 4], [44, 72, 4],
        [48, 72, 4], [52, 71, 4],
      ],
    },
    {
      chords: [CH.Abmaj7, CH.Bb, CH.Cm, CH.Ebmaj7, CH.Fm7, CH.Bb, CH.Ebmaj7, CH.Ebmaj7],
      notes: [
        [0, 75, 4], [4, 79, 4],
        [8, 77, 4], [12, 74, 4],
        [16, 75, 4], [20, 72, 4],
        [24, 70, 6],
        [32, 68, 4], [36, 72, 4],
        [40, 70, 4], [44, 74, 4],
        [48, 75, 6],
      ],
    },
  ]),

  // 9. NECROPOLE DES ROIS OUBLIES — 24 bars @ 92 BPM = 62.6s solemn gothic strings
  crypte: buildLongScore('crypte', 'La Nécropole des Rois Oubliés', 92, 'strings', 'sparse_echo', [
    {
      chords: [CH.Dmin, CH.Bbmaj7, CH.Gm7, CH.A7, CH.Dmin, CH.Fmaj, CH.Asus4, CH.A7],
      notes: [
        [0, 62, 4], [4, 65, 2], [6, 69, 2],
        [8, 70, 5], [14, 69, 2],
        [16, 67, 4], [20, 65, 4],
        [24, 61, 6],
        [32, 62, 3], [35, 69, 1], [36, 74, 4],
        [40, 72, 4], [44, 69, 4],
        [48, 69, 4], [52, 67, 4],
        [56, 69, 6],
      ],
    },
    {
      chords: [CH.Bbmaj7, CH.Fmaj, CH.Gm7, CH.Dmin, CH.Bbmaj7, CH.A7, CH.Dmin, CH.Dmin],
      notes: [
        [0, 74, 4], [4, 77, 4],
        [8, 76, 4], [12, 72, 4],
        [16, 70, 3], [19, 72, 1], [20, 74, 4],
        [24, 69, 6],
        [32, 70, 4], [36, 67, 4],
        [40, 69, 3], [43, 67, 1], [44, 61, 4],
        [48, 62, 6],
      ],
    },
    {
      chords: [CH.Gm7, CH.Dmin, CH.Bbmaj7, CH.A7, CH.Dmin, CH.Gm7, CH.A7, CH.Dmin],
      notes: [
        [4, 67, 4], [8, 69, 4], [12, 65, 4],
        [16, 70, 4], [20, 69, 4],
        [24, 73, 5],
        [32, 74, 4], [36, 69, 4],
        [40, 70, 4], [44, 67, 4],
        [48, 69, 6],
      ],
    },
  ]),

  // 10. TERRES ARDENTES DE PYRA — 24 bars @ 112 BPM = 51.4s volcanic march
  terres_ardentes: buildLongScore(
    'terres_ardentes',
    'Les Terres Ardentes de Pyra',
    112,
    'brass',
    'driving',
    [
      {
        chords: [CH.Em_low, CH.F_phryg, CH.Em_low, CH.Dmin, CH.Em_low, CH.F_phryg, CH.Bdim, CH.E7],
        notes: [
          [0, 64, 3], [3, 65, 1], [4, 68, 2], [6, 71, 2],
          [8, 72, 4], [12, 71, 4],
          [16, 68, 3], [19, 65, 1], [20, 64, 4],
          [24, 62, 6],
          [32, 64, 2], [34, 68, 2], [36, 71, 2], [38, 76, 2],
          [40, 77, 4], [44, 76, 4],
          [48, 74, 3], [51, 72, 1], [52, 71, 4],
          [56, 68, 6],
        ],
      },
      {
        chords: [CH.Amin, CH.Em_low, CH.F_phryg, CH.E7, CH.Amin, CH.F_phryg, CH.E7, CH.Em_low],
        notes: [
          [0, 76, 3], [3, 77, 1], [4, 81, 4],
          [8, 79, 4], [12, 76, 4],
          [16, 77, 3], [19, 76, 1], [20, 72, 4],
          [24, 71, 6],
          [32, 72, 3], [35, 74, 1], [36, 76, 4],
          [40, 77, 3], [43, 76, 1], [44, 72, 4],
          [48, 71, 4], [52, 68, 4],
          [56, 64, 6],
        ],
      },
      {
        chords: [CH.F_phryg, CH.Em_low, CH.Dmin, CH.E7, CH.F_phryg, CH.Bdim, CH.E7, CH.Em_low],
        notes: [
          [2, 65, 2], [4, 68, 2], [6, 71, 2],
          [8, 76, 5], [14, 72, 2],
          [16, 74, 4], [20, 71, 4],
          [24, 68, 5],
          [32, 77, 4], [36, 72, 4],
          [40, 74, 4], [44, 71, 4],
          [48, 68, 6],
        ],
      },
    ]
  ),

  // 11. SANCTUAIRE DE L'ECLIPSE — 32 bars @ 108 BPM = 71.1s grand climax ascent in B Minor
  citadelle: buildLongScore('citadelle', "Le Sanctuaire de l'Éclipse", 108, 'strings', 'driving', [
    {
      chords: [CH.Bm, CH.Gmaj, CH.Em7, CH.Fsharp7, CH.Bm, CH.Dmaj, CH.Em7, CH.Fsharp7],
      notes: [
        [0, 71, 3], [3, 74, 1], [4, 78, 4],
        [8, 79, 3], [11, 78, 1], [12, 74, 4],
        [16, 76, 3], [19, 74, 1], [20, 71, 4],
        [24, 73, 6],
        [32, 71, 2], [34, 74, 2], [36, 78, 2], [38, 83, 2],
        [40, 81, 4], [44, 78, 4],
        [48, 79, 3], [51, 76, 1], [52, 74, 4],
        [56, 78, 6],
      ],
    },
    {
      chords: [CH.Gmaj, CH.Dmaj, CH.Em7, CH.Bm, CH.Gmaj, CH.Fsharp7, CH.Bm, CH.Bm],
      notes: [
        [0, 83, 4], [4, 79, 4],
        [8, 81, 4], [12, 78, 4],
        [16, 76, 3], [19, 78, 1], [20, 79, 4],
        [24, 74, 6],
        [32, 79, 3], [35, 78, 1], [36, 76, 4],
        [40, 78, 4], [44, 73, 4],
        [48, 71, 6],
      ],
    },
    {
      chords: [CH.Em7, CH.Bm, CH.Gmaj, CH.Dmaj, CH.Em7, CH.Bm, CH.Gmaj, CH.Fsharp7],
      notes: [
        [2, 76, 2], [4, 79, 4],
        [8, 78, 4], [12, 74, 4],
        [16, 79, 3], [19, 81, 1], [20, 83, 4],
        [24, 81, 6],
        [32, 76, 3], [35, 78, 1], [36, 79, 4],
        [40, 78, 4], [44, 74, 4],
        [48, 79, 4], [52, 76, 4],
        [56, 78, 5],
      ],
    },
    {
      chords: [CH.Gmaj, CH.A7, CH.Bm, CH.Dmaj, CH.Em7, CH.Fsharp7, CH.Bm, CH.Bm],
      notes: [
        [0, 79, 4], [4, 83, 4],
        [8, 81, 4], [12, 76, 4],
        [16, 78, 4], [20, 74, 4],
        [24, 81, 6],
        [32, 79, 3], [35, 76, 1], [36, 74, 4],
        [40, 73, 3], [43, 76, 1], [44, 78, 4],
        [48, 71, 6],
      ],
    },
  ]),

  // 12. COMBAT DE BOSS / PYRAXIS — 24 bars @ 132 BPM heroic battle symphony!
  boss_battle: buildLongScore(
    'boss_battle',
    'Choc des Gardiens Primordiaux',
    132,
    'brass',
    'driving',
    [
      {
        chords: [CH.Dmin, CH.Bbmaj7, CH.Cmaj, CH.Dmin, CH.Dmin, CH.Gm7, CH.A7, CH.Dmin],
        notes: [
          [0, 74, 2], [2, 74, 1], [3, 76, 1], [4, 77, 2], [6, 74, 2],
          [8, 70, 3], [11, 72, 1], [12, 74, 4],
          [16, 72, 2], [18, 74, 2], [20, 76, 2], [22, 72, 2],
          [24, 74, 6],
          [32, 74, 2], [34, 77, 2], [36, 81, 3], [39, 79, 1],
          [40, 79, 3], [43, 77, 1], [44, 74, 4],
          [48, 73, 3], [51, 76, 1], [52, 79, 4],
          [56, 74, 6],
        ],
      },
      {
        chords: [CH.Bbmaj7, CH.Cmaj, CH.Dm7, CH.Fmaj, CH.Gm7, CH.A7, CH.Dmin, CH.A7],
        notes: [
          [0, 77, 3], [3, 79, 1], [4, 81, 4],
          [8, 79, 3], [11, 81, 1], [12, 84, 4],
          [16, 81, 4], [20, 77, 4],
          [24, 81, 6],
          [32, 79, 2], [34, 77, 2], [36, 74, 4],
          [40, 76, 3], [43, 74, 1], [44, 73, 4],
          [48, 74, 6],
        ],
      },
      {
        chords: [CH.Gm7, CH.Amin, CH.Bbmaj7, CH.A7, CH.Dm7, CH.Bbmaj7, CH.A7, CH.Dmin],
        notes: [
          [0, 70, 2], [2, 74, 2], [4, 79, 4],
          [8, 76, 2], [10, 79, 2], [12, 81, 4],
          [16, 82, 3], [19, 81, 1], [20, 79, 4],
          [24, 81, 6],
          [32, 86, 4], [36, 81, 4],
          [40, 82, 3], [43, 79, 1], [44, 77, 4],
          [48, 76, 3], [51, 73, 1], [52, 76, 4],
          [56, 74, 6],
        ],
      },
    ]
  ),
};

const CLASSIC_MP3_FALLBACK: Record<string, string> = {
  maison: 'maison',
  forge: 'maison',
  chateau: 'maison',
  aventure: 'aventure',
  foret: 'aventure',
  terres_ardentes: 'aventure',
  grotte: 'grotte',
  oubliettes: 'grotte',
  temple: 'grotte',
  crypte: 'grotte',
  citadelle: 'grotte',
  boss_battle: 'grotte',
};

class EthyndAudioEngine {
  private musicTrack: HTMLAudioElement | null = null;
  private currentRegionTrack = '';
  private activeScoreId = '';
  private bossEngaged = false;
  private mode: MusicMode = 'evolved';

  private sfxCache: Record<string, HTMLAudioElement> = {};
  private walkAudio: HTMLAudioElement | null = null;

  private ctx: AudioContext | null = null;
  private musicBus: GainNode | null = null;
  private schedulerTimer: number | null = null;
  private nextStepTime = 0;
  private currentStep = 0;
  private noteMapForActiveScore: Map<number, NoteEvent[]> = new Map();

  private muted = false;
  private musicVolume = 0.34;
  private sfxVolume = 0.55;
  private unlockListenersBound = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.bindAutoplayUnlock();
    }
  }

  private bindAutoplayUnlock() {
    if (this.unlockListenersBound) return;
    this.unlockListenersBound = true;
    const unlock = () => {
      if (this.muted) return;
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      } else if (!this.ctx && this.activeScoreId && this.mode === 'evolved') {
        this.startProceduralScheduler();
      }
      if (this.mode === 'classic' && this.musicTrack && this.musicTrack.paused) {
        this.musicTrack.play().catch(() => {});
      }
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      // Build warm acoustic-like master bus with gentle lowpass + stereo echo delay
      const master = this.ctx.createGain();
      master.gain.value = this.musicVolume;

      const warmFilter = this.ctx.createBiquadFilter();
      warmFilter.type = 'lowpass';
      warmFilter.frequency.value = 2400;
      warmFilter.Q.value = 0.7;

      const delay = this.ctx.createDelay(1.0);
      delay.delayTime.value = 0.27;
      const delayFb = this.ctx.createGain();
      delayFb.gain.value = 0.22;
      const delayWet = this.ctx.createGain();
      delayWet.gain.value = 0.18;

      master.connect(warmFilter);
      warmFilter.connect(this.ctx.destination);

      warmFilter.connect(delay);
      delay.connect(delayFb);
      delayFb.connect(delay);
      delay.connect(delayWet);
      delayWet.connect(this.ctx.destination);

      this.musicBus = master;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getScoreMetrics(trackName: string) {
    const comp = COMPOSITIONS[trackName] || COMPOSITIONS.maison;
    const totalSteps = comp.bars * 8;
    const eighthSec = 60 / (comp.bpm * 2);
    return {
      id: comp.id,
      titleFr: comp.titleFr,
      bars: comp.bars,
      totalSteps,
      cycleDurationSec: Number((totalSteps * eighthSec).toFixed(1)),
      melodyNotes: comp.melody.length,
    };
  }

  public getAllScoreIds(): string[] {
    return Object.keys(COMPOSITIONS);
  }

  public getMusicMode(): MusicMode {
    return this.mode;
  }

  public setMusicMode(nextMode: MusicMode) {
    if (this.mode === nextMode) return;
    this.mode = nextMode;
    this.stopAllMusicImmediate();
    const target = this.bossEngaged ? 'boss_battle' : this.currentRegionTrack;
    if (target) {
      this.applyActiveScore(target);
    }
  }

  public isMuted() {
    return this.muted;
  }

  public setMuted(m: boolean) {
    this.muted = m;
    if (m) {
      this.stopProceduralScheduler();
      if (this.musicTrack) {
        this.musicTrack.muted = true;
        this.musicTrack.pause();
      }
      if (this.walkAudio) {
        this.walkAudio.pause();
      }
    } else {
      const target = this.bossEngaged ? 'boss_battle' : this.currentRegionTrack;
      if (target) {
        this.applyActiveScore(target);
      }
    }
  }

  public setBossEngagement(engaged: boolean) {
    if (this.bossEngaged === engaged) return;
    this.bossEngaged = engaged;
    const target = engaged ? 'boss_battle' : this.currentRegionTrack;
    if (target) {
      this.applyActiveScore(target);
    }
  }

  public playMusic(name: string) {
    if (!name || name === 'none') {
      this.currentRegionTrack = '';
      this.bossEngaged = false;
      this.stopAllMusicImmediate();
      return;
    }
    this.currentRegionTrack = name;
    const target = this.bossEngaged ? 'boss_battle' : name;
    this.applyActiveScore(target);
  }

  private stopProceduralScheduler() {
    if (this.schedulerTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  private stopAllMusicImmediate() {
    this.stopProceduralScheduler();
    this.activeScoreId = '';
    if (this.musicTrack) {
      this.musicTrack.pause();
      this.musicTrack.currentTime = 0;
    }
  }

  private applyActiveScore(scoreName: string) {
    if (this.mode === 'classic') {
      this.stopProceduralScheduler();
      const mp3Name = CLASSIC_MP3_FALLBACK[scoreName] || 'aventure';
      if (this.activeScoreId === `mp3:${mp3Name}` && this.musicTrack) {
        this.musicTrack.muted = this.muted;
        if (!this.muted && this.musicTrack.paused) {
          this.musicTrack.play().catch(() => {});
        }
        return;
      }
      if (this.musicTrack) {
        this.musicTrack.pause();
        this.musicTrack.currentTime = 0;
      }
      this.activeScoreId = `mp3:${mp3Name}`;
      if (typeof Audio !== 'undefined') {
        const audio = new Audio(`/ethynd/audio/${mp3Name}.mp3`);
        audio.loop = true;
        audio.volume = this.musicVolume;
        audio.muted = this.muted;
        this.musicTrack = audio;
        if (!this.muted) {
          audio.play().catch(() => {});
        }
      }
      return;
    }

    // Evolved Long-Phrase Mode
    if (this.musicTrack) {
      this.musicTrack.pause();
    }
    const comp = COMPOSITIONS[scoreName] || COMPOSITIONS.aventure;
    if (this.activeScoreId === comp.id && this.schedulerTimer !== null) {
      return;
    }

    this.activeScoreId = comp.id;
    this.noteMapForActiveScore.clear();
    for (const ev of comp.melody) {
      const list = this.noteMapForActiveScore.get(ev.step) || [];
      list.push(ev);
      this.noteMapForActiveScore.set(ev.step, list);
    }
    this.currentStep = 0;

    if (!this.muted) {
      this.startProceduralScheduler();
    }
  }

  private startProceduralScheduler() {
    this.stopProceduralScheduler();
    const ctx = this.ensureContext();
    if (!ctx || !this.musicBus || typeof window === 'undefined') return;

    this.nextStepTime = ctx.currentTime + 0.06;
    const tickScheduler = () => {
      if (this.muted || !this.ctx || !this.musicBus) return;
      const comp = COMPOSITIONS[this.activeScoreId];
      if (!comp) return;
      const eighthSec = 60 / (comp.bpm * 2);
      const totalSteps = comp.bars * 8;

      while (this.nextStepTime < this.ctx.currentTime + 0.28) {
        this.scheduleStep(comp, this.currentStep, this.nextStepTime, eighthSec);
        this.nextStepTime += eighthSec;
        this.currentStep = (this.currentStep + 1) % totalSteps;
      }
    };

    tickScheduler();
    this.schedulerTimer = window.setInterval(tickScheduler, 110);
  }

  private scheduleStep(
    comp: RegionComposition,
    step: number,
    when: number,
    eighthSec: number
  ) {
    if (!this.ctx || !this.musicBus) return;
    const barIdx = Math.floor(step / 8) % comp.barChords.length;
    const beatInBar = step % 8;
    const chord = comp.barChords[barIdx];
    const isFinalBreathingBars = barIdx >= comp.bars - 2;

    // 1. Warm Cello / Bass foundation on beat 0 (and gentle fifth on beat 4)
    if (beatInBar === 0) {
      this.playWarmBass(midiToFreq(chord[0]), when, eighthSec * 4.5, 0.22);
    } else if (beatInBar === 4 && !isFinalBreathingBars) {
      this.playWarmBass(midiToFreq(chord[1]), when, eighthSec * 3.5, 0.14);
    }

    // 2. Harp / Lute accompaniment pattern
    const upper = chord.slice(1);
    if (comp.arpStyle === 'gentle_up') {
      const idx = [0, 1, 2, 3, 2, 1, 2, 0][beatInBar] % upper.length;
      if (!isFinalBreathingBars || beatInBar % 2 === 0) {
        this.playPluckedHarp(midiToFreq(upper[idx]), when, eighthSec * 2.2, 0.11);
      }
    } else if (comp.arpStyle === 'pendulum') {
      const idx = [0, 2, 1, 3, 2, 3, 1, 2][beatInBar] % upper.length;
      this.playPluckedHarp(midiToFreq(upper[idx]), when, eighthSec * 1.9, 0.11);
    } else if (comp.arpStyle === 'waltz_8') {
      if (beatInBar === 0 || beatInBar === 3 || beatInBar === 6) {
        this.playPluckedHarp(midiToFreq(upper[0]), when, eighthSec * 2.0, 0.12);
        this.playPluckedHarp(midiToFreq(upper[2 % upper.length]), when + 0.015, eighthSec * 2.0, 0.1);
      } else if (beatInBar === 2 || beatInBar === 5) {
        this.playPluckedHarp(midiToFreq(upper[1 % upper.length]), when, eighthSec * 1.5, 0.08);
      }
    } else if (comp.arpStyle === 'sparse_echo') {
      if (beatInBar === 0 || beatInBar === 3 || beatInBar === 5) {
        const idx = (beatInBar + barIdx) % upper.length;
        this.playPluckedHarp(midiToFreq(upper[idx]), when, eighthSec * 2.8, 0.09);
      }
    } else if (comp.arpStyle === 'driving') {
      const idx = beatInBar % upper.length;
      this.playPluckedHarp(midiToFreq(upper[idx]), when, eighthSec * 1.15, 0.12);
    }

    // 3. Expressive Long-Phrase Lead Melody
    const events = this.noteMapForActiveScore.get(step);
    if (events) {
      for (const ev of events) {
        const durSec = Math.max(0.14, ev.dur * eighthSec * 0.94);
        this.playLeadVoice(comp.lead, midiToFreq(ev.midi), when, durSec, ev.vel ?? 0.24);
      }
    }
  }

  private playWarmBass(freq: number, when: number, dur: number, peak: number) {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, when);

    gain.gain.setValueAtTime(0.0008, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, when + dur);

    osc.connect(gain);
    gain.connect(this.musicBus);
    osc.start(when);
    osc.stop(when + dur + 0.03);
  }

  private playPluckedHarp(freq: number, when: number, dur: number, peak: number) {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, when);

    gain.gain.setValueAtTime(0.0008, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, when + dur);

    osc.connect(gain);
    gain.connect(this.musicBus);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  private playLeadVoice(
    inst: LeadInstrument,
    freq: number,
    when: number,
    dur: number,
    peak: number
  ) {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (inst === 'flute') {
      osc.type = 'sine';
      sub.type = 'triangle';
      osc.frequency.setValueAtTime(freq, when);
      sub.frequency.setValueAtTime(freq, when);

      // Gentle expressive vibrato on sustained flute notes
      if (dur > 0.45) {
        const vib = this.ctx.createOscillator();
        const vibGain = this.ctx.createGain();
        vib.frequency.setValueAtTime(5.2, when);
        vibGain.gain.setValueAtTime(0, when);
        vibGain.gain.linearRampToValueAtTime(freq * 0.007, when + 0.25);
        vib.connect(vibGain);
        vibGain.connect(osc.frequency);
        vib.start(when);
        vib.stop(when + dur + 0.04);
      }

      gain.gain.setValueAtTime(0.001, when);
      gain.gain.linearRampToValueAtTime(peak, when + 0.055);
      gain.gain.setValueAtTime(peak * 0.85, when + dur * 0.72);
      gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
    } else if (inst === 'strings') {
      osc.type = 'sawtooth';
      sub.type = 'triangle';
      osc.frequency.setValueAtTime(freq, when);
      sub.frequency.setValueAtTime(freq * 1.003, when); // Warm ensemble chorus

      const lpf = this.ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(1450, when);

      gain.gain.setValueAtTime(0.001, when);
      gain.gain.linearRampToValueAtTime(peak * 0.72, when + 0.075);
      gain.gain.setValueAtTime(peak * 0.62, when + dur * 0.75);
      gain.gain.exponentialRampToValueAtTime(0.001, when + dur);

      osc.connect(lpf);
      sub.connect(lpf);
      lpf.connect(gain);
      gain.connect(this.musicBus);
      osc.start(when);
      sub.start(when);
      osc.stop(when + dur + 0.04);
      sub.stop(when + dur + 0.04);
      return;
    } else if (inst === 'brass') {
      osc.type = 'sawtooth';
      sub.type = 'triangle';
      osc.frequency.setValueAtTime(freq, when);
      sub.frequency.setValueAtTime(freq * 0.5, when);

      const lpf = this.ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(900, when);
      lpf.frequency.linearRampToValueAtTime(1850, when + 0.09);

      gain.gain.setValueAtTime(0.001, when);
      gain.gain.linearRampToValueAtTime(peak * 0.74, when + 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, when + dur);

      osc.connect(lpf);
      sub.connect(lpf);
      lpf.connect(gain);
      gain.connect(this.musicBus);
      osc.start(when);
      sub.start(when);
      osc.stop(when + dur + 0.04);
      sub.stop(when + dur + 0.04);
      return;
    } else if (inst === 'bell') {
      osc.type = 'sine';
      sub.type = 'sine';
      osc.frequency.setValueAtTime(freq, when);
      sub.frequency.setValueAtTime(freq * 2, when);

      gain.gain.setValueAtTime(0.001, when);
      gain.gain.linearRampToValueAtTime(peak * 0.85, when + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, when + dur * 1.15);
    } else {
      // harp lead
      osc.type = 'triangle';
      sub.type = 'sine';
      osc.frequency.setValueAtTime(freq, when);
      sub.frequency.setValueAtTime(freq * 2, when);

      gain.gain.setValueAtTime(0.001, when);
      gain.gain.linearRampToValueAtTime(peak * 0.9, when + 0.016);
      gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
    }

    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.28;
    osc.connect(gain);
    sub.connect(subGain);
    subGain.connect(gain);
    gain.connect(this.musicBus);

    osc.start(when);
    sub.start(when);
    osc.stop(when + dur + 0.2);
    sub.stop(when + dur + 0.2);
  }

  public playWalkStep() {
    if (this.muted || typeof Audio === 'undefined') return;
    if (!this.walkAudio) {
      this.walkAudio = new Audio('/ethynd/audio/joueur_marche.mp3');
      this.walkAudio.volume = this.sfxVolume * 0.4;
    }
    if (this.walkAudio.paused) {
      this.walkAudio.currentTime = 0;
      this.walkAudio.play().catch(() => {});
    }
  }

  public playOriginalSfx(
    key:
      | 'joueur_attaque'
      | 'joueur_blessure'
      | 'monstre_chauve_souris'
      | 'monstre_dragon_rouge'
      | 'selection_menu'
  ) {
    if (this.muted || typeof Audio === 'undefined') return;
    let base = this.sfxCache[key];
    if (!base) {
      base = new Audio(`/ethynd/audio/${key}.mp3`);
      this.sfxCache[key] = base;
    }
    const clone = base.cloneNode() as HTMLAudioElement;
    clone.volume = this.sfxVolume;
    clone.play().catch(() => {});
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'triangle',
    delay = 0,
    gainPeak = 0.14
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainPeak * this.sfxVolume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playLevelUp() {
    this.tone(523.25, 0.14, 'triangle', 0, 0.22);
    this.tone(659.25, 0.14, 'triangle', 0.1, 0.22);
    this.tone(783.99, 0.16, 'triangle', 0.2, 0.24);
    this.tone(1046.5, 0.35, 'sine', 0.32, 0.26);
  }

  public playChestOpen() {
    this.tone(440, 0.12, 'triangle', 0, 0.18);
    this.tone(554.37, 0.12, 'triangle', 0.09, 0.18);
    this.tone(659.25, 0.24, 'sine', 0.18, 0.22);
  }

  public playLoreUnlock() {
    this.tone(392, 0.18, 'sine', 0, 0.16);
    this.tone(587.33, 0.22, 'sine', 0.12, 0.18);
    this.tone(783.99, 0.32, 'sine', 0.24, 0.2);
  }

  public playSkillWave() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
    gain.gain.setValueAtTime(0.16 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playForgeClang() {
    this.tone(880, 0.08, 'square', 0, 0.18);
    this.tone(1320, 0.22, 'triangle', 0.04, 0.2);
  }

  public playHeal() {
    this.tone(523.25, 0.15, 'sine', 0, 0.16);
    this.tone(783.99, 0.22, 'sine', 0.1, 0.18);
  }
}

export const audioEngine = new EthyndAudioEngine();
