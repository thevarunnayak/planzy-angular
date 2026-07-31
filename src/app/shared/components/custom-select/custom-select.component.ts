import { Component, EventEmitter, Input, Output, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
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
            <app-icon [name]="$any(selectedOption?.icon)" [size]="14"></app-icon>
          }
          <span>{{ selectedOption?.label || placeholder }}</span>
        </div>
        <div class="arrow-icon" [class.rotated]="isOpen">
          ▼
        </div>
      </button>

      @if (isOpen) {
        <div
          class="options-dropdown glass-card bounce-in"
          [class.open-upward]="openUpward"
        >
          @for (opt of options; track opt.value) {
            <button
              type="button"
              class="option-item"
              [class.selected]="opt.value === value"
              (click)="selectOption(opt)"
            >
              @if (opt.icon) {
                <app-icon [name]="$any(opt.icon)" [size]="14"></app-icon>
              }
              <span>{{ opt.label }}</span>
              @if (opt.value === value) {
                <app-icon name="check" [size]="14" class="check-mark"></app-icon>
              }
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
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      background: var(--background);
      color: var(--text);
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
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
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .arrow-icon {
      font-size: 0.65rem;
      color: var(--text-muted);
      transition: transform 0.2s ease;

      &.rotated {
        transform: rotate(180deg);
      }
    }

    .options-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 3000;
      background: var(--surface);
      border-radius: var(--radius-md);
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 220px;
      overflow-y: auto;
      box-shadow: var(--shadow-lg);

      &.open-upward {
        top: auto;
        bottom: calc(100% + 6px);
      }
    }

    .option-item {
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      border: none;
      background: transparent;
      color: var(--text);
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      text-align: left;
      transition: background 0.15s ease;

      &:hover {
        background: var(--surface-hover);
        color: var(--primary);
      }

      &.selected {
        background: var(--primary-light);
        color: var(--primary);
      }
    }

    .check-mark {
      margin-left: auto;
      color: var(--primary);
    }
  `]
})
export class CustomSelectComponent {
  @Input() options: SelectOption[] = [];
  @Input() value: string = '';
  @Input() placeholder: string = 'Select...';

  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  openUpward = false;
  private elementRef = inject(ElementRef);

  get selectedOption(): SelectOption | undefined {
    return this.options.find(o => o.value === this.value);
  }

  toggleOpen(): void {
    if (!this.isOpen) {
      this.calculatePosition();
    }
    this.isOpen = !this.isOpen;
  }

  private calculatePosition(): void {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const popoverHeight = 240;
    this.openUpward = spaceBelow < popoverHeight && rect.top > popoverHeight;
  }

  selectOption(opt: SelectOption): void {
    this.valueChange.emit(opt.value);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
