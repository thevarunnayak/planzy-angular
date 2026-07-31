import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SoundService } from '../../core/services/sound.service';
import { ConfettiService } from '../../core/services/confetti.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';

@Component({
  selector: 'app-focus-session',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, TooltipDirective],
  template: `
    <div class="focus-view">
      <!-- Header Banner -->
      <div class="focus-header glass-card">
        <div class="header-title-row">
          <app-icon name="meditation" [size]="32"></app-icon>
          <h2>Focus Session Studio</h2>
        </div>
        <p>Customize your focus timer duration, select ambient sounds, and enter distraction-free Zen Mode.</p>
      </div>

      <!-- Config & Launch Grid -->
      <div class="config-grid">
        <!-- Duration Settings Card -->
        <div class="config-card glass-card">
          <div class="card-title">
            <app-icon name="clock" [size]="20"></app-icon>
            <h3>Focus Timer Duration</h3>
          </div>

          <!-- Focus Presets -->
          <div class="setting-group">
            <label class="setting-label">Select Focus Work Duration</label>
            <div class="preset-pills">
              <button
                type="button"
                class="preset-btn"
                [class.active]="workMinutes() === 15"
                (click)="workMinutes.set(15)"
              >15 Min <span>Quick Sprint</span></button>

              <button
                type="button"
                class="preset-btn"
                [class.active]="workMinutes() === 25"
                (click)="workMinutes.set(25)"
              >25 Min <span>Pomodoro</span></button>

              <button
                type="button"
                class="preset-btn"
                [class.active]="workMinutes() === 50"
                (click)="workMinutes.set(50)"
              >50 Min <span>Deep Work</span></button>

              <button
                type="button"
                class="preset-btn"
                [class.active]="workMinutes() === 90"
                (click)="workMinutes.set(90)"
              >90 Min <span>Ultradian</span></button>
            </div>

            <!-- Custom Number Stepper with Minus & Plus Arrow Buttons -->
            <div class="custom-stepper-box">
              <span class="stepper-label">Custom Duration:</span>
              <div class="stepper-controls">
                <button
                  type="button"
                  class="stepper-btn"
                  (click)="decrementMinutes()"
                  [disabled]="workMinutes() <= 1"
                  appTooltip="Decrease 1 Minute"
                >
                  <app-icon name="minus" [size]="14"></app-icon>
                </button>

                <div class="stepper-value-display">
                  <span>{{ workMinutes() }}</span>
                  <span class="unit">min</span>
                </div>

                <button
                  type="button"
                  class="stepper-btn"
                  (click)="incrementMinutes()"
                  [disabled]="workMinutes() >= 300"
                  appTooltip="Increase 1 Minute"
                >
                  <app-icon name="plus" [size]="14"></app-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Ambient Sound & Zen Mode Launcher Card -->
        <div class="launch-card glass-card">
          <div class="card-title">
            <app-icon name="sparkles" [size]="20"></app-icon>
            <h3>Ambient Sound & Launch</h3>
          </div>

          <div class="sound-toggle-box">
            <div class="toggle-left">
              <strong>Play Ambient Zen Music</strong>
              <p>Loop relaxing background sound during your session</p>
            </div>
            <input
              type="checkbox"
              [ngModel]="zenMusicEnabled()"
              (ngModelChange)="zenMusicEnabled.set($event)"
              class="toggle-checkbox"
            />
          </div>

          <div class="summary-box">
            <div class="summary-item">
              <span class="label">Focus Session Duration:</span>
              <span class="value">{{ workMinutes() }} Minutes</span>
            </div>
          </div>

          <button
            class="jelly-btn launch-btn width-full"
            (click)="launchZenMode()"
            appTooltip="Launch Fullscreen Zen Focus Mode"
          >
            <app-icon name="meditation" [size]="20"></app-icon>
            <span>Launch Zen Focus Mode</span>
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
                <span class="zen-mode-badge">FOCUS SESSION</span>
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
    </div>
  `,
  styles: [`
    .focus-view {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .focus-header {
      padding: 24px;
      background: linear-gradient(135deg, var(--surface), var(--primary-light));

      .header-title-row {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--primary);
      }

      h2 { font-size: 1.6rem; font-weight: 900; color: var(--text); }
      p { font-size: 0.88rem; color: var(--text-muted); margin-top: 4px; }
    }

    .config-grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 24px;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    .config-card, .launch-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--primary);
      h3 { font-size: 1.2rem; font-weight: 900; color: var(--text); }
    }

    .setting-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .setting-label {
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }

    .preset-pills {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 12px;
    }

    .preset-btn {
      background: var(--background);
      border: 2px solid var(--border);
      border-radius: var(--radius-md);
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      font-weight: 900;
      font-size: 1rem;
      color: var(--text);
      transition: all 0.2s ease;

      span { font-size: 0.72rem; font-weight: 700; color: var(--text-muted); }

      &:hover { border-color: var(--primary); }

      &.active {
        border-color: var(--primary);
        background: var(--surface);
        color: var(--primary);
        box-shadow: var(--shadow-sm);
        span { color: var(--primary); }
      }
    }

    /* Custom Stepper Controls (Flex Column on Mobile / Small Screens) */
    .custom-stepper-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 18px;
      background: var(--background);
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);

      @media (max-width: 576px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }

    .stepper-label {
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--text);
    }

    .stepper-controls {
      display: flex;
      align-items: center;
      gap: 12px;

      @media (max-width: 576px) {
        width: 100%;
        justify-content: space-between;
      }
    }

    .stepper-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      border: 1.5px solid var(--border);
      background: var(--surface);
      color: var(--text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        border-color: var(--primary);
        color: var(--primary);
        transform: scale(1.1);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .stepper-value-display {
      font-size: 1.3rem;
      font-weight: 900;
      color: var(--primary);
      min-width: 60px;
      text-align: center;

      .unit {
        font-size: 0.8rem;
        color: var(--text-muted);
        font-weight: 700;
        margin-left: 3px;
      }
    }

    .sound-toggle-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 16px;
      background: var(--background);
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);

      @media (max-width: 576px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .toggle-left {
        display: flex;
        flex-direction: column;
        gap: 4px;

        strong { font-size: 0.9rem; color: var(--text); display: block; }
        p { font-size: 0.78rem; color: var(--text-muted); line-height: 1.3; }
      }
    }

    .toggle-checkbox {
      width: 22px;
      height: 22px;
      min-width: 22px;
      cursor: pointer;
      accent-color: var(--primary);
    }

    .summary-box {
      background: var(--background);
      border-radius: var(--radius-md);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.88rem;
      .label { color: var(--text-muted); font-weight: 700; }
      .value { color: var(--primary); font-weight: 900; }
    }

    .launch-btn {
      padding: 16px;
      font-size: 1.05rem;
      justify-content: center;
    }

    .width-full { width: 100%; }

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
export class FocusSessionComponent {
  soundService = inject(SoundService);
  private confettiService = inject(ConfettiService);

  workMinutes = signal(25);
  zenMusicEnabled = signal(true);

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

  incrementMinutes(): void {
    if (this.workMinutes() < 300) {
      this.workMinutes.update(v => v + 1);
    }
  }

  decrementMinutes(): void {
    if (this.workMinutes() > 1) {
      this.workMinutes.update(v => v - 1);
    }
  }

  launchZenMode(): void {
    this.mode.set('work');
    this.secondsLeft.set(Math.max(1, this.workMinutes()) * 60);
    this.openZenOverlay();
    this.startTimer();
  }

  openZenOverlay(): void {
    this.zenOverlayOpen.set(true);
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    if (this.zenMusicEnabled()) {
      this.soundService.startZenMusic();
    }
  }

  closeZenOverlay(): void {
    this.zenOverlayOpen.set(false);
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    this.pauseTimer();
  }

  toggleZenMusic(): void {
    this.soundService.toggleZenMusic();
  }

  startTimer(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.soundService.playPop();

    if (this.zenMusicEnabled() && !this.soundService.zenMusicPlaying()) {
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
    this.secondsLeft.set(Math.max(1, this.workMinutes()) * 60);
  }

  private onTimerComplete(): void {
    this.pauseTimer();
    this.soundService.playSuccessChime();
    this.confettiService.launchCelebration();
    this.secondsLeft.set(Math.max(1, this.workMinutes()) * 60);
  }
}
