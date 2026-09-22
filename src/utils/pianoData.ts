import { NoteInfo } from '../types';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_ES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

// Two keyboard mapping schemes:
// 1. 'home-row':
//    White keys: A (C4), S (D4), D (E4), F (F4), G (G4), H (A4), J (B4), K (C5), L (D5), ; / Ñ (E5), ' (F5)
//    Black keys: W (C#4), E (D#4), T (F#4), Y (G#4), U (A#4), O (C#5), P (D#5)
// 2. 'two-tier':
//    Octave 3: Z, S, X, D, C, V, G, B, H, N, J, M
//    Octave 4: Q, 2, W, 3, E, R, 5, T, 6, Y, 7, U, I

export const KEYBOARD_MAP_HOME_ROW: Record<number, string> = {
  // Octave 4
  60: 'A', // C4
  61: 'W', // C#4
  62: 'S', // D4
  63: 'E', // D#4
  64: 'D', // E4
  65: 'F', // F4
  66: 'T', // F#4
  67: 'G', // G4
  68: 'Y', // G#4
  69: 'H', // A4
  70: 'U', // A#4
  71: 'J', // B4
  // Octave 5 (Extension)
  72: 'K', // C5
  73: 'O', // C#5
  74: 'L', // D5
  75: 'P', // D#5
  76: 'Ñ', // E5 (or ;)
  77: '´', // F5
};

// Alternative keys for international keyboards (; and : for ñ)
export const KEY_CODE_TO_MIDI_HOME: Record<string, number> = {
  KeyA: 60,
  KeyW: 61,
  KeyS: 62,
  KeyE: 63,
  KeyD: 64,
  KeyF: 65,
  KeyT: 66,
  KeyG: 67,
  KeyY: 68,
  KeyH: 69,
  KeyU: 70,
  KeyJ: 71,
  KeyK: 72,
  KeyO: 73,
  KeyL: 74,
  KeyP: 75,
  Semicolon: 76,
  Quote: 77,
};

export const KEYBOARD_MAP_TWO_TIER: Record<number, string> = {
  // Octave 3 (Low row)
  48: 'Z',
  49: 'S',
  50: 'X',
  51: 'D',
  52: 'C',
  53: 'V',
  54: 'G',
  55: 'B',
  56: 'H',
  57: 'N',
  58: 'J',
  59: 'M',
  // Octave 4 (High row)
  60: 'Q',
  61: '2',
  62: 'W',
  63: '3',
  64: 'E',
  65: 'R',
  66: '5',
  67: 'T',
  68: '6',
  69: 'Y',
  70: '7',
  71: 'U',
  72: 'I',
};

export const KEY_CODE_TO_MIDI_TWO_TIER: Record<string, number> = {
  KeyZ: 48,
  KeyS: 49,
  KeyX: 50,
  KeyD: 51,
  KeyC: 52,
  KeyV: 53,
  KeyG: 54,
  KeyB: 55,
  KeyH: 56,
  KeyN: 57,
  KeyJ: 58,
  KeyM: 59,
  KeyQ: 60,
  Digit2: 61,
  KeyW: 62,
  Digit3: 63,
  KeyE: 64,
  KeyR: 65,
  Digit5: 66,
  KeyT: 67,
  Digit6: 68,
  KeyY: 69,
  Digit7: 70,
  KeyU: 71,
  KeyI: 72,
};

export function midiToFrequency(midi: number, transpose: number = 0): number {
  return 440 * Math.pow(2, (midi + transpose - 69) / 12);
}

/**
 * Generates 4 full octaves from C2 to C6 inclusive (49 keys total: 29 white, 20 black).
 */
export function generatePianoNotes(mappingMode: 'home-row' | 'two-tier' = 'home-row'): NoteInfo[] {
  const notes: NoteInfo[] = [];
  const startOctave = 2;
  const endOctave = 6;
  let whiteCount = 0;

  for (let octave = startOctave; octave <= endOctave; octave++) {
    const maxNote = octave === endOctave ? 0 : 11; // If endOctave, only take C (index 0)
    for (let i = 0; i <= maxNote; i++) {
      const midi = (octave + 1) * 12 + i;
      const noteName = NOTE_NAMES[i];
      const noteNameEs = NOTE_NAMES_ES[i];
      const isBlack = noteName.includes('#');
      const frequency = midiToFrequency(midi);
      
      const keyboardMap = mappingMode === 'home-row' ? KEYBOARD_MAP_HOME_ROW : KEYBOARD_MAP_TWO_TIER;
      const keyboardKey = keyboardMap[midi];

      const whiteIndex = isBlack ? whiteCount - 1 : whiteCount;

      notes.push({
        midi,
        noteName,
        noteNameEs,
        octave,
        fullName: `${noteName}${octave}`,
        fullNameEs: `${noteNameEs}${octave}`,
        isBlack,
        frequency,
        keyboardKey,
        whiteKeyIndex: whiteIndex,
      });

      if (!isBlack) {
        whiteCount++;
      }
    }
  }

  return notes;
}
