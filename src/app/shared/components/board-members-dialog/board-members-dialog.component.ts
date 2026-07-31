import { Component, inject, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardStore } from '../../../core/stores/board.store';
import { AppwriteService } from '../../../core/services/appwrite.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BoardMember, MemberRole } from '../../../core/models/board.model';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';
import { BadgeComponent } from '../badge/badge.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-board-members-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent, BadgeComponent, IconComponent],
  template: `
    <app-modal
      title="Board Members & Access Control"
      icon="target"
      maxWidth="540px"
      (closed)="closed.emit()"
    >
      <div class="dialog-body">
        <!-- Tabs Header -->
        <div class="tab-bar">
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab() === 'members'"
            (click)="activeTab.set('members')"
          >
            <app-icon name="folder" [size]="14"></app-icon>
            <span>Active Members ({{ members().length }})</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab() === 'invite'"
            (click)="activeTab.set('invite')"
          >
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Invite Member</span>
          </button>
        </div>

        <!-- Tab 1: Active Members List -->
        @if (activeTab() === 'members') {
          <div class="members-list custom-scroll-body">
            @for (mem of members(); track mem.userId + '-' + $index) {
              <div class="member-card">
                <div class="member-left">
                  <div class="member-avatar">
                    {{ (mem.name || mem.email || 'M').charAt(0).toUpperCase() }}
                  </div>
                  <div class="member-details">
                    <strong class="member-name">{{ mem.name }}</strong>
                    <span class="member-email">{{ mem.email }}</span>
                  </div>
                </div>

                <div class="member-right">
                  @if (mem.role === 'owner') {
                    <app-badge variant="urgent" size="sm">Owner</app-badge>
                  } @else if (canManageRoles()) {
                    <div class="role-select-wrap">
                      <select
                        class="role-dropdown"
                        [ngModel]="mem.role"
                        (ngModelChange)="changeRole(mem.userId, $event)"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>

                      <button
                        type="button"
                        class="remove-btn"
                        (click)="removeMember(mem.userId)"
                        title="Remove Member"
                      >
                        <app-icon name="trash" [size]="14"></app-icon>
                      </button>
                    </div>
                  } @else {
                    <app-badge [variant]="mem.role === 'admin' ? 'high' : 'secondary'" size="sm">
                      {{ mem.role === 'admin' ? 'Admin' : 'Member' }}
                    </app-badge>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Tab 2: Invite Member Form -->
        @if (activeTab() === 'invite') {
          <form (ngSubmit)="sendInvite()" class="invite-form">
            <div class="form-group">
              <label>Member Email Address</label>
              <input
                type="email"
                class="form-input"
                placeholder="e.g. colleague@company.com"
                [(ngModel)]="inviteEmail"
                name="inviteEmail"
                required
                autofocus
              />
            </div>

            <div class="form-group">
              <label>Initial Permission Role</label>
              <div class="role-radio-group">
                <label class="role-radio-btn" [class.selected]="inviteRole === 'member'">
                  <input
                    type="radio"
                    name="inviteRole"
                    value="member"
                    [(ngModel)]="inviteRole"
                  />
                  <div class="role-text">
                    <strong>Member</strong>
                    <span>Can move tasks & add comments (No task creation)</span>
                  </div>
                </label>

                <label class="role-radio-btn" [class.selected]="inviteRole === 'admin'">
                  <input
                    type="radio"
                    name="inviteRole"
                    value="admin"
                    [(ngModel)]="inviteRole"
                  />
                  <div class="role-text">
                    <strong>Admin</strong>
                    <span>Can create/edit tasks & manage board settings</span>
                  </div>
                </label>
              </div>
            </div>

            <div class="form-actions">
              <app-button type="submit" [disabled]="!inviteEmail.trim() || sending()">
                {{ sending() ? 'Sending...' : 'Send Invitation' }}
              </app-button>
            </div>
          </form>
        }
      </div>
    </app-modal>
  `,
  styles: [`
    .dialog-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .tab-bar {
      display: flex;
      gap: 8px;
      border-bottom: 1.5px solid var(--border);
      padding-bottom: 8px;
    }

    .tab-btn {
      background: transparent;
      border: none;
      padding: 8px 14px;
      border-radius: var(--radius-md);
      font-weight: 800;
      font-size: 0.84rem;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;

      &:hover, &.active {
        color: var(--primary);
        background: var(--primary-light);
      }
    }

    .members-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 320px;
      overflow-y: auto;
    }

    .member-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      background: var(--background);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
    }

    .member-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .member-avatar {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-full);
      background: var(--primary);
      color: white;
      font-weight: 900;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .member-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      .member-name { font-size: 0.88rem; color: var(--text); }
      .member-email { font-size: 0.72rem; color: var(--text-muted); }
    }

    .role-select-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .role-dropdown {
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      border: 1.5px solid var(--border);
      background: var(--surface);
      color: var(--text);
      font-size: 0.78rem;
      font-weight: 800;
      outline: none;
    }

    .remove-btn {
      background: transparent;
      border: none;
      color: var(--danger);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      border-radius: var(--radius-sm);
      &:hover { background: var(--danger-light); }
    }

    .invite-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
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

    .form-input {
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

    .role-radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .role-radio-btn {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      background: var(--background);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      cursor: pointer;

      &.selected {
        border-color: var(--primary);
        background: var(--surface);
      }

      input { margin-top: 3px; accent-color: var(--primary); }

      .role-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        strong { font-size: 0.85rem; color: var(--text); }
        span { font-size: 0.74rem; color: var(--text-muted); }
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class BoardMembersDialogComponent {
  private boardStore = inject(BoardStore);
  private appwriteService = inject(AppwriteService);
  private notificationService = inject(NotificationService);

  @Output() closed = new EventEmitter<void>();

  activeTab = signal<'members' | 'invite'>('members');
  inviteEmail = '';
  inviteRole: MemberRole = 'member';
  sending = signal(false);

  members = computed<BoardMember[]>(() => {
    const active = this.boardStore.activeBoard();
    if (!active) return [];
    return active.members || [];
  });

  canManageRoles = computed(() => {
    return this.boardStore.isOwner() || this.boardStore.isAdmin();
  });

  changeRole(userId: string, newRole: MemberRole): void {
    this.boardStore.updateMemberRole(userId, newRole);
    this.notificationService.success('Role Updated', 'Member permission role updated');
  }

  removeMember(userId: string): void {
    this.boardStore.removeMember(userId);
    this.notificationService.info('Member Removed', 'User removed from workspace board');
  }

  async sendInvite(): Promise<void> {
    const active = this.boardStore.activeBoard();
    if (!active || !this.inviteEmail.trim()) return;

    this.sending.set(true);
    const success = await this.appwriteService.sendBoardInvitation(
      active.id,
      active.name,
      this.inviteEmail.trim(),
      this.inviteRole === 'admin' ? 'admin' : 'member'
    );

    this.sending.set(false);
    if (success) {
      this.inviteEmail = '';
      this.activeTab.set('members');
    }
  }
}
