import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsStore } from '../../../core/stores/settings.store';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-poppi-mascot',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (settingsStore.settings().showMascotPoppi) {
      <div class="mascot-wrapper floating-blob">
        @if (speechBubbleVisible()) {
          <div class="speech-bubble bounce-in">
            <span>{{ currentQuote() }}</span>
            <button class="close-bubble-btn" (click)="hideBubble($event)">✕</button>
          </div>
        }

        <button class="poppi-mascot-btn" (click)="triggerQuote()" title="Click Poppi for motivation!">
          <div class="mascot-avatar-badge">
            <app-icon name="mascot" [size]="42"></app-icon>
          </div>
        </button>
      </div>
    }
  `,
  styles: [`
    .mascot-wrapper {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .speech-bubble {
      background: var(--surface);
      border: 2px solid var(--border);
      padding: 10px 16px;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--text);
      margin-bottom: 8px;
      max-width: 220px;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: -8px;
        right: 20px;
        border-width: 8px 8px 0;
        border-style: solid;
        border-color: var(--surface) transparent;
        display: block;
        width: 0;
      }
    }

    .close-bubble-btn {
      background: transparent;
      border: none;
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--text-muted);
      cursor: pointer;
      margin-left: 8px;
    }

    .poppi-mascot-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      transition: transform 0.25s var(--transition-spring);

      &:hover {
        transform: scale(1.15) rotate(6deg);
      }
    }

    .mascot-avatar-badge {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-full);
      background: var(--primary-light);
      color: var(--primary);
      border: 2.5px solid var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-md);
    }
  `]
})
export class PoppiMascotComponent {
  settingsStore = inject(SettingsStore);

  speechBubbleVisible = signal(true);
  currentQuote = signal("You're doing great! Keep up the awesome focus!");

  private quotes = [
    "You're doing great! Keep up the awesome focus!",
    "Take a quick breather if you need it!",
    "One task at a time, you got this!",
    "Organized mind, peaceful day!"
  ];

  triggerQuote(): void {
    const random = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    this.currentQuote.set(random);
    this.speechBubbleVisible.set(true);
  }

  hideBubble(event: MouseEvent): void {
    event.stopPropagation();
    this.speechBubbleVisible.set(false);
  }
}
