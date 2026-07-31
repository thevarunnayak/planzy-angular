import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { BoardStore } from '../../../core/stores/board.store';
import { TaskStore } from '../../../core/stores/task.store';
import { LayoutService } from '../../../core/services/layout.service';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TooltipDirective,
    IconComponent
  ],
  template: `
    <!-- Mobile Off-Canvas Backdrop -->
    @if (layoutService.mobileSidebarOpen()) {
      <div class="sidebar-backdrop fade-in" (click)="layoutService.closeMobileSidebar()"></div>
    }

    <!-- Sidebar Aside Element (Becomes Bottom-Up Drawer on Mobile) -->
    <aside class="sidebar" [class.mobile-open]="layoutService.mobileSidebarOpen()">
      <!-- Tactile Handle Pill for Mobile Bottom Sheet -->
      <div class="drawer-pill-handle"></div>

      <div class="sidebar-mobile-header">
        <div class="mobile-title">
          <app-icon name="mascot" [size]="22"></app-icon>
          <span>Workspace Menu</span>
        </div>
        <button class="close-drawer-btn" (click)="layoutService.closeMobileSidebar()">
          <app-icon name="x" [size]="18"></app-icon>
        </button>
      </div>

      <nav class="nav-section">
        <span class="section-label">MAIN MENU</span>

        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <app-icon name="dashboard" [size]="18"></app-icon>
          <span class="nav-text">Dashboard</span>
        </a>

        <a routerLink="/focus" routerLinkActive="active" class="nav-item" (click)="onNavClick()" appTooltip="Focus Session Studio">
          <app-icon name="meditation" [size]="18"></app-icon>
          <span class="nav-text">Focus Session</span>
        </a>

        <a routerLink="/starred" routerLinkActive="active" class="nav-item starred-nav-item" (click)="onNavClick()">
          <app-icon name="star" [size]="18"></app-icon>
          <span class="nav-text">Starred Tasks</span>
          @if (taskStore.favoriteTasksCount() > 0) {
            <span class="nav-badge">{{ taskStore.favoriteTasksCount() }}</span>
          }
        </a>

        <a routerLink="/boards" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <app-icon name="kanban" [size]="18"></app-icon>
          <span class="nav-text">Kanban Boards</span>
        </a>

        <a routerLink="/calendar" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <app-icon name="calendar" [size]="18"></app-icon>
          <span class="nav-text">Planner Calendar</span>
        </a>
      </nav>

      <div class="nav-section boards-section">
        <div class="boards-header">
          <span class="section-label">MY BOARDS</span>
          <button class="add-board-mini-btn" (click)="openCreateBoardModal()" appTooltip="Create New Board">+ New</button>
        </div>

        <div class="boards-list custom-scroll-body">
          @for (board of boardStore.boards(); track board.id) {
            <button
              class="board-item"
              [class.active]="boardStore.activeBoardId() === board.id"
              (click)="selectBoard(board.id)"
            >
              <app-icon name="folder" [size]="16"></app-icon>
              <span class="board-name">{{ board.name }}</span>
            </button>
          } @empty {
            <div class="empty-sidebar-boards">
              <span>No boards yet</span>
            </div>
          }
        </div>
      </div>

      <!-- Quick Task Creation inside Bottom Drawer for Mobile -->
      <div class="mobile-quick-task-btn-wrap">
        <button class="jelly-btn width-full" (click)="handleMobileCreateTask()">
          <app-icon name="plus" [size]="16"></app-icon>
          <span>Create New Task</span>
        </button>
      </div>

      <!-- Settings Pinned to Bottom -->
      <div class="sidebar-bottom-section">
        <a routerLink="/settings" routerLinkActive="active" class="nav-item settings-item" (click)="onNavClick()">
          <app-icon name="settings" [size]="18"></app-icon>
          <span class="nav-text">Settings</span>
        </a>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(18, 24, 36, 0.65);
      backdrop-filter: blur(6px);
      z-index: 1999;
    }

    .sidebar {
      width: 250px;
      min-width: 250px;
      background: var(--surface);
      border-right: 2px solid var(--border);
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: calc(100vh - 72px);
      position: sticky;
      top: 72px;
      z-index: 900;
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .drawer-pill-handle {
      display: none;
      width: 48px;
      height: 5px;
      background: var(--border);
      border-radius: var(--radius-full);
      margin: 0 auto 6px auto;
    }

    .sidebar-mobile-header {
      display: none;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 12px;
      border-bottom: 1.5px solid var(--border);

      .mobile-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 800;
        color: var(--primary);
        font-size: 1rem;
      }
    }

    .close-drawer-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .section-label {
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--text-muted);
      letter-spacing: 0.8px;
      padding: 0 10px;
      margin-bottom: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      color: var(--text);
      text-decoration: none;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      position: relative;

      &:hover {
        background: var(--surface-hover);
        color: var(--primary);
        transform: translateX(4px);
      }

      &.active {
        background: var(--primary-light);
        color: var(--primary);
      }
    }

    .starred-nav-item app-icon {
      color: #F59E0B;
    }

    .nav-badge {
      margin-left: auto;
      background: #F59E0B;
      color: white;
      font-size: 0.7rem;
      font-weight: 900;
      padding: 2px 7px;
      border-radius: var(--radius-full);
    }

    .boards-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-right: 6px;
    }

    .add-board-mini-btn {
      background: var(--secondary);
      color: var(--text);
      border: none;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 800;
      cursor: pointer;
      transition: transform 0.2s ease;

      &:hover {
        transform: scale(1.08);
        background: var(--primary);
        color: white;
      }
    }

    .boards-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 180px;
      overflow-y: auto;
    }

    .board-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      color: var(--text);
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
      width: 100%;

      &:hover {
        background: var(--background);
      }

      &.active {
        background: var(--primary-light);
        color: var(--primary);
      }
    }

    .board-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .empty-sidebar-boards {
      padding: 10px;
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 700;
      font-style: italic;
    }

    .mobile-quick-task-btn-wrap {
      display: none;

      .width-full {
        width: 100%;
        justify-content: center;
      }
    }

    .sidebar-bottom-section {
      margin-top: auto;
      padding-top: 12px;
      border-top: 1.5px solid var(--border);
    }

    .settings-item {
      color: var(--text);
    }

    /* Responsive Bottom-Up Sheet Drawer on Small Devices (< 991px) */
    @media (max-width: 991px) {
      .sidebar {
        position: fixed !important;
        bottom: 0 !important;
        top: auto !important;
        left: 0 !important;
        right: 0 !important;
        width: 100vw !important;
        min-width: 100vw !important;
        height: auto !important;
        max-height: 82vh !important;
        border-radius: 28px 28px 0 0 !important;
        border-top: 2.5px solid var(--border) !important;
        border-right: none !important;
        transform: translateY(100%);
        box-shadow: 0 -12px 32px rgba(0, 0, 0, 0.25);
        z-index: 2000 !important;
        padding: 16px 20px 24px 20px !important;
        overflow-y: auto;
      }

      .sidebar.mobile-open {
        transform: translateY(0);
      }

      .drawer-pill-handle {
        display: block;
      }

      .sidebar-mobile-header {
        display: flex;
      }

      .mobile-quick-task-btn-wrap {
        display: block;
      }
    }
  `]
})
export class SidebarComponent {
  boardStore = inject(BoardStore);
  taskStore = inject(TaskStore);
  layoutService = inject(LayoutService);
  private router = inject(Router);

  selectBoard(id: string): void {
    this.boardStore.selectBoard(id);
    this.router.navigate(['/boards', id]);
    this.layoutService.closeMobileSidebar();
  }

  openCreateBoardModal(): void {
    this.boardStore.openCreateModal();
    this.layoutService.closeMobileSidebar();
  }

  handleMobileCreateTask(): void {
    this.layoutService.closeMobileSidebar();
    this.taskStore.openCreateModal();
  }

  onNavClick(): void {
    this.layoutService.closeMobileSidebar();
  }
}
