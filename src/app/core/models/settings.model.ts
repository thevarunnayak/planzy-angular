export type ThemeName = 'blue' | 'pink' | 'lavender' | 'mint';

export interface AppSettings {
  theme: ThemeName;
  darkMode: boolean;
  soundEnabled: boolean;
  zenMusicEnabled?: boolean;
  confettiEnabled: boolean;
  autoSave: boolean;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  showMascotPoppi: boolean;
}
