import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled = true;

  zenMusicPlaying = signal<boolean>(false);
  private zenAudio: HTMLAudioElement | null = null;
  private zenOsc1: OscillatorNode | null = null;
  private zenOsc2: OscillatorNode | null = null;
  private zenGain: GainNode | null = null;

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  private initCtx(): AudioContext | null {
    if (!this.soundEnabled) return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  startZenMusic(): void {
    if (this.zenMusicPlaying()) return;

    // Try HTML Audio element for custom MP3: src/assets/audio/zen_music.mp3
    if (!this.zenAudio) {
      this.zenAudio = new Audio('assets/audio/zen_music.mp3');
      this.zenAudio.loop = true;
      this.zenAudio.volume = 0.5;
    }

    const playPromise = this.zenAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.zenMusicPlaying.set(true);
      }).catch(() => {
        // MP3 missing or blocked -> Fallback to Web Audio Ambient Drone Synth
        this.startWebAudioZenDrone();
      });
    } else {
      this.zenMusicPlaying.set(true);
    }
  }

  private startWebAudioZenDrone(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      this.zenGain = ctx.createGain();
      this.zenGain.gain.setValueAtTime(0.08, ctx.currentTime);

      this.zenOsc1 = ctx.createOscillator();
      this.zenOsc2 = ctx.createOscillator();

      this.zenOsc1.type = 'sine';
      this.zenOsc2.type = 'sine';

      // Warm soothing A440 harmonic drone (220Hz + 330Hz)
      this.zenOsc1.frequency.setValueAtTime(220, ctx.currentTime);
      this.zenOsc2.frequency.setValueAtTime(330, ctx.currentTime);

      this.zenOsc1.connect(this.zenGain);
      this.zenOsc2.connect(this.zenGain);
      this.zenGain.connect(ctx.destination);

      this.zenOsc1.start();
      this.zenOsc2.start();

      this.zenMusicPlaying.set(true);
    } catch {
      this.zenMusicPlaying.set(false);
    }
  }

  stopZenMusic(): void {
    if (this.zenAudio) {
      this.zenAudio.pause();
      this.zenAudio.currentTime = 0;
    }

    if (this.zenOsc1) {
      try { this.zenOsc1.stop(); } catch {}
      this.zenOsc1 = null;
    }

    if (this.zenOsc2) {
      try { this.zenOsc2.stop(); } catch {}
      this.zenOsc2 = null;
    }

    if (this.zenGain) {
      this.zenGain = null;
    }

    this.zenMusicPlaying.set(false);
  }

  toggleZenMusic(): void {
    if (this.zenMusicPlaying()) {
      this.stopZenMusic();
    } else {
      this.startZenMusic();
    }
  }

  playPop(): void {
    const ctx = this.initCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  playSuccessChime(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      const startTime = ctx.currentTime + idx * 0.07;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  playLevelUp(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startTime = ctx.currentTime + idx * 0.1;
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }
}
