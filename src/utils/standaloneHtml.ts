export function getStandaloneHtml(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Piano Web Audio API - 4 Octavas</title>
  <style>
    :root {
      --bg-dark: #0f1117;
      --panel-bg: #161922;
      --panel-border: #232836;
      --accent-color: #38bdf8;
      --accent-hover: #0284c7;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --white-key-w: 48px;
      --white-key-h: 220px;
      --black-key-w: 30px;
      --black-key-h: 138px;
    }

    * {
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      overflow-x: hidden;
    }

    .app-header {
      width: 100%;
      max-width: 1440px;
      margin-bottom: 16px;
      text-align: center;
    }

    .app-title {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .app-subtitle {
      color: var(--text-muted);
      font-size: 13px;
      margin-top: 4px;
    }

    /* Top Control Panel */
    .control-panel {
      width: 100%;
      max-width: 1440px;
      background: var(--panel-bg);
      border: 1px solid var(--panel-border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .control-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 600;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
    }

    .control-value {
      color: var(--accent-color);
      font-family: monospace;
    }

    /* Waveform Buttons */
    .btn-group {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      background: #0b0d13;
      padding: 4px;
      border-radius: 8px;
      border: 1px solid var(--panel-border);
    }

    .wave-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 8px 4px;
      font-size: 12px;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .wave-btn:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.05);
    }

    .wave-btn.active {
      background: var(--accent-color);
      color: #0b0d13;
      font-weight: 700;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.35);
    }

    /* Sliders */
    input[type="range"] {
      -webkit-appearance: none;
      width: 100%;
      height: 6px;
      background: #0b0d13;
      border-radius: 3px;
      outline: none;
      margin: 8px 0;
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--accent-color);
      cursor: pointer;
      box-shadow: 0 0 8px rgba(56, 189, 248, 0.5);
      border: 2px solid #ffffff;
      transition: transform 0.1s;
    }

    input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.15);
    }

    /* Oscilloscope canvas */
    .scope-box {
      background: #090b10;
      border: 1px solid #1a202c;
      border-radius: 8px;
      height: 60px;
      width: 100%;
      overflow: hidden;
    }

    .scope-box canvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    /* Toggle Buttons */
    .toggle-btn {
      background: #0b0d13;
      border: 1px solid var(--panel-border);
      color: var(--text-muted);
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 38px;
    }

    .toggle-btn.active {
      background: rgba(56, 189, 248, 0.15);
      border-color: var(--accent-color);
      color: var(--accent-color);
    }

    /* Piano Container */
    .piano-wrapper {
      width: 100%;
      max-width: 1440px;
      background: #08090d;
      border-radius: 16px;
      border: 2px solid #232838;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.05);
      padding: 16px 12px 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .piano-header-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 8px;
    }

    .felt-strip {
      height: 8px;
      background: linear-gradient(90deg, #991b1b, #dc2626, #991b1b);
      border-radius: 2px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.5);
      margin-bottom: 2px;
    }

    .piano-scroll-container {
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 8px;
      touch-action: pan-x;
      scroll-behavior: smooth;
    }

    .piano-scroll-container::-webkit-scrollbar {
      height: 8px;
    }

    .piano-scroll-container::-webkit-scrollbar-track {
      background: #0b0e14;
      border-radius: 4px;
    }

    .piano-scroll-container::-webkit-scrollbar-thumb {
      background: #232a3b;
      border-radius: 4px;
    }

    .piano-scroll-container::-webkit-scrollbar-thumb:hover {
      background: #333d54;
    }

    .piano-bed {
      position: relative;
      display: flex;
      margin: 0 auto;
      width: max-content;
      padding: 0 4px;
      user-select: none;
    }

    /* White Keys */
    .white-key {
      position: relative;
      width: var(--white-key-w);
      height: var(--white-key-h);
      background: linear-gradient(to bottom, #edeef2 0%, #fdfdfd 80%, #e1e3e8 100%);
      border: 1px solid #11141a;
      border-bottom-width: 4px;
      border-radius: 0 0 6px 6px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      padding-bottom: 12px;
      box-shadow: inset 0 2px 2px rgba(255,255,255,0.8), 0 4px 6px rgba(0,0,0,0.4);
      transition: background 0.05s ease, transform 0.05s ease;
      touch-action: none;
    }

    .white-key:hover {
      background: linear-gradient(to bottom, #f3f4f8 0%, #ffffff 85%, #d9dce3 100%);
    }

    .white-key.active {
      background: linear-gradient(to bottom, #dbeafe 0%, #bfdbfe 100%) !important;
      box-shadow: inset 0 3px 6px rgba(0,0,0,0.3), 0 0 16px rgba(56, 189, 248, 0.4);
      transform: translateY(2px);
      border-bottom-width: 2px;
    }

    /* Black Keys */
    .black-key {
      position: absolute;
      top: 0;
      width: var(--black-key-w);
      height: var(--black-key-h);
      background: linear-gradient(to bottom, #2b303c 0%, #15181f 70%, #090b0e 100%);
      border: 1px solid #000000;
      border-bottom: 3px solid #06070a;
      border-radius: 0 0 4px 4px;
      cursor: pointer;
      z-index: 10;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      padding-bottom: 10px;
      box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.6), inset 1px 1px 1px rgba(255, 255, 255, 0.15);
      transition: background 0.05s ease, transform 0.05s ease;
      touch-action: none;
    }

    .black-key:hover {
      background: linear-gradient(to bottom, #383e4d 0%, #1c202a 70%, #0d0f14 100%);
    }

    .black-key.active {
      background: linear-gradient(to bottom, #0284c7 0%, #0369a1 100%) !important;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.7), inset 0 2px 4px rgba(0,0,0,0.5);
      transform: translateY(2px);
    }

    /* Key Label Badges */
    .key-note {
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      pointer-events: none;
    }

    .black-key .key-note {
      color: #94a3b8;
      font-size: 9px;
    }

    .key-shortcut {
      margin-top: 4px;
      font-size: 10px;
      font-weight: 800;
      background: #e2e8f0;
      color: #1e293b;
      padding: 1px 5px;
      border-radius: 3px;
      pointer-events: none;
      box-shadow: 0 1px 2px rgba(0,0,0,0.15);
    }

    .black-key .key-shortcut {
      background: #334155;
      color: #38bdf8;
      box-shadow: none;
    }

    .white-key.active .key-shortcut {
      background: #38bdf8;
      color: #0b0d13;
    }

    .octave-marker {
      font-size: 10px;
      font-weight: 800;
      color: #dc2626;
      margin-top: 2px;
      pointer-events: none;
    }

    /* Quick Octave Selector */
    .octave-nav {
      display: flex;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .octave-nav-btn {
      background: #161922;
      border: 1px solid var(--panel-border);
      color: var(--text-muted);
      padding: 6px 12px;
      font-size: 12px;
      border-radius: 6px;
      cursor: pointer;
    }

    .octave-nav-btn:hover {
      color: var(--text-main);
      border-color: var(--accent-color);
    }

    @media (max-width: 768px) {
      :root {
        --white-key-w: 42px;
        --white-key-h: 180px;
        --black-key-w: 26px;
        --black-key-h: 112px;
      }
    }
  </style>
</head>
<body>

  <header class="app-header">
    <h1 class="app-title">
      <span>🎹</span> Piano Web Audio API (4 Octavas: C2 - C6)
    </h1>
    <p class="app-subtitle">Síntesis pura con Web Audio API · Sin librerías externas · Multitáctil & Mapeo de Teclado Físico</p>
  </header>

  <!-- Panel Superior de Controles -->
  <section class="control-panel">
    <!-- Selector de Onda -->
    <div class="control-group">
      <div class="control-label">
        <span>Forma de Onda (Oscilador)</span>
        <span id="lblWaveform" class="control-value">Triangular</span>
      </div>
      <div class="btn-group">
        <button class="wave-btn" data-wave="sine">Senoide</button>
        <button class="wave-btn active" data-wave="triangle">Triang.</button>
        <button class="wave-btn" data-wave="sawtooth">Sierra</button>
        <button class="wave-btn" data-wave="square">Cuadrada</button>
      </div>
    </div>

    <!-- Volumen Maestro -->
    <div class="control-group">
      <div class="control-label">
        <span>Volumen Maestro</span>
        <span id="lblVolume" class="control-value">75%</span>
      </div>
      <input type="range" id="sliderVolume" min="0" max="1" step="0.01" value="0.75">
    </div>

    <!-- Transposición de Octava -->
    <div class="control-group">
      <div class="control-label">
        <span>Transposición</span>
        <span id="lblOctave" class="control-value">0 Octavas</span>
      </div>
      <input type="range" id="sliderOctave" min="-2" max="2" step="1" value="0">
    </div>

    <!-- Envolvente Release / Ataque -->
    <div class="control-group">
      <div class="control-label">
        <span>Sustain / Caída (Release)</span>
        <span id="lblRelease" class="control-value">0.35s</span>
      </div>
      <input type="range" id="sliderRelease" min="0.05" max="2.0" step="0.05" value="0.35">
    </div>

    <!-- Pedal Sustain & Oscilloscope -->
    <div class="control-group">
      <div class="control-label">
        <span>Pedal de Sustain</span>
        <span class="control-value">Espacio</span>
      </div>
      <button id="btnSustain" class="toggle-btn">
        <span>Pedal Sustain: <strong>DESACTIVADO</strong></span>
      </button>
    </div>

    <!-- Osciloscopio -->
    <div class="control-group" style="grid-column: span 1;">
      <div class="control-label">
        <span>Osciloscopio en Vivo</span>
        <span id="lblVoices" class="control-value">0 Notas</span>
      </div>
      <div class="scope-box">
        <canvas id="scopeCanvas" width="300" height="60"></canvas>
      </div>
    </div>
  </section>

  <!-- Navegador Rápido de Octavas -->
  <div class="octave-nav" style="margin-bottom: 12px;">
    <button class="octave-nav-btn" onclick="scrollToOctave(2)">Ir a Octava 2 (Bajos)</button>
    <button class="octave-nav-btn" onclick="scrollToOctave(3)">Ir a Octava 3</button>
    <button class="octave-nav-btn" onclick="scrollToOctave(4)">Ir a Octava 4 (Central A-K)</button>
    <button class="octave-nav-btn" onclick="scrollToOctave(5)">Ir a Octava 5 (Agudos)</button>
  </div>

  <!-- Teclado de Piano de 4 Octavas -->
  <main class="piano-wrapper">
    <div class="felt-strip"></div>
    <div class="piano-scroll-container" id="scrollContainer">
      <div class="piano-bed" id="pianoBed">
        <!-- Generado dinámicamente por JavaScript -->
      </div>
    </div>
  </main>

  <footer style="margin-top: 16px; color: var(--text-muted); font-size: 12px; text-align: center;">
    Toca las teclas con ratón, toque en pantalla o con el teclado físico: 
    <strong>[A, S, D, F, G, H, J]</strong> notas blancas · <strong>[W, E, T, Y, U]</strong> notas negras · <strong>[Espacio]</strong> pedal de sustain.
  </footer>

  <script>
    /* ==========================================================================
       PIANO CON WEB AUDIO API PURA (4 OCTAVAS: C2 a C6)
       ========================================================================== */

    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const NOTE_NAMES_ES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

    // Mapeo teclado físico solicitado:
    // Blancas: A, S, D, F, G, H, J, K, L...
    // Negras: W, E, T, Y, U, O, P...
    const KEY_TO_MIDI = {
      // Octava 4 (Central)
      'a': 60, // C4
      'w': 61, // C#4
      's': 62, // D4
      'e': 63, // D#4
      'd': 64, // E4
      'f': 65, // F4
      't': 66, // F#4
      'g': 67, // G4
      'y': 68, // G#4
      'h': 69, // A4
      'u': 70, // A#4
      'j': 71, // B4
      'k': 72, // C5
      'o': 73, // C#5
      'l': 74, // D5
      'p': 75, // D#5
      ';': 76, // E5
      "'": 77, // F5
    };

    // Invertir para mostrar letra en tecla
    const MIDI_TO_KEY = {};
    for (const [k, v] of Object.entries(KEY_TO_MIDI)) {
      MIDI_TO_KEY[v] = k.toUpperCase();
    }

    // Estado del Motor de Audio
    let audioCtx = null;
    let masterGain = null;
    let compressor = null;
    let analyser = null;
    let waveform = 'triangle';
    let masterVolume = 0.75;
    let octaveShift = 0;
    let attackTime = 0.015;
    let releaseTime = 0.35;
    let isSustain = false;

    // Voces activas polifónicas
    const activeVoices = new Map();
    const sustainedNotes = new Set();
    const physicalKeysHeld = new Set();

    function initAudio() {
      if (audioCtx) return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();

      // Compresor para evitar distorsión con acordes densos
      compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, audioCtx.currentTime);
      compressor.ratio.setValueAtTime(10, audioCtx.currentTime);

      // Ganancia Maestra
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(masterVolume, audioCtx.currentTime);

      // Analizador para Osciloscopio
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;

      compressor.connect(masterGain);
      masterGain.connect(analyser);
      analyser.connect(audioCtx.destination);

      startVisualizer();
    }

    function midiToFreq(midi, shift) {
      return 440 * Math.pow(2, (midi + shift * 12 - 69) / 12);
    }

    function playNote(midi) {
      initAudio();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      if (activeVoices.has(midi)) {
        stopVoice(midi, true);
      }
      sustainedNotes.delete(midi);

      const now = audioCtx.currentTime;
      const freq = midiToFreq(midi, octaveShift);

      const osc = audioCtx.createOscillator();
      osc.type = waveform;
      osc.frequency.setValueAtTime(freq, now);

      const gain = audioCtx.createGain();
      // Envolvente suave para evitar clicks / pops
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(1.0, now + attackTime);
      gain.gain.exponentialRampToValueAtTime(0.7, now + attackTime + 0.2);

      osc.connect(gain);
      gain.connect(compressor);
      osc.start(now);

      activeVoices.set(midi, { osc, gain });

      // Actualizar UI de tecla
      const keyElem = document.getElementById('key-' + midi);
      if (keyElem) keyElem.classList.add('active');
      updateVoicesCount();
    }

    function releaseNote(midi) {
      if (isSustain) {
        sustainedNotes.add(midi);
        return;
      }
      stopVoice(midi, false);
    }

    function stopVoice(midi, immediate) {
      const voice = activeVoices.get(midi);
      if (!voice || !audioCtx) return;

      const now = audioCtx.currentTime;
      const rel = immediate ? 0.04 : releaseTime;

      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), now);
      voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + rel);

      setTimeout(() => {
        try {
          voice.osc.stop();
          voice.osc.disconnect();
          voice.gain.disconnect();
        } catch(e) {}
      }, rel * 1000 + 30);

      activeVoices.delete(midi);

      const keyElem = document.getElementById('key-' + midi);
      if (keyElem) keyElem.classList.remove('active');
      updateVoicesCount();
    }

    function updateVoicesCount() {
      const el = document.getElementById('lblVoices');
      if (el) el.textContent = activeVoices.size + ' Notas';
    }

    /* Construcción del Teclado (4 Octavas: C2 a C6) */
    function buildPiano() {
      const bed = document.getElementById('pianoBed');
      bed.innerHTML = '';

      const startOctave = 2;
      const endOctave = 6;
      let whiteKeyIndex = 0;
      const whiteKeyWidth = 48; // px

      // Array para almacenar info de teclas negras y posicionarlas
      const blackKeysToPlace = [];

      for (let oct = startOctave; oct <= endOctave; oct++) {
        const maxNote = (oct === endOctave) ? 0 : 11;
        for (let i = 0; i <= maxNote; i++) {
          const midi = (oct + 1) * 12 + i;
          const noteName = NOTE_NAMES[i];
          const noteNameEs = NOTE_NAMES_ES[i];
          const isBlack = noteName.includes('#');
          const shortcut = MIDI_TO_KEY[midi] || '';

          if (!isBlack) {
            const key = document.createElement('div');
            key.className = 'white-key';
            key.id = 'key-' + midi;
            key.dataset.midi = midi;

            let inner = '<span class="key-note">' + noteNameEs + (noteName === 'C' ? ' ' + oct : '') + '</span>';
            if (shortcut) {
              inner += '<span class="key-shortcut">' + shortcut + '</span>';
            }
            if (noteName === 'C') {
              inner += '<span class="octave-marker">C' + oct + '</span>';
            }
            key.innerHTML = inner;

            bed.appendChild(key);
            whiteKeyIndex++;
          } else {
            // Guardar para colocar sobre la tecla blanca previa
            blackKeysToPlace.push({
              midi,
              noteName,
              noteNameEs,
              shortcut,
              left: (whiteKeyIndex * whiteKeyWidth) - 15,
            });
          }
        }
      }

      // Colocar teclas negras
      blackKeysToPlace.forEach(b => {
        const key = document.createElement('div');
        key.className = 'black-key';
        key.id = 'key-' + b.midi;
        key.dataset.midi = b.midi;
        key.style.left = b.left + 'px';

        let inner = '<span class="key-note">' + b.noteNameEs + '</span>';
        if (b.shortcut) {
          inner += '<span class="key-shortcut">' + b.shortcut + '</span>';
        }
        key.innerHTML = inner;

        bed.appendChild(key);
      });

      setupMouseAndTouch();
    }

    /* Manejadores de Ratón y Pantalla Táctil Multitáctil */
    function setupMouseAndTouch() {
      let isMouseDown = false;
      let currentMidiPlaying = null;

      window.addEventListener('mousedown', () => isMouseDown = true);
      window.addEventListener('mouseup', () => {
        isMouseDown = false;
        if (currentMidiPlaying !== null) {
          releaseNote(currentMidiPlaying);
          currentMidiPlaying = null;
        }
      });

      const bed = document.getElementById('pianoBed');

      // Click de ratón con soporte glissando
      bed.addEventListener('mousedown', (e) => {
        const key = e.target.closest('[data-midi]');
        if (key) {
          const midi = parseInt(key.dataset.midi, 10);
          currentMidiPlaying = midi;
          playNote(midi);
        }
      });

      bed.addEventListener('mouseover', (e) => {
        if (!isMouseDown) return;
        const key = e.target.closest('[data-midi]');
        if (key) {
          const midi = parseInt(key.dataset.midi, 10);
          if (currentMidiPlaying !== midi) {
            if (currentMidiPlaying !== null) releaseNote(currentMidiPlaying);
            currentMidiPlaying = midi;
            playNote(midi);
          }
        }
      });

      bed.addEventListener('mouseout', (e) => {
        if (!isMouseDown) return;
        const key = e.target.closest('[data-midi]');
        if (key && currentMidiPlaying === parseInt(key.dataset.midi, 10)) {
          releaseNote(currentMidiPlaying);
          currentMidiPlaying = null;
        }
      });

      // Multitáctil completo
      const activeTouches = new Map();

      bed.addEventListener('touchstart', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const el = document.elementFromPoint(touch.clientX, touch.clientY);
          const key = el ? el.closest('[data-midi]') : null;
          if (key) {
            const midi = parseInt(key.dataset.midi, 10);
            activeTouches.set(touch.identifier, midi);
            playNote(midi);
          }
        }
      }, { passive: false });

      bed.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const prevMidi = activeTouches.get(touch.identifier);
          const el = document.elementFromPoint(touch.clientX, touch.clientY);
          const key = el ? el.closest('[data-midi]') : null;
          const currentMidi = key ? parseInt(key.dataset.midi, 10) : null;

          if (currentMidi !== prevMidi) {
            if (prevMidi) releaseNote(prevMidi);
            if (currentMidi) {
              activeTouches.set(touch.identifier, currentMidi);
              playNote(currentMidi);
            } else {
              activeTouches.delete(touch.identifier);
            }
          }
        }
      }, { passive: false });

      const handleTouchEnd = (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const midi = activeTouches.get(touch.identifier);
          if (midi) {
            releaseNote(midi);
            activeTouches.delete(touch.identifier);
          }
        }
      };

      bed.addEventListener('touchend', handleTouchEnd, { passive: false });
      bed.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    }

    /* Mapeo Teclado Físico de Computadora */
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.repeat) return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggleSustain();
        return;
      }

      const key = e.key.toLowerCase();
      const midi = KEY_TO_MIDI[key];
      if (midi && !physicalKeysHeld.has(key)) {
        physicalKeysHeld.add(key);
        playNote(midi);
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (physicalKeysHeld.has(key)) {
        physicalKeysHeld.delete(key);
        const midi = KEY_TO_MIDI[key];
        if (midi) releaseNote(midi);
      }
    });

    /* Controles de UI */
    // Selector de Onda
    document.querySelectorAll('.wave-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.wave-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        waveform = btn.dataset.wave;
        const names = { sine: 'Senoide', triangle: 'Triangular', sawtooth: 'Sierra', square: 'Cuadrada' };
        document.getElementById('lblWaveform').textContent = names[waveform];
      });
    });

    // Volumen
    document.getElementById('sliderVolume').addEventListener('input', (e) => {
      masterVolume = parseFloat(e.target.value);
      document.getElementById('lblVolume').textContent = Math.round(masterVolume * 100) + '%';
      if (masterGain && audioCtx) {
        masterGain.gain.setTargetAtTime(masterVolume, audioCtx.currentTime, 0.02);
      }
    });

    // Transposición de Octava
    document.getElementById('sliderOctave').addEventListener('input', (e) => {
      octaveShift = parseInt(e.target.value, 10);
      const sign = octaveShift > 0 ? '+' : '';
      document.getElementById('lblOctave').textContent = sign + octaveShift + ' Octavas';
    });

    // Release
    document.getElementById('sliderRelease').addEventListener('input', (e) => {
      releaseTime = parseFloat(e.target.value);
      document.getElementById('lblRelease').textContent = releaseTime.toFixed(2) + 's';
    });

    // Sustain
    const btnSustain = document.getElementById('btnSustain');
    function toggleSustain() {
      isSustain = !isSustain;
      btnSustain.classList.toggle('active', isSustain);
      btnSustain.innerHTML = 'Pedal Sustain: <strong>' + (isSustain ? 'ACTIVADO' : 'DESACTIVADO') + '</strong>';
      if (!isSustain) {
        sustainedNotes.forEach(m => stopVoice(m, false));
        sustainedNotes.clear();
      }
    }
    btnSustain.addEventListener('click', toggleSustain);

    /* Navegación por scroll */
    function scrollToOctave(oct) {
      const key = document.getElementById('key-' + ((oct + 1) * 12));
      if (key) {
        key.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    }

    /* Osciloscopio */
    function startVisualizer() {
      const canvas = document.getElementById('scopeCanvas');
      const ctx = canvas.getContext('2d');
      const buffer = new Uint8Array(analyser.fftSize);

      function draw() {
        requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(buffer);

        ctx.fillStyle = '#090b10';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();

        const sliceWidth = canvas.width / buffer.length;
        let x = 0;

        for (let i = 0; i < buffer.length; i++) {
          const v = buffer[i] / 128.0;
          const y = (v * canvas.height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.stroke();
      }
      draw();
    }

    // Inicializar piano
    buildPiano();
  </script>
</body>
</html>`;
}
