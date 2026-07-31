import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <nav class="bottom-nav">
      <a routerLink="/dashboard" routerLinkActive="active" class="bottom-nav-item">
        <app-icon name="dashboard" [size]="20"></app-icon>
        <span class="nav-label">Home</span>
      </a>

      <a routerLink="/starred" routerLinkActive="active" class="bottom-nav-item starred-item">
        <app-icon name="star" [size]="20"></app-icon>
        <span class="nav-label">Starred</span>
      </a>

      <a routerLink="/boards" routerLinkActive="active" class="bottom-nav-item">
        <app-icon name="kanban" [size]="20"></app-icon>
        <span class="nav-label">Boards</span>
      </a>

      <a routerLink="/calendar" routerLinkActive="active" class="bottom-nav-item">
        <app-icon name="calendar" [size]="20"></app-icon>
        <span class="nav-label">Calendar</span>
      </a>

      <a routerLink="/settings" routerLinkActive="active" class="bottom-nav-item">
        <app-icon name="settings" [size]="20"></app-icon>
        <span class="nav-label">Settings</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      display: none;
    }

    @media (max-width: 768px) {
      .bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 64px;
        background: var(--surface);
        border-top: 2px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: space-around;
        z-index: 1500;
        box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
        padding-bottom: env(safe-area-inset-bottom);
      }

      .bottom-nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        color: var(--text-muted);
        text-decoration: none;
        font-size: 0.72rem;
        font-weight: 800;
        flex: 1;
        height: 100%;
        transition: color 0.2s ease;

        &.starred-item app-icon {
          color: #F59E0B;
        }

        &.active {
          color: var(--primary);

          .nav-label {
            color: var(--primary);
          }
        }
      }
    }
  `]
})
export class BottomNavComponent {}
