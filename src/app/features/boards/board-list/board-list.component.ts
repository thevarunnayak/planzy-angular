import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BoardStore } from '../../../core/stores/board.store';
import { TaskStore } from '../../../core/stores/task.store';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BoardDialogComponent } from '../../../shared/components/board-dialog/board-dialog.component';
import { TemplateLibraryDialogComponent } from '../../../shared/components/template-library-dialog/template-library-dialog.component';
import { ImportBoardDialogComponent } from '../../../shared/components/import-board-dialog/import-board-dialog.component';

@Component({
  selector: 'app-board-list',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    ConfirmDialogComponent,
    BoardDialogComponent,
    TemplateLibraryDialogComponent,
    ImportBoardDialogComponent
  ],
  template: `
    <div class="boards-page-view">
      <!-- Sticky Header Bar -->
      <div class="page-header glass-card sticky-header">
        <div class="header-left">
          <app-icon name="kanban" [size]="28"></app-icon>
          <div>
            <h2>My Workspace Boards</h2>
            <p>Organize projects, manage tasks, and streamline your workflow</p>
          </div>
        </div>

        <div class="header-right-actions">
          <button class="jelly-btn secondary" (click)="templateGalleryOpen.set(true)">
            <app-icon name="sparkles" [size]="16"></app-icon>
            <span class="hide-on-mobile">Starter Templates</span>
          </button>

          <button class="jelly-btn secondary" (click)="importModalOpen.set(true)">
            <app-icon name="folder" [size]="16"></app-icon>
            <span class="hide-on-mobile">Import Backup</span>
          </button>

          <button class="jelly-btn" (click)="openCreateBoardModal()">
            <app-icon name="plus" [size]="16"></app-icon>
            <span>New Board</span>
          </button>
        </div>
      </div>

      <!-- Boards Grid or Empty State -->
      @if (boardStore.boards().length > 0) {
        <div class="boards-grid">
          @for (board of boardStore.boards(); track board.id) {
            <div class="board-card glass-card" (click)="openBoard(board.id)">
              <div class="card-top">
                <div class="board-badge-icon">
                  <app-icon name="folder" [size]="20"></app-icon>
                </div>
                <div class="card-actions-menu">
                  <button class="icon-mini-btn" (click)="duplicateBoard($event, board.id)" title="Duplicate">
                    <app-icon name="copy" [size]="14"></app-icon>
                  </button>
                  <button class="icon-mini-btn danger" (click)="requestDeleteBoard($event, board.id)" title="Delete">
                    <app-icon name="trash" [size]="14"></app-icon>
                  </button>
                </div>
              </div>

              <h3 class="board-title">{{ board.name }}</h3>
              <p class="board-desc">{{ board.description || 'Custom Kanban Workspace' }}</p>

              <div class="card-footer">
                <span class="column-count">
                  <app-icon name="kanban" [size]="12"></app-icon>
                  {{ board.columns.length }} columns
                </span>
                <span class="task-count font-bold">
                  {{ getTaskCountForBoard(board.id) }} tasks
                </span>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Empty State Screen for Board List -->
        <div class="empty-boards-wrapper">
          <div class="empty-boards-card glass-card">
            <div class="empty-icon-wrap">
              <app-icon name="kanban" [size]="48"></app-icon>
            </div>
            <h3>No Boards Found</h3>
            <p>Your workspace is currently empty. Click the button below to create your first Kanban board or pick a starter template!</p>
            <div class="empty-actions-row">
              <button class="jelly-btn secondary" (click)="templateGalleryOpen.set(true)">
                <app-icon name="sparkles" [size]="16"></app-icon>
                <span>Starter Templates</span>
              </button>
              <button class="jelly-btn" (click)="openCreateBoardModal()">
                <app-icon name="plus" [size]="16"></app-icon>
                <span>Create Board</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Create Board Modal -->
      @if (boardStore.createModalOpen()) {
        <app-board-dialog
          (submitted)="onBoardSubmitted($event)"
          (cancelled)="boardStore.closeCreateModal()"
          (openTemplateGallery)="boardStore.closeCreateModal(); templateGalleryOpen.set(true)"
        ></app-board-dialog>
      }

      <!-- Starter Template Gallery Modal -->
      @if (templateGalleryOpen()) {
        <app-template-library-dialog
          (closed)="templateGalleryOpen.set(false)"
          (backToCreate)="templateGalleryOpen.set(false); boardStore.openCreateModal()"
        ></app-template-library-dialog>
      }

      <!-- Import Board Backup Modal -->
      @if (importModalOpen()) {
        <app-import-board-dialog
          (closed)="importModalOpen.set(false)"
        ></app-import-board-dialog>
      }

      <!-- Custom Confirmation Modal for Deleting Board -->
      @if (targetDeleteBoardId()) {
        <app-confirm-dialog
          title="Delete Workspace Board?"
          message="Are you sure you want to delete this board? All column data will be removed."
          confirmText="Delete Board"
          (confirmed)="confirmDeleteBoard()"
          (cancelled)="targetDeleteBoardId.set(null)"
        ></app-confirm-dialog>
      }
    </div>
  `,
  styles: [`
    .boards-page-view {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(12px);
    }

    .page-header {
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--primary);
      }

      h2 { font-size: 1.6rem; font-weight: 900; color: var(--text); }
      p { font-size: 0.88rem; color: var(--text-muted); margin-top: 2px; }
    }

    .boards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .board-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      cursor: pointer;
      border: 2px solid var(--border);
      transition: all 0.25s var(--transition-spring);

      &:hover {
        transform: translateY(-4px);
        border-color: var(--primary);
        box-shadow: var(--shadow-lg);
      }
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .board-badge-icon {
      width: 40px;
      height: 40px;
      background: var(--primary-light);
      color: var(--primary);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-actions-menu {
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

    .board-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text);
    }

    .board-desc {
      font-size: 0.82rem;
      color: var(--text-muted);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 8px;
      padding-top: 10px;
      border-top: 1.5px solid var(--border);
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .column-count {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .empty-boards-wrapper {
      padding: 60px 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-boards-card {
      padding: 40px;
      max-width: 440px;
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

      h3 { font-size: 1.4rem; font-weight: 900; color: var(--text); }
      p { font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; }
    }

    .header-right-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .empty-actions-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Mobile Responsive Header Layout (< 768px) */
    @media (max-width: 768px) {
      .boards-page-view {
        padding: 12px;
        gap: 16px;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 14px;
        padding: 16px;

        .header-left {
          width: 100%;
          align-items: flex-start;
        }

        h2 {
          font-size: 1.25rem;
          line-height: 1.3;
        }

        p {
          font-size: 0.8rem;
        }

        .header-right-actions {
          width: 100%;
          flex-direction: column;
          align-items: stretch;

          .jelly-btn {
            width: 100%;
            justify-content: center;
          }
        }
      }
    }
  `]
})
export class BoardListComponent {
  boardStore = inject(BoardStore);
  taskStore = inject(TaskStore);
  private router = inject(Router);

  targetDeleteBoardId = signal<string | null>(null);
  templateGalleryOpen = signal<boolean>(false);
  importModalOpen = signal<boolean>(false);

  getTaskCountForBoard(boardId: string): number {
    return this.taskStore.tasks().filter(t => t.boardId === boardId).length;
  }

  openBoard(boardId: string): void {
    this.boardStore.selectBoard(boardId);
    this.router.navigate(['/boards', boardId]);
  }

  openCreateBoardModal(): void {
    this.boardStore.openCreateModal();
  }

  onBoardSubmitted(dto: { name: string; description: string; emoji: string; isGroup: boolean }): void {
    const created = this.boardStore.createBoard(dto.name, dto.description, dto.emoji, dto.isGroup);
    this.boardStore.closeCreateModal();
    if (created) {
      this.openBoard(created.id);
    }
  }

  duplicateBoard(event: MouseEvent, boardId: string): void {
    event.stopPropagation();
    this.boardStore.duplicateBoard(boardId);
  }

  requestDeleteBoard(event: MouseEvent, boardId: string): void {
    event.stopPropagation();
    this.targetDeleteBoardId.set(boardId);
  }

  confirmDeleteBoard(): void {
    const id = this.targetDeleteBoardId();
    if (id) {
      this.boardStore.deleteBoard(id);
      this.targetDeleteBoardId.set(null);
    }
  }
}
