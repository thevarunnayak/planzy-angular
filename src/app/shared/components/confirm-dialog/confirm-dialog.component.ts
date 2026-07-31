import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  template: `
    <div class="modal-overlay bounce-in" (click)="onBackdropClick($event)">
      <div class="modal-card glass-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-icon-wrap" [class.danger]="isDanger">
            <app-icon [name]="isDanger ? 'alert' : 'sparkles'" [size]="24"></app-icon>
          </div>
          <div class="header-text">
            <h3>{{ title }}</h3>
            <p>{{ message }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <app-button variant="secondary" (btnClick)="cancelled.emit()">
            {{ cancelText }}
          </app-button>

          <app-button
            [variant]="isDanger ? 'danger' : 'primary'"
            (btnClick)="confirmed.emit()"
          >
            {{ confirmText }}
          </app-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-card {
      width: 100%;
      max-width: 420px;
      padding: 24px;
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .header-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-full);
      background: var(--primary-light);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.danger {
        background: var(--danger-light);
        color: var(--danger);
      }
    }

    .header-text {
      display: flex;
      flex-direction: column;
      gap: 4px;

      h3 {
        font-size: 1.2rem;
        font-weight: 900;
        color: var(--text);
      }

      p {
        font-size: 0.85rem;
        color: var(--text-muted);
        line-height: 1.4;
      }
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() title = 'Are you sure?';
  @Input() message = 'This action cannot be undone.';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() isDanger = true;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cancelled.emit();
    }
  }
}
