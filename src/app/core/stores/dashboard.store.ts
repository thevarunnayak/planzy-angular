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
    const boards = this.boardStore.boards();
    const validBoardIds = new Set(boards.map(b => b.id));

    // Filter tasks so dashboard only counts tasks belonging to existing boards
    const tasks = this.taskStore.tasks().filter(t => validBoardIds.has(t.boardId));
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => {
      if (!t.columnId) return false;
      const lower = t.columnId.toLowerCase();
      return lower === 'done' || lower.includes('done') || lower.includes('achieved') || lower.includes('published');
    }).length;
    const pendingTasks = totalTasks - completedTasks;

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter(t => {
      const isDone = t.columnId && (t.columnId === 'done' || t.columnId.toLowerCase().includes('done'));
      return !isDone && t.dueDate && t.dueDate < todayStr;
    }).length;

    const productivityScore = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

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
