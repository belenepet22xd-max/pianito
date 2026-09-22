export type WaveformType = 'sine' | 'triangle' | 'sawtooth' | 'square';

export type InstrumentPreset = 'classic-piano' | 'electric-piano' | 'organ' | 'synth-lead' | 'retro-8bit' | 'warm-pad';

export interface NoteInfo {
  midi: number;
  noteName: string; // e.g., 'C', 'C#', 'D'
  noteNameEs: string; // e.g., 'Do', 'Do#', 'Re'
  octave: number;
  fullName: string; // e.g., 'C4'
  fullNameEs: string; // e.g., 'Do 4'
  isBlack: boolean;
  frequency: number;
  keyboardKey?: string; // Physical keyboard key mapped
  whiteKeyIndex: number; // Index among white keys (for positioning black keys)
}

export interface ADSREnvelope {
  attack: number; // in seconds (e.g. 0.01)
  decay: number; // in seconds (e.g. 0.1)
  sustain: number; // ratio 0 - 1 (e.g. 0.7)
  release: number; // in seconds (e.g. 0.3)
}

export interface ActiveVoice {
  midi: number;
  oscillator: OscillatorNode;
  subOsc?: OscillatorNode;
  gainNode: GainNode;
  filterNode?: BiquadFilterNode;
  startTime: number;
}

export interface RecordedNote {
  midi: number;
  time: number; // ms from start
  duration: number; // ms
}

export interface Song {
  title: string;
  author: string;
  notes: { midi: number; duration: number; delay: number }[];
}
