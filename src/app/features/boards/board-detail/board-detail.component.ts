import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BoardStore } from '../../../core/stores/board.store';
import { TaskStore } from '../../../core/stores/task.store';
import { Task } from '../../../core/models/task.model';
import { KanbanColumnComponent } from '../kanban-column/kanban-column.component';
import { TaskDialogComponent } from '../task-dialog/task-dialog.component';
import { ColumnDialogComponent } from '../../../shared/components/column-dialog/column-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BoardMembersDialogComponent } from '../../../shared/components/board-members-dialog/board-members-dialog.component';
import { CustomMultiSelectComponent, MultiSelectOption } from '../../../shared/components/custom-multi-select/custom-multi-select.component';
import { CustomSortSelectComponent, SortSelectOption, SortState } from '../../../shared/components/custom-sort-select/custom-sort-select.component';
import { TooltipDirective } from '../../../shared/directives/tooltip.directive';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-board-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    KanbanColumnComponent,
    TaskDialogComponent,
    ColumnDialogComponent,
    ConfirmDialogComponent,
    BoardMembersDialogComponent,
    CustomMultiSelectComponent,
    CustomSortSelectComponent,
    TooltipDirective,
    IconComponent,
    ButtonComponent,
    BadgeComponent
  ],
  template: `
    @if (boardStore.activeBoard(); as board) {
      <div class="board-view-container">
        <!-- Sticky Header Container (Header & Toolbar Stay Sticky on Scroll) -->
        <div class="sticky-header-container">
          <!-- Board Header Bar -->
          <div class="board-header">
            <div class="header-left">
              <div class="board-icon-badge">
                <app-icon name="folder" [size]="24"></app-icon>
              </div>
              <div class="header-titles">
                <div class="title-row">
                  <h2 class="board-name-heading">{{ board.name }}</h2>
                  <app-badge [variant]="board.isGroup ? 'urgent' : 'secondary'" size="sm">
                    {{ board.isGroup ? 'Group Board' : 'Individual Board' }}
                  </app-badge>
                </div>
                <p class="board-desc-sub">{{ board.description || 'Custom Kanban Workspace' }}</p>
              </div>
            </div>

            <div class="header-actions">
              <!-- Members & Access Control Button -->
              <button class="jelly-btn secondary" (click)="membersModalOpen.set(true)" appTooltip="Board Members & Sharing">
                <app-icon name="target" [size]="16"></app-icon>
                <span>Members ({{ board.members?.length || 1 }})</span>
              </button>

              <button class="jelly-btn secondary" (click)="duplicateBoard(board.id)" appTooltip="Duplicate Board">
                <app-icon name="copy" [size]="16"></app-icon>
                <span>Duplicate</span>
              </button>

              @if (boardStore.canEditBoard()) {
                <button class="jelly-btn secondary" (click)="openAddColumnModal()" appTooltip="Add Custom Column">
                  <app-icon name="plus" [size]="16"></app-icon>
                  <span>Column</span>
                </button>
              }

              @if (boardStore.isOwner()) {
                <button class="jelly-btn danger-btn" (click)="confirmDeleteBoardId.set(board.id)" appTooltip="Delete Board">
                  <app-icon name="trash" [size]="16"></app-icon>
                  <span>Delete</span>
                </button>
              }

              @if (boardStore.canCreateTask()) {
                <button class="jelly-btn" (click)="openCreateTaskModal(board.columns[0] ? board.columns[0].id : '')" appTooltip="Add New Task">
                  <app-icon name="plus" [size]="16"></app-icon>
                  <span>Task</span>
                </button>
              }
            </div>
          </div>

          <!-- Filter & Search Toolbar with Priority Multi-Select & 3-State Sort Controls -->
          <div class="toolbar glass-card">
            <div class="toolbar-search">
              <app-icon name="search" [size]="16"></app-icon>
              <input
                type="text"
                class="toolbar-input"
                placeholder="Filter tasks by name or label..."
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
              />
            </div>

            <div class="toolbar-filters">
              <!-- Priority Multi-Select Filter -->
              <div class="select-chip-wrap">
                <app-custom-multi-select
                  label="Priority"
                  allLabel="All Priorities"
                  [options]="priorityMultiOptions"
                  [selectedValues]="selectedPriorities()"
                  (selectedValuesChange)="selectedPriorities.set($event)"
                ></app-custom-multi-select>
              </div>

              <!-- Unified 3-State Sort Control -->
              <div class="select-chip-wrap">
                <app-custom-sort-select
                  [options]="sortOptions"
                  [sortState]="sortState()"
                  (sortStateChange)="sortState.set($event)"
                ></app-custom-sort-select>
              </div>

              <button
                class="filter-chip-btn"
                [class.active]="favoriteOnly()"
                (click)="favoriteOnly.set(!favoriteOnly())"
                appTooltip="Filter Starred Tasks Only"
              >
                <app-icon name="star" [size]="14"></app-icon>
                <span>Favorites</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Kanban Columns Canvas -->
        <div class="kanban-canvas">
          @for (col of board.columns; track col.id) {
            <app-kanban-column
              [column]="col"
              [tasks]="getTasksForColumn(col.id)"
              [connectedColumnIds]="allColumnIds()"
              (cardDropped)="onCardDropped($event, col.id)"
              (selectCardRequested)="openEditTaskModal($event)"
              (addCardRequested)="openCreateTaskModal($event)"
            ></app-kanban-column>
          }
        </div>

        <!-- Task Edit / Create Dialog Modal -->
        @if (dialogOpen()) {
          <app-task-dialog
            [task]="selectedTaskForEdit()"
            (closed)="closeTaskModal()"
          ></app-task-dialog>
        }

        <!-- Members & Roles Dialog Modal -->
        @if (membersModalOpen()) {
          <app-board-members-dialog
            (closed)="membersModalOpen.set(false)"
          ></app-board-members-dialog>
        }

        <!-- Custom Add Column Modal Popup -->
        @if (columnModalOpen()) {
          <app-column-dialog
            (submitted)="onColumnSubmitted($event)"
            (cancelled)="columnModalOpen.set(false)"
          ></app-column-dialog>
        }

        <!-- Custom Delete Board Confirmation Modal -->
        @if (confirmDeleteBoardId()) {
          <app-confirm-dialog
            title="Delete Board Workspace?"
            message="Are you sure you want to delete this board? All column data will be removed."
            confirmText="Delete Board"
            (confirmed)="deleteBoardConfirmed()"
            (cancelled)="confirmDeleteBoardId.set(null)"
          ></app-confirm-dialog>
        }
      </div>
    } @else {
      <!-- Empty State Screen when 0 Boards Exist -->
      <div class="empty-state-view">
        <div class="empty-state-card glass-card">
          <div class="empty-icon-wrap">
            <app-icon name="kanban" [size]="48"></app-icon>
          </div>
          <h2>No Active Workspace Board</h2>
          <p>Create your very first board to start organizing your daily tasks, projects, and goals.</p>
          <button class="jelly-btn" (click)="openCreateBoardModal()">
            <app-icon name="plus" [size]="18"></app-icon>
            <span>Create Board</span>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .board-view-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 24px;
      min-height: calc(100vh - 72px);
    }

    .sticky-header-container {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--background);
      padding-top: 4px;
      padding-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .board-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .board-icon-badge {
      width: 44px;
      height: 44px;
      background: var(--primary-light);
      color: var(--primary);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .board-name-heading {
      font-size: 1.6rem;
      font-weight: 900;
      color: var(--text);
    }

    .board-desc-sub {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      gap: 16px;
      flex-wrap: wrap;
      position: relative;
      z-index: 600;
    }

    .toolbar-search {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--background);
      border: 1.5px solid var(--border);
      padding: 6px 14px;
      border-radius: var(--radius-full);
      flex: 1;
      min-width: 240px;
      max-width: 380px;
      color: var(--text-muted);
    }

    .toolbar-input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text);
    }

    .toolbar-filters {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .select-chip-wrap {
      min-width: 180px;
    }

    .filter-chip-btn {
      background: var(--background);
      border: 1.5px solid var(--border);
      padding: 9px 16px;
      border-radius: var(--radius-md);
      font-weight: 800;
      font-size: 0.84rem;
      color: var(--text);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;

      &.active {
        background: var(--yellow);
        border-color: var(--yellow-dark);
        color: #7A5B00;
      }
    }

    .kanban-canvas {
      display: flex;
      gap: 20px;
      align-items: flex-start;
      overflow-x: auto;
      padding-bottom: 24px;
      flex: 1;
      -webkit-overflow-scrolling: touch;
      position: relative;
      z-index: 1;
    }

    .empty-state-view {
      padding: 60px 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      height: calc(100vh - 72px);
    }

    .empty-state-card {
      padding: 40px;
      max-width: 460px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;

      .empty-icon-wrap {
        width: 80px;
        height: 80px;
        background: var(--primary-light);
        color: var(--primary);
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      h2 {
        font-size: 1.5rem;
        font-weight: 900;
        color: var(--text);
      }

      p {
        font-size: 0.88rem;
        color: var(--text-muted);
        line-height: 1.5;
      }
    }

    /* Small Screen Devices Responsiveness (< 768px) */
    @media (max-width: 768px) {
      .board-view-container {
        padding: 12px;
        gap: 12px;
      }

      .board-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .header-actions {
        flex-wrap: wrap;
        width: 100%;
        gap: 8px;

        .jelly-btn {
          padding: 8px 12px;
          font-size: 0.8rem;
        }
      }

      .toolbar {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        padding: 12px;
      }

      .toolbar-search {
        max-width: 100%;
        min-width: 100%;
      }

      .toolbar-filters {
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        gap: 10px;
      }

      .select-chip-wrap {
        width: 100%;
        min-width: 100%;
      }
    }
  `]
})
export class BoardDetailComponent implements OnInit {
  boardStore = inject(BoardStore);
  taskStore = inject(TaskStore);
  private route = inject(ActivatedRoute);

  dialogOpen = signal(false);
  columnModalOpen = signal(false);
  membersModalOpen = signal(false);
  selectedTaskForEdit = signal<Task | null>(null);
  confirmDeleteBoardId = signal<string | null>(null);

  // Filters & Sorting Signals
  searchQuery = signal<string>('');
  selectedPriorities = signal<string[]>(['urgent', 'high', 'medium', 'low']);
  favoriteOnly = signal<boolean>(false);
  sortState = signal<SortState>({ sortBy: null, direction: 'none' });

  priorityMultiOptions: MultiSelectOption[] = [
    { value: 'urgent', label: 'Urgent', icon: 'alert' },
    { value: 'high', label: 'High', icon: 'flame' },
    { value: 'medium', label: 'Medium', icon: 'zap' },
    { value: 'low', label: 'Low', icon: 'bookmark' }
  ];

  sortOptions: SortSelectOption[] = [
    { value: 'priority', label: 'Priority', icon: 'flame' },
    { value: 'dueDate', label: 'Due Date', icon: 'clock' },
    { value: 'title', label: 'Title (A-Z)', icon: 'star' },
    { value: 'createdAt', label: 'Created Date', icon: 'calendar' }
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const boardId = params.get('id');
      if (boardId) {
        this.boardStore.selectBoard(boardId);
      }
    });
  }

  allColumnIds = () => {
    return this.boardStore.activeColumns().map(c => c.id);
  };

  getTasksForColumn(columnId: string): Task[] {
    const activeBoard = this.boardStore.activeBoard();
    if (!activeBoard) return [];

    let tasks = this.taskStore.tasks().filter(t => t.boardId === activeBoard.id && t.columnId === columnId);

    // 1. Search Query Filter
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        (t.labels && t.labels.some(l => l.toLowerCase().includes(query)))
      );
    }

    // 2. Multi-Select Priority Filter
    const priorities = this.selectedPriorities();
    if (priorities.length > 0) {
      tasks = tasks.filter(t => priorities.includes(t.priority));
    } else {
      tasks = [];
    }

    // 3. Favorites Only Filter
    if (this.favoriteOnly()) {
      tasks = tasks.filter(t => t.isFavorite);
    }

    // 4. Unified 3-State Sort
    const sort = this.sortState();
    if (!sort.sortBy || sort.direction === 'none') {
      return tasks;
    }

    return [...tasks].sort((a, b) => {
      let comparison = 0;
      if (sort.sortBy === 'priority') {
        const weights: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        comparison = (weights[b.priority] || 0) - (weights[a.priority] || 0);
      } else if (sort.sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        comparison = a.dueDate.localeCompare(b.dueDate);
      } else if (sort.sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sort.sortBy === 'createdAt') {
        comparison = b.createdAt.localeCompare(a.createdAt);
      }

      return sort.direction === 'asc' ? -comparison : comparison;
    });
  }

  onCardDropped(event: CdkDragDrop<Task[]>, targetColumnId: string): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const movedTask = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.taskStore.moveTaskColumn(movedTask.id, targetColumnId, event.currentIndex);
    }
  }

  openCreateTaskModal(columnId?: string): void {
    this.selectedTaskForEdit.set(null);
    this.dialogOpen.set(true);
  }

  openEditTaskModal(task: Task): void {
    this.selectedTaskForEdit.set(task);
    this.dialogOpen.set(true);
  }

  closeTaskModal(): void {
    this.dialogOpen.set(false);
    this.selectedTaskForEdit.set(null);
  }

  openAddColumnModal(): void {
    this.columnModalOpen.set(true);
  }

  openCreateBoardModal(): void {
    this.boardStore.openCreateModal();
  }

  onColumnSubmitted(data: { name: string; color: string }): void {
    const activeBoard = this.boardStore.activeBoard();
    if (activeBoard) {
      this.boardStore.addColumn(activeBoard.id, data.name, data.color);
    }
    this.columnModalOpen.set(false);
  }

  deleteBoardConfirmed(): void {
    const id = this.confirmDeleteBoardId();
    if (id) {
      this.boardStore.deleteBoard(id);
      this.confirmDeleteBoardId.set(null);
    }
  }

  duplicateBoard(id: string): void {
    this.boardStore.duplicateBoard(id);
  }
}
