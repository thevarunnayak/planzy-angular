import { Component, Input, Output, EventEmitter, ElementRef, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';

export interface MultiSelectOption {
  value: string;
  label: string;
  icon?: IconName;
}

@Component({
  selector: 'app-custom-multi-select',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="multi-select-container">
      <!-- Select Display Trigger Chip -->
      <button
        type="button"
        class="multi-select-trigger"
        [class.open]="isOpen()"
        (click)="toggleOpen()"
      >
        <span class="trigger-label">
          @if (label) {
            <span class="label-prefix">{{ label }}:</span>
          }
          {{ selectedSummary }}
        </span>
        <span class="chevron" [class.open]="isOpen()">▼</span>
      </button>

      <!-- Dropdown Popup Menu -->
      @if (isOpen()) {
        <div class="multi-select-menu glass-card bounce-in">
          <div class="menu-header">
            <button type="button" class="action-link" (click)="selectAll()">Select All</button>
            <button type="button" class="action-link" (click)="clearAll()">Clear All</button>
          </div>

          <div class="options-list custom-scroll-body">
            @for (opt of options; track opt.value) {
              <div
                class="option-item"
                [class.selected]="isSelected(opt.value)"
                (click)="toggleOption(opt.value)"
              >
                <div class="checkbox-box" [class.checked]="isSelected(opt.value)">
                  @if (isSelected(opt.value)) {
                    <app-icon name="check" [size]="12"></app-icon>
                  }
                </div>

                @if (opt.icon) {
                  <app-icon [name]="opt.icon" [size]="14"></app-icon>
                }
                <span class="option-label">{{ opt.label }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .multi-select-container {
      position: relative;
      display: inline-block;
      width: 100%;
    }

    .multi-select-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 9px 14px;
      background: var(--background);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text);
      font-size: 0.85rem;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover, &.open {
        border-color: var(--primary);
        background: var(--surface);
      }
    }

    .label-prefix {
      color: var(--text-muted);
      margin-right: 4px;
    }

    .trigger-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chevron {
      font-size: 0.65rem;
      color: var(--text-muted);
      transition: transform 0.2s ease;

      &.open {
        transform: rotate(180deg);
        color: var(--primary);
      }
    }

    .multi-select-menu {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 1200;
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 200px;
    }

    .menu-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 6px 8px 6px;
      border-bottom: 1.5px solid var(--border);
    }

    .action-link {
      background: transparent;
      border: none;
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--primary);
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }

    .options-list {
      max-height: 200px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .option-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background 0.15s ease;

      &:hover {
        background: var(--background);
      }

      &.selected {
        background: var(--primary-light);

        .option-label {
          color: var(--primary);
          font-weight: 900;
        }
      }
    }

    .checkbox-box {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      border: 1.5px solid var(--border);
      background: var(--background);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: all 0.15s ease;

      &.checked {
        background: var(--primary);
        border-color: var(--primary);
      }
    }

    .option-label {
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--text);
    }
  `]
})
export class CustomMultiSelectComponent {
  @Input() options: MultiSelectOption[] = [];
  @Input() selectedValues: string[] = [];
  @Input() label: string = '';
  @Input() allLabel: string = 'All Selected';
  @Output() selectedValuesChange = new EventEmitter<string[]>();

  isOpen = signal(false);

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleOpen(): void {
    this.isOpen.update(v => !v);
  }

  isSelected(val: string): boolean {
    return this.selectedValues.includes(val);
  }

  toggleOption(val: string): void {
    let updated: string[];
    if (this.isSelected(val)) {
      updated = this.selectedValues.filter(v => v !== val);
    } else {
      updated = [...this.selectedValues, val];
    }
    this.selectedValuesChange.emit(updated);
  }

  selectAll(): void {
    const all = this.options.map(o => o.value);
    this.selectedValuesChange.emit(all);
  }

  clearAll(): void {
    this.selectedValuesChange.emit([]);
  }

  get selectedSummary(): string {
    if (this.selectedValues.length === 0) {
      return 'None Selected';
    }
    if (this.selectedValues.length === this.options.length) {
      return this.allLabel;
    }
    if (this.selectedValues.length === 1) {
      const match = this.options.find(o => o.value === this.selectedValues[0]);
      return match ? match.label : this.selectedValues[0];
    }
    return `${this.selectedValues.length} Selected`;
  }
}
