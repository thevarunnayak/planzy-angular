import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="toast-container">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div class="toast-card glass-card bounce-in" [class]="toast.type">
          <div class="toast-icon-wrap">
            @switch (toast.type) {
              @case ('success') { <app-icon name="check" [size]="16"></app-icon> }
              @case ('error') { <app-icon name="alert" [size]="16"></app-icon> }
              @case ('warning') { <app-icon name="alert" [size]="16"></app-icon> }
              @default { <app-icon name="sparkles" [size]="16"></app-icon> }
            }
          </div>
          <div class="toast-content">
            <strong class="toast-title">{{ toast.title }}</strong>
            <p class="toast-msg">{{ toast.message }}</p>
          </div>
          <button class="toast-close" (click)="notificationService.dismiss(toast.id)">
            <app-icon name="x" [size]="14"></app-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 84px;
      right: 24px;
      z-index: 3000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      min-width: 280px;
      max-width: 360px;
      padding: 12px 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: var(--surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      border-left: 6px solid var(--primary);

      &.success { border-left-color: var(--success); }
      &.error { border-left-color: var(--danger); }
      &.warning { border-left-color: var(--yellow-dark); }
    }

    .toast-icon-wrap {
      color: var(--primary);
      margin-top: 2px;
    }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--text);
      display: block;
    }

    .toast-msg {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
    }
  `]
})
export class ToastComponent {
  notificationService = inject(NotificationService);
}
