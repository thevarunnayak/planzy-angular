import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'mint' | 'glass' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      class="app-button-el"
      [ngClass]="[
        variant === 'icon' ? 'icon-btn-style' : 'jelly-btn',
        variant !== 'primary' && variant !== 'icon' ? variant + '-btn' : '',
        size !== 'md' ? 'size-' + size : '',
        fullWidth ? 'width-full' : ''
      ]"
      (click)="onClick($event)"
    >
      @if (icon && iconPosition === 'left') {
        <app-icon [name]="icon" [size]="computedIconSize"></app-icon>
      }

      <span class="btn-content">
        <ng-content></ng-content>
      </span>

      @if (icon && iconPosition === 'right') {
        <app-icon [name]="icon" [size]="computedIconSize"></app-icon>
      }
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;

      &.full-width {
        display: block;
        width: 100%;
      }
    }

    .app-button-el {
      box-sizing: border-box;
      width: 100%;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
        box-shadow: none !important;
      }
    }

    .btn-content {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .width-full {
      width: 100%;
      justify-content: center;
    }

    /* Size Variations */
    .size-sm {
      padding: 6px 14px !important;
      font-size: 0.8rem !important;
    }

    .size-lg {
      padding: 16px 32px !important;
      font-size: 1.05rem !important;
    }

    /* Variant Modifications */
    .secondary-btn {
      background: var(--surface) !important;
      color: var(--text) !important;
      border: 1.5px solid var(--border) !important;
      box-shadow: 0 4px 0 var(--border), var(--shadow-sm) !important;

      &:hover:not(:disabled) {
        background: var(--surface-hover) !important;
        border-color: var(--primary) !important;
      }
    }

    .danger-btn {
      background: var(--danger) !important;
      color: white !important;
      box-shadow: 0 6px 0 rgba(200, 40, 50, 0.35) !important;
    }

    .mint-btn {
      background: var(--mint) !important;
      color: #1E5128 !important;
      box-shadow: 0 6px 0 rgba(140, 220, 160, 0.4), var(--shadow-sm) !important;
    }

    .glass-btn {
      background: var(--glass-bg) !important;
      backdrop-filter: var(--glass-blur) !important;
      border: 1.5px solid var(--border) !important;
      color: var(--text) !important;
      box-shadow: var(--shadow-sm) !important;
    }

    .icon-btn-style {
      background: var(--background);
      border: 1.5px solid var(--border);
      width: 38px;
      height: 38px;
      border-radius: var(--radius-full);
      cursor: pointer;
      font-size: 0.9rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text);
      transition: transform 0.2s ease, border-color 0.2s ease;
      outline: none;

      &:hover:not(:disabled) {
        transform: scale(1.1);
        border-color: var(--primary);
      }
    }
  `]
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() icon?: IconName;
  @Input() iconSize?: number;
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() disabled: boolean = false;
  @Input() fullWidth: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  @Output() btnClick = new EventEmitter<MouseEvent>();

  get computedIconSize(): number {
    if (this.iconSize) return this.iconSize;
    if (this.size === 'sm') return 12;
    if (this.size === 'lg') return 20;
    return 16;
  }

  onClick(event: MouseEvent): void {
    if (!this.disabled) {
      this.btnClick.emit(event);
    }
  }
}
