import { Pipe, PipeTransform } from '@angular/core';
import { TaskPriority } from '../../core/models/task.model';

@Pipe({
  name: 'priorityBadge',
  standalone: true
})
export class PriorityBadgePipe implements PipeTransform {
  transform(priority: TaskPriority): { label: string; icon: string; className: string } {
    switch (priority) {
      case 'urgent':
        return { label: 'Urgent', icon: 'alert', className: 'urgent' };
      case 'high':
        return { label: 'High', icon: 'flame', className: 'high' };
      case 'medium':
        return { label: 'Medium', icon: 'zap', className: 'medium' };
      case 'low':
        return { label: 'Low', icon: 'bookmark', className: 'low' };
      default:
        return { label: 'Normal', icon: 'bookmark', className: 'low' };
    }
  }
}
