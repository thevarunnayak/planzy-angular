import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-board-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="modal-overlay bounce-in" (click)="onBackdropClick($event)">
      <div class="modal-card glass-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ initialName ? 'Edit Board' : 'Create New Workspace Board' }}</h3>
          <button class="close-btn" (click)="cancelled.emit()">
            <app-icon name="x" [size]="16"></app-icon>
          </button>
        </div>

        <form (ngSubmit)="submitForm()" class="modal-form">
          <div class="form-group">
            <label>Board Icon</label>
            <div class="icon-selector-grid">
              @for (ic of availableIcons; track ic) {
                <button
                  type="button"
                  class="icon-opt-btn"
                  [class.selected]="selectedIcon === ic"
                  (click)="selectedIcon = ic"
                >
                  <app-icon [name]="ic" [size]="18"></app-icon>
                </button>
              }
            </div>
          </div>

          <div class="form-group">
            <label>Board Title</label>
            <input
              type="text"
              class="form-input"
              placeholder="e.g. My Sprint Board, Personal Planning"
              [(ngModel)]="boardName"
              name="boardName"
              required
              autofocus
            />
          </div>

          <div class="form-group">
            <label>Description (Optional)</label>
            <textarea
              class="form-textarea"
              placeholder="What is this board for?"
              [(ngModel)]="boardDescription"
              name="boardDescription"
              rows="3"
            ></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="jelly-btn secondary" (click)="cancelled.emit()">Cancel</button>
            <button type="submit" class="jelly-btn" [disabled]="!boardName.trim()">
              {{ initialName ? 'Save Changes' : 'Create Board' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(18, 24, 36, 0.6);
      backdrop-filter: blur(4px);
      z-index: 2500;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-card {
      width: 100%;
      max-width: 440px;
      padding: 24px;
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        font-size: 1.25rem;
        font-weight: 900;
        color: var(--text);
      }
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    .modal-form {
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

    .icon-selector-grid {
      display: flex;
      gap: 8px;
    }

    .icon-opt-btn {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      background: var(--background);
      color: var(--text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &.selected {
        border-color: var(--primary);
        background: var(--primary-light);
        color: var(--primary);
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

      &:focus {
        border-color: var(--primary);
      }
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }
  `]
})
export class BoardDialogComponent {
  @Input() initialName = '';
  @Input() initialDescription = '';
  @Input() initialEmoji = 'folder';

  @Output() submitted = new EventEmitter<{ name: string; description: string; emoji: string }>();
  @Output() cancelled = new EventEmitter<void>();

  boardName = '';
  boardDescription = '';
  selectedIcon: IconName = 'folder';

  availableIcons: IconName[] = ['folder', 'kanban', 'dashboard', 'star', 'target', 'bookmark'];

  ngOnInit(): void {
    this.boardName = this.initialName;
    this.boardDescription = this.initialDescription;
    this.selectedIcon = (this.initialEmoji as IconName) || 'folder';
  }

  submitForm(): void {
    if (this.boardName.trim()) {
      this.submitted.emit({
        name: this.boardName.trim(),
        description: this.boardDescription.trim(),
        emoji: this.selectedIcon
      });
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cancelled.emit();
    }
  }
}
