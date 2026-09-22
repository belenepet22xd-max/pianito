import { ActiveVoice, ADSREnvelope, InstrumentPreset, WaveformType } from '../types';
import { midiToFrequency } from './pianoData';

class WebAudioPianoEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  private activeVoices: Map<number, ActiveVoice> = new Map();
  private sustainedNotes: Set<number> = new Set();
  
  // Synthesizer Configuration
  public waveform: WaveformType = 'triangle';
  public preset: InstrumentPreset = 'classic-piano';
  public masterVolume: number = 0.75;
  public octaveShift: number = 0; // -2, -1, 0, +1, +2 octaves
  public semitoneShift: number = 0; // -12 to +12
  public isSustainActive: boolean = false;
  
  // ADSR Settings
  public envelope: ADSREnvelope = {
    attack: 0.015, // seconds (smooth click-free attack)
    decay: 0.25,   // seconds
    sustain: 0.75, // 0 to 1
    release: 0.35, // seconds
  };

  // Filter settings
  public filterCutoff: number = 5000; // Hz
  public filterResonance: number = 1;

  public init() {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master Limiter / Compressor to avoid distortion on loud chords
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

    // Global Master Filter
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(this.filterCutoff, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(this.filterResonance, this.ctx.currentTime);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

    // Analyser Node for Visualizer
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    // Connect audio chain: Voices -> Filter -> Compressor -> MasterGain -> Analyser -> Destination
    this.filterNode.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public async resumeContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public setMasterVolume(val: number) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.02);
    }
  }

  public setFilterCutoff(freq: number) {
    this.filterCutoff = Math.max(200, Math.min(16000, freq));
    if (this.filterNode && this.ctx) {
      this.filterNode.frequency.setTargetAtTime(this.filterCutoff, this.ctx.currentTime, 0.03);
    }
  }

  public setPreset(preset: InstrumentPreset) {
    this.preset = preset;
    switch (preset) {
      case 'classic-piano':
        this.waveform = 'triangle';
        this.envelope = { attack: 0.012, decay: 0.4, sustain: 0.65, release: 0.4 };
        this.setFilterCutoff(4500);
        break;
      case 'electric-piano':
        this.waveform = 'sine';
        this.envelope = { attack: 0.008, decay: 0.3, sustain: 0.5, release: 0.6 };
        this.setFilterCutoff(6500);
        break;
      case 'organ':
        this.waveform = 'sine';
        this.envelope = { attack: 0.02, decay: 0.05, sustain: 0.95, release: 0.15 };
        this.setFilterCutoff(8000);
        break;
      case 'synth-lead':
        this.waveform = 'sawtooth';
        this.envelope = { attack: 0.03, decay: 0.2, sustain: 0.8, release: 0.3 };
        this.setFilterCutoff(3500);
        break;
      case 'retro-8bit':
        this.waveform = 'square';
        this.envelope = { attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.1 };
        this.setFilterCutoff(12000);
        break;
      case 'warm-pad':
        this.waveform = 'triangle';
        this.envelope = { attack: 0.18, decay: 0.4, sustain: 0.85, release: 1.2 };
        this.setFilterCutoff(2800);
        break;
    }
  }

  public setSustain(active: boolean) {
    this.isSustainActive = active;
    if (!active) {
      // Release all sustained notes that are not physically held down
      this.sustainedNotes.forEach((midi) => {
        this.stopVoice(midi, true);
      });
      this.sustainedNotes.clear();
    }
  }

  public startNote(midi: number) {
    this.resumeContext();
    if (!this.ctx || !this.filterNode) return;

    // If note is already playing, stop existing voice smoothly first
    if (this.activeVoices.has(midi)) {
      this.stopVoice(midi, true);
    }
    this.sustainedNotes.delete(midi);

    const now = this.ctx.currentTime;
    const effectiveTranspose = this.octaveShift * 12 + this.semitoneShift;
    const freq = midiToFrequency(midi, effectiveTranspose);

    // Create primary Oscillator
    const osc = this.ctx.createOscillator();
    osc.type = this.waveform;
    osc.frequency.setValueAtTime(freq, now);

    // Voice Gain Envelope
    const voiceGain = this.ctx.createGain();
    // Start strictly at 0 to avoid clicks
    voiceGain.gain.setValueAtTime(0.0001, now);

    // ADSR Envelope calculation
    const attackTime = Math.max(0.005, this.envelope.attack);
    const decayTime = Math.max(0.01, this.envelope.decay);
    const sustainLevel = Math.max(0.001, Math.min(1.0, this.envelope.sustain));

    // Attack: smooth exponential ramp to 1.0
    voiceGain.gain.exponentialRampToValueAtTime(1.0, now + attackTime);
    // Decay: ramp to sustain level
    voiceGain.gain.exponentialRampToValueAtTime(sustainLevel, now + attackTime + decayTime);

    let subOsc: OscillatorNode | undefined = undefined;

    // Optional subtle overtone/sub-oscillator according to preset
    if (this.preset === 'electric-piano' || this.preset === 'organ') {
      subOsc = this.ctx.createOscillator();
      subOsc.type = this.preset === 'organ' ? 'triangle' : 'sine';
      // Harmonic multiplier: 2x frequency (one octave up chime)
      subOsc.frequency.setValueAtTime(freq * 2, now);
      
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(this.preset === 'organ' ? 0.4 : 0.2, now);
      subOsc.connect(subGain);
      subGain.connect(voiceGain);
      subOsc.start(now);
    }

    osc.connect(voiceGain);
    voiceGain.connect(this.filterNode);
    osc.start(now);

    this.activeVoices.set(midi, {
      midi,
      oscillator: osc,
      subOsc,
      gainNode: voiceGain,
      startTime: now,
    });
  }

  public stopNote(midi: number) {
    if (this.isSustainActive) {
      // Mark as sustained instead of stopping immediately
      this.sustainedNotes.add(midi);
      return;
    }

    this.stopVoice(midi, false);
  }

  private stopVoice(midi: number, immediate: boolean = false) {
    const voice = this.activeVoices.get(midi);
    if (!voice || !this.ctx) return;

    const now = this.ctx.currentTime;
    const releaseTime = immediate ? 0.05 : Math.max(0.02, this.envelope.release);

    // Smooth release ramp to 0.0001 to avoid audio clicks
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(Math.max(0.0001, voice.gainNode.gain.value), now);
    voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);

    // Stop oscillators after release finishes
    setTimeout(() => {
      try {
        voice.oscillator.stop();
        voice.oscillator.disconnect();
        if (voice.subOsc) {
          voice.subOsc.stop();
          voice.subOsc.disconnect();
        }
        voice.gainNode.disconnect();
      } catch {
        // Ignore if already stopped
      }
    }, releaseTime * 1000 + 50);

    this.activeVoices.delete(midi);
  }

  public stopAllNotes() {
    this.activeVoices.forEach((_, midi) => {
      this.stopVoice(midi, true);
    });
    this.sustainedNotes.clear();
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getActiveCount(): number {
    return this.activeVoices.size;
  }
}

export const audioEngine = new WebAudioPianoEngine();
