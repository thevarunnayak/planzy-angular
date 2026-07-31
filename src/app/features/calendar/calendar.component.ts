import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TaskStore } from '../../core/stores/task.store';
import { Task } from '../../core/models/task.model';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';

interface CalendarCell {
  dateStr: string;
  dayNum: number;
  isToday: boolean;
  isOtherMonth: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, IconComponent, TooltipDirective],
  template: `
    <div class="calendar-view">
      <!-- Calendar Header & Navigation Bar -->
      <div class="calendar-header glass-card">
        <div class="header-left">
          <div class="title-row">
            <app-icon name="calendar" [size]="24"></app-icon>
            <h2>{{ currentMonthName() }} {{ currentYear() }}</h2>
          </div>
          <p class="hide-on-mobile">Organize deadlines, track tasks, and plan ahead with clarity. Click any task to view it on its board.</p>
        </div>

        <div class="header-controls">
          <div class="nav-btn-group">
            <button class="jelly-btn secondary icon-only" (click)="prevMonth()" title="Previous Month">
              ‹
            </button>
            <button class="jelly-btn secondary" (click)="goToToday()">
              Today
            </button>
            <button class="jelly-btn secondary icon-only" (click)="nextMonth()" title="Next Month">
              ›
            </button>
          </div>

          <div class="legend-row hide-on-mobile">
            <span class="legend-item"><span class="dot urgent"></span> Urgent</span>
            <span class="legend-item"><span class="dot high"></span> High</span>
            <span class="legend-item"><span class="dot medium"></span> Medium</span>
          </div>
        </div>
      </div>

      <!-- Month Grid -->
      <div class="calendar-grid glass-card">
        <!-- Weekday Headers -->
        @for (day of weekDays; track day) {
          <div class="weekday-header">{{ day }}</div>
        }

        <!-- Days -->
        @for (cell of daysInMonth(); track cell.dateStr + '-' + $index) {
          <div class="day-cell" [class.today]="cell.isToday" [class.other-month]="cell.isOtherMonth">
            <span class="day-number">{{ cell.dayNum }}</span>

            <div class="cell-tasks">
              @for (task of getTasksForDate(cell.dateStr); track task.id) {
                <div
                  class="calendar-task-pill"
                  [class]="task.priority"
                  (click)="navigateToBoard(task, $event)"
                  [appTooltip]="'Open on board: ' + task.title"
                >
                  <app-icon name="bookmark" [size]="10"></app-icon>
                  <span class="task-title-short">{{ task.title }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .calendar-view {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .calendar-header {
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;

      .title-row {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--primary);
      }

      h2 { font-size: 1.5rem; font-weight: 900; color: var(--text); }
      p { font-size: 0.85rem; color: var(--text-muted); margin-top: 2px; }
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .nav-btn-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon-only {
      padding: 8px 14px;
      font-size: 1.1rem;
      font-weight: 900;
    }

    .legend-row {
      display: flex;
      gap: 14px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      font-weight: 700;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: var(--radius-full);
      &.urgent { background: var(--danger); }
      &.high { background: var(--yellow-dark); }
      &.medium { background: var(--accent); }
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: var(--border);
      border-radius: var(--radius-xl);
      overflow: hidden;
    }

    .weekday-header {
      background: var(--surface);
      padding: 12px;
      text-align: center;
      font-weight: 800;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .day-cell {
      background: var(--surface);
      min-height: 110px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: background 0.2s ease;

      &:hover {
        background: var(--surface-hover);
      }

      &.today {
        background: var(--primary-light);
        .day-number {
          background: var(--primary);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      &.other-month {
        opacity: 0.35;
        background: var(--background);
      }
    }

    .day-number {
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--text);
    }

    .cell-tasks {
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
    }

    .calendar-task-pill {
      background: var(--background);
      border-left: 3.5px solid var(--primary);
      padding: 5px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.74rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

      &:hover {
        transform: translateY(-1.5px) scale(1.02);
        box-shadow: var(--shadow-sm);
        border-left-width: 4.5px;
        filter: brightness(1.15);
      }

      &:active {
        transform: scale(0.98);
      }

      &.urgent { border-left-color: var(--danger); }
      &.high { border-left-color: var(--yellow-dark); }
      &.medium { border-left-color: var(--accent); }
    }

    .task-title-short {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 576px) {
      .calendar-view {
        padding: 12px;
        gap: 12px;
      }
      .calendar-header {
        padding: 12px 14px;
        h2 { font-size: 1.15rem; }
      }
      .hide-on-mobile {
        display: none !important;
      }
      .weekday-header {
        padding: 6px 2px;
        font-size: 0.68rem;
      }
      .day-cell {
        min-height: 68px;
        padding: 4px;
        gap: 2px;
      }
      .day-number {
        font-size: 0.75rem;
      }
      .calendar-task-pill {
        padding: 3px 5px;
        font-size: 0.65rem;
      }
    }
  `]
})
export class CalendarComponent {
  taskStore = inject(TaskStore);
  private router = inject(Router);

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  activeDate = signal<Date>(new Date());

  currentYear = computed(() => this.activeDate().getFullYear());
  currentMonth = computed(() => this.activeDate().getMonth());
  currentMonthName = computed(() => this.monthNames[this.currentMonth()]);

  daysInMonth = computed<CalendarCell[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    const prevMonthDaysCount = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    const cells: CalendarCell[] = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDaysCount - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const mStr = (prevMonth + 1).toString().padStart(2, '0');
      const dStr = dayNum.toString().padStart(2, '0');
      const dateStr = `${prevYear}-${mStr}-${dStr}`;
      cells.push({
        dateStr,
        dayNum,
        isToday: dateStr === todayStr,
        isOtherMonth: true
      });
    }

    for (let dayNum = 1; dayNum <= daysCount; dayNum++) {
      const mStr = (month + 1).toString().padStart(2, '0');
      const dStr = dayNum.toString().padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      cells.push({
        dateStr,
        dayNum,
        isToday: dateStr === todayStr,
        isOtherMonth: false
      });
    }

    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const mStr = (nextMonth + 1).toString().padStart(2, '0');
      const dStr = i.toString().padStart(2, '0');
      const dateStr = `${nextYear}-${mStr}-${dStr}`;
      cells.push({
        dateStr,
        dayNum: i,
        isToday: dateStr === todayStr,
        isOtherMonth: true
      });
    }

    return cells;
  });

  prevMonth(): void {
    const current = this.activeDate();
    this.activeDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const current = this.activeDate();
    this.activeDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  goToToday(): void {
    this.activeDate.set(new Date());
  }

  getTasksForDate(dateStr: string): Task[] {
    return this.taskStore.tasks().filter(t => t.dueDate === dateStr);
  }

  navigateToBoard(task: Task, event: MouseEvent): void {
    event.stopPropagation();
    if (task.boardId) {
      this.router.navigate(['/boards', task.boardId]);
    } else {
      this.router.navigate(['/boards']);
    }
  }
}
