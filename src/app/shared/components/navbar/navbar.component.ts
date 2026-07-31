import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BoardStore } from '../../../core/stores/board.store';
import { TaskStore } from '../../../core/stores/task.store';
import { ThemeStore } from '../../../core/stores/theme.store';
import { LayoutService } from '../../../core/services/layout.service';
import { AppwriteService } from '../../../core/services/appwrite.service';
import { KeyboardShortcutsService } from '../../../core/services/keyboard-shortcuts.service';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { IconComponent } from '../icon/icon.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { InvitationInboxDialogComponent } from '../invitation-inbox-dialog/invitation-inbox-dialog.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TooltipDirective,
    IconComponent,
    ConfirmDialogComponent,
    InvitationInboxDialogComponent
  ],
  template: `
    <header class="navbar">
      <!-- Navbar Left Brand Logo (Clean, Prominent & Uncluttered) -->
      <div class="navbar-left">
        <a routerLink="/" class="brand">
          <div class="brand-badge">
            <app-icon name="mascot" [size]="38"></app-icon>
          </div>
          <div class="brand-text">
            <span class="brand-name">Planzy</span>
            <span class="brand-tagline hide-on-mobile">Plan Happy. Do More.</span>
          </div>
        </a>
      </div>

      <!-- Navbar Right Actions & User Profile Auth Trigger -->
      <div class="navbar-right">
        <!-- Command Palette Trigger -->
        <button class="cmd-palette-btn" (click)="openCmdPalette()" appTooltip="Search & Commands (Ctrl+K)">
          <app-icon name="search" [size]="16"></app-icon>
          <span class="cmd-label hide-on-mobile">Search...</span>
          <kbd class="cmd-kbd hide-on-mobile">Ctrl+K</kbd>
        </button>

        <!-- Theme Mode Switcher Button -->
        <button class="icon-btn" (click)="themeStore.toggleDarkMode()" appTooltip="Toggle Dark/Light Mode">
          @if (themeStore.darkMode()) {
            <app-icon name="sun" [size]="18"></app-icon>
          } @else {
            <app-icon name="moon" [size]="18"></app-icon>
          }
        </button>

        <!-- Pending Invitations Bell Button -->
        @if (appwriteService.isLoggedIn()) {
          <button
            class="icon-btn invite-bell-btn"
            (click)="invitationModalOpen.set(true)"
            appTooltip="Workspace Board Invitations"
          >
            <app-icon name="sparkles" [size]="18"></app-icon>
            @if (appwriteService.pendingInvitations().length > 0) {
              <span class="notification-badge">{{ appwriteService.pendingInvitations().length }}</span>
            }
          </button>
        }

        <!-- Desktop-Only Quick Create Board Button -->
        <button class="jelly-btn secondary navbar-btn hide-on-mobile" (click)="openCreateBoardModal()" appTooltip="Create New Board">
          <app-icon name="plus" [size]="14"></app-icon>
          <span>Board</span>
        </button>

        <!-- Desktop-Only Quick Create Task Button -->
        <button class="jelly-btn navbar-btn hide-on-mobile" (click)="handleCreateTaskClick()" appTooltip="Add New Task">
          <app-icon name="plus" [size]="14"></app-icon>
          <span>Task</span>
        </button>

        <!-- Auth User Profile / Sign In Button -->
        @if (appwriteService.isLoggedIn()) {
          <div class="user-pill-wrap" (click)="userMenuOpen.set(!userMenuOpen())" appTooltip="Account Options">
            <div class="user-avatar-badge">
              {{ (appwriteService.currentUser()?.name || 'U').charAt(0).toUpperCase() }}
            </div>
            <span class="user-email-name hide-on-mobile">{{ appwriteService.currentUser()?.name }}</span>

            @if (userMenuOpen()) {
              <div class="user-dropdown-menu glass-card fade-in" (click)="$event.stopPropagation()">
                <div class="user-info-row">
                  <strong>{{ appwriteService.currentUser()?.name }}</strong>
                  <span class="user-email-sub">{{ appwriteService.currentUser()?.email }}</span>
                </div>
                <button class="dropdown-item danger" (click)="appwriteService.logout(); userMenuOpen.set(false)">
                  <app-icon name="x" [size]="14"></app-icon>
                  <span>Sign Out</span>
                </button>
              </div>
            }
          </div>
        } @else {
          <button class="jelly-btn secondary navbar-btn auth-btn" (click)="appwriteService.openAuthModal()" appTooltip="Sign In / Sync Cloud">
            <app-icon name="target" [size]="16"></app-icon>
            <span>Sign In</span>
          </button>
        }

        <!-- Right-Side 3-Line Hamburger Menu Button for Small Devices -->
        <button
          class="icon-btn mobile-menu-toggle-btn"
          (click)="layoutService.toggleMobileSidebar()"
          appTooltip="Open Workspace Menu"
        >
          <app-icon name="menu" [size]="20"></app-icon>
        </button>
      </div>

      <!-- Pending Invitations Inbox Modal -->
      @if (invitationModalOpen()) {
        <app-invitation-inbox-dialog
          (closed)="invitationModalOpen.set(false)"
        ></app-invitation-inbox-dialog>
      }

      <!-- No Boards Available Prompt Modal -->
      @if (noBoardsPromptOpen()) {
        <app-confirm-dialog
          title="No Boards Available"
          message="You don't have any workspace boards created yet. Would you like to create a board first?"
          confirmText="Create a Board"
          cancelText="Cancel"
          [isDanger]="false"
          (confirmed)="onCreateBoardPromptConfirm()"
          (cancelled)="noBoardsPromptOpen.set(false)"
        ></app-confirm-dialog>
      }
    </header>
  `,
  styles: [`
    .navbar {
      height: 72px;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--surface);
      border-bottom: 2px solid var(--border);
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      width: 100vw !important;
      z-index: 1000 !important;
      box-shadow: var(--shadow-sm);
    }

    .navbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--text);
    }

    .brand-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      padding: 0;
      border-radius: 0;
      transition: transform 0.25s var(--transition-spring);

      &:hover {
        transform: scale(1.1) rotate(5deg);
      }
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.4rem;
      font-weight: 900;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }

    .brand-tagline {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.2px;
    }

    .navbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .cmd-palette-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--background);
      border: 1.5px solid var(--border);
      padding: 8px 14px;
      border-radius: var(--radius-full);
      color: var(--text-muted);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--primary);
        color: var(--text);
      }

      kbd {
        background: var(--surface);
        border: 1px solid var(--border);
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 800;
      }
    }

    .icon-btn {
      background: var(--background);
      border: 1.5px solid var(--border);
      width: 42px;
      height: 42px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text);
      cursor: pointer;
      transition: transform 0.2s ease;
      position: relative;

      &:hover {
        transform: scale(1.08);
        border-color: var(--primary);
      }
    }

    .invite-bell-btn {
      color: var(--primary);
    }

    .notification-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: var(--danger);
      color: white;
      font-size: 0.68rem;
      font-weight: 900;
      width: 18px;
      height: 18px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .mobile-menu-toggle-btn {
      display: none;
      background: var(--primary-light);
      color: var(--primary);
      border-color: var(--primary-light);
    }

    .navbar-btn {
      padding: 8px 14px;
      font-size: 0.85rem;
    }

    .user-pill-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--background);
      border: 1.5px solid var(--border);
      padding: 4px 12px 4px 6px;
      border-radius: var(--radius-full);
      cursor: pointer;
      position: relative;
      user-select: none;

      &:hover {
        border-color: var(--primary);
      }
    }

    .user-avatar-badge {
      width: 30px;
      height: 30px;
      border-radius: var(--radius-full);
      background: var(--primary);
      color: white;
      font-weight: 900;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-email-name {
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--text);
    }

    .user-dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 200px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 2000;

      .user-info-row {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-bottom: 8px;
        border-bottom: 1.5px solid var(--border);
        strong { font-size: 0.88rem; color: var(--text); }
        .user-email-sub { font-size: 0.72rem; color: var(--text-muted); }
      }

      .dropdown-item {
        background: transparent;
        border: none;
        padding: 8px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.82rem;
        font-weight: 800;
        cursor: pointer;
        color: var(--text);

        &.danger {
          color: var(--danger);
          &:hover { background: var(--danger-light); }
        }
      }
    }

    /* Small Screen Responsive Styles (< 991px and < 768px) */
    @media (max-width: 991px) {
      .mobile-menu-toggle-btn {
        display: flex;
      }
      .hide-on-mobile {
        display: none !important;
      }
    }

    @media (max-width: 576px) {
      .navbar {
        padding: 0 14px;
      }
      .cmd-palette-btn {
        padding: 8px;
        border-radius: var(--radius-full);
      }
    }
  `]
})
export class NavbarComponent {
  boardStore = inject(BoardStore);
  taskStore = inject(TaskStore);
  themeStore = inject(ThemeStore);
  layoutService = inject(LayoutService);
  appwriteService = inject(AppwriteService);
  private shortcutsService = inject(KeyboardShortcutsService);

  noBoardsPromptOpen = signal(false);
  userMenuOpen = signal(false);
  invitationModalOpen = signal(false);

  openCmdPalette(): void {
    this.shortcutsService.toggleCommandPalette(true);
  }

  openCreateBoardModal(): void {
    this.boardStore.openCreateModal();
  }

  handleCreateTaskClick(): void {
    if (this.boardStore.boards().length === 0) {
      this.noBoardsPromptOpen.set(true);
    } else {
      this.taskStore.openCreateModal();
    }
  }

  onCreateBoardPromptConfirm(): void {
    this.noBoardsPromptOpen.set(false);
    this.boardStore.openCreateModal();
  }
}
