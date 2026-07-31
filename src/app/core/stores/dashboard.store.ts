import { Injectable, computed, inject } from '@angular/core';
import { TaskStore } from './task.store';
import { BoardStore } from './board.store';
import { DashboardStats } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardStore {
  private taskStore = inject(TaskStore);
  private boardStore = inject(BoardStore);

  stats = computed<DashboardStats>(() => {
    const tasks = this.taskStore.tasks();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.columnId === 'done').length;
    const pendingTasks = totalTasks - completedTasks;

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter(t => t.columnId !== 'done' && t.dueDate && t.dueDate < todayStr).length;

    const productivityScore = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 100;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyActivity = days.map((day, idx) => {
      const dayTasks = tasks.filter(t => {
        const d = new Date(t.createdAt);
        return d.getDay() === idx;
      });
      return {
        day,
        completed: dayTasks.filter(t => t.columnId === 'done').length,
        created: dayTasks.length
      };
    });

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      productivityScore,
      currentStreakDays: 0,
      totalTimeTrackedHours: 0,
      weeklyActivity
    };
  });
}
