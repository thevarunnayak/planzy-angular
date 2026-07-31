export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  xpReward: number;
}

export interface UserXPState {
  currentXP: number;
  level: number;
  levelTitle: string;
  nextLevelXP: number;
}
