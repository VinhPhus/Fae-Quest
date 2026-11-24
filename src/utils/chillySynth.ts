/**
 * Web Audio API Engine tạo âm thanh Ambient thư giãn theo thời gian thực
 * Không phụ thuộc file ngoài, không lo lỗi bản quyền hay lỗi kết nối mạng.
 */

class ChillySynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isRunning = false;
  private currentType: 'ambient_pad' | 'rain_lofi' | null = null;
  private activeNodes: { stop?: () => void; disconnect: () => void }[] = [];
  private loopTimer: any = null;
  private volumeLevel = 0.8;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volumeLevel, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volumeLevel = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volumeLevel, this.ctx.currentTime, 0.05);
    }
  }

  public play(type: 'ambient_pad' | 'rain_lofi') {
    this.stop();
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.isRunning = true;
    this.currentType = type;

    if (type === 'ambient_pad') {
      this.startAmbientPad();
    } else {
      this.startRainLoFi();
    }
  }

  public stop() {
    this.isRunning = false;
    this.currentType = null;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    for (const node of this.activeNodes) {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch {}
    }
    this.activeNodes = [];
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }

  public getCurrentType() {
    return this.currentType;
  }

  /**
   * Soundscape 1: Afterglow Ambient Pad
   * Chuỗi hợp âm Fmaj7 -> Cmaj7 -> Am7 -> Gsus4 với bộ lọc Low-pass êm dịu
   */
  private startAmbientPad() {
    if (!this.ctx || !this.masterGain || !this.isRunning) return;

    // Các nốt tần số Hz cho vòng hòa âm
    // Fmaj7: F3 (174.61), A3 (220), C4 (261.63), E4 (329.63)
    // Cmaj7: C3 (130.81), E3 (164.81), G3 (196), B3 (246.94)
    // Am7:   A2 (110), C3 (130.81), E3 (164.81), G3 (196)
    // Gsus4: G2 (98), C3 (130.81), D3 (146.83), G3 (196)
    const chordProgression: number[][] = [
      [174.61, 220.00, 261.63, 329.63],
      [130.81, 164.81, 196.00, 246.94],
      [110.00, 130.81, 164.81, 196.00],
      [98.00, 130.81, 146.83, 196.00],
    ];

    let chordIdx = 0;
    const chordDuration = 6.0; // 6 giây một hợp âm

    const playChord = () => {
      if (!this.ctx || !this.masterGain || !this.isRunning) return;

      const chord = chordProgression[chordIdx % chordProgression.length];
      const now = this.ctx.currentTime;

      // Filter cho hợp âm
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, now);
      filter.frequency.linearRampToValueAtTime(560, now + chordDuration * 0.5);
      filter.frequency.linearRampToValueAtTime(350, now + chordDuration);
      filter.connect(this.masterGain);

      // Stereo Panner nếu có
      let destinationNode: AudioNode = filter;
      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime((chordIdx % 2 === 0 ? 0.2 : -0.2), now);
        panner.connect(filter);
        destinationNode = panner;
      }

      // Tạo các oscillator cho từng nốt trong hợp âm
      chord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        // Detune nhẹ để tạo độ ấm và chorus
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((idx - 1.5) * 5, now);

        // Attack & Release mượt mà
        oscGain.gain.setValueAtTime(0.001, now);
        oscGain.gain.linearRampToValueAtTime(0.08, now + 2.0);
        oscGain.gain.linearRampToValueAtTime(0.001, now + chordDuration);

        osc.connect(oscGain);
        oscGain.connect(destinationNode);

        osc.start(now);
        osc.stop(now + chordDuration + 0.1);

        this.activeNodes.push({
          stop: () => {
            try { osc.stop(); } catch {}
          },
          disconnect: () => {
            try {
              osc.disconnect();
              oscGain.disconnect();
            } catch {}
          },
        });
      });

      chordIdx++;
      if (this.isRunning) {
        this.loopTimer = setTimeout(playChord, (chordDuration - 0.5) * 1000);
      }
    };

    playChord();
  }

  /**
   * Soundscape 2: Midnight Rain Lo-Fi
   * Tiếng mưa đêm dịu êm kết hợp nốt Rhodes piano ấm áp
   */
  private startRainLoFi() {
    if (!this.ctx || !this.masterGain || !this.isRunning) return;

    // 1. Máy tạo tiếng mưa bằng White/Pink Noise Buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Thuật toán pink noise êm tai
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 2.5; // Gain bù
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.09, this.ctx.currentTime);

    whiteNoise.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(this.masterGain);

    whiteNoise.start();
    this.activeNodes.push({
      stop: () => { try { whiteNoise.stop(); } catch {} },
      disconnect: () => {
        try {
          whiteNoise.disconnect();
          rainFilter.disconnect();
          rainGain.disconnect();
        } catch {}
      },
    });

    // 2. Chuỗi nốt đàn lofi rơi nhẹ theo nhịp
    const lofiNotes = [261.63, 311.13, 392.00, 466.16, 523.25, 392.00, 311.13];
    let noteIdx = 0;

    const playLofiNote = () => {
      if (!this.ctx || !this.masterGain || !this.isRunning) return;

      const now = this.ctx.currentTime;
      const freq = lofiNotes[noteIdx % lofiNotes.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 3.0);

      this.activeNodes.push({
        stop: () => { try { osc.stop(); } catch {} },
        disconnect: () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {}
        },
      });

      noteIdx++;
      if (this.isRunning) {
        // Khoảng cách nhịp ngẫu nhiên tự nhiên kiểu lo-fi chill
        const delay = (1.8 + Math.random() * 1.4) * 1000;
        this.loopTimer = setTimeout(playLofiNote, delay);
      }
    };

    playLofiNote();
  }
}

export const chillySynth = new ChillySynthEngine();
