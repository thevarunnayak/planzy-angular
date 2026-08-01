import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskStore } from '../../../core/stores/task.store';
import { BoardStore } from '../../../core/stores/board.store';
import { TaskCardComponent } from '../task-card/task-card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CustomSelectComponent, SelectOption } from '../../../shared/components/custom-select/custom-select.component';
import { CustomMultiSelectComponent, MultiSelectOption } from '../../../shared/components/custom-multi-select/custom-multi-select.component';
import { CustomSortSelectComponent, SortSelectOption, SortState } from '../../../shared/components/custom-sort-select/custom-sort-select.component';
import { Task } from '../../../core/models/task.model';

import { TaskCommentsModalComponent } from '../../../shared/components/task-comments-modal/task-comments-modal.component';

@Component({
  selector: 'app-starred-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TaskCardComponent,
    IconComponent,
    CustomSelectComponent,
    CustomMultiSelectComponent,
    CustomSortSelectComponent,
    TaskCommentsModalComponent
  ],
  template: `
    <div class="starred-page">
      <!-- Header Banner -->
      <header class="starred-header glass-card">
        <div class="header-content">
          <div class="title-group">
            <div class="icon-blob floating-blob">
              <app-icon name="star" [size]="28"></app-icon>
            </div>
            <div>
              <h1 class="page-title">Starred Tasks</h1>
              <p class="page-subtitle">Quick access to your prioritized & favorite tasks across all boards</p>
            </div>
          </div>
          <div class="count-badge">
            <span class="count-number">{{ processedStarredTasks().length }}</span>
            <span class="count-label">Starred</span>
          </div>
        </div>

        <!-- Controls Toolbar with Custom Multi-Select Dropdowns & 3-State Sort Control -->
        <div class="controls-toolbar">
          <!-- Board Multi-Select Filter -->
          <div class="control-item">
            <app-custom-multi-select
              label="Boards"
              allLabel="All Boards"
              [options]="boardMultiOptions()"
              [selectedValues]="selectedBoardIds()"
              (selectedValuesChange)="selectedBoardIds.set($event)"
            ></app-custom-multi-select>
          </div>

          <!-- Status Multi-Select Filter -->
          <div class="control-item">
            <app-custom-multi-select
              label="Status"
              allLabel="All Statuses"
              [options]="statusMultiOptions"
              [selectedValues]="selectedStates()"
              (selectedValuesChange)="selectedStates.set($event)"
            ></app-custom-multi-select>
          </div>

          <!-- Priority Single-Select Filter -->
          <div class="control-item">
            <app-custom-select
              [options]="priorityFilterOptions"
              [value]="selectedPriority()"
              (valueChange)="selectedPriority.set($event)"
            ></app-custom-select>
          </div>

          <!-- Unified 3-State Sort Dropdown -->
          <div class="control-item">
            <app-custom-sort-select
              [options]="sortOptions"
              [sortState]="sortState()"
              (sortStateChange)="sortState.set($event)"
            ></app-custom-sort-select>
          </div>
        </div>
      </header>

      <!-- Tasks Grid -->
      <main class="tasks-container">
        @if (processedStarredTasks().length > 0) {
          <div class="tasks-grid">
            @for (task of processedStarredTasks(); track task.id) {
              <div class="starred-task-wrapper">
                <app-task-card
                  [task]="task"
                  [boardName]="getBoardName(task.boardId)"
                  [columnName]="getColumnName(task.columnId)"
                  (selectCard)="onCardClick($event)"
                  (openComments)="commentsTask.set($event)"
                ></app-task-card>
              </div>
            }
          </div>
        } @else {
          <div class="empty-starred-state glass-card">
            <div class="empty-mascot bounce-in">
              <app-icon name="mascot" [size]="64"></app-icon>
            </div>
            <h3>No Starred Tasks Found</h3>
            <p>Click the ⭐ star icon on any task card across your boards to pin them here for quick access!</p>
          </div>
        }
      </main>

      @if (commentsTask()) {
        <app-task-comments-modal
          [task]="commentsTask()!"
          (closed)="commentsTask.set(null)"
        ></app-task-comments-modal>
      }
    </div>
  `,
  styles: [`
    .starred-page {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 1300px;
      margin: 0 auto;
      width: 100%;
    }

    .starred-header {
      padding: 24px;
      border-radius: var(--radius-xl);
      background: var(--surface);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 20px;
      position: relative;
      z-index: 500;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .title-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .icon-blob {
      width: 54px;
      height: 54px;
      border-radius: var(--radius-full);
      background: var(--warning-light);
      color: #F59E0B;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 900;
      color: var(--text);
    }

    .page-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .count-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--background);
      padding: 10px 18px;
      border-radius: var(--radius-lg);
      border: 1.5px solid var(--border);
    }

    .count-number {
      font-size: 1.4rem;
      font-weight: 900;
      color: var(--primary);
    }

    .count-label {
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .controls-toolbar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 14px;
      padding-top: 16px;
      border-top: 1.5px solid var(--border);
      align-items: center;
      position: relative;
      z-index: 600;
    }

    .control-item {
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .tasks-container {
      position: relative;
      z-index: 1;
    }

    .tasks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
      gap: 18px;
      align-items: stretch;
    }

    .starred-task-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .empty-starred-state {
      padding: 60px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      max-width: 480px;
      margin: 40px auto;
      border-radius: var(--radius-xl);

      .empty-mascot {
        color: var(--primary);
        margin-bottom: 8px;
      }

      h3 {
        font-size: 1.2rem;
        font-weight: 900;
        color: var(--text);
      }

      p {
        font-size: 0.86rem;
        color: var(--text-muted);
        line-height: 1.5;
      }
    }
  `]
})
export class StarredTasksComponent {
  taskStore = inject(TaskStore);
  boardStore = inject(BoardStore);
  private router = inject(Router);

  selectedBoardIds = signal<string[]>([]);
  selectedStates = signal<string[]>(['todo', 'in_progress', 'done']);
  selectedPriority = signal<string>('all');
  sortState = signal<SortState>({ sortBy: 'priority', direction: 'desc' });
  commentsTask = signal<Task | null>(null);

  userFavoriteTasks = computed(() => {
    const validBoardIds = new Set(this.boardStore.boards().map(b => b.id));
    return this.taskStore.tasks().filter((t: Task) => t.isFavorite && validBoardIds.has(t.boardId));
  });

  priorityFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Priorities', icon: 'filter' },
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

  statusMultiOptions: MultiSelectOption[] = [
    { value: 'todo', label: 'To Do', icon: 'folder' },
    { value: 'in_progress', label: 'In Progress', icon: 'zap' },
    { value: 'done', label: 'Done', icon: 'check' }
  ];

  boardMultiOptions = computed<MultiSelectOption[]>(() => {
    return this.boardStore.boards().map(b => ({
      value: b.id,
      label: b.name,
      icon: 'folder'
    }));
  });

  constructor() {
    effect(() => {
      const boards = this.boardStore.boards();
      if (boards.length > 0) {
        const boardIds = boards.map(b => b.id);
        const current = this.selectedBoardIds();
        if (current.length === 0) {
          this.selectedBoardIds.set(boardIds);
        }
      }
    });
  }

  processedStarredTasks = computed(() => {
    let list = this.userFavoriteTasks();
    const boardIds = this.selectedBoardIds();
    const states = this.selectedStates();
    const priority = this.selectedPriority();
    const sort = this.sortState();

    if (boardIds.length > 0) {
      list = list.filter((t: Task) => boardIds.includes(t.boardId));
    } else {
      return [];
    }

    if (states.length > 0) {
      list = list.filter((t: Task) => states.includes(t.columnId));
    } else {
      return [];
    }

    if (priority !== 'all') {
      list = list.filter((t: Task) => t.priority === priority);
    }

    if (!sort.sortBy || sort.direction === 'none') {
      return list;
    }

    return [...list].sort((a, b) => {
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
  });

  onCardClick(task: Task): void {
    if (task && task.boardId) {
      this.boardStore.selectBoard(task.boardId);
      this.router.navigate(['/boards', task.boardId]);
    }
  }

  getBoardName(boardId: string): string {
    const board = this.boardStore.boards().find(b => b.id === boardId);
    return board ? board.name : 'Workspace';
  }

  getColumnName(columnId: string): string {
    if (columnId === 'todo') return 'To Do';
    if (columnId === 'in_progress') return 'In Progress';
    if (columnId === 'done') return 'Done';
    return columnId;
  }
}
