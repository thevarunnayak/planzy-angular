import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeStore } from '../../core/stores/theme.store';
import { SettingsStore } from '../../core/stores/settings.store';
import { ThemeName } from '../../core/models/settings.model';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="settings-view">
      <div class="settings-header glass-card">
        <div class="header-title-row">
          <app-icon name="settings" [size]="28"></app-icon>
          <h2>Application Settings</h2>
        </div>
        <p>Customize your PlanIQ experience, switch color palettes, and toggle dark/light mode</p>
      </div>

      <!-- Color Palette Selector Card -->
      <div class="settings-card glass-card">
        <div class="card-title-row">
          <app-icon name="sparkles" [size]="20"></app-icon>
          <h3>Theme Color Palette</h3>
        </div>
        <p class="section-desc">Select your favorite aesthetic pastel color scheme</p>

        <div class="theme-grid">
          <!-- Blue Theme -->
          <button
            class="theme-card-btn blue"
            [class.selected]="themeStore.theme() === 'blue'"
            (click)="selectTheme('blue')"
          >
            <span class="theme-swatch blue-swatch"></span>
            <strong>PlanIQ Blue</strong>
            <span>Korean Blue (Default)</span>
          </button>

          <!-- Pink Theme -->
          <button
            class="theme-card-btn pink"
            [class.selected]="themeStore.theme() === 'pink'"
            (click)="selectTheme('pink')"
          >
            <span class="theme-swatch pink-swatch"></span>
            <strong>Bubblegum Pink</strong>
            <span>Cute Pastel Pink</span>
          </button>

          <!-- Lavender Theme -->
          <button
            class="theme-card-btn lavender"
            [class.selected]="themeStore.theme() === 'lavender'"
            (click)="selectTheme('lavender')"
          >
            <span class="theme-swatch purple-swatch"></span>
            <strong>Cozy Lavender</strong>
            <span>Soft Purple</span>
          </button>

          <!-- Mint Theme -->
          <button
            class="theme-card-btn mint"
            [class.selected]="themeStore.theme() === 'mint'"
            (click)="selectTheme('mint')"
          >
            <span class="theme-swatch green-swatch"></span>
            <strong>Minty Fresh</strong>
            <span>Calming Mint</span>
          </button>
        </div>
      </div>

      <!-- Appearance & Preferences Toggles -->
      <div class="settings-card glass-card">
        <h3>Appearance & Sound Controls</h3>

        <!-- Dark Mode Toggle across all 4 themes -->
        <div class="toggle-row">
          <div class="toggle-info">
            <strong>Dark Mode</strong>
            <p>Applies dark contrast mode across any selected theme palette</p>
          </div>
          <input
            type="checkbox"
            [checked]="themeStore.darkMode()"
            (change)="themeStore.toggleDarkMode()"
            class="toggle-checkbox"
          />
        </div>

        <div class="toggle-row">
          <div class="toggle-info">
            <strong>Cute Web Audio Sound Effects</strong>
            <p>Play pop and chime sounds on card moves and task completions</p>
          </div>
          <input
            type="checkbox"
            [checked]="settingsStore.settings().soundEnabled"
            (change)="settingsStore.toggleSound()"
            class="toggle-checkbox"
          />
        </div>

        <!-- Ambient Zen Music Default Toggle -->
        <div class="toggle-row">
          <div class="toggle-info">
            <strong>Ambient Zen Music (Focus Sessions)</strong>
            <p>Play relaxing ambient sound during Focus Timer sessions by default.</p>
          </div>
          <input
            type="checkbox"
            [checked]="settingsStore.settings().zenMusicEnabled"
            (change)="settingsStore.toggleZenMusic()"
            class="toggle-checkbox"
          />
        </div>

        <div class="toggle-row">
          <div class="toggle-info">
            <strong>Poppi Mascot Companion</strong>
            <p>Show the smiling bubble mascot in the bottom corner</p>
          </div>
          <input
            type="checkbox"
            [checked]="settingsStore.settings().showMascotPoppi"
            (change)="settingsStore.toggleMascot()"
            class="toggle-checkbox"
          />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-view {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .settings-header {
      padding: 24px;

      .header-title-row {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--primary);
      }

      h2 { font-size: 1.6rem; font-weight: 900; color: var(--text); }
      p { font-size: 0.88rem; color: var(--text-muted); margin-top: 4px; }
    }

    .settings-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .card-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--primary);
      }

      h3 { font-size: 1.2rem; font-weight: 900; color: var(--text); }
      .section-desc { font-size: 0.82rem; color: var(--text-muted); }
    }

    .theme-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }

    .theme-card-btn {
      background: var(--background);
      border: 2px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;

      strong { font-size: 0.95rem; color: var(--text); }
      span { font-size: 0.75rem; color: var(--text-muted); }

      &.selected {
        border-color: var(--primary);
        background: var(--surface);
        box-shadow: var(--shadow-md);
      }
    }

    .theme-swatch {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);

      &.blue-swatch { background: #3A86FF; }
      &.pink-swatch { background: #FF7597; }
      &.purple-swatch { background: #8A5CF5; }
      &.green-swatch { background: #2EC4B6; }
    }

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1.5px solid var(--border);

      &:last-child {
        border-bottom: none;
      }
    }

    .toggle-info strong {
      font-size: 0.9rem;
      color: var(--text);
      display: block;
      margin-bottom: 4px;
    }

    .toggle-info p {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .toggle-checkbox {
      width: 22px;
      height: 22px;
      min-width: 22px;
      cursor: pointer;
      accent-color: var(--primary);
    }
  `]
})
export class SettingsComponent {
  themeStore = inject(ThemeStore);
  settingsStore = inject(SettingsStore);

  selectTheme(theme: ThemeName): void {
    this.themeStore.setTheme(theme);
  }
}
