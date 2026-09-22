/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Volume2, VolumeX, Music, Sliders, Waves, Play, Square, Disc, 
  RotateCcw, Code, Download, Check, Sparkles, Piano as PianoIcon, 
  ChevronLeft, ChevronRight, Layers, HelpCircle, Activity
} from 'lucide-react';
import { audioEngine } from './utils/audioEngine';
import { generatePianoNotes, KEY_CODE_TO_MIDI_HOME, KEY_CODE_TO_MIDI_TWO_TIER } from './utils/pianoData';
import { DEMO_SONGS } from './utils/songs';
import { getStandaloneHtml } from './utils/standaloneHtml';
import { InstrumentPreset, NoteInfo, RecordedNote, Song, WaveformType } from './types';

export default function App() {
  // Synthesizer State
  const [waveform, setWaveform] = useState<WaveformType>('triangle');
  const [preset, setPreset] = useState<InstrumentPreset>('classic-piano');
  const [volume, setVolume] = useState<number>(0.75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [octaveShift, setOctaveShift] = useState<number>(0);
  const [sustain, setSustain] = useState<boolean>(false);
  
  // Envelope & Filter
  const [attack, setAttack] = useState<number>(0.015);
  const [release, setRelease] = useState<number>(0.35);
  const [filterCutoff, setFilterCutoff] = useState<number>(5000);

  // UI Configuration
  const [keyLabelMode, setKeyLabelMode] = useState<'both' | 'notes' | 'shortcuts' | 'none'>('both');
  const [noteNaming, setNoteNaming] = useState<'es' | 'en'>('es'); // Do-Re-Mi vs C-D-E
  const [keyboardMappingMode, setKeyboardMappingMode] = useState<'home-row' | 'two-tier'>('home-row');
  const [zoomLevel, setZoomLevel] = useState<'normal' | 'fit' | 'compact'>('normal');

  // Currently active notes (for UI feedback)
  const [activeMidiNotes, setActiveMidiNotes] = useState<Set<number>>(new Set());

  // Demo Songs & Recording
  const [isPlayingSong, setIsPlayingSong] = useState<boolean>(false);
  const [currentSongTitle, setCurrentSongTitle] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const songTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Standalone HTML Modal
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [hasCopiedCode, setHasCopiedCode] = useState<boolean>(false);

  // References
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseIsDownRef = useRef<boolean>(false);
  const activeTouchesRef = useRef<Map<number, number>>(new Map());

  // Piano Notes (4 Octaves: C2 to C6 = 49 notes)
  const pianoNotes = useRef<NoteInfo[]>(generatePianoNotes(keyboardMappingMode)).current;

  // Trigger Note On
  const handleNoteOn = useCallback((midi: number) => {
    audioEngine.startNote(midi);
    setActiveMidiNotes((prev) => new Set(prev).add(midi));

    // If recording, store note
    if (isRecording) {
      const time = Date.now() - recordingStartTimeRef.current;
      setRecordedNotes((prev) => [...prev, { midi, time, duration: 300 }]);
    }
  }, [isRecording]);

  // Trigger Note Off
  const handleNoteOff = useCallback((midi: number) => {
    audioEngine.stopNote(midi);
    setActiveMidiNotes((prev) => {
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
  }, []);

  // Update notes if mapping mode changes
  const currentNotes = generatePianoNotes(keyboardMappingMode);

  // Global mouse up
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      mouseIsDownRef.current = false;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Physical Keyboard Handling
  useEffect(() => {
    const heldKeys = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in text inputs or modals
      if ((e.target as HTMLElement).tagName === 'INPUT' || showCodeModal) return;
      if (e.repeat) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setSustain((prev) => {
          const next = !prev;
          audioEngine.setSustain(next);
          return next;
        });
        return;
      }

      const keyMap = keyboardMappingMode === 'home-row' ? KEY_CODE_TO_MIDI_HOME : KEY_CODE_TO_MIDI_TWO_TIER;
      const midi = keyMap[e.code];

      if (midi && !heldKeys.has(e.code)) {
        e.preventDefault();
        heldKeys.add(e.code);
        handleNoteOn(midi);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (heldKeys.has(e.code)) {
        heldKeys.delete(e.code);
        const keyMap = keyboardMappingMode === 'home-row' ? KEY_CODE_TO_MIDI_HOME : KEY_CODE_TO_MIDI_TWO_TIER;
        const midi = keyMap[e.code];
        if (midi) {
          handleNoteOff(midi);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyboardMappingMode, handleNoteOn, handleNoteOff, showCodeModal]);

  // Real-time Oscilloscope animation
  useEffect(() => {
    let animationFrameId: number;

    const renderScope = () => {
      const canvas = canvasRef.current;
      const analyser = audioEngine.getAnalyser();

      if (canvas && analyser) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const bufferLength = analyser.fftSize;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteTimeDomainData(dataArray);

          ctx.fillStyle = '#0b0e14';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Grid lines
          ctx.strokeStyle = '#161c28';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();

          // Waveform line
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#38bdf8';
          ctx.beginPath();

          const sliceWidth = canvas.width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          ctx.stroke();
          ctx.shadowBlur = 0; // reset
        }
      }

      animationFrameId = requestAnimationFrame(renderScope);
    };

    renderScope();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Preset selection
  const handleSelectPreset = (newPreset: InstrumentPreset) => {
    setPreset(newPreset);
    audioEngine.setPreset(newPreset);
    setWaveform(audioEngine.waveform);
    setAttack(audioEngine.envelope.attack);
    setRelease(audioEngine.envelope.release);
    setFilterCutoff(audioEngine.filterCutoff);
  };

  // Waveform selection
  const handleSelectWaveform = (newWave: WaveformType) => {
    setWaveform(newWave);
    audioEngine.waveform = newWave;
  };

  // Volume Change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audioEngine.setMasterVolume(isMuted ? 0 : newVol);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    audioEngine.setMasterVolume(!isMuted ? 0 : volume);
  };

  // Octave Shift
  const handleOctaveShift = (shift: number) => {
    setOctaveShift(shift);
    audioEngine.octaveShift = shift;
  };

  // Sustain toggle
  const toggleSustain = () => {
    const next = !sustain;
    setSustain(next);
    audioEngine.setSustain(next);
  };

  // Attack & Release
  const handleAttackChange = (val: number) => {
    setAttack(val);
    audioEngine.envelope.attack = val;
  };

  const handleReleaseChange = (val: number) => {
    setRelease(val);
    audioEngine.envelope.release = val;
  };

  const handleCutoffChange = (val: number) => {
    setFilterCutoff(val);
    audioEngine.setFilterCutoff(val);
  };

  // Scroll to Octave Helper
  const scrollToOctave = (oct: number) => {
    const keyElem = document.getElementById(`piano-key-${(oct + 1) * 12}`);
    if (keyElem && scrollContainerRef.current) {
      keyElem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  // Demo Song Playback
  const playSong = (song: Song) => {
    stopSong();
    setIsPlayingSong(true);
    setCurrentSongTitle(song.title);

    song.notes.forEach((item) => {
      const onTimeout = setTimeout(() => {
        handleNoteOn(item.midi);
      }, item.delay);

      const offTimeout = setTimeout(() => {
        handleNoteOff(item.midi);
      }, item.delay + item.duration);

      songTimeoutsRef.current.push(onTimeout, offTimeout);
    });

    const totalDuration = Math.max(...song.notes.map(n => n.delay + n.duration)) + 200;
    const endTimeout = setTimeout(() => {
      setIsPlayingSong(false);
      setCurrentSongTitle('');
    }, totalDuration);

    songTimeoutsRef.current.push(endTimeout);
  };

  const stopSong = () => {
    songTimeoutsRef.current.forEach((t) => clearTimeout(t));
    songTimeoutsRef.current = [];
    audioEngine.stopAllNotes();
    setActiveMidiNotes(new Set());
    setIsPlayingSong(false);
    setCurrentSongTitle('');
  };

  // Recording Controls
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setRecordedNotes([]);
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);
    }
  };

  const playRecordedMelody = () => {
    if (recordedNotes.length === 0) return;
    stopSong();
    setIsPlayingSong(true);
    setCurrentSongTitle('Tu Grabación');

    recordedNotes.forEach((item) => {
      const onTimeout = setTimeout(() => {
        handleNoteOn(item.midi);
      }, item.time);

      const offTimeout = setTimeout(() => {
        handleNoteOff(item.midi);
      }, item.time + item.duration);

      songTimeoutsRef.current.push(onTimeout, offTimeout);
    });

    const total = Math.max(...recordedNotes.map(n => n.time + n.duration)) + 200;
    const endTimeout = setTimeout(() => {
      setIsPlayingSong(false);
      setCurrentSongTitle('');
    }, total);
    songTimeoutsRef.current.push(endTimeout);
  };

  // Download Standalone HTML
  const downloadStandaloneHtml = () => {
    const html = getStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'piano-4-octavas-webaudio.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyStandaloneHtml = () => {
    const html = getStandaloneHtml();
    navigator.clipboard.writeText(html).then(() => {
      setHasCopiedCode(true);
      setTimeout(() => setHasCopiedCode(false), 2500);
    });
  };

  // Key Width class based on zoom
  const whiteKeyWidthClass = 
    zoomLevel === 'fit' ? 'w-8 sm:w-10 md:w-12 h-44 sm:h-52' :
    zoomLevel === 'compact' ? 'w-9 h-44' : 'w-12 h-56';
  
  const blackKeyWidthClass = 
    zoomLevel === 'fit' ? 'w-5 sm:w-6 md:w-7 h-28 sm:h-32' :
    zoomLevel === 'compact' ? 'w-5 h-28' : 'w-7 h-36';

  const whiteKeyPixelWidth = zoomLevel === 'compact' ? 36 : zoomLevel === 'fit' ? 44 : 48;
  const blackKeyOffset = zoomLevel === 'compact' ? 12 : zoomLevel === 'fit' ? 14 : 15;

  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100 flex flex-col items-center select-none font-sans p-2 sm:p-4 md:p-6">
      
      {/* Top Header Bar */}
      <header className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <PianoIcon className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Virtuoso <span className="text-sky-400 font-semibold text-sm">Web Audio API</span>
            </h1>
            <p className="text-xs text-slate-400">
              Piano Polifónico de 4 Octavas (C2 – C6) · Sintetizador Nativo en Tiempo Real
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* Demo Songs Dropdown */}
          <div className="relative group">
            <button className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors">
              <Music className="w-3.5 h-3.5 text-sky-400" />
              <span>{isPlayingSong ? `Reproduciendo: ${currentSongTitle}` : 'Canciones Demo'}</span>
            </button>
            <div className="absolute right-0 mt-1 w-56 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl p-1.5 hidden group-hover:block z-50">
              <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Obras Clásicas</div>
              {DEMO_SONGS.map((song) => (
                <button
                  key={song.title}
                  onClick={() => playSong(song)}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:bg-sky-500/10 hover:text-sky-300 rounded-md transition-colors flex items-center justify-between"
                >
                  <span className="truncate">{song.title}</span>
                  <span className="text-[10px] text-slate-500">{song.author}</span>
                </button>
              ))}
              {isPlayingSong && (
                <button
                  onClick={stopSong}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-md transition-colors mt-1 border-t border-slate-800 flex items-center gap-1"
                >
                  <Square className="w-3 h-3" /> Detener reproducción
                </button>
              )}
            </div>
          </div>

          {/* Recording Button */}
          <button
            onClick={toggleRecording}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
              isRecording
                ? 'bg-red-950/80 border-red-500 text-red-200 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-200'
            }`}
          >
            <Disc className={`w-3.5 h-3.5 ${isRecording ? 'text-red-400' : 'text-slate-400'}`} />
            <span>{isRecording ? 'Grabando...' : 'Grabar'}</span>
          </button>

          {recordedNotes.length > 0 && !isRecording && (
            <button
              onClick={playRecordedMelody}
              className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/60 text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Oír ({recordedNotes.length} notas)</span>
            </button>
          )}

          {/* Standalone HTML Exporter Modal Button */}
          <button
            onClick={() => setShowCodeModal(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-sky-600/30 to-blue-600/30 hover:from-sky-600/50 hover:to-blue-600/50 border border-sky-500/40 text-sky-300 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Code className="w-3.5 h-3.5" />
            <span>HTML Único</span>
          </button>
        </div>
      </header>

      {/* Main Synthesizer Control Rack */}
      <section className="w-full max-w-7xl mt-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
        
        {/* Rack Header Strip */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-900 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              AUDIO CONTEXT ACTIVO
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">POLIFONÍA: {activeMidiNotes.size} VOZ(ES)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Mapeo Teclado:</span>
            <button
              onClick={() => setKeyboardMappingMode(keyboardMappingMode === 'home-row' ? 'two-tier' : 'home-row')}
              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[11px] text-sky-400"
            >
              {keyboardMappingMode === 'home-row' ? 'Fila A-S-D-F / W-E-T-Y' : '2 Filas (Z-M / Q-I)'}
            </button>
          </div>
        </div>

        {/* Modular Hardware Knobs & Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Module 1: Sound Presets & Waveform */}
          <div className="bg-slate-900/60 border border-slate-800/70 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <span className="flex items-center gap-1.5"><Waves className="w-3.5 h-3.5 text-sky-400" /> Timbre / Preset</span>
              </div>
              
              {/* Presets Select */}
              <div className="grid grid-cols-2 gap-1 mb-2.5">
                {[
                  { id: 'classic-piano', name: 'Piano Clásico' },
                  { id: 'electric-piano', name: 'Piano Eléctrico' },
                  { id: 'organ', name: 'Órgano' },
                  { id: 'synth-lead', name: 'Lead 80s' },
                  { id: 'retro-8bit', name: '8-Bit Retro' },
                  { id: 'warm-pad', name: 'Pad Cálido' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectPreset(item.id as InstrumentPreset)}
                    className={`px-2 py-1 text-[11px] font-medium rounded text-left transition-all ${
                      preset === item.id 
                        ? 'bg-sky-500 text-slate-950 font-bold shadow-sm' 
                        : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Waveform Selection */}
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">Oscilador Base:</div>
              <div className="grid grid-cols-4 gap-1">
                {(['sine', 'triangle', 'sawtooth', 'square'] as WaveformType[]).map((w) => (
                  <button
                    key={w}
                    onClick={() => handleSelectWaveform(w)}
                    className={`py-1 text-[10px] font-semibold rounded text-center transition-all ${
                      waveform === w
                        ? 'bg-sky-400/20 text-sky-300 border border-sky-400/50'
                        : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {w === 'sine' ? 'Seno' : w === 'triangle' ? 'Triang' : w === 'sawtooth' ? 'Sierra' : 'Cuad'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Module 2: Master Volume & Transposition */}
          <div className="bg-slate-900/60 border border-slate-800/70 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-sky-400" /> Dinámica</span>
                <span className="text-sky-400 font-mono text-[11px]">{isMuted ? 'Silenciado' : `${Math.round(volume * 100)}%`}</span>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 mb-3">
                <button 
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Octave Transposition */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Transposición de Octava</span>
                <span className="font-mono text-sky-400 font-bold">
                  {octaveShift > 0 ? `+${octaveShift}` : octaveShift} Oct
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[-2, -1, 0, 1, 2].map((shift) => (
                  <button
                    key={shift}
                    onClick={() => handleOctaveShift(shift)}
                    className={`flex-1 py-1 text-xs font-mono rounded transition-colors ${
                      octaveShift === shift
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {shift > 0 ? `+${shift}` : shift}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Module 3: ADSR Envelopes & Tone */}
          <div className="bg-slate-900/60 border border-slate-800/70 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-sky-400" /> Envolvente ADSR</span>
            </div>

            {/* Attack Slider */}
            <div className="mb-2">
              <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                <span>Ataque (Attack)</span>
                <span className="font-mono text-sky-400 text-[10px]">{Math.round(attack * 1000)} ms</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.4"
                step="0.005"
                value={attack}
                onChange={(e) => handleAttackChange(parseFloat(e.target.value))}
                className="w-full accent-sky-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Release Slider */}
            <div className="mb-2">
              <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                <span>Caída (Release)</span>
                <span className="font-mono text-sky-400 text-[10px]">{release.toFixed(2)} s</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="2.0"
                step="0.05"
                value={release}
                onChange={(e) => handleReleaseChange(parseFloat(e.target.value))}
                className="w-full accent-sky-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Filter Cutoff */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                <span>Filtro Pasa-Bajos</span>
                <span className="font-mono text-sky-400 text-[10px]">{Math.round(filterCutoff)} Hz</span>
              </div>
              <input
                type="range"
                min="400"
                max="14000"
                step="100"
                value={filterCutoff}
                onChange={(e) => handleCutoffChange(parseFloat(e.target.value))}
                className="w-full accent-sky-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Module 4: Sustain Pedal & Display Options */}
          <div className="bg-slate-900/60 border border-slate-800/70 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <span>Pedal y Etiquetas</span>
            </div>

            {/* Sustain Pedal Button */}
            <button
              onClick={toggleSustain}
              className={`w-full py-2.5 px-3 rounded-lg border font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                sustain
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-amber-500/20 ring-2 ring-amber-500/40'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${sustain ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
              <span>Pedal Sustain: <strong>{sustain ? 'ON' : 'OFF'}</strong></span>
              <span className="text-[10px] text-slate-400 font-mono">[Espacio]</span>
            </button>

            {/* Note Display Configuration */}
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Nomenclatura:</span>
                <div className="flex rounded overflow-hidden border border-slate-800 text-[10px]">
                  <button
                    onClick={() => setNoteNaming('es')}
                    className={`px-2 py-0.5 ${noteNaming === 'es' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}
                  >
                    Do-Re-Mi
                  </button>
                  <button
                    onClick={() => setNoteNaming('en')}
                    className={`px-2 py-0.5 ${noteNaming === 'en' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}
                  >
                    C-D-E
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Etiquetas:</span>
                <select
                  value={keyLabelMode}
                  onChange={(e) => setKeyLabelMode(e.target.value as typeof keyLabelMode)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-1.5 py-0.5 text-[10px]"
                >
                  <option value="both">Notas y Teclas</option>
                  <option value="notes">Solo Notas</option>
                  <option value="shortcuts">Solo Teclas PC</option>
                  <option value="none">Sin Texto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Module 5: Oscilloscope in Real-Time */}
          <div className="bg-slate-900/60 border border-slate-800/70 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-sky-400" /> Osciloscopio</span>
              <span className="text-[10px] text-emerald-400 font-mono">EN VIVO</span>
            </div>

            <div className="w-full h-16 bg-[#0b0e14] border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center relative">
              <canvas
                ref={canvasRef}
                width={260}
                height={64}
                className="w-full h-full block"
              />
              {activeMidiNotes.size === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600 font-mono pointer-events-none">
                  Presiona una tecla...
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 text-center font-mono mt-1">
              Frecuencia y Amplitud de Onda
            </div>
          </div>

        </div>
      </section>

      {/* Octave Quick Jump & Zoom Bar */}
      <div className="w-full max-w-7xl mt-4 flex items-center justify-between gap-2 flex-wrap px-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 mr-1">Navegar octavas:</span>
          {[
            { oct: 2, label: 'C2 Bajo' },
            { oct: 3, label: 'C3 Medio-Bajo' },
            { oct: 4, label: 'C4 Central (Teclado PC)' },
            { oct: 5, label: 'C5 Agudos' },
          ].map((item) => (
            <button
              key={item.oct}
              onClick={() => scrollToOctave(item.oct)}
              className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-md text-xs transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Zoom Mode */}
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span>Vista:</span>
          <button
            onClick={() => setZoomLevel('normal')}
            className={`px-2 py-0.5 rounded text-[11px] ${zoomLevel === 'normal' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}
          >
            Estándar (Scroll)
          </button>
          <button
            onClick={() => setZoomLevel('compact')}
            className={`px-2 py-0.5 rounded text-[11px] ${zoomLevel === 'compact' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}
          >
            Compacta
          </button>
          <button
            onClick={() => setZoomLevel('fit')}
            className={`px-2 py-0.5 rounded text-[11px] ${zoomLevel === 'fit' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}
          >
            Ajustar
          </button>
        </div>
      </div>

      {/* Piano Chassis Container (Authentic Instrument Case) */}
      <main className="w-full max-w-7xl mt-2 bg-[#0d0f15] border-2 border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden">
        
        {/* Felt Red Strip (Acoustic Damper Strip on real pianos) */}
        <div className="w-full h-2.5 bg-gradient-to-r from-red-950 via-red-600 to-red-950 rounded-t-sm shadow-inner mb-1 border-b border-red-900" />

        {/* Horizontal Scroll Area */}
        <div 
          ref={scrollContainerRef}
          className="w-full overflow-x-auto overflow-y-hidden pb-3 pt-1 scroll-smooth touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Piano Key Bed (Absolute + Relative placement for genuine piano geometry) */}
          <div 
            className="relative flex mx-auto w-max select-none py-1 px-2"
            onMouseDown={() => { mouseIsDownRef.current = true; }}
            onTouchStart={(e) => {
              // Multitouch chord support
              for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                const key = el?.closest('[data-midi]') as HTMLElement;
                if (key) {
                  const midi = parseInt(key.dataset.midi || '', 10);
                  activeTouchesRef.current.set(touch.identifier, midi);
                  handleNoteOn(midi);
                }
              }
            }}
            onTouchMove={(e) => {
              for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const prevMidi = activeTouchesRef.current.get(touch.identifier);
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                const key = el?.closest('[data-midi]') as HTMLElement;
                const currMidi = key ? parseInt(key.dataset.midi || '', 10) : null;

                if (currMidi !== prevMidi) {
                  if (prevMidi) handleNoteOff(prevMidi);
                  if (currMidi) {
                    activeTouchesRef.current.set(touch.identifier, currMidi);
                    handleNoteOn(currMidi);
                  } else {
                    activeTouchesRef.current.delete(touch.identifier);
                  }
                }
              }
            }}
            onTouchEnd={(e) => {
              for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const midi = activeTouchesRef.current.get(touch.identifier);
                if (midi) {
                  handleNoteOff(midi);
                  activeTouchesRef.current.delete(touch.identifier);
                }
              }
            }}
            onTouchCancel={(e) => {
              for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const midi = activeTouchesRef.current.get(touch.identifier);
                if (midi) {
                  handleNoteOff(midi);
                  activeTouchesRef.current.delete(touch.identifier);
                }
              }
            }}
          >
            {/* White Keys */}
            {currentNotes.filter((n) => !n.isBlack).map((note) => {
              const isActive = activeMidiNotes.has(note.midi);
              const displayName = noteNaming === 'es' ? note.noteNameEs : note.noteName;
              const isMiddleC = note.midi === 60;

              return (
                <div
                  key={note.midi}
                  id={`piano-key-${note.midi}`}
                  data-midi={note.midi}
                  onMouseDown={() => handleNoteOn(note.midi)}
                  onMouseUp={() => handleNoteOff(note.midi)}
                  onMouseEnter={() => {
                    if (mouseIsDownRef.current) handleNoteOn(note.midi);
                  }}
                  onMouseLeave={() => {
                    if (mouseIsDownRef.current) handleNoteOff(note.midi);
                  }}
                  className={`
                    relative flex-shrink-0 cursor-pointer flex flex-col justify-end items-center pb-3
                    border-x border-b border-slate-950 rounded-b-md transition-all duration-75
                    ${whiteKeyWidthClass}
                    ${
                      isActive
                        ? 'bg-gradient-to-b from-sky-100 via-sky-200 to-sky-300 translate-y-1 shadow-[inset_0_4px_8px_rgba(0,0,0,0.3),0_0_20px_rgba(56,189,248,0.5)] border-b-2'
                        : 'bg-gradient-to-b from-[#f5f6f8] via-[#ffffff] to-[#e4e7ec] shadow-[inset_0_2px_3px_rgba(255,255,255,0.9),0_5px_10px_rgba(0,0,0,0.5)] border-b-4 hover:bg-slate-50'
                    }
                  `}
                >
                  {/* Note Label */}
                  {(keyLabelMode === 'both' || keyLabelMode === 'notes') && (
                    <span className="text-[11px] font-bold text-slate-700 pointer-events-none">
                      {displayName}
                    </span>
                  )}

                  {/* Physical Keyboard Shortcut Badge */}
                  {(keyLabelMode === 'both' || keyLabelMode === 'shortcuts') && note.keyboardKey && (
                    <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded shadow-sm mt-1 pointer-events-none ${
                      isActive ? 'bg-sky-500 text-slate-950' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {note.keyboardKey}
                    </span>
                  )}

                  {/* Octave Marker (e.g. C3, C4) */}
                  {note.noteName === 'C' && (
                    <span className={`text-[9px] font-bold mt-1 pointer-events-none ${
                      isMiddleC ? 'text-blue-600 font-extrabold underline' : 'text-slate-400'
                    }`}>
                      C{note.octave} {isMiddleC && '• Medio'}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Black Keys (Positioned precisely overlapping the white keys) */}
            {currentNotes.filter((n) => n.isBlack).map((note) => {
              const isActive = activeMidiNotes.has(note.midi);
              const displayName = noteNaming === 'es' ? note.noteNameEs : note.noteName;
              
              // Exact horizontal position calculated by white key index
              const leftPos = (note.whiteKeyIndex * whiteKeyPixelWidth) + (whiteKeyPixelWidth - blackKeyOffset);

              return (
                <div
                  key={note.midi}
                  id={`piano-key-${note.midi}`}
                  data-midi={note.midi}
                  onMouseDown={() => handleNoteOn(note.midi)}
                  onMouseUp={() => handleNoteOff(note.midi)}
                  onMouseEnter={() => {
                    if (mouseIsDownRef.current) handleNoteOn(note.midi);
                  }}
                  onMouseLeave={() => {
                    if (mouseIsDownRef.current) handleNoteOff(note.midi);
                  }}
                  style={{ left: `${leftPos}px` }}
                  className={`
                    absolute top-0 z-20 cursor-pointer flex flex-col justify-end items-center pb-2.5
                    border-x border-b border-black rounded-b-sm transition-all duration-75
                    ${blackKeyWidthClass}
                    ${
                      isActive
                        ? 'bg-gradient-to-b from-sky-600 via-sky-500 to-sky-700 translate-y-1 shadow-[0_0_20px_rgba(56,189,248,0.8),inset_0_2px_4px_rgba(0,0,0,0.6)]'
                        : 'bg-gradient-to-b from-[#2a2f3a] via-[#161a22] to-[#090b0e] shadow-[2px_4px_10px_rgba(0,0,0,0.8),inset_1px_1px_1px_rgba(255,255,255,0.15)] border-b-4 hover:from-[#353b48]'
                    }
                  `}
                >
                  {/* Note Label */}
                  {(keyLabelMode === 'both' || keyLabelMode === 'notes') && (
                    <span className="text-[9px] font-semibold text-slate-300 pointer-events-none">
                      {displayName}
                    </span>
                  )}

                  {/* Physical Keyboard Shortcut Badge */}
                  {(keyLabelMode === 'both' || keyLabelMode === 'shortcuts') && note.keyboardKey && (
                    <span className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded mt-1 pointer-events-none ${
                      isActive ? 'bg-white text-slate-950' : 'bg-slate-700 text-sky-300'
                    }`}>
                      {note.keyboardKey}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Piano Bottom Lip / Bevel */}
        <div className="w-full h-3 bg-gradient-to-b from-[#0b0d13] to-[#151922] rounded-b-lg border-t border-slate-900 shadow-inner mt-1" />
      </main>

      {/* Keyboard Quick Help Footer */}
      <footer className="w-full max-w-7xl mt-4 px-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Teclado de computadora:</span>
          <span>Notas blancas: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-sky-400">A, S, D, F, G, H, J, K, L</code></span>
          <span>·</span>
          <span>Notas negras: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-sky-400">W, E, T, Y, U, O, P</code></span>
        </div>

        <div className="flex items-center gap-3">
          <span>Sustain: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-400">Espacio</code></span>
          <span>·</span>
          <span className="text-slate-500">Web Audio API Nativa (Sin Librerías)</span>
        </div>
      </footer>

      {/* Standalone Single-File HTML Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Código HTML Único Autónomo</h3>
                  <p className="text-xs text-slate-400">Todo el piano (HTML5 + CSS3 + JS nativo Web Audio API) en un solo archivo independiente</p>
                </div>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content / Preview */}
            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs bg-[#090b10] text-slate-300 border-b border-slate-800">
              <p className="text-slate-400 mb-2 font-sans text-xs">
                Este archivo contiene el 100% de la aplicación funcional, sin dependencias de Node, npm, React ni librerías de sonido. Puedes guardarlo en tu computadora y abrirlo con doble clic en Chrome, Firefox, Safari o Edge:
              </p>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto text-[11px] text-sky-300/90 leading-relaxed max-h-64">
                {getStandaloneHtml().slice(0, 1200)}
                {'\n... [más de 600 líneas de código completo de síntesis Web Audio API] ...'}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-950 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Archivo disponible en: <code className="text-sky-400">/public/piano.html</code>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyStandaloneHtml}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {hasCopiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Code className="w-4 h-4" />}
                  <span>{hasCopiedCode ? '¡Copiado al portapapeles!' : 'Copiar Código HTML'}</span>
                </button>

                <button
                  onClick={downloadStandaloneHtml}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-sky-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar piano.html</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
