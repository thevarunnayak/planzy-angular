import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Achievement, UserXPState } from '../models/achievement.model';
import { StorageService } from '../services/storage.service';
import { ConfettiService } from '../services/confetti.service';
import { SoundService } from '../services/sound.service';
import { NotificationService } from '../services/notification.service';

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-1',
    title: '✨ First Steps',
    description: 'Create your very first task in Planzy',
    icon: '✨',
    unlocked: true,
    unlockedAt: new Date().toISOString(),
    progress: 1,
    maxProgress: 1,
    xpReward: 50
  },
  {
    id: 'ach-2',
    title: '🎉 Task Master',
    description: 'Complete 5 tasks on any board',
    icon: '🎉',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    xpReward: 150
  },
  {
    id: 'ach-3',
    title: '🔥 Streak Champion',
    description: 'Maintain a 3-day focus streak',
    icon: '🔥',
    unlocked: false,
    progress: 1,
    maxProgress: 3,
    xpReward: 200
  },
  {
    id: 'ach-4',
    title: '🎯 Sticker Master',
    description: 'Add cute stickers to 3 different tasks',
    icon: '🎯',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
    xpReward: 100
  },
  {
    id: 'ach-5',
    title: '🍅 Pomodoro Ninja',
    description: 'Complete 4 Pomodoro focus sessions',
    icon: '🍅',
    unlocked: false,
    progress: 0,
    maxProgress: 4,
    xpReward: 250
  }
];

@Injectable({
  providedIn: 'root'
})
export class AchievementStore {
  private storageService = inject(StorageService);
  private confettiService = inject(ConfettiService);
  private soundService = inject(SoundService);
  private notificationService = inject(NotificationService);

  achievements = signal<Achievement[]>([]);
  totalXP = signal<number>(120);

  userXPState = computed<UserXPState>(() => {
    const xp = this.totalXP();
    const level = Math.floor(xp / 100) + 1;
    const currentLevelXP = xp % 100;
    const nextLevelXP = 100;

    const titles: Record<number, string> = {
      1: 'Novice Planner ✨',
      2: 'Smart Organizer 📘',
      3: 'Productivity Star ⭐',
      4: 'Focus Wizard 🧙‍♂️',
      5: 'Planzy Master 👑'
    };

    return {
      currentXP: currentLevelXP,
      level,
      levelTitle: titles[level] || `Master Level ${level} ✨`,
      nextLevelXP
    };
  });

  unlockedCount = computed(() => {
    return this.achievements().filter(a => a.unlocked).length;
  });

  constructor() {
    const savedAch = this.storageService.getAchievements();
    if (savedAch && savedAch.length > 0) {
      this.achievements.set(savedAch);
    } else {
      this.achievements.set(INITIAL_ACHIEVEMENTS);
      this.storageService.saveAchievements(INITIAL_ACHIEVEMENTS);
    }

    const savedXP = this.storageService.getXP();
    if (savedXP !== null) {
      this.totalXP.set(savedXP);
    } else {
      this.storageService.saveXP(120);
    }

    effect(() => {
      this.storageService.saveAchievements(this.achievements());
      this.storageService.saveXP(this.totalXP());
    });
  }

  addXP(amount: number): void {
    const oldLevel = this.userXPState().level;
    this.totalXP.update(current => current + amount);
    const newLevel = this.userXPState().level;

    if (newLevel > oldLevel) {
      this.soundService.playLevelUp();
      this.confettiService.launchLevelUp();
      this.notificationService.success('LEVEL UP! 🎉', `Congratulations! You reached Level ${newLevel}: ${this.userXPState().levelTitle}`);
    }
  }

  updateProgress(achievementId: string, deltaProgress: number = 1): void {
    this.achievements.update(list => list.map(a => {
      if (a.id === achievementId && !a.unlocked) {
        const newProg = Math.min(a.maxProgress, a.progress + deltaProgress);
        const unlockedNow = newProg >= a.maxProgress;

        if (unlockedNow) {
          this.addXP(a.xpReward);
          this.notificationService.success('Achievement Unlocked! 🏆', `${a.icon} ${a.title}`);
          return { ...a, progress: newProg, unlocked: true, unlockedAt: new Date().toISOString() };
        }
        return { ...a, progress: newProg };
      }
      return a;
    }));
  }
}
