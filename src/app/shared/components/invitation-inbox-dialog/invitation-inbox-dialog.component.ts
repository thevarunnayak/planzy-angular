import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppwriteService } from '../../../core/services/appwrite.service';
import { BoardStore } from '../../../core/stores/board.store';
import { BoardInvitation } from '../../../core/models/invitation.model';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';
import { BadgeComponent } from '../badge/badge.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-invitation-inbox-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent, BadgeComponent, IconComponent],
  template: `
    <app-modal
      title="Pending Workspace Invitations"
      icon="sparkles"
      maxWidth="500px"
      (closed)="closed.emit()"
    >
      <div class="inbox-body">
        @if (appwriteService.pendingInvitations().length > 0) {
          <div class="invites-list">
            @for (invite of appwriteService.pendingInvitations(); track invite.id) {
              <div class="invite-card">
                <div class="invite-info">
                  <div class="invite-header-row">
                    <strong class="board-title">{{ invite.boardName }}</strong>
                    <app-badge [variant]="invite.role === 'admin' ? 'urgent' : 'primary'" size="sm">
                      {{ invite.role === 'admin' ? 'Admin Role' : 'Member Role' }}
                    </app-badge>
                  </div>
                  <p class="invite-desc">
                    <strong>{{ invite.inviterName }}</strong> invited you to join this workspace board.
                  </p>
                </div>

                <div class="invite-actions">
                  <app-button
                    variant="secondary"
                    size="sm"
                    (btnClick)="decline(invite)"
                  >
                    Decline
                  </app-button>

                  <app-button
                    variant="primary"
                    size="sm"
                    (btnClick)="accept(invite)"
                  >
                    Accept & Join
                  </app-button>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-inbox">
            <app-icon name="sparkles" [size]="36"></app-icon>
            <p>No pending board invitations found.</p>
          </div>
        }
      </div>
    </app-modal>
  `,
  styles: [`
    .inbox-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .invites-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .invite-card {
      background: var(--background);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .invite-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .invite-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;

      .board-title {
        font-size: 1.05rem;
        font-weight: 900;
        color: var(--text);
      }
    }

    .invite-desc {
      font-size: 0.84rem;
      color: var(--text-muted);
      strong { color: var(--text); }
    }

    .invite-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }

    .empty-inbox {
      text-align: center;
      padding: 32px 16px;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;

      p { font-size: 0.9rem; font-weight: 700; }
    }
  `]
})
export class InvitationInboxDialogComponent {
  appwriteService = inject(AppwriteService);
  private boardStore = inject(BoardStore);

  @Output() closed = new EventEmitter<void>();

  async accept(invite: BoardInvitation): Promise<void> {
    const user = this.appwriteService.currentUser();
    if (!user) return;

    await this.appwriteService.respondToInvitation(invite.id, true);
    this.boardStore.acceptBoardInvitation(invite.boardId, {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: invite.role,
      joinedAt: new Date().toISOString()
    });

    this.closed.emit();
  }

  async decline(invite: BoardInvitation): Promise<void> {
    await this.appwriteService.respondToInvitation(invite.id, false);
  }
}
