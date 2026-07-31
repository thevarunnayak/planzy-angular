import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="modal-backdrop fade-in" (click)="onBackdropClick($event)">
      <div
        class="modal-card glass-card bounce-in"
        [style.maxWidth]="maxWidth"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="header-left">
            @if (icon) {
              <app-icon [name]="icon" [size]="20"></app-icon>
            }
            <h3>{{ title }}</h3>
            <ng-content select="[modal-header]"></ng-content>
          </div>

          <button
            type="button"
            class="modal-close-btn"
            (click)="close()"
            title="Close (ESC)"
          >
            <app-icon name="x" [size]="18"></app-icon>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body custom-scroll-body">
          <ng-content></ng-content>
        </div>

        <!-- Modal Footer Slot (if present) -->
        <div class="modal-footer">
          <ng-content select="[modal-footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
    }

    .modal-card {
      width: 100%;
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: var(--shadow-md);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--primary);

        h3 {
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--text);
        }
      }
    }

    .modal-close-btn {
      background: var(--background);
      border: 1.5px solid var(--border);
      width: 34px;
      height: 34px;
      border-radius: var(--radius-full);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--danger);
        color: var(--danger);
        transform: scale(1.1);
      }
    }

    .modal-body {
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: calc(90vh - 160px);
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      &:empty { display: none; }
    }
  `]
})
export class ModalComponent {
  @Input({ required: true }) title!: string;
  @Input() icon?: IconName;
  @Input() maxWidth: string = '520px';
  @Input() closeOnBackdrop: boolean = true;

  @Output() closed = new EventEmitter<void>();

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }

  close(): void {
    this.closed.emit();
  }
}
