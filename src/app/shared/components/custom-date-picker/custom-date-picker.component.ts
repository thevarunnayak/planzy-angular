import { Component, EventEmitter, Input, Output, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-custom-date-picker',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="custom-datepicker-wrapper">
      <button
        type="button"
        class="datepicker-trigger"
        [class.open]="isOpen"
        (click)="toggleOpen()"
      >
        <div class="trigger-label">
          <app-icon name="calendar" [size]="16"></app-icon>
          <span>{{ value || 'Set due date...' }}</span>
        </div>
        @if (value) {
          <button type="button" class="clear-btn" (click)="clearDate($event)" title="Clear Date">
            <app-icon name="x" [size]="12"></app-icon>
          </button>
        }
      </button>

      @if (isOpen) {
        <div
          class="calendar-popover glass-card bounce-in"
          [class.open-upward]="openUpward"
        >
          <!-- Calendar Header -->
          <div class="cal-nav-header">
            <button type="button" class="nav-btn" (click)="prevMonth()">‹</button>
            <span class="month-year-label">{{ monthNames[currentMonth] }} {{ currentYear }}</span>
            <button type="button" class="nav-btn" (click)="nextMonth()">›</button>
          </div>

          <!-- Quick Actions -->
          <div class="quick-dates-row">
            <button type="button" class="quick-chip" (click)="selectQuick('today')">Today</button>
            <button type="button" class="quick-chip" (click)="selectQuick('tomorrow')">Tomorrow</button>
            <button type="button" class="quick-chip" (click)="selectQuick('nextWeek')">Next Week</button>
          </div>

          <!-- Weekday Headers -->
          <div class="cal-days-grid">
            <span class="w-header">S</span>
            <span class="w-header">M</span>
            <span class="w-header">T</span>
            <span class="w-header">W</span>
            <span class="w-header">T</span>
            <span class="w-header">F</span>
            <span class="w-header">S</span>

            <!-- Blank padding days -->
            @for (blank of blankDays; track $index) {
              <span class="day-cell empty"></span>
            }

            <!-- Month days -->
            @for (day of monthDays; track day) {
              <button
                type="button"
                class="day-cell"
                [class.selected]="getDateString(day) === value"
                [class.today]="getDateString(day) === todayStr"
                (click)="selectDay(day)"
              >
                {{ day }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .custom-datepicker-wrapper {
      position: relative;
      width: 100%;
    }

    .datepicker-trigger {
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

    .trigger-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text);
    }

    .clear-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;

      &:hover { color: var(--danger); }
    }

    .calendar-popover {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      z-index: 3000;
      width: 260px;
      background: var(--surface);
      border-radius: var(--radius-lg);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: var(--shadow-lg);

      &.open-upward {
        top: auto;
        bottom: calc(100% + 6px);
      }
    }

    .cal-nav-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .month-year-label {
      font-size: 0.88rem;
      font-weight: 800;
      color: var(--text);
    }

    .nav-btn {
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: var(--radius-full);
      width: 28px;
      height: 28px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 800;
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover { background: var(--primary-light); color: var(--primary); }
    }

    .quick-dates-row {
      display: flex;
      gap: 6px;
    }

    .quick-chip {
      flex: 1;
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: var(--radius-full);
      padding: 4px 6px;
      font-size: 0.68rem;
      font-weight: 800;
      color: var(--text-muted);
      cursor: pointer;

      &:hover { background: var(--primary-light); color: var(--primary); }
    }

    .cal-days-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      text-align: center;
    }

    .w-header {
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--text-muted);
      padding-bottom: 4px;
    }

    .day-cell {
      background: transparent;
      border: none;
      height: 28px;
      border-radius: var(--radius-sm);
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: var(--surface-hover);
        color: var(--primary);
      }

      &.today {
        border: 1.5px solid var(--primary);
      }

      &.selected {
        background: var(--primary);
        color: white;
      }
    }
  `]
})
export class CustomDatePickerComponent {
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  openUpward = false;
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();
  todayStr = new Date().toISOString().split('T')[0];

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  private elementRef = inject(ElementRef);

  get blankDays(): number[] {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    return Array(firstDay).fill(0);
  }

  get monthDays(): number[] {
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
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
    const popoverHeight = 280;
    this.openUpward = spaceBelow < popoverHeight && rect.top > popoverHeight;
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  getDateString(day: number): string {
    const m = (this.currentMonth + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${this.currentYear}-${m}-${d}`;
  }

  selectDay(day: number): void {
    const str = this.getDateString(day);
    this.valueChange.emit(str);
    this.isOpen = false;
  }

  selectQuick(type: 'today' | 'tomorrow' | 'nextWeek'): void {
    const d = new Date();
    if (type === 'tomorrow') d.setDate(d.getDate() + 1);
    if (type === 'nextWeek') d.setDate(d.getDate() + 7);
    const str = d.toISOString().split('T')[0];
    this.valueChange.emit(str);
    this.isOpen = false;
  }

  clearDate(event: MouseEvent): void {
    event.stopPropagation();
    this.valueChange.emit('');
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
