import { Injectable, signal, effect, inject } from '@angular/core';
import { AppSettings } from '../models/settings.model';
import { StorageService } from '../services/storage.service';
import { SoundService } from '../services/sound.service';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'blue',
  darkMode: false,
  soundEnabled: true,
  zenMusicEnabled: true,
  confettiEnabled: true,
  autoSave: true,
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  showMascotPoppi: true
};

@Injectable({
  providedIn: 'root'
})
export class SettingsStore {
  private storageService = inject(StorageService);
  private soundService = inject(SoundService);

  settings = signal<AppSettings>(DEFAULT_SETTINGS);

  constructor() {
    const saved = this.storageService.getSettings();
    if (saved) {
      this.settings.set({ ...DEFAULT_SETTINGS, ...saved });
    }

    effect(() => {
      const current = this.settings();
      this.soundService.setSoundEnabled(current.soundEnabled);
      this.storageService.saveSettings(current);
    });
  }

  updateSettings(partial: Partial<AppSettings>): void {
    this.settings.update(s => ({ ...s, ...partial }));
  }

  toggleSound(): void {
    this.settings.update(s => ({ ...s, soundEnabled: !s.soundEnabled }));
  }

  toggleZenMusic(): void {
    this.settings.update(s => ({ ...s, zenMusicEnabled: !s.zenMusicEnabled }));
  }

  toggleMascot(): void {
    this.settings.update(s => ({ ...s, showMascotPoppi: !s.showMascotPoppi }));
  }
}
