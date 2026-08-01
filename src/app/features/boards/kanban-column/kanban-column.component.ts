import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Column } from '../../../core/models/board.model';
import { Task } from '../../../core/models/task.model';
import { TaskCardComponent } from '../task-card/task-card.component';
import { BoardStore } from '../../../core/stores/board.store';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-kanban-column',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    TaskCardComponent,
    IconComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="kanban-column glass-card" [style.border-top-color]="column.color || 'var(--primary)'">
      <!-- Column Header -->
      <div class="column-header">
        <div class="header-left">
          <app-icon name="folder" [size]="16"></app-icon>
          <h3 class="column-title">{{ column.name }}</h3>
          <span class="count-badge">{{ tasks.length }}</span>
        </div>

        <div class="header-actions">
          <button class="icon-mini-btn" (click)="onAddCard()" title="Add Task">
            <app-icon name="plus" [size]="14"></app-icon>
          </button>
          <button class="icon-mini-btn danger" (click)="confirmDeleteModalOpen.set(true)" title="Delete Column">
            <app-icon name="trash" [size]="14"></app-icon>
          </button>
        </div>
      </div>

      <!-- Drop List Container -->
      <div
        cdkDropList
        [id]="column.id"
        [cdkDropListData]="tasks"
        [cdkDropListConnectedTo]="connectedColumnIds"
        (cdkDropListDropped)="onDrop($event)"
        class="cards-drop-list"
      >
        @for (task of tasks; track task.id) {
          <div cdkDrag [cdkDragData]="task" class="card-drag-wrapper">
            <app-task-card
              [task]="task"
              (selectCard)="selectCardRequested.emit($event)"
              (openComments)="openCommentsRequested.emit($event)"
            ></app-task-card>
          </div>
        } @empty {
          <div class="empty-column-placeholder">
            <span>No tasks in {{ column.name }}</span>
          </div>
        }
      </div>

      <button class="add-card-footer-btn" (click)="onAddCard()">
        <app-icon name="plus" [size]="14"></app-icon>
        <span>Add Task</span>
      </button>

      <!-- Custom Confirmation Modal for Deleting Column -->
      @if (confirmDeleteModalOpen()) {
        <app-confirm-dialog
          title="Delete Column?"
          [message]="'Are you sure you want to delete column &quot;' + column.name + '&quot;?'"
          confirmText="Delete Column"
          (confirmed)="deleteColumnConfirmed()"
          (cancelled)="confirmDeleteModalOpen.set(false)"
        ></app-confirm-dialog>
      }
    </div>
  `,
  styles: [`
    .kanban-column {
      width: 320px;
      min-width: 320px;
      background: var(--surface);
      border-radius: var(--radius-xl);
      border-top: 5px solid var(--primary);
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 220px);
      padding: 16px;
      gap: 14px;
    }

    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary);
    }

    .column-title {
      font-size: 1rem;
      font-weight: 800;
      color: var(--text);
    }

    .count-badge {
      background: var(--background);
      border: 1.5px solid var(--border);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: 0.72rem;
      font-weight: 900;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .icon-mini-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;

      &:hover {
        background: var(--surface-hover);
        color: var(--primary);
      }

      &.danger:hover {
        color: var(--danger);
      }
    }

    .cards-drop-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 120px;
      padding: 8px 6px 8px 4px;
    }

    .card-drag-wrapper {
      padding-top: 2px;
      padding-bottom: 2px;
    }

    .empty-column-placeholder {
      height: 100px;
      border: 2px dashed var(--border);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      font-size: 0.8rem;
      font-weight: 700;
    }

    .add-card-footer-btn {
      background: var(--background);
      border: 1.5px solid var(--border);
      padding: 10px;
      border-radius: var(--radius-lg);
      font-weight: 800;
      font-size: 0.82rem;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s ease;

      &:hover {
        background: var(--primary-light);
        border-color: var(--primary);
        color: var(--primary);
      }
    }

    @media (max-width: 576px) {
      .kanban-column {
        width: 275px;
        min-width: 275px;
        padding: 12px;
        gap: 10px;
      }
      .column-title {
        font-size: 0.92rem;
      }
    }
  `]
})
export class KanbanColumnComponent {
  @Input({ required: true }) column!: Column;
  @Input() tasks: Task[] = [];
  @Input() connectedColumnIds: string[] = [];

  @Output() cardDropped = new EventEmitter<CdkDragDrop<Task[]>>();
  @Output() selectCardRequested = new EventEmitter<Task>();
  @Output() addCardRequested = new EventEmitter<string>();
  @Output() openCommentsRequested = new EventEmitter<Task>();

  private boardStore = inject(BoardStore);

  confirmDeleteModalOpen = signal(false);

  onDrop(event: CdkDragDrop<Task[]>): void {
    this.cardDropped.emit(event);
  }

  onAddCard(): void {
    this.addCardRequested.emit(this.column.id);
  }

  deleteColumnConfirmed(): void {
    const activeBoard = this.boardStore.activeBoard();
    if (activeBoard) {
      this.boardStore.deleteColumn(activeBoard.id, this.column.id);
    }
    this.confirmDeleteModalOpen.set(false);
  }
}
