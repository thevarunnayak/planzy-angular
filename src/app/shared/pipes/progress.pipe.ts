import { Pipe, PipeTransform } from '@angular/core';
import { Subtask } from '../../core/models/task.model';

@Pipe({
  name: 'subtaskProgress',
  standalone: true
})
export class ProgressPipe implements PipeTransform {
  transform(subtasks?: Subtask[]): { completed: number; total: number; percentage: number } {
    if (!subtasks || subtasks.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    const completed = subtasks.filter(s => s.completed).length;
    const total = subtasks.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  }
}
