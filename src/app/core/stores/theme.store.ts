import { Injectable, signal, effect, inject } from '@angular/core';
import { ThemeName } from '../models/settings.model';
import { StorageService } from '../services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeStore {
  private storageService = inject(StorageService);

  theme = signal<ThemeName>('blue');
  darkMode = signal<boolean>(false);

  constructor() {
    const saved = this.storageService.getSettings();
    if (saved) {
      if (saved.theme && ['blue', 'pink', 'lavender', 'mint'].includes(saved.theme)) {
        this.theme.set(saved.theme);
      }
      if (typeof saved.darkMode === 'boolean') {
        this.darkMode.set(saved.darkMode);
      }
    }

    effect(() => {
      const currentTheme = this.theme();
      const isDark = this.darkMode();
      document.documentElement.setAttribute('data-theme', currentTheme);
      document.documentElement.setAttribute('data-mode', isDark ? 'dark' : 'light');
    });
  }

  setTheme(newTheme: ThemeName): void {
    this.theme.set(newTheme);
    this.save();
  }

  toggleDarkMode(): void {
    this.darkMode.update(d => !d);
    this.save();
  }

  private save(): void {
    const settings = this.storageService.getSettings() || {
      theme: this.theme(),
      darkMode: this.darkMode(),
      soundEnabled: true,
      zenMusicEnabled: true,
      confettiEnabled: true,
      autoSave: true,
      pomodoroWorkMinutes: 25,
      pomodoroBreakMinutes: 5,
      showMascotPoppi: true
    };
    settings.theme = this.theme();
    settings.darkMode = this.darkMode();
    this.storageService.saveSettings(settings);
  }
}
