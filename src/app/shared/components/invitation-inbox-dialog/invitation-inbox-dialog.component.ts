import { Component, Output, EventEmitter, inject } from '@angular/core';
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
  imports: [
    CommonModule,
    ModalComponent,
    ButtonComponent,
    BadgeComponent,
    IconComponent
  ],
  template: `
    <app-modal
      title="Board Collaboration Invitations"
      icon="mail"
      maxWidth="540px"
      (closed)="closed.emit()"
    >
      <div class="dialog-body custom-scroll-body">
        @if (appwriteService.pendingInvitations().length > 0) {
          <div class="invitations-list">
            @for (invite of appwriteService.pendingInvitations(); track invite.id) {
              <div class="invite-card glass-card">
                <div class="invite-header">
                  <div class="inviter-avatar">
                    {{ (invite.inviterName || 'I').charAt(0).toUpperCase() }}
                  </div>
                  <div class="invite-meta">
                    <div class="inviter-name">
                      <strong>{{ invite.inviterName }}</strong> invited you to
                    </div>
                    <h4 class="board-title">{{ invite.boardName }}</h4>
                    <span class="invite-time">{{ invite.createdAt | date:'mediumDate' }}</span>
                  </div>
                  <app-badge [variant]="invite.role === 'admin' ? 'urgent' : 'secondary'" size="sm">
                    {{ invite.role === 'admin' ? 'Admin' : 'Member' }}
                  </app-badge>
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
                    variant="mint"
                    size="sm"
                    (btnClick)="accept(invite)"
                  >
                    Accept & Join Board
                  </app-button>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <app-icon name="check" [size]="36"></app-icon>
            <h4>All Caught Up!</h4>
            <p>You have no pending board invitations right now.</p>
          </div>
        }
      </div>
    </app-modal>
  `,
  styles: [`
    .dialog-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 400px;
      overflow-y: auto;
    }

    .invitations-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .invite-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-lg);
    }

    .invite-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .inviter-avatar {
      width: 36px;
      height: 36px;
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

    .invite-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;

      .inviter-name {
        font-size: 0.8rem;
        color: var(--text-muted);
        strong { color: var(--text); }
      }

      .board-title {
        font-size: 1rem;
        font-weight: 900;
        color: var(--primary);
      }

      .invite-time {
        font-size: 0.72rem;
        color: var(--text-muted);
      }
    }

    .invite-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 8px;
      border-top: 1.5px solid var(--border);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 36px 16px;
      color: var(--text-muted);
      text-align: center;

      h4 { font-size: 1.1rem; font-weight: 900; color: var(--text); }
      p { font-size: 0.85rem; }
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
    await this.boardStore.acceptBoardInvitation(invite.boardId, {
      userId: user.id,
      name: user.name || user.email,
      email: user.email,
      role: invite.role,
      joinedAt: new Date().toISOString()
    }, invite.boardName);

    this.closed.emit();
  }

  async decline(invite: BoardInvitation): Promise<void> {
    await this.appwriteService.respondToInvitation(invite.id, false);
  }
}
