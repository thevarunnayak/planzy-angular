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
      <!-- Navbar Left Brand Logo -->
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

      <!-- Navbar Right Actions -->
      <div class="navbar-right">
        <!-- Command Palette Trigger -->
        <button class="cmd-palette-btn" (click)="openCmdPalette()" appTooltip="Search & Commands (Ctrl+K)">
          <app-icon name="search" [size]="16"></app-icon>
          <span class="cmd-label hide-on-mobile">Search...</span>
          <kbd class="cmd-kbd hide-on-mobile">Ctrl+K</kbd>
        </button>

        <!-- Workspace Board Invitations Checking Button -->
        @if (appwriteService.isLoggedIn()) {
          <button
            class="icon-btn invite-bell-btn"
            (click)="invitationModalOpen.set(true)"
            appTooltip="Check Workspace Board Invitations"
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

        <!-- Standalone Clean Avatar Circle Button Trigger -->
        @if (appwriteService.isLoggedIn()) {
          <div class="user-avatar-btn" (click)="toggleAvatarMenu($event)" appTooltip="Account Options & Theme">
            <div class="user-avatar-badge">
              {{ (appwriteService.currentUser()?.name || appwriteService.currentUser()?.email || 'U').charAt(0).toUpperCase() }}
            </div>

            @if (userMenuOpen()) {
              <div class="user-dropdown-menu glass-card fade-in" (click)="$event.stopPropagation()">
                <div class="user-info-row">
                  <div class="dropdown-avatar-circle">
                    {{ (appwriteService.currentUser()?.name || 'U').charAt(0).toUpperCase() }}
                  </div>
                  <div class="dropdown-user-details">
                    <strong class="user-name-title">{{ appwriteService.currentUser()?.name }}</strong>
                    <span class="user-email-sub">{{ appwriteService.currentUser()?.email }}</span>
                  </div>
                </div>

                <div class="dropdown-divider"></div>

                <!-- Theme Mode Switcher inside Menu -->
                <button class="dropdown-item" (click)="themeStore.toggleDarkMode()">
                  <app-icon [name]="themeStore.darkMode() ? 'sun' : 'moon'" [size]="16"></app-icon>
                  <span>Theme: {{ themeStore.darkMode() ? 'Dark' : 'Light' }}</span>
                </button>

                <!-- Workspace Invitations Option inside Menu -->
                @if (appwriteService.pendingInvitations().length > 0) {
                  <button class="dropdown-item" (click)="invitationModalOpen.set(true); userMenuOpen.set(false)">
                    <app-icon name="sparkles" [size]="16"></app-icon>
                    <span>Invitations ({{ appwriteService.pendingInvitations().length }})</span>
                  </button>
                }

                <div class="dropdown-divider"></div>

                <!-- Direct Sign Out Button -->
                <button class="dropdown-item danger" (click)="appwriteService.logout(); userMenuOpen.set(false)">
                  <app-icon name="x" [size]="16"></app-icon>
                  <span>Sign Out</span>
                </button>
              </div>
            }
          </div>
        } @else {
          <!-- Guest Account Avatar Menu Button -->
          <div class="user-avatar-btn guest" (click)="toggleAvatarMenu($event)" appTooltip="Account Options & Theme">
            <div class="user-avatar-badge guest-badge">
              <app-icon name="user" [size]="18"></app-icon>
            </div>

            @if (userMenuOpen()) {
              <div class="user-dropdown-menu glass-card fade-in" (click)="$event.stopPropagation()">
                <!-- Theme Mode Switcher inside Menu -->
                <button class="dropdown-item" (click)="themeStore.toggleDarkMode()">
                  <app-icon [name]="themeStore.darkMode() ? 'sun' : 'moon'" [size]="16"></app-icon>
                  <span>Theme: {{ themeStore.darkMode() ? 'Dark' : 'Light' }}</span>
                </button>

                <div class="dropdown-divider"></div>

                <button class="dropdown-item primary" (click)="appwriteService.openAuthModal(); userMenuOpen.set(false)">
                  <app-icon name="target" [size]="16"></app-icon>
                  <span>Sign In / Create Account</span>
                </button>
              </div>
            }
          </div>
        }
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
      gap: 12px;
      text-decoration: none;
    }

    .brand-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 4px 10px rgba(58, 134, 255, 0.3));
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.45rem;
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
      gap: 12px;
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

    .navbar-btn {
      padding: 8px 14px;
      font-size: 0.85rem;
    }

    .user-avatar-btn {
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }

    .user-avatar-badge {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background: var(--primary);
      color: white;
      font-weight: 900;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      border: 2px solid transparent;

      &:hover {
        transform: scale(1.06);
        border-color: var(--primary);
        box-shadow: 0 4px 12px rgba(58, 134, 255, 0.35);
      }

      &.guest-badge {
        background: var(--background);
        border: 1.5px solid var(--border);
        color: var(--text-muted);

        &:hover {
          color: var(--primary);
        }
      }
    }

    .user-dropdown-menu {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 230px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 2000;
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);

      .user-info-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 4px 10px 4px;
      }

      .dropdown-avatar-circle {
        width: 34px;
        height: 34px;
        border-radius: var(--radius-full);
        background: var(--primary);
        color: white;
        font-weight: 900;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .dropdown-user-details {
        display: flex;
        flex-direction: column;
        gap: 1px;
        overflow: hidden;

        .user-name-title {
          font-size: 0.88rem;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-email-sub {
          font-size: 0.72rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .dropdown-divider {
        height: 1px;
        background: var(--border);
        margin: 4px 0;
      }

      .dropdown-item {
        background: transparent;
        border: none;
        padding: 9px 12px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.84rem;
        font-weight: 800;
        cursor: pointer;
        color: var(--text);
        width: 100%;
        transition: background 0.15s ease;

        &:hover {
          background: var(--background);
        }

        &.primary {
          color: var(--primary);
          background: var(--primary-light);
        }

        &.danger {
          color: var(--danger);
          &:hover {
            background: rgba(230, 57, 70, 0.1);
          }
        }
      }
    }

    @media (max-width: 991px) {
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

  toggleAvatarMenu(event: MouseEvent): void {
    event.stopPropagation();
    if (window.innerWidth <= 991) {
      this.userMenuOpen.set(false);
      this.layoutService.toggleMobileSidebar();
    } else {
      this.userMenuOpen.set(!this.userMenuOpen());
    }
  }

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
