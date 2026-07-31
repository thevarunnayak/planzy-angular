import { Component, Input, Output, EventEmitter, ElementRef, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';

export interface SortSelectOption {
  value: string;
  label: string;
  icon?: IconName;
}

export type SortDirection = 'asc' | 'desc' | 'none';

export interface SortState {
  sortBy: string | null;
  direction: SortDirection;
}

@Component({
  selector: 'app-custom-sort-select',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="sort-select-container">
      <!-- Select Display Trigger Button -->
      <button
        type="button"
        class="sort-select-trigger"
        [class.open]="isOpen()"
        [class.active]="sortState.sortBy !== null"
        (click)="toggleOpen()"
      >
        <div class="trigger-left">
          <app-icon name="clock" [size]="14"></app-icon>
          <span class="trigger-label">{{ selectedLabel }}</span>
        </div>

        <div class="trigger-right">
          <span class="chevron" [class.open]="isOpen()">▼</span>
        </div>
      </button>

      <!-- Dropdown Menu -->
      @if (isOpen()) {
        <div class="sort-select-menu glass-card bounce-in">
          <div class="options-list">
            @for (opt of options; track opt.value) {
              <button
                type="button"
                class="option-item"
                [class.selected]="sortState.sortBy === opt.value"
                (click)="onOptionClick(opt.value)"
              >
                <div class="option-left">
                  @if (opt.icon) {
                    <app-icon [name]="opt.icon" [size]="14"></app-icon>
                  }
                  <span class="option-label">{{ opt.label }}</span>
                </div>

                <div class="option-right">
                  @if (sortState.sortBy === opt.value) {
                    <span class="state-badge" [class.asc]="sortState.direction === 'asc'">
                      {{ sortState.direction === 'asc' ? '▲ ASC' : '▼ DESC' }}
                    </span>
                  }
                </div>
              </button>
            }

            @if (sortState.sortBy) {
              <button type="button" class="clear-sort-btn" (click)="clearSort()">
                <app-icon name="x" [size]="12"></app-icon>
                <span>Clear Sorting</span>
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sort-select-container {
      position: relative;
      display: inline-block;
      width: 100%;
    }

    .sort-select-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
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

      &.active {
        border-color: var(--primary);
        background: var(--primary-light);
        color: var(--primary);
      }
    }

    .trigger-left {
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .trigger-right {
      display: flex;
      align-items: center;
      gap: 6px;
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

    .sort-select-menu {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 9999 !important;
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 220px;
    }

    .options-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .option-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 10px;
      border-radius: var(--radius-md);
      border: none;
      background: transparent;
      color: var(--text);
      cursor: pointer;
      text-align: left;
      transition: background 0.15s ease;

      &:hover {
        background: var(--background);
      }

      &.selected {
        background: var(--primary-light);
        color: var(--primary);

        .option-label {
          font-weight: 900;
          color: var(--primary);
        }
      }
    }

    .option-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .option-label {
      font-size: 0.84rem;
      font-weight: 700;
    }

    .state-badge {
      font-size: 0.7rem;
      font-weight: 900;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      background: var(--primary);
      color: white;

      &.asc {
        background: #38B000;
      }
    }

    .clear-sort-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px;
      margin-top: 4px;
      border: none;
      background: var(--danger-light);
      color: var(--danger);
      border-radius: var(--radius-md);
      font-size: 0.74rem;
      font-weight: 800;
      cursor: pointer;

      &:hover {
        opacity: 0.85;
      }
    }
  `]
})
export class CustomSortSelectComponent {
  @Input() options: SortSelectOption[] = [];
  @Input() sortState: SortState = { sortBy: null, direction: 'none' };
  @Output() sortStateChange = new EventEmitter<SortState>();

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

  onOptionClick(val: string): void {
    if (this.sortState.sortBy === val) {
      if (this.sortState.direction === 'asc') {
        this.sortStateChange.emit({ sortBy: val, direction: 'desc' });
      } else if (this.sortState.direction === 'desc') {
        this.sortStateChange.emit({ sortBy: null, direction: 'none' });
        this.isOpen.set(false);
      } else {
        this.sortStateChange.emit({ sortBy: val, direction: 'asc' });
      }
    } else {
      this.sortStateChange.emit({ sortBy: val, direction: 'asc' });
    }
  }

  clearSort(): void {
    this.sortStateChange.emit({ sortBy: null, direction: 'none' });
    this.isOpen.set(false);
  }

  get selectedLabel(): string {
    if (!this.sortState.sortBy || this.sortState.direction === 'none') {
      return 'Sort By';
    }
    const match = this.options.find(o => o.value === this.sortState.sortBy);
    return match ? `Sort: ${match.label}` : 'Sort By';
  }
}
