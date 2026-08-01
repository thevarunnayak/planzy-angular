import { Component, inject, Input, Output, EventEmitter, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardStore } from '../../../core/stores/board.store';
import { AppwriteService } from '../../../core/services/appwrite.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BoardMember, MemberRole } from '../../../core/models/board.model';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';
import { BadgeComponent } from '../badge/badge.component';
import { IconComponent, IconName } from '../icon/icon.component';
import { CustomSingleSelectComponent, SingleSelectOption } from '../custom-single-select/custom-single-select.component';

@Component({
  selector: 'app-board-members-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    BadgeComponent,
    IconComponent,
    CustomSingleSelectComponent
  ],
  template: `
    <app-modal
      title="Board Workspace Settings"
      icon="settings"
      maxWidth="620px"
      (closed)="closed.emit()"
    >
      <div class="dialog-body">
        <!-- Tabs Header -->
        <div class="tab-bar">
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab() === 'general'"
            (click)="activeTab.set('general')"
          >
            <app-icon name="settings" [size]="14"></app-icon>
            <span>General Settings</span>
          </button>

          @if (isGroup) {
            <button
              type="button"
              class="tab-btn"
              [class.active]="activeTab() === 'members'"
              (click)="activeTab.set('members')"
            >
              <app-icon name="folder" [size]="14"></app-icon>
              <span>Members ({{ members().length }})</span>
            </button>

            <button
              type="button"
              class="tab-btn"
              [class.active]="activeTab() === 'invite'"
              (click)="activeTab.set('invite')"
            >
              <app-icon name="plus" [size]="14"></app-icon>
              <span>Invite</span>
            </button>
          }
        </div>

        <!-- Tab 1: General Settings & Privacy Toggle -->
        @if (activeTab() === 'general') {
          <form (ngSubmit)="saveGeneralSettings()" class="settings-form">
            <div class="form-group">
              <label>Board Access & Visibility Type</label>
              <div class="type-selector-pills">
                <button
                  type="button"
                  class="type-btn"
                  [class.selected]="!isGroup"
                  (click)="isGroup = false"
                >
                  <app-icon name="bookmark" [size]="16"></app-icon>
                  <div class="type-text">
                    <strong>Individual Board</strong>
                    <span>Private to you only</span>
                  </div>
                </button>

                <button
                  type="button"
                  class="type-btn"
                  [class.selected]="isGroup"
                  (click)="isGroup = true"
                >
                  <app-icon name="target" [size]="16"></app-icon>
                  <div class="type-text">
                    <strong>Group Board</strong>
                    <span>Invite members & assign tasks</span>
                  </div>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Board Title</label>
              <input
                type="text"
                class="form-input"
                [(ngModel)]="boardName"
                name="boardName"
                required
              />
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea
                class="form-textarea"
                [(ngModel)]="boardDescription"
                name="boardDescription"
                rows="3"
              ></textarea>
            </div>

            @if (!isGroup) {
              <div class="info-banner">
                <app-icon name="sparkles" [size]="16"></app-icon>
                <span>Switch this board to <strong>Group Board</strong> above to invite members and assign tasks.</span>
              </div>
            }

            <div class="form-actions">
              <app-button type="submit" [disabled]="!boardName.trim()">
                Save General Settings
              </app-button>
            </div>
          </form>
        }

        <!-- Tab 2: Active Members List (Group Boards Only) -->
        @if (activeTab() === 'members' && isGroup) {
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
                      <app-custom-single-select
                        [options]="roleOptions"
                        [value]="mem.role"
                        (valueChange)="changeRole(mem.userId, $event)"
                      ></app-custom-single-select>

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

        <!-- Tab 3: Invite Member Form (Group Boards Only) -->
        @if (activeTab() === 'invite' && isGroup) {
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
      overflow-x: hidden;
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

    .settings-form, .invite-form {
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

    .type-selector-pills {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .type-btn {
      background: var(--background);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;

      .type-text {
        display: flex;
        flex-direction: column;
        gap: 2px;

        strong { font-size: 0.85rem; color: var(--text); }
        span { font-size: 0.7rem; color: var(--text-muted); }
      }

      &.selected {
        border-color: var(--primary);
        background: var(--primary-light);
        color: var(--primary);

        .type-text strong { color: var(--primary); }
      }
    }

    .form-input, .form-textarea {
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

    .info-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--primary-light);
      color: var(--primary);
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 0.8rem;
      font-weight: 700;
    }

    .members-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 320px;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 2px;
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
      width: 100%;
      box-sizing: border-box;
    }

    .member-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1;
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
      flex-shrink: 0;
    }

    .member-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;

      .member-name {
        font-size: 0.88rem;
        font-weight: 800;
        color: var(--text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .member-email {
        font-size: 0.74rem;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .member-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .role-select-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 135px;
      flex-shrink: 0;
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
export class BoardMembersDialogComponent implements OnInit {
  private boardStore = inject(BoardStore);
  private appwriteService = inject(AppwriteService);
  private notificationService = inject(NotificationService);

  @Output() closed = new EventEmitter<void>();

  activeTab = signal<'general' | 'members' | 'invite'>('general');
  boardName = '';
  boardDescription = '';
  isGroup = false;

  inviteEmail = '';
  inviteRole: MemberRole = 'member';
  sending = signal(false);

  roleOptions: SingleSelectOption[] = [
    { value: 'admin', label: 'Admin', icon: 'zap' },
    { value: 'member', label: 'Member', icon: 'user' }
  ];

  ngOnInit(): void {
    const active = this.boardStore.activeBoard();
    if (active) {
      this.boardName = active.name;
      this.boardDescription = active.description || '';
      this.isGroup = active.isGroup || false;
    }
  }

  members = computed<BoardMember[]>(() => {
    const active = this.boardStore.activeBoard();
    if (!active) return [];
    return active.members || [];
  });

  canManageRoles = computed(() => {
    return this.boardStore.isOwner() || this.boardStore.isAdmin();
  });

  saveGeneralSettings(): void {
    const active = this.boardStore.activeBoard();
    if (!active || !this.boardName.trim()) return;

    this.boardStore.updateBoard(active.id, {
      name: this.boardName.trim(),
      description: this.boardDescription.trim(),
      isGroup: this.isGroup
    });

    this.notificationService.success('Board Settings Saved', 'Workspace settings updated');
    this.closed.emit();
  }

  changeRole(userId: string, newRoleVal: string): void {
    const newRole = newRoleVal as MemberRole;
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
