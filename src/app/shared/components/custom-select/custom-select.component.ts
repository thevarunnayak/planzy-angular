import { Component, EventEmitter, Input, Output, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="custom-select-wrapper">
      <button
        type="button"
        class="select-trigger"
        [class.open]="isOpen"
        (click)="toggleOpen()"
      >
        <div class="selected-label">
          @if (selectedOption?.icon) {
            <app-icon [name]="$any(selectedOption?.icon)" [size]="14" [style.color]="selectedOption?.color"></app-icon>
          }
          <span>{{ selectedOption?.label || placeholder }}</span>
        </div>
        <svg class="arrow" [class.rotated]="isOpen" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      @if (isOpen) {
        <div class="options-dropdown glass-card fade-in">
          @for (option of options; track option.value) {
            <button
              type="button"
              class="option-item"
              [class.selected]="option.value === value"
              (click)="selectOption(option.value)"
            >
              @if (option.icon) {
                <app-icon [name]="$any(option.icon)" [size]="14" [style.color]="option.color"></app-icon>
              }
              <span>{{ option.label }}</span>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .custom-select-wrapper {
      position: relative;
      width: 100%;
    }

    .select-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: var(--background);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text);
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover, &.open {
        border-color: var(--primary);
        background: var(--surface);
      }
    }

    .selected-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .arrow {
      transition: transform 0.2s ease;
      color: var(--text-muted);
      &.rotated { transform: rotate(180deg); }
    }

    .options-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 3000;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 200px;
      overflow-y: auto;
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
    }

    .option-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: transparent;
      border: none;
      border-radius: var(--radius-sm);
      color: var(--text);
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s ease;

      &:hover {
        background: var(--background);
        color: var(--primary);
      }

      &.selected {
        background: var(--primary-light);
        color: var(--primary);
      }
    }
  `]
})
export class CustomSelectComponent {
  private elementRef = inject(ElementRef);

  @Input() options: SelectOption[] = [];
  @Input() value = '';
  @Input() placeholder = 'Select option...';

  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;

  get selectedOption(): SelectOption | undefined {
    return this.options.find(o => o.value === this.value);
  }

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
  }

  selectOption(val: string): void {
    this.valueChange.emit(val);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
