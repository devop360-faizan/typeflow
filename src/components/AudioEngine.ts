class AudioEngine {
  private ctx: AudioContext | null = null;
  private volume: number = 0.4; // 0 to 1
  private soundType: 'mechanical' | 'retro' | 'beep' | 'muted' = 'mechanical';

  private initCtx() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  getVolume(): number {
    return this.volume;
  }

  setSoundType(type: 'mechanical' | 'retro' | 'beep' | 'muted') {
    this.soundType = type;
  }

  getSoundType(): 'mechanical' | 'retro' | 'beep' | 'muted' {
    return this.soundType;
  }

  playKey(isSpaceOrEnter = false) {
    if (this.soundType === 'muted' || this.volume === 0) return;
    
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const mainGain = this.ctx.createGain();
      mainGain.gain.setValueAtTime(this.volume, now);
      mainGain.connect(this.ctx.destination);

      if (this.soundType === 'mechanical') {
        // High click sound (Cherry MX switch tactility)
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(isSpaceOrEnter ? 1100 : 1600, now);
        
        clickGain.gain.setValueAtTime(0.25, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
        
        clickOsc.connect(clickGain);
        clickGain.connect(mainGain);
        clickOsc.start(now);
        clickOsc.stop(now + 0.015);

        // Low bottom out thud
        const thudOsc = this.ctx.createOscillator();
        const thudGain = this.ctx.createGain();
        thudOsc.type = 'sine';
        thudOsc.frequency.setValueAtTime(isSpaceOrEnter ? 85 : 120, now);
        thudOsc.frequency.exponentialRampToValueAtTime(55, now + 0.07);

        thudGain.gain.setValueAtTime(0.65, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        thudOsc.connect(thudGain);
        thudGain.connect(mainGain);
        thudOsc.start(now);
        thudOsc.stop(now + 0.08);
      } else if (this.soundType === 'retro') {
        // Retro typewriter: metallic click and resonance
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        clickOsc.type = 'sawtooth';
        clickOsc.frequency.setValueAtTime(isSpaceOrEnter ? 550 : 800, now);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isSpaceOrEnter ? 900 : 1400, now);
        filter.Q.setValueAtTime(4, now);

        clickGain.gain.setValueAtTime(0.35, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        clickOsc.connect(filter);
        filter.connect(clickGain);
        clickGain.connect(mainGain);
        clickOsc.start(now);
        clickOsc.stop(now + 0.04);

        if (isSpaceOrEnter) {
          // Retro carriage return bell sound
          const bellOsc = this.ctx.createOscillator();
          const bellGain = this.ctx.createGain();
          bellOsc.type = 'sine';
          bellOsc.frequency.setValueAtTime(987.77, now); // B5 note

          bellGain.gain.setValueAtTime(0.18, now);
          bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

          bellOsc.connect(bellGain);
          bellGain.connect(mainGain);
          bellOsc.start(now);
          bellOsc.stop(now + 0.3);
        } else {
          // Typewriter paper roll solid thud
          const paperOsc = this.ctx.createOscillator();
          const paperGain = this.ctx.createGain();
          paperOsc.type = 'triangle';
          paperOsc.frequency.setValueAtTime(220, now);

          paperGain.gain.setValueAtTime(0.3, now);
          paperGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

          paperOsc.connect(paperGain);
          paperGain.connect(mainGain);
          paperOsc.start(now);
          paperOsc.stop(now + 0.08);
        }
      } else if (this.soundType === 'beep') {
        const beepOsc = this.ctx.createOscillator();
        const beepGain = this.ctx.createGain();
        beepOsc.type = 'sine';
        beepOsc.frequency.setValueAtTime(isSpaceOrEnter ? 280 : 380, now);

        beepGain.gain.setValueAtTime(0.12, now);
        beepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        beepOsc.connect(beepGain);
        beepGain.connect(mainGain);
        beepOsc.start(now);
        beepOsc.stop(now + 0.08);
      }
    } catch (e) {
      console.warn("AudioEngine key click error:", e);
    }
  }

  playError() {
    if (this.soundType === 'muted' || this.volume === 0) return;
    
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const mainGain = this.ctx.createGain();
      mainGain.gain.setValueAtTime(this.volume * 0.7, now);
      mainGain.connect(this.ctx.destination);

      // Low pitch alert buzzer
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.12);

      oscGain.gain.setValueAtTime(0.25, now);
      oscGain.gain.linearRampToValueAtTime(0.001, now + 0.12);

      osc.connect(oscGain);
      oscGain.connect(mainGain);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn("AudioEngine error beep error:", e);
    }
  }
}

export const audioEngine = new AudioEngine();
