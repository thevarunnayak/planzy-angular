import { Component, Input, Output, EventEmitter, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, TaskAssignee, TaskComment, TaskPriority } from '../../../core/models/task.model';
import { TaskStore } from '../../../core/stores/task.store';
import { BoardStore } from '../../../core/stores/board.store';
import { AppwriteService } from '../../../core/services/appwrite.service';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { CustomSelectComponent, SelectOption } from '../../../shared/components/custom-select/custom-select.component';
import { CustomDatePickerComponent } from '../../../shared/components/custom-date-picker/custom-date-picker.component';
import { CustomNumberInputComponent } from '../../../shared/components/custom-number-input/custom-number-input.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

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
    ConfirmDialogComponent,
    ButtonComponent
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

            <!-- Task Assignee (Group Boards) & Due Date -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Assignee (Group Member)</label>
                <select
                  class="form-select"
                  [ngModel]="selectedAssigneeUserId"
                  (ngModelChange)="onAssigneeSelect($event)"
                  name="assigneeSelect"
                >
                  <option value="">Unassigned</option>
                  @for (mem of boardMembers(); track mem.userId) {
                    <option [value]="mem.userId">{{ mem.name }} ({{ mem.role }})</option>
                  }
                </select>
              </div>

              <div class="form-group flex-1">
                <label>Due Date</label>
                <app-custom-date-picker
                  [value]="dueDate"
                  (valueChange)="dueDate = $event"
                ></app-custom-date-picker>
              </div>
            </div>

            <!-- Est. Hours & Labels Row -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Est. Hours</label>
                <app-custom-number-input
                  [(value)]="estimatedHours"
                  [step]="0.5"
                  [min]="0.5"
                  placeholder="1.5"
                ></app-custom-number-input>
              </div>

              <div class="form-group flex-1">
                <label>Labels (Comma separated)</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="e.g. Design, Frontend"
                  [ngModel]="labelsInput"
                  (ngModelChange)="labelsInput = $event"
                  name="labelsInput"
                />
              </div>
            </div>

            <!-- Task Activity & Comments Section -->
            @if (isEditMode) {
              <div class="comments-section">
                <div class="section-title">
                  <app-icon name="comment" [size]="16"></app-icon>
                  <span>Activity & Comments ({{ comments.length }})</span>
                </div>

                <div class="comments-list">
                  @for (c of comments; track c.id) {
                    <div class="comment-item">
                      <div class="comment-avatar">
                        {{ (c.authorName || 'U').charAt(0).toUpperCase() }}
                      </div>
                      <div class="comment-bubble">
                        <div class="comment-meta">
                          <strong>{{ c.authorName }}</strong>
                          <span class="time">{{ c.createdAt | date:'shortTime' }}</span>
                        </div>
                        <p class="comment-text">{{ c.content }}</p>
                      </div>
                    </div>
                  }
                </div>

                <div class="add-comment-row">
                  <input
                    type="text"
                    class="form-input flex-1"
                    placeholder="Write a comment..."
                    [(ngModel)]="newCommentText"
                    name="newCommentText"
                    (keydown.enter)="$event.preventDefault(); postComment()"
                  />
                  <app-button
                    size="sm"
                    [disabled]="!newCommentText.trim()"
                    (btnClick)="postComment()"
                  >
                    Post
                  </app-button>
                </div>
              </div>
            }
          </form>

          <!-- Fixed Modal Footer -->
          <div class="modal-footer">
            @if (isEditMode && task && boardStore.canCreateTask()) {
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
      max-width: 560px;
      padding: 24px 24px 20px 24px;
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-height: 88vh;
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

    .form-input, .form-textarea, .form-select {
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

    .comments-section {
      margin-top: 10px;
      padding-top: 14px;
      border-top: 1.5px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 12px;

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.88rem;
        font-weight: 800;
        color: var(--primary);
      }
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 180px;
      overflow-y: auto;
    }

    .comment-item {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }

    .comment-avatar {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-full);
      background: var(--primary);
      color: white;
      font-size: 0.75rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .comment-bubble {
      background: var(--background);
      border: 1.5px solid var(--border);
      padding: 8px 12px;
      border-radius: var(--radius-md);
      flex: 1;

      .comment-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
        strong { font-size: 0.8rem; color: var(--text); }
        .time { font-size: 0.68rem; color: var(--text-muted); }
      }

      .comment-text {
        font-size: 0.82rem;
        color: var(--text);
        line-height: 1.3;
      }
    }

    .add-comment-row {
      display: flex;
      gap: 8px;
      align-items: center;
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
  boardStore = inject(BoardStore);
  private appwriteService = inject(AppwriteService);

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
  selectedAssigneeUserId = '';
  assignee?: TaskAssignee;
  comments: TaskComment[] = [];
  newCommentText = '';

  confirmDeleteModalOpen = signal(false);

  availableIcons: IconName[] = ['bookmark', 'zap', 'flame', 'star', 'target', 'coffee', 'clock'];

  priorityOptions: SelectOption[] = [
    { value: 'urgent', label: 'Urgent', icon: 'alert' },
    { value: 'high', label: 'High', icon: 'flame' },
    { value: 'medium', label: 'Medium', icon: 'zap' },
    { value: 'low', label: 'Low', icon: 'bookmark' }
  ];

  boardMembers = computed(() => {
    const board = this.boardStore.boards().find(b => b.id === this.targetBoardId);
    return board?.members || [];
  });

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
      this.assignee = this.task.assignee;
      this.selectedAssigneeUserId = this.task.assignee?.userId || '';
      this.comments = this.task.comments || [];
    } else {
      const activeBoard = this.boardStore.activeBoard();
      this.targetBoardId = activeBoard ? activeBoard.id : (boards.length > 0 ? boards[0].id : '');
      const board = boards.find(b => b.id === this.targetBoardId);
      if (board && board.columns.length > 0) {
        this.columnId = board.columns[0].id;
      }
    }
  }

  onAssigneeSelect(userId: string): void {
    this.selectedAssigneeUserId = userId;
    if (!userId) {
      this.assignee = undefined;
    } else {
      const mem = this.boardMembers().find(m => m.userId === userId);
      if (mem) {
        this.assignee = {
          userId: mem.userId,
          name: mem.name,
          email: mem.email
        };
      }
    }
  }

  onPriorityChange(val: string): void {
    this.priority = val as TaskPriority;
  }

  postComment(): void {
    if (!this.newCommentText.trim()) return;

    const user = this.appwriteService.currentUser();
    const newComment: TaskComment = {
      id: `comment-${Date.now()}`,
      authorId: user ? user.id : 'guest',
      authorName: user ? user.name : 'Guest User',
      content: this.newCommentText.trim(),
      createdAt: new Date().toISOString()
    };

    this.comments.push(newComment);
    this.newCommentText = '';

    if (this.isEditMode && this.task) {
      this.taskStore.updateTask(this.task.id, {
        comments: this.comments
      });
    }
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
        assignee: this.assignee,
        comments: this.comments,
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
        assignee: this.assignee,
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
