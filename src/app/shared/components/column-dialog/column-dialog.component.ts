import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoFocusDirective } from '../../directives/autofocus.directive';

const COLUMN_COLORS = ['#3A86FF', '#8ECAE6', '#C7F9CC', '#D8BBFF', '#FFF3B0', '#FF5A5F'];

@Component({
  selector: 'app-column-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoFocusDirective],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-card glass-card bounce-in" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Add Custom Column</h3>
          <button class="close-btn" (click)="close()">✕</button>
        </div>

        <div class="modal-body">
          <div class="field-group">
            <label class="label">Column Name *</label>
            <input
              type="text"
              class="input-field"
              [(ngModel)]="name"
              placeholder="e.g. Under Review, In Testing..."
              appAutofocus
            />
          </div>

          <div class="field-group">
            <label class="label">Accent Color</label>
            <div class="colors-row">
              @for (color of colors; track color) {
                <button
                  class="color-opt"
                  [style.background]="color"
                  [class.selected]="selectedColor() === color"
                  (click)="selectedColor.set(color)"
                ></button>
              }
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="jelly-btn secondary" (click)="close()">Cancel</button>
          <button class="jelly-btn" (click)="submit()" [disabled]="!name.trim()">Add Column</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(18, 24, 36, 0.45);
      backdrop-filter: blur(6px);
      z-index: 2000;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .modal-card {
      width: 100%;
      max-width: 440px;
      background: var(--surface);
      border-radius: var(--radius-xl);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 18px 24px;
      border-bottom: 1.5px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 { font-size: 1.15rem; font-weight: 900; }
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.1rem;
      color: var(--text-muted);
      cursor: pointer;
      font-weight: 800;
    }

    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .label {
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--text-muted);
    }

    .input-field {
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      background: var(--background);
      color: var(--text);
      font-weight: 700;
      outline: none;
      font-size: 0.95rem;

      &:focus { border-color: var(--primary); }
    }

    .colors-row {
      display: flex;
      gap: 10px;
    }

    .color-opt {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      border: 2px solid transparent;
      cursor: pointer;

      &.selected {
        border-color: var(--text);
        transform: scale(1.15);
      }
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1.5px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class ColumnDialogComponent {
  @Output() submitted = new EventEmitter<{ name: string; color: string }>();
  @Output() cancelled = new EventEmitter<void>();

  colors = COLUMN_COLORS;
  selectedColor = signal('#3A86FF');
  name = '';

  close(): void {
    this.cancelled.emit();
  }

  submit(): void {
    if (this.name.trim()) {
      this.submitted.emit({
        name: this.name.trim(),
        color: this.selectedColor()
      });
    }
  }
}
