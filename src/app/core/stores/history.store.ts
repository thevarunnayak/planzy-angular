import { Injectable, signal, computed } from '@angular/core';
import { Task } from '../models/task.model';
import { Board } from '../models/board.model';

export interface AppSnapshot {
  boards: Board[];
  tasks: Task[];
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class HistoryStore {
  private past = signal<AppSnapshot[]>([]);
  private future = signal<AppSnapshot[]>([]);

  canUndo = computed(() => this.past().length > 0);
  canRedo = computed(() => this.future().length > 0);

  pushSnapshot(boards: Board[], tasks: Task[]): void {
    const snapshot: AppSnapshot = {
      boards: JSON.parse(JSON.stringify(boards)),
      tasks: JSON.parse(JSON.stringify(tasks)),
      timestamp: new Date().toISOString()
    };
    this.past.update(stack => [...stack, snapshot]);
    this.future.set([]); // clear redo stack on new action
  }

  popUndo(): AppSnapshot | null {
    const p = this.past();
    if (p.length === 0) return null;

    const last = p[p.length - 1];
    this.past.update(stack => stack.slice(0, stack.length - 1));
    return last;
  }

  popRedo(): AppSnapshot | null {
    const f = this.future();
    if (f.length === 0) return null;

    const next = f[0];
    this.future.update(queue => queue.slice(1));
    return next;
  }
}
