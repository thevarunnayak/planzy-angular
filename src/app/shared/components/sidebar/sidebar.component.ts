import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { BoardStore } from '../../../core/stores/board.store';
import { TaskStore } from '../../../core/stores/task.store';
import { ThemeStore } from '../../../core/stores/theme.store';
import { LayoutService } from '../../../core/services/layout.service';
import { AppwriteService } from '../../../core/services/appwrite.service';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { IconComponent } from '../icon/icon.component';
import { InvitationInboxDialogComponent } from '../invitation-inbox-dialog/invitation-inbox-dialog.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TooltipDirective,
    IconComponent,
    InvitationInboxDialogComponent
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

      <!-- Sticky Header inside Drawer -->
      <div class="drawer-sticky-header">
        <div class="sidebar-mobile-header">
          <div class="mobile-title">
            <app-icon name="mascot" [size]="22"></app-icon>
            <span>Workspace Menu</span>
          </div>

          <div class="mobile-header-actions">
            <!-- Close Drawer Button -->
            <button class="close-drawer-btn" (click)="layoutService.closeMobileSidebar()">
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Scrollable Body Content inside Drawer -->
      <div class="drawer-scroll-body custom-scroll-body">
        <!-- Workspace Invitations Row inside Drawer -->
        @if (appwriteService.isLoggedIn() && appwriteService.pendingInvitations().length > 0) {
          <button class="nav-item invite-drawer-btn" (click)="invitationModalOpen.set(true); onNavClick()">
            <app-icon name="sparkles" [size]="18"></app-icon>
            <span class="nav-text">Board Invitations</span>
            <span class="nav-badge danger-badge">{{ appwriteService.pendingInvitations().length }}</span>
          </button>
        }

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
            @if (userFavoriteTasksCount() > 0) {
              <span class="nav-badge">{{ userFavoriteTasksCount() }}</span>
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
              <a
                [routerLink]="['/boards', board.id]"
                routerLinkActive="active"
                class="board-item"
                (click)="onBoardClick(board.id)"
              >
                <app-icon name="folder" [size]="16"></app-icon>
                <span class="board-name">{{ board.name }}</span>
              </a>
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

        <!-- Settings & Theme & Sign Out Pinned at Bottom of Content -->
        <div class="sidebar-bottom-section">
          <!-- Theme Mode Switcher Button -->
          <button class="nav-item theme-drawer-btn" (click)="themeStore.toggleDarkMode()">
            <app-icon [name]="themeStore.darkMode() ? 'sun' : 'moon'" [size]="18"></app-icon>
            <span class="nav-text">Theme: {{ themeStore.darkMode() ? 'Dark' : 'Light' }} Mode</span>
          </button>

          <a routerLink="/settings" routerLinkActive="active" class="nav-item settings-item" (click)="onNavClick()">
            <app-icon name="settings" [size]="18"></app-icon>
            <span class="nav-text">Settings</span>
          </a>

          @if (appwriteService.isLoggedIn()) {
            <button class="nav-item signout-item" (click)="logoutMobile()">
              <app-icon name="x" [size]="18"></app-icon>
              <span class="nav-text">Sign Out</span>
            </button>
          } @else {
            <button class="nav-item signin-item" (click)="signinMobile()">
              <app-icon name="target" [size]="18"></app-icon>
              <span class="nav-text">Sign In</span>
            </button>
          }
        </div>
      </div>
    </aside>

    <!-- Pending Invitations Inbox Modal inside Drawer -->
    @if (invitationModalOpen()) {
      <app-invitation-inbox-dialog
        (closed)="invitationModalOpen.set(false)"
      ></app-invitation-inbox-dialog>
    }
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
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      height: calc(100vh - 72px);
      position: sticky;
      top: 72px;
      z-index: 900;
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* Sticky Drawer Header Styling */
    .drawer-sticky-header {
      position: sticky;
      top: 0;
      background: var(--surface);
      z-index: 10;
      padding-bottom: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .sidebar-mobile-header {
      display: none;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 8px;
      border-bottom: 1.5px solid var(--border);
    }

    .mobile-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
      font-weight: 900;
      color: var(--text);
    }

    .mobile-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon-btn {
      background: var(--background);
      border: 1.5px solid var(--border);
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text);
      cursor: pointer;
      transition: transform 0.2s ease;

      &:hover {
        transform: scale(1.08);
        border-color: var(--primary);
      }
    }

    .close-drawer-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
    }

    /* Scrollable Body Content inside Drawer */
    .drawer-scroll-body {
      flex: 1;
      overflow-y: auto;
      overscroll-behavior: contain;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-right: 4px;
      padding-top: 10px;
      scrollbar-width: thin;
      scrollbar-color: var(--border) transparent;

      &::-webkit-scrollbar {
        width: 5px;
      }
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: var(--radius-full);
      }
    }

    .theme-drawer-btn {
      background: var(--background);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      cursor: pointer;
      width: 100%;

      &:hover {
        border-color: var(--primary);
        color: var(--primary);
      }
    }

    .invite-drawer-btn {
      background: var(--primary-light);
      border: 1.5px solid var(--primary-light);
      border-radius: var(--radius-md);
      color: var(--primary);
      cursor: pointer;
      width: 100%;
    }

    .drawer-pill-handle {
      display: none;
      width: 44px;
      height: 5px;
      background: var(--border);
      border-radius: var(--radius-full);
      margin: 0 auto 8px auto;
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .section-label {
      font-size: 0.7rem;
      font-weight: 900;
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

    .signout-item {
      background: transparent;
      border: none;
      width: 100%;
      color: var(--danger) !important;
      cursor: pointer;

      &:hover {
        background: rgba(230, 57, 70, 0.1) !important;
        color: var(--danger) !important;
      }
    }

    .signin-item {
      background: var(--primary-light);
      border: none;
      width: 100%;
      color: var(--primary) !important;
      cursor: pointer;
    }

    .nav-badge {
      margin-left: auto;
      background: #F59E0B;
      color: white;
      font-size: 0.7rem;
      font-weight: 900;
      padding: 2px 7px;
      border-radius: var(--radius-full);

      &.danger-badge {
        background: var(--danger);
      }
    }

    .boards-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-right: 6px;
    }

    .boards-header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .add-board-mini-btn {
      background: transparent;
      border: none;
      color: var(--primary);
      font-weight: 800;
      font-size: 0.75rem;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: var(--radius-sm);

      &:hover {
        background: var(--primary-light);
      }
    }

    .boards-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 180px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .board-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-weight: 700;
      font-size: 0.85rem;
      width: 100%;
      cursor: pointer;
      text-align: left;
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        background: var(--surface-hover);
        color: var(--text);
      }

      &.active {
        background: var(--surface-hover);
        color: var(--primary);
        font-weight: 900;
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
      text-align: center;
    }

    .mobile-quick-task-btn-wrap {
      display: none;
      margin-top: 10px;
    }

    .sidebar-bottom-section {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1.5px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 6px;
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
        max-height: 85vh !important;
        border-radius: 28px 28px 0 0 !important;
        border-top: 2.5px solid var(--border) !important;
        border-right: none !important;
        transform: translateY(100%);
        box-shadow: 0 -12px 32px rgba(0, 0, 0, 0.25);
        z-index: 2000 !important;
        padding: 16px 20px 24px 20px !important;
        overflow-y: hidden; /* Uses inner drawer-scroll-body */
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
  themeStore = inject(ThemeStore);
  layoutService = inject(LayoutService);
  appwriteService = inject(AppwriteService);
  private router = inject(Router);

  invitationModalOpen = signal(false);

  userFavoriteTasksCount = computed(() => {
    const validBoardIds = new Set(this.boardStore.boards().map(b => b.id));
    return this.taskStore.tasks().filter(t => t.isFavorite && validBoardIds.has(t.boardId)).length;
  });

  onBoardClick(id: string): void {
    this.boardStore.selectBoard(id);
    this.layoutService.closeMobileSidebar();
  }

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

  logoutMobile(): void {
    this.layoutService.closeMobileSidebar();
    this.appwriteService.logout();
  }

  signinMobile(): void {
    this.layoutService.closeMobileSidebar();
    this.appwriteService.openAuthModal();
  }

  onNavClick(): void {
    this.layoutService.closeMobileSidebar();
  }
}
