import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../core/models/task.model';
import { RelativeDatePipe } from '../../../shared/pipes/relative-date.pipe';
import { ProgressPipe } from '../../../shared/pipes/progress.pipe';
import { PriorityBadgePipe } from '../../../shared/pipes/priority-badge.pipe';
import { TaskStore } from '../../../core/stores/task.store';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [
    CommonModule,
    RelativeDatePipe,
    ProgressPipe,
    PriorityBadgePipe,
    IconComponent
  ],
  template: `
    <div
      class="task-card glass-card"
      [class.completed]="task.columnId === 'done'"
      (click)="onClickCard()"
    >
      <div class="card-main-content">
        <!-- Optional Board Origin & Status Tag (For Starred Tasks view) -->
        @if (boardName) {
          <div class="board-origin-chip">
            <app-icon name="folder" [size]="12"></app-icon>
            <span class="origin-board-text">{{ boardName }}</span>
            <span class="origin-divider">•</span>
            <span class="origin-status-text" [class]="task.columnId">{{ columnName || task.columnId }}</span>
          </div>
        }

        <div class="card-header">
          <div class="sticker-tag">
            <app-icon name="bookmark" [size]="16"></app-icon>
          </div>

          <div class="header-right">
            @let badge = task.priority | priorityBadge;
            <span class="badge" [class]="badge.className">
              <app-icon [name]="getPriorityIconName(task.priority)" [size]="12"></app-icon>
              {{ badge.label }}
            </span>

            <button class="fav-btn" [class.active]="task.isFavorite" (click)="toggleFav($event)">
              <app-icon name="star" [size]="16"></app-icon>
            </button>
          </div>
        </div>

        <h4 class="card-title">{{ task.title }}</h4>

        <!-- Description -->
        @if (task.description) {
          <p class="card-desc">{{ task.description }}</p>
        }

        <!-- Labels Pills with Spacing -->
        @if (task.labels && task.labels.length > 0) {
          <div class="card-labels">
            @for (label of task.labels; track label) {
              <span class="label-chip">{{ label }}</span>
            }
          </div>
        }

        <!-- Subtask Progress Bar -->
        @if (task.subtasks && task.subtasks.length > 0) {
          @let prog = task.subtasks | subtaskProgress;
          <div class="progress-section">
            <div class="progress-bar-bg">
              <div class="progress-fill" [style.width.%]="prog.percentage"></div>
            </div>
            <span class="progress-text">{{ prog.completed }}/{{ prog.total }} subtasks</span>
          </div>
        }
      </div>

      <!-- Footer Info (Pinned to bottom so all cards match height) -->
      <div class="card-footer">
        <div class="footer-left">
          @if (task.dueDate) {
            <span class="due-date-pill">
              <app-icon name="clock" [size]="12"></app-icon>
              {{ task.dueDate | relativeDate }}
            </span>
          }
        </div>

        <div class="footer-meta">
          @if (task.comments && task.comments.length > 0) {
            <span class="meta-item">
              <app-icon name="comment" [size]="12"></app-icon>
              {{ task.comments.length }}
            </span>
          }
          @if (task.estimatedHours) {
            <span class="meta-item duration-pill" title="Estimated Duration">
              <app-icon name="clock" [size]="12"></app-icon>
              {{ task.estimatedHours }}h
            </span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .task-card {
      padding: 16px;
      background: var(--surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      min-height: 150px;
      cursor: pointer;
      user-select: none;
      position: relative;
      border: 2px solid var(--border);
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;

      &:hover {
        transform: translateY(-2px);
        border-color: var(--primary);
        box-shadow: var(--shadow-md);
      }

      &.completed {
        opacity: 0.75;
        .card-title {
          text-decoration: line-through;
        }
      }
    }

    .board-origin-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--text-muted);
      background: var(--background);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      margin-bottom: 6px;
      width: fit-content;

      .origin-board-text {
        color: var(--primary);
      }

      .origin-divider {
        opacity: 0.5;
      }

      .origin-status-text {
        text-transform: capitalize;
        &.todo { color: #3A86FF; }
        &.in_progress { color: #8ECAE6; }
        &.done { color: #38B000; }
      }
    }

    .card-main-content {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .sticker-tag {
      color: var(--primary);
      display: flex;
      align-items: center;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .fav-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: transform 0.2s ease;

      &:hover { transform: scale(1.15); }
      &.active { color: #FFC107; }
    }

    .card-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--text);
      line-height: 1.35;
    }

    .card-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin: 2px 0;
    }

    .card-labels {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px; /* Spacing below label pills */
    }

    .label-chip {
      background: var(--background);
      border: 1.5px solid var(--border);
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text);
    }

    .progress-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 6px;
    }

    .progress-bar-bg {
      height: 6px;
      background: var(--background);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--secondary), var(--primary));
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 10px;
      border-top: 1.5px solid var(--border);
      gap: 8px;
    }

    .footer-left {
      display: flex;
      align-items: center;
    }

    .due-date-pill {
      font-size: 0.74rem;
      font-weight: 800;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--primary-light);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
    }

    .footer-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;

      .meta-item {
        font-size: 0.74rem;
        font-weight: 800;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 4px;

        &.duration-pill {
          background: var(--background);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          color: var(--text);
        }
      }
    }
  `]
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Input() boardName?: string;
  @Input() columnName?: string;
  @Output() selectCard = new EventEmitter<Task>();

  private taskStore = inject(TaskStore);

  getPriorityIconName(priority: string): 'alert' | 'flame' | 'zap' | 'bookmark' {
    switch (priority) {
      case 'urgent': return 'alert';
      case 'high': return 'flame';
      case 'medium': return 'zap';
      default: return 'bookmark';
    }
  }

  onClickCard(): void {
    this.selectCard.emit(this.task);
  }

  toggleFav(event: MouseEvent): void {
    event.stopPropagation();
    this.taskStore.toggleFavorite(this.task.id);
  }
}
