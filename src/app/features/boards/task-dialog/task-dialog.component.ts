import { Component, Input, Output, EventEmitter, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, TaskPriority } from '../../../core/models/task.model';
import { TaskStore } from '../../../core/stores/task.store';
import { BoardStore } from '../../../core/stores/board.store';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { CustomSelectComponent, SelectOption } from '../../../shared/components/custom-select/custom-select.component';
import { CustomDatePickerComponent } from '../../../shared/components/custom-date-picker/custom-date-picker.component';
import { CustomNumberInputComponent } from '../../../shared/components/custom-number-input/custom-number-input.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    CustomSelectComponent,
    CustomDatePickerComponent,
    CustomNumberInputComponent,
    ConfirmDialogComponent
  ],
  template: `
    @if (targetBoardId) {
      <div class="modal-overlay bounce-in" (click)="onBackdropClick($event)">
        <div class="modal-card glass-card" (click)="$event.stopPropagation()">
          <!-- Fixed Modal Header -->
          <div class="modal-header">
            <div class="header-title-group">
              <app-icon name="bookmark" [size]="20"></app-icon>
              <h3>{{ isEditMode ? 'Edit Task Details' : 'Create New Task' }}</h3>
            </div>
            <button class="close-btn" (click)="closed.emit()">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          <!-- Scrollable Modal Body Form -->
          <form id="taskForm" (ngSubmit)="saveTask()" class="modal-form custom-scroll-body">
            <!-- Icon Tag Selection -->
            <div class="form-group">
              <label>Badge Tag</label>
              <div class="icon-picker">
                @for (st of availableIcons; track st) {
                  <button
                    type="button"
                    class="icon-opt-btn"
                    [class.selected]="sticker === st"
                    (click)="sticker = st"
                  >
                    <app-icon [name]="st" [size]="18"></app-icon>
                  </button>
                }
              </div>
            </div>

            <!-- Task Title -->
            <div class="form-group">
              <label>Task Title</label>
              <input
                type="text"
                class="form-input"
                placeholder="What needs to be done?"
                [(ngModel)]="title"
                name="title"
                required
                autofocus
              />
            </div>

            <!-- Description -->
            <div class="form-group">
              <label>Description</label>
              <textarea
                class="form-textarea"
                placeholder="Add details, links, or notes..."
                [(ngModel)]="description"
                name="description"
                rows="3"
              ></textarea>
            </div>

            <!-- Priority & Column Row -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Priority</label>
                <app-custom-select
                  [options]="priorityOptions"
                  [value]="priority"
                  (valueChange)="onPriorityChange($event)"
                ></app-custom-select>
              </div>

              <div class="form-group flex-1">
                <label>Column</label>
                <app-custom-select
                  [options]="columnOptions()"
                  [value]="columnId"
                  (valueChange)="columnId = $event"
                ></app-custom-select>
              </div>
            </div>

            <!-- Due Date & Est. Hours (Custom Number Input) -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Due Date</label>
                <app-custom-date-picker
                  [value]="dueDate"
                  (valueChange)="dueDate = $event"
                ></app-custom-date-picker>
              </div>

              <div class="form-group flex-1">
                <label>Est. Hours</label>
                <app-custom-number-input
                  [(value)]="estimatedHours"
                  [step]="0.5"
                  [min]="0.5"
                  placeholder="1.5"
                ></app-custom-number-input>
              </div>
            </div>

            <!-- Labels Input -->
            <div class="form-group">
              <label>Labels (Comma separated)</label>
              <input
                type="text"
                class="form-input"
                placeholder="e.g. Design, Frontend, Urgent"
                [ngModel]="labelsInput"
                (ngModelChange)="labelsInput = $event"
                name="labelsInput"
              />
            </div>
          </form>

          <!-- Fixed Modal Footer -->
          <div class="modal-footer">
            @if (isEditMode && task) {
              <button type="button" class="jelly-btn danger-btn margin-right-auto" (click)="confirmDeleteModalOpen.set(true)">
                <app-icon name="trash" [size]="14"></app-icon>
                <span>Delete</span>
              </button>
            }
            <button type="button" class="jelly-btn secondary" (click)="closed.emit()">Cancel</button>
            <button type="submit" form="taskForm" class="jelly-btn" [disabled]="!title.trim()">
              {{ isEditMode ? 'Save Task' : 'Create Task' }}
            </button>
          </div>
        </div>

        <!-- Custom Confirmation Dialog for Task Deletion -->
        @if (confirmDeleteModalOpen()) {
          <app-confirm-dialog
            title="Delete Task?"
            [message]="'Are you sure you want to delete task &quot;' + title + '&quot;?'"
            confirmText="Delete Task"
            (confirmed)="deleteTaskConfirmed()"
            (cancelled)="confirmDeleteModalOpen.set(false)"
          ></app-confirm-dialog>
        }
      </div>
    } @else {
      <!-- Interactive Confirmation Dialog Popup when 0 Boards Exist -->
      <app-confirm-dialog
        title="No Boards Available"
        message="You don't have any workspace boards created yet. Would you like to create a board first?"
        confirmText="Create a Board"
        cancelText="Cancel"
        [isDanger]="false"
        (confirmed)="redirectToCreateBoard()"
        (cancelled)="closed.emit()"
      ></app-confirm-dialog>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(18, 24, 36, 0.6);
      backdrop-filter: blur(4px);
      z-index: 2500;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .modal-card {
      width: 100%;
      max-width: 520px;
      padding: 24px 24px 20px 24px;
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-height: 85vh;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;

      .header-title-group {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--primary);
      }

      h3 { font-size: 1.25rem; font-weight: 900; color: var(--text); }
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow-y: auto;
      padding-right: 8px;
      padding-bottom: 8px;
      flex: 1;
    }

    /* Cute Inset Scrollbar */
    .custom-scroll-body::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scroll-body::-webkit-scrollbar-track {
      background: var(--background);
      border-radius: 999px;
    }
    .custom-scroll-body::-webkit-scrollbar-thumb {
      background: var(--secondary);
      border-radius: 999px;
    }
    .custom-scroll-body::-webkit-scrollbar-thumb:hover {
      background: var(--primary);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label { font-size: 0.8rem; font-weight: 800; color: var(--text-muted); }
    }

    .form-row {
      display: flex;
      gap: 14px;
    }

    .flex-1 { flex: 1; }

    .icon-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .icon-opt-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      background: var(--background);
      color: var(--text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      &.selected {
        border-color: var(--primary);
        background: var(--primary-light);
        color: var(--primary);
      }
    }

    .form-input, .form-textarea {
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      background: var(--background);
      color: var(--text);
      font-size: 0.9rem;
      font-weight: 700;
      outline: none;

      &:focus { border-color: var(--primary); }
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 16px;
      padding-bottom: 12px;
      border-top: 1.5px solid var(--border);
      flex-shrink: 0;
    }

    .margin-right-auto { margin-right: auto; }
  `]
})
export class TaskDialogComponent implements OnInit {
  @Input() task: Task | null = null;
  @Output() closed = new EventEmitter<void>();

  private taskStore = inject(TaskStore);
  private boardStore = inject(BoardStore);

  isEditMode = false;
  targetBoardId = '';
  title = '';
  description = '';
  priority: TaskPriority = 'medium';
  columnId = 'todo';
  dueDate = '';
  estimatedHours?: number;
  sticker: IconName = 'bookmark';
  labelsInput = '';

  confirmDeleteModalOpen = signal(false);

  availableIcons: IconName[] = ['bookmark', 'zap', 'flame', 'star', 'target', 'coffee', 'clock'];

  priorityOptions: SelectOption[] = [
    { value: 'urgent', label: 'Urgent', icon: 'alert' },
    { value: 'high', label: 'High', icon: 'flame' },
    { value: 'medium', label: 'Medium', icon: 'zap' },
    { value: 'low', label: 'Low', icon: 'bookmark' }
  ];

  columnOptions = () => {
    const board = this.boardStore.boards().find(b => b.id === this.targetBoardId);
    if (!board || board.columns.length === 0) return [];
    return board.columns.map(c => ({
      value: c.id,
      label: c.name,
      icon: 'folder'
    }));
  };

  ngOnInit(): void {
    const boards = this.boardStore.boards();
    if (this.task) {
      this.isEditMode = true;
      this.targetBoardId = this.task.boardId;
      this.title = this.task.title;
      this.description = this.task.description || '';
      this.priority = this.task.priority;
      this.columnId = this.task.columnId;
      this.dueDate = this.task.dueDate || '';
      this.estimatedHours = this.task.estimatedHours;
      this.sticker = (this.task.sticker as IconName) || 'bookmark';
      this.labelsInput = this.task.labels.join(', ');
    } else {
      const activeBoard = this.boardStore.activeBoard();
      this.targetBoardId = activeBoard ? activeBoard.id : (boards.length > 0 ? boards[0].id : '');
      const board = boards.find(b => b.id === this.targetBoardId);
      if (board && board.columns.length > 0) {
        this.columnId = board.columns[0].id;
      }
    }
  }

  onPriorityChange(val: string): void {
    this.priority = val as TaskPriority;
  }

  saveTask(): void {
    if (!this.title.trim() || !this.targetBoardId) return;

    const labels = this.labelsInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (this.isEditMode && this.task) {
      this.taskStore.updateTask(this.task.id, {
        title: this.title.trim(),
        description: this.description.trim(),
        priority: this.priority,
        columnId: this.columnId,
        dueDate: this.dueDate || undefined,
        estimatedHours: this.estimatedHours,
        sticker: this.sticker,
        labels
      });
    } else {
      this.taskStore.createTask({
        boardId: this.targetBoardId,
        columnId: this.columnId,
        title: this.title.trim(),
        description: this.description.trim(),
        priority: this.priority,
        dueDate: this.dueDate || undefined,
        estimatedHours: this.estimatedHours,
        sticker: this.sticker,
        labels
      });
    }

    this.closed.emit();
  }

  redirectToCreateBoard(): void {
    this.closed.emit();
    this.boardStore.openCreateModal();
  }

  deleteTaskConfirmed(): void {
    if (this.task) {
      this.taskStore.deleteTask(this.task.id);
      this.confirmDeleteModalOpen.set(false);
      this.closed.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closed.emit();
    }
  }
}
