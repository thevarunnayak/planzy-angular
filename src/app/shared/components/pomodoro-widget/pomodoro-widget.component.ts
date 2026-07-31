import { Component, inject, signal, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsStore } from '../../../core/stores/settings.store';
import { SoundService } from '../../../core/services/sound.service';
import { ConfettiService } from '../../../core/services/confetti.service';
import { IconComponent } from '../icon/icon.component';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-pomodoro-widget',
  standalone: true,
  imports: [CommonModule, IconComponent, TooltipDirective],
  template: `
    <!-- Standard Card Widget -->
    <div class="pomodoro-card glass-card">
      <div class="pomo-header">
        <app-icon name="clock" [size]="18"></app-icon>
        <span class="pomo-title">{{ mode() === 'work' ? 'Focus Session' : 'Short Break' }}</span>
      </div>

      <div class="timer-display">
        <span class="time-text">{{ formattedTime() }}</span>
      </div>

      <div class="pomo-controls">
        @if (!isRunning()) {
          <button
            class="jelly-btn pomo-btn"
            (click)="startTimerAndZen()"
            appTooltip="Start Focus Timer & Zen Mode"
          >
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Start</span>
          </button>
        } @else {
          <button
            class="jelly-btn secondary pomo-btn"
            (click)="pauseTimer()"
            appTooltip="Pause Focus Timer"
          >
            <span>Pause</span>
          </button>
        }

        <!-- Zen Mode Button with Lotus Blossom Icon & App Tooltip Directive -->
        <button
          class="icon-btn"
          (click)="openZenOverlay()"
          appTooltip="Open Fullscreen Zen Focus Mode"
        >
          <app-icon name="meditation" [size]="16"></app-icon>
        </button>

        <button
          class="icon-btn"
          (click)="resetTimer()"
          appTooltip="Reset Focus Timer to 25:00"
        >
          <app-icon name="refresh" [size]="14"></app-icon>
        </button>
      </div>
    </div>

    <!-- Fullscreen Zen Mode Overlay -->
    @if (zenOverlayOpen()) {
      <div class="zen-fullscreen-overlay fade-in">
        <!-- Top Toolbar -->
        <header class="zen-top-bar">
          <div class="zen-title">
            <app-icon name="meditation" [size]="24"></app-icon>
            <span>Zen Focus Mode</span>
          </div>

          <div class="zen-top-actions">
            <!-- Close Zen Mode Button -->
            <button
              type="button"
              class="zen-close-btn"
              (click)="closeZenOverlay()"
              appTooltip="Exit Zen Mode (ESC)"
            >
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>
        </header>

        <!-- Main Focus Timer Ring Body -->
        <main class="zen-main-content">
          <div class="zen-ring-container" [class.running]="isRunning()">
            <div class="pulse-ring"></div>
            <div class="zen-timer-box">
              <span class="zen-mode-badge">{{ mode() === 'work' ? 'FOCUS SESSION' : 'SHORT BREAK' }}</span>
              <h1 class="zen-time-display">{{ formattedTime() }}</h1>
              <p class="zen-subtext">{{ isRunning() ? 'Stay in the flow state' : 'Paused' }}</p>
            </div>
          </div>

          <!-- Zen Controls -->
          <div class="zen-controls-bar">
            @if (!isRunning()) {
              <button
                class="zen-action-btn primary"
                (click)="startTimer()"
                appTooltip="Start Focus Countdown"
              >
                <span>Start Focus</span>
              </button>
            } @else {
              <button
                class="zen-action-btn secondary"
                (click)="pauseTimer()"
                appTooltip="Pause Focus Countdown"
              >
                <span>Pause</span>
              </button>
            }

            <button
              class="zen-action-btn glass"
              (click)="resetTimer()"
              appTooltip="Reset Focus Countdown"
            >
              <span>Reset</span>
            </button>
          </div>
        </main>

        <!-- Bottom Right Floating Music Toggle Button -->
        <footer class="zen-bottom-bar">
          <button
            type="button"
            class="zen-music-btn"
            [class.active]="soundService.zenMusicPlaying()"
            (click)="toggleZenMusic()"
            [appTooltip]="soundService.zenMusicPlaying() ? 'Mute Ambient Zen Music' : 'Play Ambient Zen Music'"
          >
            <span>{{ soundService.zenMusicPlaying() ? 'Zen Music On' : 'Zen Music Muted' }}</span>
          </button>
        </footer>
      </div>
    }
  `,
  styles: [`
    .pomodoro-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      background: linear-gradient(135deg, var(--surface), var(--surface-hover));
    }

    .pomo-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary);
    }

    .pomo-title {
      font-weight: 800;
      font-size: 0.95rem;
      color: var(--text);
    }

    .timer-display {
      font-size: 2.2rem;
      font-weight: 900;
      color: var(--primary);
      letter-spacing: 2px;
      font-family: 'Poppins', sans-serif;
    }

    .pomo-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .pomo-btn {
      padding: 8px 18px;
      font-size: 0.85rem;
    }

    .icon-btn {
      background: var(--background);
      border: 1.5px solid var(--border);
      width: 38px;
      height: 38px;
      border-radius: var(--radius-full);
      cursor: pointer;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text);
      transition: transform 0.2s ease;

      &:hover { transform: scale(1.1); }
    }

    /* Fullscreen Zen Overlay Styles */
    .zen-fullscreen-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 999999 !important;
      background: radial-gradient(circle at center, var(--surface) 0%, var(--background) 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 32px 40px;
      backdrop-filter: blur(20px);
      overflow: hidden !important;
      box-sizing: border-box;
    }

    .zen-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .zen-title {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 1.3rem;
        font-weight: 900;
        color: var(--primary);
      }
    }

    .zen-top-actions {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .zen-bottom-bar {
      display: flex;
      justify-content: flex-end;
      width: 100%;
    }

    .zen-music-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: var(--radius-full);
      border: 2px solid var(--border);
      background: var(--surface);
      color: var(--text);
      font-size: 0.88rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;

      &:hover, &.active {
        border-color: var(--primary);
        background: var(--primary-light);
        color: var(--primary);
        box-shadow: var(--shadow-md);
      }
    }

    .zen-close-btn {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-full);
      border: 2px solid var(--border);
      background: var(--surface);
      color: var(--text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;

      &:hover {
        transform: scale(1.1);
        border-color: var(--danger);
        color: var(--danger);
      }
    }

    .zen-main-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 40px;
      flex: 1;
    }

    .zen-ring-container {
      position: relative;
      width: 320px;
      height: 320px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.running .pulse-ring {
        animation: pulseRing 3s infinite ease-in-out;
      }
    }

    .pulse-ring {
      position: absolute;
      inset: 0;
      border-radius: var(--radius-full);
      border: 4px solid var(--primary-light);
      background: radial-gradient(circle, var(--primary-light) 0%, transparent 70%);
      opacity: 0.6;
    }

    @keyframes pulseRing {
      0% { transform: scale(0.95); opacity: 0.4; }
      50% { transform: scale(1.08); opacity: 0.8; }
      100% { transform: scale(0.95); opacity: 0.4; }
    }

    .zen-timer-box {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .zen-mode-badge {
      font-size: 0.85rem;
      font-weight: 900;
      letter-spacing: 1.5px;
      color: var(--primary);
      background: var(--surface);
      padding: 6px 16px;
      border-radius: var(--radius-full);
      border: 1.5px solid var(--border);
    }

    .zen-time-display {
      font-size: 5.5rem;
      font-weight: 900;
      color: var(--text);
      letter-spacing: 4px;
      line-height: 1;
      font-family: 'Poppins', sans-serif;
    }

    .zen-subtext {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .zen-controls-bar {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .zen-action-btn {
      padding: 14px 28px;
      border-radius: var(--radius-full);
      font-size: 1rem;
      font-weight: 900;
      cursor: pointer;
      border: none;
      transition: transform 0.2s ease;

      &:hover { transform: translateY(-2px); }

      &.primary {
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white;
        box-shadow: var(--shadow-md);
      }

      &.secondary {
        background: var(--danger);
        color: white;
      }

      &.glass {
        background: var(--surface);
        border: 2px solid var(--border);
        color: var(--text);
      }
    }
  `]
})
export class PomodoroWidgetComponent implements OnDestroy {
  settingsStore = inject(SettingsStore);
  soundService = inject(SoundService);
  private confettiService = inject(ConfettiService);

  mode = signal<'work' | 'break'>('work');
  secondsLeft = signal(25 * 60);
  isRunning = signal(false);
  zenOverlayOpen = signal(false);
  private timerId: unknown = null;

  formattedTime = () => {
    const s = this.secondsLeft();
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  @HostListener('window:keydown.escape')
  onEscapePress(): void {
    if (this.zenOverlayOpen()) {
      this.closeZenOverlay();
    }
  }

  startTimerAndZen(): void {
    this.openZenOverlay();
    this.startTimer();
  }

  openZenOverlay(): void {
    this.zenOverlayOpen.set(true);
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    if (this.settingsStore.settings().zenMusicEnabled) {
      this.soundService.startZenMusic();
    }
  }

  closeZenOverlay(): void {
    this.zenOverlayOpen.set(false);
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    this.soundService.stopZenMusic();
  }

  toggleZenMusic(): void {
    this.soundService.toggleZenMusic();
  }

  startTimer(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.soundService.playPop();

    if (this.settingsStore.settings().zenMusicEnabled && !this.soundService.zenMusicPlaying()) {
      this.soundService.startZenMusic();
    }

    this.timerId = setInterval(() => {
      if (this.secondsLeft() > 0) {
        this.secondsLeft.update(v => v - 1);
      } else {
        this.onTimerComplete();
      }
    }, 1000);
  }

  pauseTimer(): void {
    this.isRunning.set(false);
    if (this.timerId) {
      clearInterval(this.timerId as number);
      this.timerId = null;
    }
    this.soundService.stopZenMusic();
  }

  resetTimer(): void {
    this.pauseTimer();
    const mins = this.mode() === 'work' ? this.settingsStore.settings().pomodoroWorkMinutes : this.settingsStore.settings().pomodoroBreakMinutes;
    this.secondsLeft.set(mins * 60);
  }

  private onTimerComplete(): void {
    this.pauseTimer();
    this.soundService.playSuccessChime();
    this.confettiService.launchCelebration();

    if (this.mode() === 'work') {
      this.mode.set('break');
      this.secondsLeft.set(this.settingsStore.settings().pomodoroBreakMinutes * 60);
    } else {
      this.mode.set('work');
      this.secondsLeft.set(this.settingsStore.settings().pomodoroWorkMinutes * 60);
    }
  }

  ngOnDestroy(): void {
    this.pauseTimer();
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
}
