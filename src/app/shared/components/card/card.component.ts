import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'glass' | 'surface' | 'outlined';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="app-card"
      [ngClass]="[
        'card-' + variant,
        'padding-' + padding,
        hoverable ? 'hoverable' : ''
      ]"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .app-card {
      border-radius: var(--radius-xl);
      box-sizing: border-box;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, border-color 0.2s ease;
    }

    /* Variants */
    .card-glass {
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border: 1.5px solid var(--glass-border);
      box-shadow: var(--shadow-sm);
    }

    .card-surface {
      background: var(--surface);
      border: 1.5px solid var(--border);
      box-shadow: var(--shadow-sm);
    }

    .card-outlined {
      background: var(--background);
      border: 1.5px solid var(--border);
    }

    /* Paddings */
    .padding-none { padding: 0; }
    .padding-sm { padding: 12px 16px; }
    .padding-md { padding: 20px 24px; }
    .padding-lg { padding: 28px 32px; }

    /* Hoverable */
    .hoverable:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: var(--primary);
    }
  `]
})
export class CardComponent {
  @Input() variant: CardVariant = 'glass';
  @Input() padding: CardPadding = 'md';
  @Input() hoverable: boolean = false;
}
