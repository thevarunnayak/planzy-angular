import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStore } from '../../core/stores/dashboard.store';
import { PomodoroWidgetComponent } from '../../shared/components/pomodoro-widget/pomodoro-widget.component';
import { MoodTrackerComponent } from '../../shared/components/mood-tracker/mood-tracker.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    PomodoroWidgetComponent,
    MoodTrackerComponent,
    IconComponent
  ],
  template: `
    <div class="dashboard-view">
      <!-- Top Banner -->
      <div class="dash-welcome-card glass-card">
        <div class="welcome-text">
          <div class="welcome-title-row">
            <app-icon name="sparkles" [size]="24"></app-icon>
            <h2>Good day, Planner!</h2>
          </div>
          <p>You have <strong>{{ dashboardStore.stats().pendingTasks }} tasks pending</strong> today. Let's make it a happy & productive day!</p>
        </div>
      </div>

      <!-- Main Metrics Grid -->
      <div class="metrics-grid">
        <!-- Productivity Score Card -->
        <div class="metric-card glass-card">
          <div class="metric-header">
            <app-icon name="target" [size]="16"></app-icon>
            <span class="metric-label">Productivity Score</span>
          </div>

          @if (dashboardStore.stats().totalTasks === 0) {
            <div class="gauge-empty-state">
              <app-icon name="plus" [size]="32"></app-icon>
              <p>Add tasks to start tracking your productivity!</p>
            </div>
          } @else {
            <div class="gauge-container">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--background)" stroke-width="12"/>
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="var(--primary)"
                  stroke-width="12"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="314"
                  [attr.stroke-dashoffset]="314 - (314 * dashboardStore.stats().productivityScore) / 100"
                  transform="rotate(-90 60 60)"
                  style="transition: stroke-dashoffset 0.8s ease;"
                />
              </svg>
              <span class="score-text">{{ dashboardStore.stats().productivityScore }}%</span>
            </div>
          }
        </div>

        <!-- Task Completion Counter Card -->
        <div class="metric-card glass-card">
          <div class="metric-header">
            <app-icon name="check" [size]="16"></app-icon>
            <span class="metric-label">Completed Tasks</span>
          </div>

          <div class="stat-big-num">
            <span>{{ dashboardStore.stats().completedTasks }}</span>
            <span class="sub-num">/ {{ dashboardStore.stats().totalTasks }} total</span>
          </div>
          <div class="progress-bar-bg">
            <div
              class="progress-fill"
              [style.width.%]="dashboardStore.stats().totalTasks > 0 ? (dashboardStore.stats().completedTasks / dashboardStore.stats().totalTasks) * 100 : 100"
            ></div>
          </div>
        </div>
      </div>

      <!-- Lower Content Layout: Weekly Activity SVG Chart + Widgets -->
      <div class="dashboard-content-grid">
        <!-- SVG Weekly Chart (Height matched to right side cards) -->
        <div class="chart-card glass-card">
          <div class="chart-header">
            <div class="chart-title-group">
              <app-icon name="dashboard" [size]="20"></app-icon>
              <h3>Weekly Productivity Report</h3>
            </div>
            <span class="chart-tag font-bold">This Week</span>
          </div>

          <div class="svg-chart-container">
            @let activity = dashboardStore.stats().weeklyActivity;
            @let maxVal = getMaxActivity(activity);

            <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
              <!-- Grid Lines -->
              <line x1="0" y1="30" x2="500" y2="30" stroke="var(--border)" stroke-dasharray="4 4"/>
              <line x1="0" y1="80" x2="500" y2="80" stroke="var(--border)" stroke-dasharray="4 4"/>
              <line x1="0" y1="130" x2="500" y2="130" stroke="var(--border)" stroke-dasharray="4 4"/>
              <line x1="0" y1="165" x2="500" y2="165" stroke="var(--border)"/>

              <!-- Bar Items -->
              @for (item of activity; track item.day; let idx = $index) {
                @let x = idx * 70 + 32;

                @if (item.completed > 0) {
                  @let barH = getScaledHeight(item.completed, maxVal);
                  <rect
                    [attr.x]="x"
                    [attr.y]="165 - barH"
                    width="32"
                    [attr.height]="barH"
                    rx="8"
                    fill="url(#barGrad)"
                  />
                }

                <text [attr.x]="x + 16" y="190" text-anchor="middle" fill="var(--text-muted)" font-size="13" font-weight="800">
                  {{ item.day }}
                </text>
              }

              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--primary)"/>
                  <stop offset="100%" stop-color="var(--secondary)"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <!-- Sidebar Widgets -->
        <div class="dashboard-widgets">
          <app-pomodoro-widget></app-pomodoro-widget>
          <app-mood-tracker></app-mood-tracker>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-view {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .dash-welcome-card {
      padding: 24px;
      background: linear-gradient(135deg, var(--surface), var(--primary-light));
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: var(--radius-xl);
    }

    .welcome-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--primary);
    }

    .welcome-text h2 {
      font-size: 1.6rem;
      font-weight: 900;
      color: var(--text);
    }

    .welcome-text p {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .metric-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .metric-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary);
    }

    .metric-label {
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }

    .gauge-container {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .gauge-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 12px 8px;
      text-align: center;
      color: var(--text-muted, #888);

      app-icon {
        opacity: 0.45;
      }

      p {
        font-size: 0.75rem;
        line-height: 1.4;
        margin: 0;
        opacity: 0.7;
      }
    }


    .score-text {
      position: absolute;
      font-size: 1.4rem;
      font-weight: 900;
      color: var(--text);
    }

    .stat-big-num {
      font-size: 2.4rem;
      font-weight: 900;
      color: var(--primary);

      .sub-num {
        font-size: 0.9rem;
        color: var(--text-muted);
        font-weight: 700;
      }
    }

    .progress-bar-bg {
      height: 8px;
      background: var(--background);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary);
      border-radius: var(--radius-full);
    }

    .dashboard-content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      align-items: stretch;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    .chart-card {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      box-sizing: border-box;
    }

    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      h3 { font-size: 1.1rem; font-weight: 900; }
    }

    .chart-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--primary);
    }

    .chart-tag {
      background: var(--background);
      padding: 4px 12px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .svg-chart-container {
      width: 100%;
      flex: 1;
      display: flex;
      align-items: stretch;
    }

    .dashboard-widgets {
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100%;
    }
  `]
})
export class DashboardComponent {
  dashboardStore = inject(DashboardStore);

  getMaxActivity(activity: Array<{ completed: number }>): number {
    const max = Math.max(...activity.map(a => a.completed), 0);
    return max > 0 ? max : 5;
  }

  getScaledHeight(val: number, maxVal: number): number {
    if (val <= 0) return 0;
    const maxBarHeight = 125;
    const ratio = val / Math.max(maxVal, 3);
    return Math.max(Math.round(ratio * maxBarHeight), 14);
  }
}
