import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KeyboardShortcutsService } from '../../../core/services/keyboard-shortcuts.service';
import { TaskStore } from '../../../core/stores/task.store';
import { BoardStore } from '../../../core/stores/board.store';
import { ThemeStore } from '../../../core/stores/theme.store';
import { AutoFocusDirective } from '../../directives/autofocus.directive';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoFocusDirective, IconComponent],
  template: `
    @if (shortcutsService.commandPaletteOpen()) {
      <div class="cmd-backdrop" (click)="close()">
        <div class="cmd-dialog glass-card bounce-in" (click)="$event.stopPropagation()">
          <div class="cmd-header">
            <app-icon name="search" [size]="18"></app-icon>
            <input
              type="text"
              class="cmd-input"
              placeholder="Type a command or search tasks & boards..."
              [(ngModel)]="searchQuery"
              appAutofocus
            />
            <span class="esc-badge">ESC</span>
          </div>

          <div class="cmd-body">
            <!-- Quick Actions Section -->
            <div class="cmd-group">
              <span class="group-title">QUICK COMMANDS</span>
              <button class="cmd-item" (click)="createTaskAction()">
                <app-icon name="plus" [size]="16"></app-icon>
                <span>Create New Task</span>
                <kbd>+ Task</kbd>
              </button>
              <button class="cmd-item" (click)="toggleThemeAction()">
                <app-icon name="sun" [size]="16"></app-icon>
                <span>Toggle Dark / Light Theme</span>
                <kbd>Theme</kbd>
              </button>
              <button class="cmd-item" (click)="navigateAction('/dashboard')">
                <app-icon name="dashboard" [size]="16"></app-icon>
                <span>Go to Dashboard</span>
              </button>
            </div>

            <!-- Task Results Section -->
            @if (matchingTasks().length > 0) {
              <div class="cmd-group">
                <span class="group-title">TASKS</span>
                @for (task of matchingTasks(); track task.id) {
                  <button class="cmd-item" (click)="selectTaskAction(task.boardId)">
                    <app-icon name="bookmark" [size]="16"></app-icon>
                    <span class="item-text">{{ task.title }}</span>
                    <span class="badge" [class]="task.priority">{{ task.priority }}</span>
                  </button>
                }
              </div>
            }

            <!-- Board Results Section -->
            @if (matchingBoards().length > 0) {
              <div class="cmd-group">
                <span class="group-title">BOARDS</span>
                @for (board of matchingBoards(); track board.id) {
                  <button class="cmd-item" (click)="selectBoardAction(board.id)">
                    <app-icon name="folder" [size]="16"></app-icon>
                    <span class="item-text">{{ board.name }}</span>
                  </button>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .cmd-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(30, 27, 36, 0.4);
      backdrop-filter: blur(6px);
      z-index: 99999;
      display: flex;
      justify-content: center;
      padding-top: 100px;
    }

    .cmd-dialog {
      width: 90%;
      max-width: 580px;
      height: max-content;
      max-height: 480px;
      background: var(--surface);
      border-radius: var(--radius-xl);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-lg);
    }

    .cmd-header {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 2px solid var(--border);
      gap: 12px;
      color: var(--primary);
    }

    .cmd-input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text);
    }

    .esc-badge {
      font-size: 0.7rem;
      font-weight: 800;
      background: var(--background);
      border: 1px solid var(--border);
      padding: 2px 6px;
      border-radius: 6px;
      color: var(--text-muted);
    }

    .cmd-body {
      padding: 12px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .cmd-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .group-title {
      font-size: 0.68rem;
      font-weight: 800;
      color: var(--text-muted);
      letter-spacing: 0.8px;
      padding: 4px 8px;
    }

    .cmd-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text);
      font-weight: 700;
      font-size: 0.9rem;
      text-align: left;
      transition: background 0.15s ease;

      &:hover {
        background: var(--surface-hover);
        color: var(--primary);
      }

      kbd {
        margin-left: auto;
        font-size: 0.7rem;
        background: var(--background);
        padding: 2px 8px;
        border-radius: var(--radius-full);
      }
    }

    .item-text {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `]
})
export class CommandPaletteComponent {
  shortcutsService = inject(KeyboardShortcutsService);
  taskStore = inject(TaskStore);
  boardStore = inject(BoardStore);
  themeStore = inject(ThemeStore);
  private router = inject(Router);

  searchQuery = '';

  matchingTasks = () => {
    if (!this.searchQuery.trim()) return [];
    const q = this.searchQuery.toLowerCase();
    return this.taskStore.tasks().filter(t => t.title.toLowerCase().includes(q)).slice(0, 4);
  };

  matchingBoards = () => {
    if (!this.searchQuery.trim()) return [];
    const q = this.searchQuery.toLowerCase();
    return this.boardStore.boards().filter(b => b.name.toLowerCase().includes(q)).slice(0, 3);
  };

  close(): void {
    this.shortcutsService.toggleCommandPalette(false);
  }

  createTaskAction(): void {
    this.taskStore.createTask({ title: 'New Quick Task' });
    this.close();
  }

  toggleThemeAction(): void {
    this.themeStore.toggleDarkMode();
    this.close();
  }

  navigateAction(path: string): void {
    this.router.navigate([path]);
    this.close();
  }

  selectBoardAction(id: string): void {
    this.boardStore.selectBoard(id);
    this.router.navigate(['/boards']);
    this.close();
  }

  selectTaskAction(boardId: string): void {
    this.boardStore.selectBoard(boardId);
    this.router.navigate(['/boards']);
    this.close();
  }
}
