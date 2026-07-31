export interface WeeklyActivity {
  day: string; // e.g. 'Mon', 'Tue'
  completed: number;
  created: number;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  productivityScore: number;
  currentStreakDays: number;
  totalTimeTrackedHours: number;
  weeklyActivity: WeeklyActivity[];
}
