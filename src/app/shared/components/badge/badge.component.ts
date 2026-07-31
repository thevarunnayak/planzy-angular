import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'urgent'
  | 'high'
  | 'medium'
  | 'low'
  | 'success'
  | 'warning'
  | 'danger'
  | 'ghost';

export type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <span
      class="app-badge"
      [ngClass]="[
        'badge-' + variant,
        'size-' + size
      ]"
    >
      @if (dot) {
        <span class="dot" [ngClass]="'dot-' + variant"></span>
      }

      @if (icon) {
        <app-icon [name]="icon" [size]="iconSize"></app-icon>
      }

      <span class="badge-text">
        <ng-content></ng-content>
      </span>
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .app-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-weight: 800;
      font-size: 0.76rem;
      letter-spacing: 0.3px;
      line-height: 1.2;
      user-select: none;
      box-sizing: border-box;
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: var(--radius-full);
      display: inline-block;
    }

    /* Sizes */
    .size-sm {
      padding: 2px 7px;
      font-size: 0.68rem;
    }

    .size-lg {
      padding: 6px 14px;
      font-size: 0.88rem;
    }

    /* Variants */
    .badge-primary {
      background: var(--primary-light);
      color: var(--primary);
      border: 1px solid var(--primary);
    }

    .badge-secondary {
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
    }

    .badge-urgent {
      background: rgba(255, 75, 75, 0.15);
      color: var(--danger);
      border: 1px solid var(--danger);

      .dot-urgent { background: var(--danger); }
    }

    .badge-high {
      background: rgba(250, 180, 20, 0.15);
      color: #946900;
      border: 1px solid var(--yellow-dark);

      .dot-high { background: var(--yellow-dark); }
    }

    .badge-medium {
      background: rgba(46, 196, 182, 0.15);
      color: var(--accent);
      border: 1px solid var(--accent);

      .dot-medium { background: var(--accent); }
    }

    .badge-low {
      background: var(--background);
      color: var(--text-muted);
      border: 1px solid var(--border);

      .dot-low { background: var(--text-muted); }
    }

    .badge-success {
      background: rgba(46, 204, 113, 0.15);
      color: #27AE60;
      border: 1px solid #27AE60;

      .dot-success { background: #27AE60; }
    }

    .badge-warning {
      background: rgba(243, 156, 18, 0.15);
      color: #D35400;
      border: 1px solid #D35400;

      .dot-warning { background: #D35400; }
    }

    .badge-danger {
      background: rgba(231, 76, 60, 0.15);
      color: var(--danger);
      border: 1px solid var(--danger);

      .dot-danger { background: var(--danger); }
    }

    .badge-ghost {
      background: transparent;
      color: var(--text-muted);
      border: 1px dashed var(--border);
    }
  `]
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'primary';
  @Input() size: BadgeSize = 'md';
  @Input() dot: boolean = false;
  @Input() icon?: IconName;

  get iconSize(): number {
    if (this.size === 'sm') return 10;
    if (this.size === 'lg') return 14;
    return 12;
  }
}
