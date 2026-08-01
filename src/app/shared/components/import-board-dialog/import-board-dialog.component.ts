import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportImportService } from '../../../core/services/export-import.service';
import { IconComponent } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-import-board-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  template: `
    <div class="modal-overlay fade-in" (click)="closed.emit()">
      <div class="modal-card glass-card pop-in" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="header-title">
            <app-icon name="folder" [size]="22"></app-icon>
            <h3>Import Board Backup</h3>
          </div>
          <button class="close-btn" (click)="closed.emit()">
            <app-icon name="x" [size]="16"></app-icon>
          </button>
        </div>

        <!-- Modal Body Dropzone -->
        <div class="modal-body">
          <p class="dialog-sub">Upload a Planzy JSON backup file (<code>.json</code>) to restore a workspace board and its tasks.</p>

          <div
            class="upload-dropzone"
            [class.dragover]="isDragging()"
            (dragover)="onDragOver($event)"
            (dragleave)="isDragging.set(false)"
            (drop)="onDrop($event)"
            (click)="fileInput.click()"
          >
            <input
              #fileInput
              type="file"
              accept=".json"
              class="hidden-file-input"
              (change)="onFileSelected($event)"
            />

            <div class="dropzone-content">
              <div class="dropzone-icon">
                <app-icon name="plus" [size]="32"></app-icon>
              </div>
              @if (selectedFileName()) {
                <strong class="selected-file-name">{{ selectedFileName() }}</strong>
                <span class="drop-hint">Click or drag another file to change</span>
              } @else {
                <strong>Drag & Drop JSON Backup File Here</strong>
                <span class="drop-hint">or click to browse your computer</span>
              }
            </div>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="modal-footer">
          <app-button variant="secondary" (btnClick)="closed.emit()">Cancel</app-button>
          <app-button
            [disabled]="!jsonContent()"
            (btnClick)="processImport()"
          >
            Import Board
          </app-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-card {
      width: 100%;
      max-width: 480px;
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }

    .modal-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1.5px solid var(--border);

      .header-title {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--primary);

        h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text);
        }
      }

      .close-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        &:hover { color: var(--text); }
      }
    }

    .modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .dialog-sub {
      font-size: 0.85rem;
      color: var(--text-muted);
      code {
        background: var(--background);
        padding: 2px 6px;
        border-radius: 4px;
        color: var(--primary);
      }
    }

    .upload-dropzone {
      border: 2px dashed var(--border);
      border-radius: var(--radius-md);
      padding: 30px 20px;
      text-align: center;
      cursor: pointer;
      background: var(--background);
      transition: all 0.2s ease;

      &:hover, &.dragover {
        border-color: var(--primary);
        background: var(--primary-light);
      }
    }

    .hidden-file-input {
      display: none;
    }

    .dropzone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .dropzone-icon {
      color: var(--primary);
    }

    .selected-file-name {
      color: var(--primary);
      font-size: 0.95rem;
    }

    .drop-hint {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .modal-footer {
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      border-top: 1.5px solid var(--border);
      background: var(--background);
    }
  `]
})
export class ImportBoardDialogComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() imported = new EventEmitter<void>();

  private exportImportService = inject(ExportImportService);

  isDragging = signal(false);
  selectedFileName = signal<string>('');
  jsonContent = signal<string>('');

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.readFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.readFile(input.files[0]);
    }
  }

  private readFile(file: File): void {
    if (!file.name.endsWith('.json')) {
      alert('Please select a valid .json file');
      return;
    }
    this.selectedFileName.set(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      this.jsonContent.set(e.target?.result as string || '');
    };
    reader.readAsText(file);
  }

  processImport(): void {
    const text = this.jsonContent();
    if (!text) return;
    const success = this.exportImportService.importBoardFromJson(text);
    if (success) {
      this.imported.emit();
      this.closed.emit();
    }
  }
}
