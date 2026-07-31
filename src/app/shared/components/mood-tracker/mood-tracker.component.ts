import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../../core/services/storage.service';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-mood-tracker',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="mood-tracker-card glass-card">
      <div class="card-title-row">
        <app-icon name="sparkles" [size]="18"></app-icon>
        <h4>Daily Focus Mood</h4>
      </div>

      <p class="subtitle">How are you feeling about your plan today?</p>

      <div class="mood-buttons-row">
        @for (m of moodOptions; track m.id) {
          <button
            class="mood-btn"
            [class.selected]="selectedMoodId === m.id"
            (click)="selectMood(m.id)"
          >
            <app-icon [name]="m.icon" [size]="20"></app-icon>
            <span>{{ m.label }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .mood-tracker-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .card-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary);

      h4 { font-size: 1rem; font-weight: 800; color: var(--text); }
    }

    .subtitle {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .mood-buttons-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 4px;
    }

    .mood-btn {
      background: var(--background);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      padding: 10px 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.2s ease;

      span { font-size: 0.72rem; font-weight: 800; color: var(--text); }

      &:hover {
        background: var(--surface);
        border-color: var(--primary);
        color: var(--primary);
      }

      &.selected {
        background: var(--primary-light);
        border-color: var(--primary);
        color: var(--primary);
        box-shadow: var(--shadow-sm);
      }
    }
  `]
})
export class MoodTrackerComponent {
  private storageService = inject(StorageService);

  selectedMoodId: string | null = null;

  moodOptions: { id: string; icon: IconName; label: string }[] = [
    { id: 'energized', icon: 'zap', label: 'Energized' },
    { id: 'focused', icon: 'target', label: 'Focused' },
    { id: 'relaxed', icon: 'coffee', label: 'Relaxed' }
  ];

  constructor() {
    const saved = localStorage.getItem('planzy_user_mood');
    if (saved) this.selectedMoodId = saved;
  }

  selectMood(id: string): void {
    this.selectedMoodId = id;
    localStorage.setItem('planzy_user_mood', id);
  }
}
