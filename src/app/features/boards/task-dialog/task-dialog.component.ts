import { Component, Input, Output, EventEmitter, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, TaskAssignee, TaskComment, TaskPriority, TaskAttachment } from '../../../core/models/task.model';
import { TaskStore } from '../../../core/stores/task.store';
import { BoardStore } from '../../../core/stores/board.store';
import { AppwriteService } from '../../../core/services/appwrite.service';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { CustomSelectComponent, SelectOption } from '../../../shared/components/custom-select/custom-select.component';
import { CustomDatePickerComponent } from '../../../shared/components/custom-date-picker/custom-date-picker.component';
import { CustomNumberInputComponent } from '../../../shared/components/custom-number-input/custom-number-input.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CustomSingleSelectComponent, SingleSelectOption } from '../../../shared/components/custom-single-select/custom-single-select.component';

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
    ButtonComponent,
    CustomSingleSelectComponent
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
            <!-- 1. Workspace Board (Top Hierarchy) -->
            <div class="form-group">
              <label>Workspace Board</label>
              <app-custom-select
                [options]="boardOptions()"
                [value]="targetBoardId"
                (valueChange)="onBoardChange($event)"
              ></app-custom-select>
            </div>

            <!-- 2. Priority Level & Target Column Row -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Priority Level</label>
                <app-custom-select
                  [options]="priorityOptions"
                  [(value)]="priority"
                ></app-custom-select>
              </div>

              <div class="form-group flex-1">
                <label>Target Column</label>
                <app-custom-select
                  [options]="columnOptions()"
                  [(value)]="columnId"
                ></app-custom-select>
              </div>
            </div>

            <!-- 3. Task Title -->
            <div class="form-group">
              <label>Task Title</label>
              <input
                type="text"
                class="form-input"
                placeholder="e.g. Design Landing Page Wireframes"
                [(ngModel)]="title"
                name="title"
                required
                autofocus
              />
            </div>

            <!-- 4. Task Description -->
            <div class="form-group">
              <label>Description</label>
              <textarea
                class="form-textarea"
                placeholder="Add task context, notes, or criteria..."
                [(ngModel)]="description"
                name="description"
                rows="3"
              ></textarea>
            </div>

            <!-- 5. Icon Tag Selection -->
            <div class="form-group">
              <label>Icon Badge</label>
              <div class="icon-selector-grid">
                @for (ic of availableStickers; track ic) {
                  <button
                    type="button"
                    class="icon-opt-btn"
                    [class.selected]="sticker === ic"
                    (click)="sticker = ic"
                  >
                    <app-icon [name]="ic" [size]="18"></app-icon>
                  </button>
                }
              </div>
            </div>

            <!-- Assignee (Full Width Row - Group Boards only) -->
            @if (isGroupBoard()) {
              <div class="form-group">
                <label>Assignee (Group Member)</label>
                <app-custom-single-select
                  [options]="assigneeOptions()"
                  [value]="selectedAssigneeUserId"
                  placeholder="Unassigned"
                  (valueChange)="onAssigneeSelect($event)"
                ></app-custom-single-select>
              </div>
            }

            <!-- Due Date & Est. Hours Row -->
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

            <!-- Labels Row -->
            <div class="form-group">
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

            <!-- Task Attachments Section -->
            <div class="form-group attachments-section">
              <div class="attachments-header">
                <label>Task Attachments ({{ attachments.length }})</label>
                <button type="button" class="upload-link-btn" (click)="attachFileInput.click()">
                  <app-icon name="plus" [size]="14"></app-icon>
                  <span>Upload File</span>
                </button>
              </div>

              <input
                #attachFileInput
                type="file"
                class="hidden-file-input"
                (change)="onAttachmentSelected($event)"
              />

              @if (attachments.length > 0) {
                <div class="attachments-grid">
                  @for (att of attachments; track att.id) {
                    <div class="attachment-item-card glass-card">
                      @if (att.type && att.type.startsWith('image/')) {
                        <div class="att-img-thumb" (click)="openImagePreview(att.url)">
                          <img [src]="att.url" [alt]="att.name" />
                        </div>
                      } @else {
                        <div class="att-icon-box">
                          <app-icon name="bookmark" [size]="20"></app-icon>
                        </div>
                      }

                      <div class="att-info">
                        <strong class="att-name" [title]="att.name">{{ att.name }}</strong>
                        <span class="att-size">{{ (att.size / 1024) | number:'1.0-1' }} KB</span>
                      </div>

                      <div class="att-actions">
                        <a [href]="att.url" target="_blank" download class="icon-mini-btn" title="Download File">
                          <app-icon name="star" [size]="14"></app-icon>
                        </a>
                        <button type="button" class="icon-mini-btn danger" (click)="removeAttachment(att.id)" title="Remove File">
                          <app-icon name="x" [size]="14"></app-icon>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-attachments-box" (click)="attachFileInput.click()">
                  <app-icon name="plus" [size]="18"></app-icon>
                  <span>No attachments added. Click to upload files.</span>
                </div>
              }
            </div>

            <!-- Image Lightbox Modal -->
            @if (previewImageUrl(); as imgUrl) {
              <div class="lightbox-overlay fade-in" (click)="previewImageUrl.set(null)">
                <div class="lightbox-card pop-in" (click)="$event.stopPropagation()">
                  <button class="lightbox-close-btn" (click)="previewImageUrl.set(null)">
                    <app-icon name="x" [size]="18"></app-icon>
                  </button>
                  <img [src]="imgUrl" alt="Attachment Preview" />
                </div>
              </div>
            }

            <!-- Task Activity & Comments Section -->
            @if (isEditMode && task) {
              <div class="activity-section">
                <div class="activity-header">
                  <app-icon name="comment" [size]="16"></app-icon>
                  <strong>Activity & Comments ({{ comments.length }})</strong>
                </div>

                <div class="comments-list">
                  @for (comm of comments; track comm.id) {
                    <div class="comment-bubble">
                      <div class="comment-avatar">
                        {{ comm.authorName.charAt(0).toUpperCase() }}
                      </div>
                      <div class="comment-content">
                        <div class="comment-meta">
                          <span class="comment-author">{{ comm.authorName }}</span>
                          <span class="comment-time">{{ comm.createdAt | date:'shortTime' }}</span>
                        </div>
                        <p class="comment-text">{{ comm.content || comm.text }}</p>
                      </div>
                    </div>
                  }
                </div>

                <div class="add-comment-box">
                  <input
                    type="text"
                    class="comment-input"
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
            @if (isEditMode) {
              <button
                type="button"
                class="delete-btn"
                (click)="confirmDelete.set(true)"
                title="Delete Task"
              >
                <app-icon name="trash" [size]="16"></app-icon>
                <span>Delete</span>
              </button>
            }
            <div class="right-actions">
              <app-button variant="secondary" (btnClick)="closed.emit()">Cancel</app-button>
              <app-button type="submit" form="taskForm" [disabled]="!title.trim()" (btnClick)="saveTask()">
                {{ isEditMode ? 'Save Changes' : 'Create Task' }}
              </app-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Task Confirmation Modal -->
      @if (confirmDelete()) {
        <app-confirm-dialog
          title="Delete Task?"
          message="Are you sure you want to delete this task? This action cannot be undone."
          confirmText="Delete Task"
          (confirmed)="deleteTaskConfirmed()"
          (cancelled)="confirmDelete.set(false)"
        ></app-confirm-dialog>
      }
    } @else {
      <!-- Fallback modal if 0 boards exist -->
      <app-confirm-dialog
        title="No Board Found"
        message="You need at least one workspace board before creating tasks."
        confirmText="Create Board"
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
        gap: 10px;
        color: var(--primary);

        h3 {
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--text);
        }
      }
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: var(--radius-sm);
      &:hover { color: var(--text); background: var(--background); }
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow-y: auto;
      padding-right: 4px;
      flex: 1;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 0.8rem;
        font-weight: 800;
        color: var(--text-muted);
      }
    }

    .form-row {
      display: flex;
      gap: 12px;

      .flex-1 {
        flex: 1;
      }
    }

    .icon-selector-grid {
      display: flex;
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
      transition: all 0.2s ease;

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
      width: 100%;

      &:focus {
        border-color: var(--primary);
      }
    }

    .activity-section {
      margin-top: 8px;
      padding-top: 14px;
      border-top: 1.5px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .activity-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--text);
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 140px;
      overflow-y: auto;
    }

    .comment-bubble {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: var(--background);
      padding: 8px 12px;
      border-radius: var(--radius-md);
    }

    .comment-avatar {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-full);
      background: var(--primary);
      color: white;
      font-size: 0.72rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .comment-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .comment-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      .comment-author { font-size: 0.75rem; font-weight: 800; color: var(--text); }
      .comment-time { font-size: 0.68rem; color: var(--text-muted); }
    }

    .comment-text {
      font-size: 0.82rem;
      color: var(--text);
    }

    .add-comment-box {
      display: flex;
      gap: 8px;
    }

    .comment-input {
      flex: 1;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      background: var(--background);
      color: var(--text);
      font-size: 0.84rem;
      outline: none;

      &:focus { border-color: var(--primary); }
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 10px;
      border-top: 1.5px solid var(--border);
      flex-shrink: 0;
    }

    .right-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: auto;
    }

    .delete-btn {
      background: transparent;
      border: none;
      color: var(--danger);
      font-size: 0.85rem;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: var(--radius-md);

      &:hover {
        background: var(--danger-light);
      }
    }
  `]
})
export class TaskDialogComponent implements OnInit {
  @Input() task: Task | null = null;
  @Output() closed = new EventEmitter<void>();

  private taskStore = inject(TaskStore);
  private boardStore = inject(BoardStore);
  private appwriteService = inject(AppwriteService);

  isEditMode = false;
  targetBoardIdSignal = signal<string>('');
  get targetBoardId(): string {
    return this.targetBoardIdSignal();
  }
  set targetBoardId(val: string) {
    this.targetBoardIdSignal.set(val || '');
  }

  title = '';
  description = '';
  priority: TaskPriority = 'medium';
  columnId = 'todo';
  dueDate = '';
  estimatedHours?: number;
  sticker: IconName = 'bookmark';
  labelsInput = '';
  assignee?: TaskAssignee;
  selectedAssigneeUserId = '';
  comments: TaskComment[] = [];
  newCommentText = '';

  confirmDelete = signal(false);

  availableStickers: IconName[] = ['bookmark', 'flame', 'zap', 'star', 'target', 'sparkles'];

  priorityOptions: SelectOption[] = [
    { value: 'low', label: 'Low', icon: 'bookmark', color: 'var(--text-muted)' },
    { value: 'medium', label: 'Medium', icon: 'zap', color: 'var(--primary)' },
    { value: 'high', label: 'High', icon: 'flame', color: 'var(--orange)' },
    { value: 'urgent', label: 'Urgent', icon: 'alert', color: 'var(--danger)' }
  ];

  boardOptions = computed<SelectOption[]>(() => {
    return this.boardStore.boards().map(b => ({
      value: b.id,
      label: b.name,
      icon: 'folder'
    }));
  });

  isGroupBoard = computed<boolean>(() => {
    const boardId = this.targetBoardIdSignal();
    const board = this.boardStore.boards().find(b => b.id === boardId);
    return Boolean(board?.isGroup);
  });

  onBoardChange(newBoardId: string): void {
    this.targetBoardIdSignal.set(newBoardId);
    const board = this.boardStore.boards().find(b => b.id === newBoardId);
    if (board && board.columns.length > 0) {
      this.columnId = board.columns[0].id;
    }
    this.selectedAssigneeUserId = '';
    this.assignee = undefined;
  }

  boardMembers = computed(() => {
    const boardId = this.targetBoardIdSignal();
    const board = this.boardStore.boards().find(b => b.id === boardId);
    return board?.members || [];
  });

  assigneeOptions = computed<SingleSelectOption[]>(() => {
    const members = this.boardMembers();
    const opts: SingleSelectOption[] = [
      { value: '', label: 'Unassigned', icon: 'user' }
    ];

    members.forEach(mem => {
      opts.push({
        value: mem.userId,
        label: mem.name || mem.email || 'Member',
        sublabel: mem.email,
        avatarInitials: (mem.name || mem.email || 'M').charAt(0).toUpperCase(),
        badge: mem.role === 'owner' ? 'Owner' : (mem.role === 'admin' ? 'Admin' : 'Member')
      });
    });

    return opts;
  });

  columnOptions = computed<SelectOption[]>(() => {
    const boardId = this.targetBoardIdSignal();
    const board = this.boardStore.boards().find(b => b.id === boardId);
    if (!board || board.columns.length === 0) return [];
    return board.columns.map(c => ({
      value: c.id,
      label: c.name,
      icon: 'folder'
    }));
  });

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
      this.attachments = this.task.attachments || [];
    } else {
      const activeBoard = this.boardStore.activeBoard();
      this.targetBoardId = activeBoard ? activeBoard.id : (boards.length > 0 ? boards[0].id : '');
      const board = boards.find(b => b.id === this.targetBoardId);
      if (board && board.columns.length > 0) {
        this.columnId = board.columns[0].id;
      }
    }
  }

  attachments: TaskAttachment[] = [];
  previewImageUrl = signal<string | null>(null);

  async onAttachmentSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const { url, fileId } = await this.appwriteService.uploadTaskAttachmentFile(file);

    const newAttachment: TaskAttachment = {
      id: `att-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url,
      fileId,
      createdAt: new Date().toISOString()
    };

    this.attachments = [...this.attachments, newAttachment];
    input.value = '';
  }

  async removeAttachment(attachmentId: string): Promise<void> {
    const att = this.attachments.find(a => a.id === attachmentId);
    if (att?.fileId) {
      await this.appwriteService.deleteTaskAttachmentFile(att.fileId);
    }
    this.attachments = this.attachments.filter(a => a.id !== attachmentId);
  }

  openImagePreview(url: string): void {
    this.previewImageUrl.set(url);
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
          name: mem.name || mem.email || 'Member',
          email: mem.email
        };
      }
    }
  }

  postComment(): void {
    const text = this.newCommentText.trim();
    const user = this.appwriteService.currentUser();
    if (!text || !this.task || !user) return;

    const newComment: TaskComment = {
      id: `comm-${Date.now()}`,
      authorId: user.id,
      authorName: user.name || user.email,
      content: text,
      text,
      createdAt: new Date().toISOString()
    };

    this.comments = [...this.comments, newComment];
    this.newCommentText = '';

    this.taskStore.updateTask(this.task.id, {
      comments: this.comments
    });
  }

  isSubmitting = false;

  saveTask(): void {
    if (this.isSubmitting || !this.title.trim()) return;
    this.isSubmitting = true;

    const labels = this.labelsInput
      .split(',')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (this.isEditMode && this.task) {
      this.taskStore.updateTask(this.task.id, {
        title: this.title.trim(),
        description: this.description.trim(),
        priority: this.priority,
        columnId: this.columnId,
        dueDate: this.dueDate || undefined,
        estimatedHours: this.estimatedHours,
        sticker: this.sticker,
        labels,
        assignee: this.assignee,
        comments: this.comments,
        attachments: this.attachments
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
        labels,
        assignee: this.assignee,
        comments: this.comments,
        attachments: this.attachments
      });
    }

    this.closed.emit();
    setTimeout(() => {
      this.isSubmitting = false;
    }, 400);
  }

  deleteTaskConfirmed(): void {
    if (this.task) {
      this.taskStore.deleteTask(this.task.id);
      this.closed.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closed.emit();
    }
  }

  redirectToCreateBoard(): void {
    this.closed.emit();
    this.boardStore.openCreateModal();
  }
}
