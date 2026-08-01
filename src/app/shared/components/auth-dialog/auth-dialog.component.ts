import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppwriteService } from '../../../core/services/appwrite.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-auth-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="modal-overlay bounce-in" (click)="onBackdropClick($event)">
      <div class="modal-card glass-card" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="auth-header">
          <div class="mascot-badge floating-blob">
            <app-icon name="mascot" [size]="42"></app-icon>
          </div>

          <h2 class="auth-title">{{ isSignUp() ? 'Join PlanIQ Happy Workspace' : 'Welcome Back to PlanIQ' }}</h2>
          <p class="auth-subtitle">Sync your workspace boards & tasks with Appwrite Cloud</p>

          <button class="close-btn" (click)="appwriteService.closeAuthModal()">
            <app-icon name="x" [size]="16"></app-icon>
          </button>
        </div>

        @if (isPlaceholderProjectId) {
          <div class="setup-notice-banner">
            <app-icon name="alert" [size]="18"></app-icon>
            <div>
              <strong>Appwrite Project ID Required</strong>
              <p>Replace <code>YOUR_APPWRITE_PROJECT_ID</code> in <code>.env.local</code> with your real Project ID from cloud.appwrite.io</p>
            </div>
          </div>
        }

        <!-- Mode Switch Tabs -->
        <div class="auth-tabs">
          <button class="tab-btn" [class.active]="!isSignUp()" (click)="isSignUp.set(false)">Sign In</button>
          <button class="tab-btn" [class.active]="isSignUp()" (click)="isSignUp.set(true)">Create Account</button>
        </div>

        <!-- Form Body -->
        <form (ngSubmit)="onSubmit()" class="auth-form">
          @if (isSignUp()) {
            <div class="form-group">
              <label>Your Name</label>
              <input
                type="text"
                class="form-input"
                placeholder="e.g. Alex"
                [(ngModel)]="name"
                name="name"
              />
            </div>
          }

          <div class="form-group">
            <label>Email Address</label>
            <input
              type="email"
              class="form-input"
              placeholder="you@example.com"
              [(ngModel)]="email"
              name="email"
              required
              autofocus
            />
          </div>

          <div class="form-group">
            <label>Password (Min 8 Characters)</label>
            <input
              type="password"
              class="form-input"
              placeholder="••••••••"
              [(ngModel)]="password"
              name="password"
              required
              minlength="8"
            />
          </div>

          <button
            type="submit"
            class="jelly-btn submit-btn"
            [disabled]="loading() || !email || !password || password.length < 8 || isPlaceholderProjectId"
          >
            <span>{{ loading() ? 'Connecting...' : (isSignUp() ? 'Create Free Account' : 'Sign In to Workspace') }}</span>
          </button>
        </form>

        <div class="auth-footer">
          <button class="guest-btn" (click)="appwriteService.closeAuthModal()">
            Continue as Guest (Local Offline Mode)
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(18, 24, 36, 0.65);
      backdrop-filter: blur(6px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-card {
      width: 100%;
      max-width: 420px;
      padding: 28px 24px;
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .setup-notice-banner {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: var(--danger-light);
      color: var(--danger);
      padding: 12px 14px;
      border-radius: var(--radius-md);
      font-size: 0.8rem;
      line-height: 1.4;

      code {
        background: rgba(255, 255, 255, 0.6);
        padding: 2px 4px;
        border-radius: 4px;
        font-weight: 800;
      }
    }

    .auth-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 10px;
      position: relative;
    }

    .mascot-badge {
      width: 64px;
      height: 64px;
      background: var(--primary-light);
      color: var(--primary);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .auth-title {
      font-size: 1.35rem;
      font-weight: 900;
      color: var(--text);
    }

    .auth-subtitle {
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .close-btn {
      position: absolute;
      top: -10px;
      right: -10px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
    }

    .auth-tabs {
      display: flex;
      background: var(--background);
      padding: 4px;
      border-radius: var(--radius-full);
      border: 1.5px solid var(--border);
    }

    .tab-btn {
      flex: 1;
      padding: 8px;
      border: none;
      background: transparent;
      border-radius: var(--radius-full);
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s ease;

      &.active {
        background: var(--surface);
        color: var(--primary);
        box-shadow: var(--shadow-sm);
      }
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 0.78rem;
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

      &:focus {
        border-color: var(--primary);
      }
    }

    .submit-btn {
      width: 100%;
      justify-content: center;
      margin-top: 6px;
    }

    .auth-footer {
      text-align: center;
      padding-top: 8px;
      border-top: 1.5px solid var(--border);
    }

    .guest-btn {
      background: transparent;
      border: none;
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--text-muted);
      cursor: pointer;

      &:hover {
        color: var(--primary);
        text-decoration: underline;
      }
    }
  `]
})
export class AuthDialogComponent {
  appwriteService = inject(AppwriteService);

  isSignUp = signal(false);
  loading = signal(false);

  email = '';
  password = '';
  name = '';

  get isPlaceholderProjectId(): boolean {
    const projectId = this.appwriteService.projectId;
    return !projectId || projectId === 'YOUR_APPWRITE_PROJECT_ID' || projectId.includes('YOUR_APPWRITE_PROJECT_ID');
  }

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) return;
    this.loading.set(true);

    try {
      if (this.isSignUp()) {
        await this.appwriteService.signUp(this.email, this.password, this.name);
      } else {
        await this.appwriteService.login(this.email, this.password);
      }
    } finally {
      this.loading.set(false);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.appwriteService.closeAuthModal();
    }
  }
}
