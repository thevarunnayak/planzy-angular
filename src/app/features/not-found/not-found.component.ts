import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="not-found-container">
      <div class="not-found-card glass-card bounce-in">
        <span class="error-emoji">🌸 404</span>
        <h2>Page Not Found</h2>
        <p>Oops! The page you were looking for seems to have floated away like a happy bubble.</p>
        <a routerLink="/" class="jelly-btn">Return to Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      height: calc(100vh - 72px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .not-found-card {
      padding: 40px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      max-width: 440px;
    }

    .error-emoji { font-size: 3.5rem; font-weight: 900; color: var(--primary); }
    h2 { font-size: 1.6rem; font-weight: 900; }
    p { font-size: 0.9rem; color: var(--text-muted); }
  `]
})
export class NotFoundComponent {}
