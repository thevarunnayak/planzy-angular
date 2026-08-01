import { Injectable } from '@angular/core';
import { Board } from '../models/board.model';
import { Task } from '../models/task.model';
import { AppSettings } from '../models/settings.model';
import { Achievement } from '../models/achievement.model';
import { MoodLog } from '../models/mood-pomodoro.model';

const STORAGE_KEYS = {
  BOARDS: 'planiq_boards_v2',
  TASKS: 'planiq_tasks_v2',
  SETTINGS: 'planiq_settings_v2',
  ACHIEVEMENTS: 'planiq_achievements_v2',
  MOODS: 'planiq_moods_v2',
  XP: 'planiq_user_xp_v2',
  VERSION: 'planiq_app_version'
};

const CURRENT_VERSION = '2.0.0';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() {
    this.checkMigration();
  }

  private checkMigration(): void {
    const version = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (!version || version !== CURRENT_VERSION) {
      // Purge all legacy v1 cached data so the user starts 100% clean
      localStorage.removeItem('planzy_boards_v1');
      localStorage.removeItem('planzy_tasks_v1');
      localStorage.removeItem('planzy_boards');
      localStorage.removeItem('planzy_tasks');
      localStorage.removeItem('planzy_settings_v1');
      localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    }
  }

  saveBoards(boards: Board[]): void {
    localStorage.setItem(STORAGE_KEYS.BOARDS, JSON.stringify(boards));
  }

  getBoards(): Board[] | null {
    const data = localStorage.getItem(STORAGE_KEYS.BOARDS);
    return data ? JSON.parse(data) : null;
  }

  saveTasks(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  getTasks(): Task[] | null {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    return data ? JSON.parse(data) : null;
  }

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  getSettings(): AppSettings | null {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : null;
  }

  saveAchievements(achievements: Achievement[]): void {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  }

  getAchievements(): Achievement[] | null {
    const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    return data ? JSON.parse(data) : null;
  }

  saveMoods(moods: MoodLog[]): void {
    localStorage.setItem(STORAGE_KEYS.MOODS, JSON.stringify(moods));
  }

  getMoods(): MoodLog[] | null {
    const data = localStorage.getItem(STORAGE_KEYS.MOODS);
    return data ? JSON.parse(data) : null;
  }

  saveXP(xp: number): void {
    localStorage.setItem(STORAGE_KEYS.XP, JSON.stringify(xp));
  }

  getXP(): number | null {
    const data = localStorage.getItem(STORAGE_KEYS.XP);
    return data ? JSON.parse(data) : null;
  }

  exportDataJSON(): string {
    const data = {
      version: CURRENT_VERSION,
      timestamp: new Date().toISOString(),
      boards: this.getBoards() || [],
      tasks: this.getTasks() || [],
      settings: this.getSettings() || {},
      achievements: this.getAchievements() || [],
      moods: this.getMoods() || [],
      xp: this.getXP() || 0
    };
    return JSON.stringify(data, null, 2);
  }

  importDataJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.boards) this.saveBoards(data.boards);
      if (data.tasks) this.saveTasks(data.tasks);
      if (data.settings) this.saveSettings(data.settings);
      if (data.achievements) this.saveAchievements(data.achievements);
      if (data.moods) this.saveMoods(data.moods);
      if (typeof data.xp === 'number') this.saveXP(data.xp);
      return true;
    } catch {
      return false;
    }
  }

  clearAllData(): void {
    localStorage.clear();
  }
}
