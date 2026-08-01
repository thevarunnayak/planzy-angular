import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardStore } from '../../../core/stores/board.store';
import { TaskStore } from '../../../core/stores/task.store';
import { NotificationService } from '../../../core/services/notification.service';
import { STARTER_BOARD_TEMPLATES, BoardTemplate } from '../../../core/models/board-template.model';
import { IconComponent } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';
import { BadgeComponent } from '../badge/badge.component';

@Component({
  selector: 'app-template-library-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent, BadgeComponent],
  template: `
    <div class="modal-overlay fade-in" (click)="closed.emit()">
      <div class="modal-card glass-card pop-in" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="header-title">
            <app-icon name="sparkles" [size]="22"></app-icon>
            <div>
              <h3>Starter Template Gallery</h3>
              <p class="header-sub">Launch pre-configured boards with custom workflow columns and starter tasks</p>
            </div>
          </div>
          <button class="close-btn" (click)="closed.emit()">
            <app-icon name="x" [size]="16"></app-icon>
          </button>
        </div>

        <!-- Modal Body Grid -->
        <div class="modal-body custom-scroll-body">
          <div class="templates-grid">
            @for (tpl of templates; track tpl.id) {
              <div class="template-card glass-card">
                <div class="tpl-card-header">
                  <div class="tpl-badge-wrap">
                    <app-badge variant="primary" size="sm">{{ tpl.category }}</app-badge>
                    <span class="tpl-type-pill">{{ tpl.isGroup ? 'Group Workspace' : 'Personal' }}</span>
                  </div>
                  <h4 class="tpl-title">{{ tpl.name }}</h4>
                  <p class="tpl-desc">{{ tpl.description }}</p>
                </div>

                <!-- Column Pills Preview -->
                <div class="tpl-cols-preview">
                  <span class="preview-label">Columns:</span>
                  <div class="cols-chips-row">
                    @for (col of tpl.columns; track col.name) {
                      <span class="col-preview-chip" [style.border-left-color]="col.color">
                        {{ col.name }}
                      </span>
                    }
                  </div>
                </div>

                <!-- Starter Tasks Preview -->
                <div class="tpl-tasks-count">
                  <app-icon name="kanban" [size]="14"></app-icon>
                  <span>Includes {{ tpl.starterTasks.length }} starter tasks</span>
                </div>

                <div class="tpl-card-action">
                  <app-button
                    size="sm"
                    className="width-full"
                    (btnClick)="instantiateTemplate(tpl)"
                  >
                    Use Template
                  </app-button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-card {
      width: 100%;
      max-width: 820px;
      max-height: 85vh;
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      padding: 18px 24px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 1.5px solid var(--border);

      .header-title {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        color: var(--primary);

        h3 {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text);
          margin: 0;
        }

        .header-sub {
          font-size: 0.82rem;
          color: var(--text-muted);
          margin-top: 2px;
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
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 18px;
    }

    .template-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: var(--background);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-lg);
      transition: transform 0.2s ease, border-color 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        border-color: var(--primary);
      }
    }

    .tpl-badge-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .tpl-type-pill {
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--text-muted);
      background: var(--surface);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      border: 1px solid var(--border);
    }

    .tpl-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text);
      margin: 0 0 6px 0;
    }

    .tpl-desc {
      font-size: 0.84rem;
      color: var(--text-muted);
      line-height: 1.4;
      margin: 0;
    }

    .tpl-cols-preview {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .preview-label {
        font-size: 0.75rem;
        font-weight: 800;
        color: var(--text-muted);
      }

      .cols-chips-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .col-preview-chip {
        font-size: 0.75rem;
        font-weight: 700;
        background: var(--surface);
        border: 1px solid var(--border);
        border-left-width: 3px;
        padding: 2px 8px;
        border-radius: 4px;
        color: var(--text);
      }
    }

    .tpl-tasks-count {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      color: var(--primary);
      font-weight: 700;
    }
  `]
})
export class TemplateLibraryDialogComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() instantiated = new EventEmitter<string>();

  private boardStore = inject(BoardStore);
  private taskStore = inject(TaskStore);
  private notificationService = inject(NotificationService);

  templates = STARTER_BOARD_TEMPLATES;

  instantiateTemplate(tpl: BoardTemplate): void {
    const createdBoard = this.boardStore.createBoard(
      tpl.name,
      tpl.description,
      'folder',
      tpl.isGroup
    );

    // Update board columns matching template
    const colIdMap = new Map<string, string>();
    const formattedCols = tpl.columns.map((c, idx) => {
      const colId = `col-${Date.now()}-${idx}`;
      return {
        id: colId,
        name: c.name,
        color: c.color,
        order: idx + 1
      };
    });

    this.boardStore.boards.update(list => list.map(b => {
      if (b.id === createdBoard.id) {
        return {
          ...b,
          columns: formattedCols
        };
      }
      return b;
    }));

    // Add starter tasks
    const firstColId = formattedCols[0].id;
    tpl.starterTasks.forEach(st => {
      this.taskStore.createTask({
        ...st,
        boardId: createdBoard.id,
        columnId: firstColId
      });
    });

    this.boardStore.selectBoard(createdBoard.id);
    this.notificationService.success('Template Launched!', `Created board "${tpl.name}" with starter tasks.`);
    this.instantiated.emit(createdBoard.id);
    this.closed.emit();
  }
}
