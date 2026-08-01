import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, TaskComment } from '../../../core/models/task.model';
import { TaskStore } from '../../../core/stores/task.store';
import { AppwriteService } from '../../../core/services/appwrite.service';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-task-comments-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    IconComponent
  ],
  template: `
    <app-modal
      [title]="'Comments: ' + task.title"
      icon="comment"
      maxWidth="540px"
      (closed)="closed.emit()"
    >
      <div class="comments-dialog-body">
        <!-- Comments List -->
        <div class="comments-scroll-area custom-scroll-body">
          @if (task.comments && task.comments.length > 0) {
            <div class="comments-feed">
              @for (comm of task.comments; track comm.id || $index) {
                <div class="comment-card">
                  <div class="comment-avatar">
                    {{ (comm.authorName || 'U').charAt(0).toUpperCase() }}
                  </div>
                  <div class="comment-body">
                    <div class="comment-header">
                      <strong class="author-name">{{ comm.authorName }}</strong>
                      <span class="comment-time">{{ comm.createdAt | date:'shortTime' }}</span>
                    </div>
                    <p class="comment-text">{{ comm.content || comm.text }}</p>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-comments">
              <app-icon name="comment" [size]="32"></app-icon>
              <p>No comments on this task yet. Start the conversation!</p>
            </div>
          }
        </div>

        <!-- Add Comment Form -->
        <div class="add-comment-footer">
          <input
            type="text"
            class="comment-input"
            placeholder="Type a comment..."
            [(ngModel)]="newCommentText"
            (keydown.enter)="$event.preventDefault(); postComment()"
          />
          <app-button
            size="sm"
            [disabled]="!newCommentText.trim()"
            (btnClick)="postComment()"
          >
            Post
          </app-button>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .comments-dialog-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 440px;
    }

    .comments-scroll-area {
      max-height: 320px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .comments-feed {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .comment-card {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      background: var(--background);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
    }

    .comment-avatar {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      background: var(--primary);
      color: white;
      font-size: 0.8rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .comment-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .comment-header {
      display: flex;
      align-items: center;
      gap: 8px;

      .author-name {
        font-size: 0.82rem;
        color: var(--text);
      }

      .comment-time {
        font-size: 0.7rem;
        color: var(--text-muted);
      }
    }

    .comment-text {
      font-size: 0.85rem;
      color: var(--text);
      line-height: 1.4;
      white-space: pre-wrap;
    }

    .empty-comments {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 40px 16px;
      color: var(--text-muted);
      text-align: center;
      font-size: 0.88rem;
    }

    .add-comment-footer {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-top: 12px;
      border-top: 1.5px solid var(--border);
    }

    .comment-input {
      flex: 1;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      background: var(--background);
      color: var(--text);
      font-size: 0.88rem;
      outline: none;

      &:focus {
        border-color: var(--primary);
      }
    }
  `]
})
export class TaskCommentsModalComponent {
  private taskStore = inject(TaskStore);
  private appwriteService = inject(AppwriteService);

  @Input({ required: true }) task!: Task;
  @Output() closed = new EventEmitter<void>();

  newCommentText = '';

  postComment(): void {
    const text = this.newCommentText.trim();
    const user = this.appwriteService.currentUser();
    if (!text || !user) return;

    const newComment: TaskComment = {
      id: `comm-${Date.now()}`,
      authorId: user.id,
      authorName: user.name || user.email,
      content: text,
      text,
      createdAt: new Date().toISOString()
    };

    const updatedComments = [...(this.task.comments || []), newComment];
    this.newCommentText = '';

    this.taskStore.updateTask(this.task.id, {
      comments: updatedComments
    });
  }
}
