export class AudioManager {
  private audioContext: AudioContext | null = null;
  private backgroundMusic: HTMLAudioElement | null = null;
  private soundEffects: Map<string, HTMLAudioElement> = new Map();
  private musicVolume = 0.3;
  private sfxVolume = 0.5;
  private isMuted = false;

  constructor() {
    this.initializeAudio();
  }

  private initializeAudio() {
    try {
      // Initialize AudioContext for better audio management
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create background music (placeholder - will use generated tones)
      this.backgroundMusic = this.createBackgroundMusic();
      
      // Preload sound effects
      this.preloadSoundEffects();
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  private createBackgroundMusic(): HTMLAudioElement {
    // Create a simple background music using generated tones
    const audio = new Audio();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Generate a simple melody using data URL
    const melody = this.generateMelodyDataURL();
    audio.src = melody;
    audio.loop = true;
    audio.volume = this.musicVolume;
    
    return audio;
  }

  private generateMelodyDataURL(): string {
    // Create a simple 8-bit style melody data
    // This is a simplified approach - in a real game you'd use actual audio files
    const sampleRate = 44100;
    const duration = 10; // 10 seconds loop
    const samples = sampleRate * duration;
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);
    
    // Generate simple melody
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const freq1 = 261.63 + Math.sin(t * 0.5) * 50; // C note with vibrato
      const freq2 = 329.63 + Math.sin(t * 0.3) * 30; // E note with vibrato
      const sample = (Math.sin(2 * Math.PI * freq1 * t) * 0.3 + 
                     Math.sin(2 * Math.PI * freq2 * t) * 0.2) * 32767;
      view.setInt16(44 + i * 2, sample, true);
    }
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  private preloadSoundEffects() {
    const effects = [
      'deploy', 'attack', 'damage', 'destroy', 'victory', 'defeat', 'spell',
      'tower_hit', 'unit_spawn', 'card_select', 'button_click'
    ];
    
    effects.forEach(effect => {
      const audio = this.generateSoundEffect(effect);
      this.soundEffects.set(effect, audio);
    });
  }

  private generateSoundEffect(type: string): HTMLAudioElement {
    const audio = new Audio();
    let dataURL = '';
    
    switch (type) {
      case 'deploy':
        dataURL = this.generateTone(800, 0.2, 'sawtooth');
        break;
      case 'attack':
        dataURL = this.generateTone(400, 0.1, 'square');
        break;
      case 'damage':
        dataURL = this.generateTone(200, 0.15, 'sawtooth');
        break;
      case 'destroy':
        dataURL = this.generateExplosion();
        break;
      case 'victory':
        dataURL = this.generateVictorySound();
        break;
      case 'defeat':
        dataURL = this.generateDefeatSound();
        break;
      case 'spell':
        dataURL = this.generateTone(1200, 0.3, 'sine');
        break;
      case 'tower_hit':
        dataURL = this.generateTone(300, 0.2, 'square');
        break;
      case 'unit_spawn':
        dataURL = this.generateTone(600, 0.15, 'triangle');
        break;
      case 'card_select':
        dataURL = this.generateTone(1000, 0.1, 'sine');
        break;
      case 'button_click':
        dataURL = this.generateTone(800, 0.05, 'square');
        break;
      default:
        dataURL = this.generateTone(440, 0.1, 'sine');
    }
    
    audio.src = dataURL;
    audio.volume = this.sfxVolume;
    return audio;
  }

  private generateTone(frequency: number, duration: number, type: OscillatorType = 'sine'): string {
    const sampleRate = 44100;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    
    // WAV header (same as before)
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);
    
    // Generate tone based on type
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
          break;
        case 'sawtooth':
          sample = 2 * (frequency * t - Math.floor(frequency * t + 0.5));
          break;
        case 'triangle':
          sample = 2 * Math.abs(2 * (frequency * t - Math.floor(frequency * t + 0.5))) - 1;
          break;
      }
      
      // Apply envelope (fade in/out)
      const envelope = Math.min(t * 10, 1) * Math.max((duration - t) * 10, 0);
      sample *= envelope * 0.3; // Reduce volume
      
      view.setInt16(44 + i * 2, sample * 32767, true);
    }
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  private generateExplosion(): string {
    const sampleRate = 44100;
    const duration = 0.5;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);
    
    // Generate explosion sound (noise with decreasing frequency)
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const freq = 800 * Math.exp(-t * 3); // Decreasing frequency
      const noise = (Math.random() - 0.5) * 2;
      const tone = Math.sin(2 * Math.PI * freq * t);
      const sample = (noise * 0.7 + tone * 0.3) * Math.exp(-t * 2);
      
      view.setInt16(44 + i * 2, sample * 32767, true);
    }
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  private generateVictorySound(): string {
    // Generate a triumphant melody
    return this.generateMelody([
      { freq: 523, duration: 0.2 }, // C5
      { freq: 659, duration: 0.2 }, // E5
      { freq: 784, duration: 0.2 }, // G5
      { freq: 1047, duration: 0.4 } // C6
    ]);
  }

  private generateDefeatSound(): string {
    // Generate a sad descending melody
    return this.generateMelody([
      { freq: 523, duration: 0.3 }, // C5
      { freq: 494, duration: 0.3 }, // B4
      { freq: 466, duration: 0.3 }, // Bb4
      { freq: 440, duration: 0.5 }  // A4
    ]);
  }

  private generateMelody(notes: Array<{ freq: number; duration: number }>): string {
    const sampleRate = 44100;
    const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0);
    const samples = Math.floor(sampleRate * totalDuration);
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);
    
    // Generate melody
    let currentSample = 0;
    notes.forEach(note => {
      const noteSamples = Math.floor(sampleRate * note.duration);
      for (let i = 0; i < noteSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.min(t * 20, 1) * Math.max((note.duration - t) * 5, 0);
        const sample = Math.sin(2 * Math.PI * note.freq * t) * envelope * 0.5;
        
        if (currentSample < samples) {
          view.setInt16(44 + currentSample * 2, sample * 32767, true);
          currentSample++;
        }
      }
    });
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  // Public methods
  playBackgroundMusic() {
    if (this.backgroundMusic && !this.isMuted) {
      this.backgroundMusic.currentTime = 0;
      this.backgroundMusic.play().catch(e => console.warn('Music play failed:', e));
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  playSoundEffect(type: string) {
    if (this.isMuted) return;
    
    const sound = this.soundEffects.get(type);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => console.warn(`Sound effect ${type} play failed:`, e));
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume;
    }
  }

  setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.soundEffects.forEach(sound => {
      sound.volume = this.sfxVolume;
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBackgroundMusic();
    } else {
      this.playBackgroundMusic();
    }
    return this.isMuted;
  }

  getMusicVolume() {
    return this.musicVolume;
  }

  getSFXVolume() {
    return this.sfxVolume;
  }

  isMusicMuted() {
    return this.isMuted;
  }

  // Cleanup
  dispose() {
    this.stopBackgroundMusic();
    this.soundEffects.forEach(sound => {
      if (sound.src.startsWith('blob:')) {
        URL.revokeObjectURL(sound.src);
      }
    });
    this.soundEffects.clear();
    
    if (this.backgroundMusic && this.backgroundMusic.src.startsWith('blob:')) {
      URL.revokeObjectURL(this.backgroundMusic.src);
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Global audio manager instance
export const audioManager = new AudioManager();