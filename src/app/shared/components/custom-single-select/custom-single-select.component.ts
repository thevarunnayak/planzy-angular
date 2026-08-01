import { Component, Input, Output, EventEmitter, signal, computed, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { BadgeComponent } from '../badge/badge.component';

export interface SingleSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  avatarInitials?: string;
  badge?: string;
  icon?: IconName;
}

@Component({
  selector: 'app-custom-single-select',
  standalone: true,
  imports: [CommonModule, IconComponent, BadgeComponent],
  template: `
    <div class="custom-select-container">
      <!-- Trigger Button -->
      <button
        type="button"
        class="select-trigger-btn"
        [class.open]="isOpen()"
        (click)="toggleOpen()"
      >
        <div class="trigger-content">
          @if (selectedOption()?.avatarInitials) {
            <span class="avatar-bubble">
              {{ selectedOption()?.avatarInitials }}
            </span>
          } @else if (selectedOption()?.icon) {
            <app-icon [name]="selectedOption()!.icon!" [size]="16"></app-icon>
          }

          <span class="label-text">
            {{ selectedOption() ? selectedOption()!.label : placeholder }}
          </span>

          @if (selectedOption()?.badge && selectedOption()?.badge?.toLowerCase() !== selectedOption()?.label?.toLowerCase()) {
            <app-badge variant="secondary" size="sm">
              {{ selectedOption()!.badge }}
            </app-badge>
          }
        </div>

        <svg class="chevron-icon" [class.rotated]="isOpen()" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <!-- Dropdown Menu -->
      @if (isOpen()) {
        <div class="select-dropdown-menu glass-card fade-in" (click)="$event.stopPropagation()">
          <div class="options-list custom-scroll-body">
            @for (opt of options; track opt.value) {
              <button
                type="button"
                class="option-item"
                [class.selected]="opt.value === valSignal()"
                (click)="selectOption(opt.value)"
              >
                <div class="opt-left">
                  @if (opt.avatarInitials) {
                    <span class="avatar-bubble">
                      {{ opt.avatarInitials }}
                    </span>
                  } @else if (opt.icon) {
                    <app-icon [name]="opt.icon" [size]="16"></app-icon>
                  }

                  <div class="opt-titles">
                    <span class="opt-label">{{ opt.label }}</span>
                    @if (opt.sublabel) {
                      <span class="opt-sublabel">{{ opt.sublabel }}</span>
                    }
                  </div>
                </div>

                <div class="opt-right">
                  @if (opt.badge) {
                    <app-badge [variant]="opt.badge === 'Admin' || opt.badge === 'admin' ? 'urgent' : 'secondary'" size="sm">
                      {{ opt.badge }}
                    </app-badge>
                  }

                  @if (opt.value === valSignal()) {
                    <app-icon name="check" [size]="14"></app-icon>
                  }
                </div>
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .custom-select-container {
      position: relative;
      width: 100%;
    }

    .select-trigger-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 14px;
      background: var(--background);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text);
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      box-sizing: border-box;

      &:hover, &.open {
        border-color: var(--primary);
        background: var(--surface);
      }
    }

    .trigger-content {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      min-width: 0;
    }

    .avatar-bubble {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-full);
      background: var(--primary);
      color: white;
      font-size: 0.72rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .label-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chevron-icon {
      transition: transform 0.2s ease;
      color: var(--text-muted);
      flex-shrink: 0;
      &.rotated { transform: rotate(180deg); }
    }

    .select-dropdown-menu {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 3000;
      padding: 6px;
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      max-height: 220px;
      overflow-x: hidden;
      box-sizing: border-box;
    }

    .options-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 210px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .option-item {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 10px;
      background: transparent;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--text);
      transition: background 0.15s ease;
      box-sizing: border-box;

      &:hover {
        background: var(--background);
        color: var(--primary);
      }

      &.selected {
        background: var(--primary-light);
        color: var(--primary);
        font-weight: 800;
      }
    }

    .opt-left {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
    }

    .opt-titles {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1px;
      min-width: 0;
      flex: 1;
    }

    .opt-label {
      font-size: 0.85rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .opt-sublabel {
      font-size: 0.7rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .opt-right {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
  `]
})
export class CustomSingleSelectComponent {
  private elementRef = inject(ElementRef);

  optionsSignal = signal<SingleSelectOption[]>([]);
  valSignal = signal<string>('');

  @Input() set options(opts: SingleSelectOption[]) {
    this.optionsSignal.set(opts || []);
  }
  get options(): SingleSelectOption[] {
    return this.optionsSignal();
  }

  @Input() set value(val: string) {
    this.valSignal.set(val || '');
  }
  get value(): string {
    return this.valSignal();
  }

  @Input() placeholder = 'Select option...';

  @Output() valueChange = new EventEmitter<string>();

  isOpen = signal(false);

  selectedOption = computed(() => {
    const currentVal = this.valSignal();
    const currentOpts = this.optionsSignal();
    return currentOpts.find(o => o.value === currentVal);
  });

  toggleOpen(): void {
    this.isOpen.set(!this.isOpen());
  }

  selectOption(val: string): void {
    this.valSignal.set(val);
    this.valueChange.emit(val);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
