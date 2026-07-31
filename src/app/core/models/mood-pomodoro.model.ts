export type UserMood = 'happy' | 'focused' | 'energetic' | 'cozy' | 'tired';

export interface MoodLog {
  id: string;
  date: string;
  mood: UserMood;
  note?: string;
}

export interface PomodoroSession {
  id: string;
  date: string;
  durationMinutes: number;
  completed: boolean;
}
