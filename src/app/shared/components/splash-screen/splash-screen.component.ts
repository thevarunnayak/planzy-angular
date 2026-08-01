import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (isVisible()) {
      <div class="splash-overlay" [class.fade-out]="isFading()">
        <div class="splash-content glass-card bounce-in">
          <div class="mascot-badge floating-blob">
            <app-icon name="mascot" [size]="54"></app-icon>
          </div>

          <div class="brand-title-wrap">
            <h1 class="splash-brand-name">PlanIQ</h1>
            <p class="splash-tagline">Plan Happy. Do More.</p>
          </div>

          <div class="loading-bar-wrap">
            <div class="loading-bar-fill"></div>
          </div>

          <span class="loading-status-text">Loading your workspace...</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .splash-overlay {
      position: fixed;
      inset: 0;
      z-index: 100000;
      background: var(--background);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      transition: opacity 0.5s ease;
      opacity: 1;

      &.fade-out {
        opacity: 0;
        pointer-events: none;
      }
    }

    .splash-content {
      width: 100%;
      max-width: 360px;
      padding: 40px 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      text-align: center;
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
    }

    .mascot-badge {
      width: 88px;
      height: 88px;
      background: var(--primary-light);
      color: var(--primary);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-md);
    }

    .brand-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .splash-brand-name {
      font-size: 2.2rem;
      font-weight: 900;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -1px;
    }

    .splash-tagline {
      font-size: 0.88rem;
      font-weight: 800;
      color: var(--text-muted);
    }

    .loading-bar-wrap {
      width: 100%;
      height: 6px;
      background: var(--background);
      border-radius: var(--radius-full);
      overflow: hidden;
      margin-top: 8px;
    }

    .loading-bar-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, var(--secondary), var(--primary));
      border-radius: var(--radius-full);
      animation: fillProgress 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .loading-status-text {
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--text-muted);
    }

    @keyframes fillProgress {
      0% { width: 0%; }
      50% { width: 65%; }
      100% { width: 100%; }
    }
  `]
})
export class SplashScreenComponent implements OnInit {
  isVisible = signal(true);
  isFading = signal(false);

  ngOnInit(): void {
    setTimeout(() => {
      this.isFading.set(true);
      setTimeout(() => {
        this.isVisible.set(false);
      }, 500);
    }, 1100);
  }
}
