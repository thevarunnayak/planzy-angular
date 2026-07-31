import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-number-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="custom-number-wrapper">
      <input
        type="text"
        class="number-input-field"
        [value]="value ?? ''"
        (input)="onInputChange($event)"
        [placeholder]="placeholder"
      />

      <div class="stepper-controls">
        <button type="button" class="stepper-btn up-btn" (click)="increment()" title="Increase by 0.5h">
          ▲
        </button>
        <button type="button" class="stepper-btn down-btn" (click)="decrement()" title="Decrease by 0.5h">
          ▼
        </button>
      </div>
    </div>
  `,
  styles: [`
    .custom-number-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .number-input-field {
      width: 100%;
      padding: 10px 36px 10px 14px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      background: var(--background);
      color: var(--text);
      font-size: 0.9rem;
      font-weight: 700;
      outline: none;
      transition: border-color 0.2s ease;

      &:focus {
        border-color: var(--primary);
        background: var(--surface);
      }
    }

    .stepper-controls {
      position: absolute;
      right: 4px;
      top: 4px;
      bottom: 4px;
      display: flex;
      flex-direction: column;
      width: 26px;
      border-left: 1.5px solid var(--border);
    }

    .stepper-btn {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.6rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease, color 0.15s ease;

      &:hover {
        background: var(--primary-light);
        color: var(--primary);
      }

      &.up-btn {
        border-top-right-radius: 6px;
      }

      &.down-btn {
        border-bottom-right-radius: 6px;
        border-top: 1px solid var(--border);
      }
    }
  `]
})
export class CustomNumberInputComponent {
  @Input() value?: number;
  @Input() step: number = 0.5;
  @Input() min: number = 0.5;
  @Input() max: number = 100;
  @Input() placeholder: string = '0.5';

  @Output() valueChange = new EventEmitter<number | undefined>();

  increment(): void {
    const current = this.value !== undefined && !isNaN(this.value) ? this.value : 0;
    let next = current + this.step;
    if (next > this.max) next = this.max;
    next = Math.round(next * 10) / 10;
    this.valueChange.emit(next);
  }

  decrement(): void {
    const current = this.value !== undefined && !isNaN(this.value) ? this.value : this.step;
    let next = current - this.step;
    if (next < this.min) next = this.min;
    next = Math.round(next * 10) / 10;
    this.valueChange.emit(next);
  }

  onInputChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    if (raw === '' || raw === null) {
      this.valueChange.emit(undefined);
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      this.valueChange.emit(parsed);
    }
  }
}
