import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent, IconName } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-board-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ButtonComponent],
  template: `
    <div class="modal-overlay bounce-in" (click)="onBackdropClick($event)">
      <div class="modal-card glass-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ initialName ? 'Edit Board Settings' : 'Create New Workspace Board' }}</h3>
          <button class="close-btn" (click)="cancelled.emit()">
            <app-icon name="x" [size]="16"></app-icon>
          </button>
        </div>

        <form (ngSubmit)="submitForm()" class="modal-form">
          <!-- Board Visibility Type Selector (isGroup Boolean) -->
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
              placeholder="e.g. Sprint Board, Product Roadmap"
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

          <!-- Starter Template Gallery Button (Create Mode) -->
          @if (!initialName) {
            <div class="form-group">
              <label>Start with a Premade Template (Optional)</label>
              <button
                type="button"
                class="explore-gallery-btn"
                (click)="openTemplateGallery.emit()"
              >
                <app-icon name="sparkles" [size]="15"></app-icon>
                <span>Explore Template Gallery</span>
              </button>
            </div>
          }

          <div class="modal-footer">
            <app-button variant="secondary" (btnClick)="cancelled.emit()">Cancel</app-button>
            <app-button type="submit" [disabled]="!boardName.trim()">
              {{ initialName ? 'Save Changes' : 'Create Board' }}
            </app-button>
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
      max-width: 480px;
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

    .explore-gallery-btn {
      width: 100%;
      background: var(--background);
      border: 1.5px dashed var(--primary);
      border-radius: var(--radius-md);
      padding: 11px 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--primary);
      font-size: 0.85rem;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      app-icon {
        color: var(--primary);
        transition: transform 0.25s var(--transition-spring);
      }

      &:hover {
        background: var(--primary-light);
        border-style: solid;
        color: var(--primary-hover);
        
        app-icon {
          transform: rotate(15deg) scale(1.1);
        }
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
export class BoardDialogComponent implements OnInit {
  @Input() initialName = '';
  @Input() initialDescription = '';
  @Input() initialEmoji = 'folder';
  @Input() initialIsGroup = false;

  @Output() submitted = new EventEmitter<{ name: string; description: string; emoji: string; isGroup: boolean }>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() openTemplateGallery = new EventEmitter<void>();

  boardName = '';
  boardDescription = '';
  selectedIcon: IconName = 'folder';
  isGroup = false;

  availableIcons: IconName[] = ['folder', 'kanban', 'dashboard', 'star', 'target', 'bookmark'];

  ngOnInit(): void {
    this.boardName = this.initialName;
    this.boardDescription = this.initialDescription;
    this.selectedIcon = (this.initialEmoji as IconName) || 'folder';
    this.isGroup = this.initialIsGroup || false;
  }



  submitForm(): void {
    if (this.boardName.trim()) {
      this.submitted.emit({
        name: this.boardName.trim(),
        description: this.boardDescription.trim(),
        emoji: this.selectedIcon,
        isGroup: this.isGroup
      });
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cancelled.emit();
    }
  }
}
