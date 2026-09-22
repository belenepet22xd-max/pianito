import { Song } from '../types';

export const DEMO_SONGS: Song[] = [
  {
    title: 'Para Elisa (Für Elise)',
    author: 'L. v. Beethoven',
    notes: [
      { midi: 64, duration: 250, delay: 0 },    // E4
      { midi: 63, duration: 250, delay: 280 },  // D#4
      { midi: 64, duration: 250, delay: 560 },  // E4
      { midi: 63, duration: 250, delay: 840 },  // D#4
      { midi: 64, duration: 250, delay: 1120 }, // E4
      { midi: 59, duration: 250, delay: 1400 }, // B3
      { midi: 62, duration: 250, delay: 1680 }, // D4
      { midi: 60, duration: 250, delay: 1960 }, // C4
      { midi: 57, duration: 500, delay: 2240 }, // A3
      // Bass octave note
      { midi: 45, duration: 500, delay: 2240 }, // A2
      { midi: 48, duration: 250, delay: 2800 }, // C3
      { midi: 52, duration: 250, delay: 3080 }, // E3
      { midi: 57, duration: 250, delay: 3360 }, // A3
      { midi: 59, duration: 500, delay: 3640 }, // B3
      { midi: 40, duration: 500, delay: 3640 }, // E2
      { midi: 52, duration: 250, delay: 4200 }, // E3
      { midi: 56, duration: 250, delay: 4480 }, // G#3
      { midi: 59, duration: 250, delay: 4760 }, // B3
      { midi: 60, duration: 500, delay: 5040 }, // C4
      { midi: 45, duration: 500, delay: 5040 }, // A2
    ],
  },
  {
    title: 'Himno a la Alegría',
    author: 'L. v. Beethoven',
    notes: [
      { midi: 64, duration: 350, delay: 0 },    // E4
      { midi: 64, duration: 350, delay: 400 },  // E4
      { midi: 65, duration: 350, delay: 800 },  // F4
      { midi: 67, duration: 350, delay: 1200 }, // G4
      { midi: 67, duration: 350, delay: 1600 }, // G4
      { midi: 65, duration: 350, delay: 2000 }, // F4
      { midi: 64, duration: 350, delay: 2400 }, // E4
      { midi: 62, duration: 350, delay: 2800 }, // D4
      { midi: 60, duration: 350, delay: 3200 }, // C4
      { midi: 60, duration: 350, delay: 3600 }, // C4
      { midi: 62, duration: 350, delay: 4000 }, // D4
      { midi: 64, duration: 350, delay: 4400 }, // E4
      { midi: 64, duration: 500, delay: 4800 }, // E4
      { midi: 62, duration: 250, delay: 5400 }, // D4
      { midi: 62, duration: 600, delay: 5700 }, // D4
    ],
  },
  {
    title: 'Estrellita / Twinkle Twinkle',
    author: 'Tradicional',
    notes: [
      { midi: 60, duration: 350, delay: 0 },    // C4
      { midi: 60, duration: 350, delay: 400 },  // C4
      { midi: 67, duration: 350, delay: 800 },  // G4
      { midi: 67, duration: 350, delay: 1200 }, // G4
      { midi: 69, duration: 350, delay: 1600 }, // A4
      { midi: 69, duration: 350, delay: 2000 }, // A4
      { midi: 67, duration: 700, delay: 2400 }, // G4
      { midi: 65, duration: 350, delay: 3200 }, // F4
      { midi: 65, duration: 350, delay: 3600 }, // F4
      { midi: 64, duration: 350, delay: 4000 }, // E4
      { midi: 64, duration: 350, delay: 4400 }, // E4
      { midi: 62, duration: 350, delay: 4800 }, // D4
      { midi: 62, duration: 350, delay: 5200 }, // D4
      { midi: 60, duration: 700, delay: 5600 }, // C4
    ],
  },
  {
    title: 'Tetris Theme (Korobeiniki)',
    author: 'Tradicional Rusa',
    notes: [
      { midi: 64, duration: 300, delay: 0 },    // E4
      { midi: 59, duration: 150, delay: 350 },  // B3
      { midi: 60, duration: 150, delay: 550 },  // C4
      { midi: 62, duration: 300, delay: 750 },  // D4
      { midi: 60, duration: 150, delay: 1100 }, // C4
      { midi: 59, duration: 150, delay: 1300 }, // B3
      { midi: 57, duration: 300, delay: 1500 }, // A3
      { midi: 57, duration: 150, delay: 1850 }, // A3
      { midi: 60, duration: 150, delay: 2050 }, // C4
      { midi: 64, duration: 300, delay: 2250 }, // E4
      { midi: 62, duration: 150, delay: 2600 }, // D4
      { midi: 60, duration: 150, delay: 2800 }, // C4
      { midi: 59, duration: 400, delay: 3000 }, // B3
      { midi: 60, duration: 200, delay: 3500 }, // C4
      { midi: 62, duration: 300, delay: 3750 }, // D4
      { midi: 64, duration: 300, delay: 4100 }, // E4
      { midi: 60, duration: 300, delay: 4450 }, // C4
      { midi: 57, duration: 300, delay: 4800 }, // A3
      { midi: 57, duration: 500, delay: 5150 }, // A3
    ],
  },
];
