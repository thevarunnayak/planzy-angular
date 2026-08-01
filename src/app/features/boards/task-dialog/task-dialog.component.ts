import { Component, Input, Output, EventEmitter, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, TaskAssignee, TaskComment, TaskPriority, TaskAttachment } from '../../../core/models/task.model';
import { TaskStore } from '../../../core/stores/task.store';
import { BoardStore } from '../../../core/stores/board.store';
import { AppwriteService } from '../../../core/services/appwrite.service';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { CustomSelectComponent, SelectOption } from '../../../shared/components/custom-select/custom-select.component';
import { CustomDatePickerComponent } from '../../../shared/components/custom-date-picker/custom-date-picker.component';
import { CustomNumberInputComponent } from '../../../shared/components/custom-number-input/custom-number-input.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CustomSingleSelectComponent, SingleSelectOption } from '../../../shared/components/custom-single-select/custom-single-select.component';
import { LightboxCarouselComponent } from '../../../shared/components/lightbox-carousel/lightbox-carousel.component';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    CustomSelectComponent,
    CustomDatePickerComponent,
    CustomNumberInputComponent,
    ConfirmDialogComponent,
    ButtonComponent,
    CustomSingleSelectComponent,
    LightboxCarouselComponent
  ],
  template: `
    @if (targetBoardId) {
      <div class="modal-overlay bounce-in" (click)="onBackdropClick($event)">
        <div class="modal-card glass-card" (click)="$event.stopPropagation()">
          <!-- Fixed Modal Header -->
          <div class="modal-header">
            <div class="header-title-group">
              <app-icon name="bookmark" [size]="20"></app-icon>
              <h3>{{ isEditMode ? 'Edit Task Details' : 'Create New Task' }}</h3>
            </div>
            <button class="close-btn" (click)="closed.emit()">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          <!-- Scrollable Modal Body Form -->
          <form id="taskForm" (ngSubmit)="saveTask()" class="modal-form custom-scroll-body">
            <!-- 1. Workspace Board (Top Hierarchy) -->
            <div class="form-group">
              <label>Workspace Board</label>
              <app-custom-select
                [options]="boardOptions()"
                [value]="targetBoardId"
                (valueChange)="onBoardChange($event)"
              ></app-custom-select>
            </div>

            <!-- 2. Priority Level & Target Column Row -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Priority Level</label>
                <app-custom-select
                  [options]="priorityOptions"
                  [(value)]="priority"
                ></app-custom-select>
              </div>

              <div class="form-group flex-1">
                <label>Target Column</label>
                <app-custom-select
                  [options]="columnOptions()"
                  [(value)]="columnId"
                ></app-custom-select>
              </div>
            </div>

            <!-- 3. Task Title -->
            <div class="form-group">
              <label>Task Title</label>
              <input
                type="text"
                class="form-input"
                placeholder="e.g. Design Landing Page Wireframes"
                [(ngModel)]="title"
                name="title"
                required
                autofocus
              />
            </div>

            <!-- 4. Task Description -->
            <div class="form-group">
              <label>Description</label>
              <textarea
                class="form-textarea"
                placeholder="Add task context, notes, or criteria..."
                [(ngModel)]="description"
                name="description"
                rows="3"
              ></textarea>
            </div>

            <!-- 5. Icon Tag Selection -->
            <div class="form-group">
              <label>Icon Badge</label>
              <div class="icon-selector-grid">
                @for (ic of availableStickers; track ic) {
                  <button
                    type="button"
                    class="icon-opt-btn"
                    [class.selected]="sticker === ic"
                    (click)="sticker = ic"
                  >
                    <app-icon [name]="ic" [size]="18"></app-icon>
                  </button>
                }
              </div>
            </div>

            <!-- Assignee (Full Width Row - Group Boards only) -->
            @if (isGroupBoard()) {
              <div class="form-group">
                <label>Assignee (Group Member)</label>
                <app-custom-single-select
                  [options]="assigneeOptions()"
                  [value]="selectedAssigneeUserId"
                  placeholder="Unassigned"
                  (valueChange)="onAssigneeSelect($event)"
                ></app-custom-single-select>
              </div>
            }

            <!-- Due Date & Est. Hours Row -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Due Date</label>
                <app-custom-date-picker
                  [value]="dueDate"
                  (valueChange)="dueDate = $event"
                ></app-custom-date-picker>
              </div>

              <div class="form-group flex-1">
                <label>Est. Hours</label>
                <app-custom-number-input
                  [(value)]="estimatedHours"
                  [step]="0.5"
                  [min]="0.5"
                  placeholder="1.5"
                ></app-custom-number-input>
              </div>
            </div>

            <!-- Labels Row -->
            <div class="form-group">
              <label>Labels (Comma separated)</label>
              <input
                type="text"
                class="form-input"
                placeholder="e.g. Design, Frontend"
                [ngModel]="labelsInput"
                (ngModelChange)="labelsInput = $event"
                name="labelsInput"
              />
            </div>

            <!-- Task Attachments Section -->
            <div class="form-group attachments-section">
              <div class="attachments-header">
                <div class="att-label-group">
                  <app-icon name="paperclip" [size]="15"></app-icon>
                  <label>Attachments @if (attachments.length > 0) {<span class="att-count-chip">{{ attachments.length }}</span>}</label>
                </div>
                <button type="button" class="att-add-btn" (click)="attachFileInput.click()" [disabled]="isUploading()">
                  @if (isUploading()) {
                    <span class="spinner-dot"></span>
                    <span>Uploading…</span>
                  } @else {
                    <app-icon name="plus" [size]="13"></app-icon>
                    <span>Add File</span>
                  }
                </button>
              </div>

              <input
                #attachFileInput
                type="file"
                class="hidden-file-input"
                [accept]="'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv'"
                (change)="onAttachmentSelected($event)"
              />

              <!-- Drag & Drop Zone (shows only when no attachments yet) -->
              @if (attachments.length === 0 && !isUploading()) {
                <div
                  class="att-dropzone"
                  [class.dragover]="isDragOver()"
                  (click)="attachFileInput.click()"
                  (dragover)="onDragOver($event)"
                  (dragleave)="isDragOver.set(false)"
                  (drop)="onDrop($event)"
                >
                  <div class="dropzone-inner">
                    <div class="dropzone-icon-ring">
                      <app-icon name="plus" [size]="22"></app-icon>
                    </div>
                    <p class="dropzone-label">Drag & drop files here</p>
                    <p class="dropzone-sub">or <span class="link-text">browse files</span> · Images, PDFs, docs, ZIPs</p>
                  </div>
                </div>
              }

              <!-- Uploading Progress State -->
              @if (isUploading()) {
                <div class="att-uploading-bar">
                  <div class="upload-bar-fill"></div>
                  <span>Uploading file…</span>
                </div>
              }

              <!-- Attachment Cards Grid -->
              @if (attachments.length > 0) {
                <div class="att-cards-list">
                  @for (att of attachments; track att.id; let attIndex = $index) {
                    <div class="att-file-card" [class.att-image-card]="att.type && att.type.startsWith('image/')">

                      <!-- Image Preview -->
                      @if (att.type && att.type.startsWith('image/')) {
                        <div class="att-thumb-wrap" (click)="openCarousel(attIndex, $event)">
                          <img [src]="att.url" [alt]="att.name" class="att-thumb-img" />
                          <div class="att-thumb-overlay">
                            <app-icon name="zap" [size]="16"></app-icon>
                          </div>
                        </div>
                      } @else {
                        <!-- File Type Icon -->
                        <div class="att-type-icon-box" [class]="getFileTypeClass(att.name)">
                          <span class="att-type-ext">{{ getFileExt(att.name) }}</span>
                        </div>
                      }

                      <!-- File Info -->
                      <div class="att-file-info">
                        <span class="att-file-name" [title]="att.name">{{ att.name }}</span>
                        <span class="att-file-meta">{{ formatFileSize(att.size) }} · {{ getFileExt(att.name).toUpperCase() }}</span>
                      </div>

                      <!-- Actions -->
                      <div class="att-file-actions">
                        <a [href]="att.url" target="_blank" download [attr.download]="att.name" class="att-action-btn download-btn" title="Download">
                          <app-icon name="star" [size]="13"></app-icon>
                        </a>
                        <button type="button" class="att-action-btn delete-att-btn" (click)="removeAttachment(att.id)" title="Remove">
                          <app-icon name="x" [size]="13"></app-icon>
                        </button>
                      </div>
                    </div>
                  }

                  <!-- Add More Tile (inline) -->
                  <button type="button" class="att-add-tile" (click)="attachFileInput.click()" [disabled]="isUploading()">
                    <app-icon name="plus" [size]="18"></app-icon>
                    <span>Add more</span>
                  </button>
                </div>
              }
            </div>

            <!-- Shared Lightbox Carousel -->
            @if (lightboxOpen()) {
              <app-lightbox-carousel
                [attachments]="attachments"
                [startIndex]="lightboxStartIndex()"
                (close)="lightboxOpen.set(false)"
              ></app-lightbox-carousel>
            }

            <!-- Task Activity & Comments Section -->
            @if (isEditMode && task) {
              <div class="activity-section">
                <div class="activity-header">
                  <app-icon name="comment" [size]="16"></app-icon>
                  <strong>Activity & Comments ({{ comments.length }})</strong>
                </div>

                <div class="comments-list">
                  @for (comm of comments; track comm.id) {
                    <div class="comment-bubble">
                      <div class="comment-avatar">
                        {{ comm.authorName.charAt(0).toUpperCase() }}
                      </div>
                      <div class="comment-content">
                        <div class="comment-meta">
                          <span class="comment-author">{{ comm.authorName }}</span>
                          <span class="comment-time">{{ comm.createdAt | date:'shortTime' }}</span>
                        </div>
                        <p class="comment-text">{{ comm.content || comm.text }}</p>
                      </div>
                    </div>
                  }
                </div>

                <div class="add-comment-box">
                  <input
                    type="text"
                    class="comment-input"
                    placeholder="Write a comment..."
                    [(ngModel)]="newCommentText"
                    name="newCommentText"
                    (keydown.enter)="$event.preventDefault(); postComment()"
                  />
                  <app-button
                    size="sm"
                    [disabled]="!newCommentText.trim()"
                    (btnClick)="postComment()"
                  >
                    Post
                  </app-button>
                </div>
              </div>
            }
          </form>

          <!-- Fixed Modal Footer -->
          <div class="modal-footer">
            @if (isEditMode) {
              <button
                type="button"
                class="delete-btn"
                (click)="confirmDelete.set(true)"
                title="Delete Task"
              >
                <app-icon name="trash" [size]="16"></app-icon>
                <span>Delete</span>
              </button>
            }
            <div class="right-actions">
              <app-button variant="secondary" (btnClick)="closed.emit()">Cancel</app-button>
              <app-button type="submit" form="taskForm" [disabled]="!title.trim()" (btnClick)="saveTask()">
                {{ isEditMode ? 'Save Changes' : 'Create Task' }}
              </app-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Task Confirmation Modal -->
      @if (confirmDelete()) {
        <app-confirm-dialog
          title="Delete Task?"
          message="Are you sure you want to delete this task? This action cannot be undone."
          confirmText="Delete Task"
          (confirmed)="deleteTaskConfirmed()"
          (cancelled)="confirmDelete.set(false)"
        ></app-confirm-dialog>
      }
    } @else {
      <!-- Fallback modal if 0 boards exist -->
      <app-confirm-dialog
        title="No Board Found"
        message="You need at least one workspace board before creating tasks."
        confirmText="Create Board"
        (confirmed)="redirectToCreateBoard()"
        (cancelled)="closed.emit()"
      ></app-confirm-dialog>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(18, 24, 36, 0.6);
      backdrop-filter: blur(4px);
      z-index: 2500;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .modal-card {
      width: 100%;
      max-width: 560px;
      padding: 24px 24px 20px 24px;
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-height: 88vh;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;

      .header-title-group {
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

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: var(--radius-sm);
      &:hover { color: var(--text); background: var(--background); }
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow-y: auto;
      padding-right: 4px;
      flex: 1;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 0.8rem;
        font-weight: 800;
        color: var(--text-muted);
      }
    }

    .form-row {
      display: flex;
      gap: 12px;

      .flex-1 {
        flex: 1;
      }
    }

    .icon-selector-grid {
      display: flex;
      gap: 8px;
    }

    .icon-opt-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      background: var(--background);
      color: var(--text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &.selected {
        border-color: var(--primary);
        background: var(--primary-light);
        color: var(--primary);
      }
    }

    .form-input, .form-textarea, .form-select {
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      background: var(--background);
      color: var(--text);
      font-size: 0.9rem;
      font-weight: 700;
      outline: none;
      width: 100%;

      &:focus {
        border-color: var(--primary);
      }
    }

    /* ────── Custom Attachment UI ────── */
    .attachments-section {
      border: 1.5px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 12px 14px 14px;
      background: var(--surface);
    }

    .attachments-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;

      .att-label-group {
        display: flex;
        align-items: center;
        gap: 7px;
        color: var(--primary);

        label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 800;
          color: var(--text);
          margin: 0;
        }

        .att-count-chip {
          background: var(--primary);
          color: white;
          font-size: 0.68rem;
          font-weight: 900;
          border-radius: 99px;
          padding: 1px 7px;
          line-height: 1.5;
        }
      }

      .att-add-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.78rem;
        font-weight: 800;
        color: var(--primary);
        background: var(--primary-light, rgba(80,120,255,0.1));
        border: 1.5px solid transparent;
        border-radius: var(--radius-md);
        padding: 5px 11px;
        cursor: pointer;
        transition: all 0.18s ease;

        &:hover:not(:disabled) {
          background: var(--primary);
          color: white;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid currentColor;
          border-top-color: transparent;
          animation: spin 0.7s linear infinite;
        }
      }
    }

    .hidden-file-input { display: none; }

    /* Drag & Drop Zone */
    .att-dropzone {
      border: 2px dashed var(--border);
      border-radius: var(--radius-lg);
      background: var(--background);
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      padding: 22px 16px;

      &:hover, &.dragover {
        border-color: var(--primary);
        background: var(--primary-light, rgba(80,120,255,0.06));

        .dropzone-icon-ring {
          background: var(--primary);
          color: white;
          transform: scale(1.1);
        }
      }

      .dropzone-inner {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        pointer-events: none;
      }

      .dropzone-icon-ring {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--border);
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        margin-bottom: 4px;
      }

      .dropzone-label {
        font-size: 0.88rem;
        font-weight: 800;
        color: var(--text);
        margin: 0;
      }

      .dropzone-sub {
        font-size: 0.76rem;
        color: var(--text-muted);
        margin: 0;

        .link-text {
          color: var(--primary);
          font-weight: 700;
        }
      }
    }

    /* Upload Progress Bar */
    .att-uploading-bar {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      background: var(--background);
      border: 1.5px solid var(--primary);
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--primary);
      position: relative;
      overflow: hidden;

      .upload-bar-fill {
        position: absolute;
        inset: 0;
        background: var(--primary);
        opacity: 0.08;
        animation: uploadPulse 1.2s ease-in-out infinite;
      }
    }

    /* Attachment Cards List */
    .att-cards-list {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .att-file-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 11px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      background: var(--background);
      transition: border-color 0.15s;

      &:hover {
        border-color: var(--primary);
      }
    }

    /* Thumbnail for images */
    .att-thumb-wrap {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      cursor: pointer;
      position: relative;
      flex-shrink: 0;

      .att-thumb-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .att-thumb-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        opacity: 0;
        transition: opacity 0.15s;
      }

      &:hover .att-thumb-overlay { opacity: 1; }
    }

    /* File type icon box */
    .att-type-icon-box {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: var(--border);

      .att-type-ext {
        font-size: 0.62rem;
        font-weight: 900;
        letter-spacing: 0.5px;
        color: var(--text);
        text-transform: uppercase;
      }

      &.type-pdf { background: #fde8e8; color: #c53030; }
      &.type-doc { background: #ebf4ff; color: #2b6cb0; }
      &.type-xls { background: #f0fff4; color: #276749; }
      &.type-img { background: #faf5ff; color: #6b46c1; }
      &.type-zip { background: #fffbeb; color: #975a16; }
      &.type-txt { background: var(--border); color: var(--text-muted); }
    }

    .att-file-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .att-file-name {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .att-file-meta {
        font-size: 0.7rem;
        color: var(--text-muted);
      }
    }

    .att-file-actions {
      display: flex;
      gap: 5px;
      flex-shrink: 0;
    }

    .att-action-btn {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      border: 1.5px solid var(--border);
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.15s;
      text-decoration: none;

      &.download-btn:hover { color: var(--primary); border-color: var(--primary); background: var(--primary-light, rgba(80,120,255,0.08)); }
      &.delete-att-btn:hover { color: var(--danger); border-color: var(--danger); background: var(--danger-light, rgba(220,38,38,0.08)); }
    }

    /* Add More Tile */
    .att-add-tile {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 8px;
      border: 2px dashed var(--border);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-muted);
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;

      &:hover:not(:disabled) {
        border-color: var(--primary);
        color: var(--primary);
      }
    }

    /* Lightbox */
    .lightbox-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(6px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .lightbox-card {
      position: relative;
      max-width: 90vw;
      max-height: 88vh;
      border-radius: var(--radius-xl);
      overflow: hidden;

      img {
        max-width: 100%;
        max-height: 80vh;
        object-fit: contain;
        display: block;
      }
    }

    .lightbox-close-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0,0,0,0.55);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    @keyframes uploadPulse {
      0%, 100% { opacity: 0.08; }
      50% { opacity: 0.18; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    /* ────── End Attachment UI ────── */

    .activity-section {
      margin-top: 8px;
      padding-top: 14px;
      border-top: 1.5px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .activity-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--text);
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 140px;
      overflow-y: auto;
    }

    .comment-bubble {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: var(--background);
      padding: 8px 12px;
      border-radius: var(--radius-md);
    }

    .comment-avatar {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-full);
      background: var(--primary);
      color: white;
      font-size: 0.72rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .comment-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .comment-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      .comment-author { font-size: 0.75rem; font-weight: 800; color: var(--text); }
      .comment-time { font-size: 0.68rem; color: var(--text-muted); }
    }

    .comment-text {
      font-size: 0.82rem;
      color: var(--text);
    }

    .add-comment-box {
      display: flex;
      gap: 8px;
    }

    .comment-input {
      flex: 1;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      background: var(--background);
      color: var(--text);
      font-size: 0.84rem;
      outline: none;

      &:focus { border-color: var(--primary); }
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 10px;
      border-top: 1.5px solid var(--border);
      flex-shrink: 0;
    }

    .right-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: auto;
    }

    .delete-btn {
      background: transparent;
      border: none;
      color: var(--danger);
      font-size: 0.85rem;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: var(--radius-md);

      &:hover {
        background: var(--danger-light);
      }
    }
  `]
})
export class TaskDialogComponent implements OnInit {
  @Input() task: Task | null = null;
  @Output() closed = new EventEmitter<void>();

  private taskStore = inject(TaskStore);
  private boardStore = inject(BoardStore);
  private appwriteService = inject(AppwriteService);

  isEditMode = false;
  targetBoardIdSignal = signal<string>('');
  get targetBoardId(): string {
    return this.targetBoardIdSignal();
  }
  set targetBoardId(val: string) {
    this.targetBoardIdSignal.set(val || '');
  }

  title = '';
  description = '';
  priority: TaskPriority = 'medium';
  columnId = 'todo';
  dueDate = '';
  estimatedHours?: number;
  sticker: IconName = 'bookmark';
  labelsInput = '';
  assignee?: TaskAssignee;
  selectedAssigneeUserId = '';
  comments: TaskComment[] = [];
  newCommentText = '';

  confirmDelete = signal(false);

  availableStickers: IconName[] = ['bookmark', 'flame', 'zap', 'star', 'target', 'sparkles'];

  priorityOptions: SelectOption[] = [
    { value: 'low', label: 'Low', icon: 'bookmark', color: 'var(--text-muted)' },
    { value: 'medium', label: 'Medium', icon: 'zap', color: 'var(--primary)' },
    { value: 'high', label: 'High', icon: 'flame', color: 'var(--orange)' },
    { value: 'urgent', label: 'Urgent', icon: 'alert', color: 'var(--danger)' }
  ];

  boardOptions = computed<SelectOption[]>(() => {
    return this.boardStore.boards().map(b => ({
      value: b.id,
      label: b.name,
      icon: 'folder'
    }));
  });

  isGroupBoard = computed<boolean>(() => {
    const boardId = this.targetBoardIdSignal();
    const board = this.boardStore.boards().find(b => b.id === boardId);
    return Boolean(board?.isGroup);
  });

  onBoardChange(newBoardId: string): void {
    this.targetBoardIdSignal.set(newBoardId);
    const board = this.boardStore.boards().find(b => b.id === newBoardId);
    if (board && board.columns.length > 0) {
      this.columnId = board.columns[0].id;
    }
    this.selectedAssigneeUserId = '';
    this.assignee = undefined;
  }

  boardMembers = computed(() => {
    const boardId = this.targetBoardIdSignal();
    const board = this.boardStore.boards().find(b => b.id === boardId);
    return board?.members || [];
  });

  assigneeOptions = computed<SingleSelectOption[]>(() => {
    const members = this.boardMembers();
    const opts: SingleSelectOption[] = [
      { value: '', label: 'Unassigned', icon: 'user' }
    ];

    members.forEach(mem => {
      opts.push({
        value: mem.userId,
        label: mem.name || mem.email || 'Member',
        sublabel: mem.email,
        avatarInitials: (mem.name || mem.email || 'M').charAt(0).toUpperCase(),
        badge: mem.role === 'owner' ? 'Owner' : (mem.role === 'admin' ? 'Admin' : 'Member')
      });
    });

    return opts;
  });

  columnOptions = computed<SelectOption[]>(() => {
    const boardId = this.targetBoardIdSignal();
    const board = this.boardStore.boards().find(b => b.id === boardId);
    if (!board || board.columns.length === 0) return [];
    return board.columns.map(c => ({
      value: c.id,
      label: c.name,
      icon: 'folder'
    }));
  });

  ngOnInit(): void {
    const boards = this.boardStore.boards();
    if (this.task) {
      this.isEditMode = true;
      this.targetBoardId = this.task.boardId;
      this.title = this.task.title;
      this.description = this.task.description || '';
      this.priority = this.task.priority;
      this.columnId = this.task.columnId;
      this.dueDate = this.task.dueDate || '';
      this.estimatedHours = this.task.estimatedHours;
      this.sticker = (this.task.sticker as IconName) || 'bookmark';
      this.labelsInput = this.task.labels.join(', ');
      this.assignee = this.task.assignee;
      this.selectedAssigneeUserId = this.task.assignee?.userId || '';
      this.comments = this.task.comments || [];
      this.attachments = this.task.attachments || [];
    } else {
      const activeBoard = this.boardStore.activeBoard();
      this.targetBoardId = activeBoard ? activeBoard.id : (boards.length > 0 ? boards[0].id : '');
      const board = boards.find(b => b.id === this.targetBoardId);
      if (board && board.columns.length > 0) {
        this.columnId = board.columns[0].id;
      }
    }
  }

  attachments: TaskAttachment[] = [];
  previewImageUrl = signal<string | null>(null); // kept for compat, use lightbox instead
  lightboxOpen = signal<boolean>(false);
  lightboxStartIndex = signal<number>(0);
  isUploading = signal<boolean>(false);
  isDragOver = signal<boolean>(false);

  openCarousel(index: number, event?: MouseEvent): void {
    event?.stopPropagation();
    this.lightboxStartIndex.set(index);
    this.lightboxOpen.set(true);
  }

  openImagePreview(url: string): void {
    // Legacy: find index by url and open carousel instead
    const idx = this.attachments.findIndex(a => a.url === url);
    this.openCarousel(idx >= 0 ? idx : 0);
  }

  async onAttachmentSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    await this.uploadFile(input.files[0]);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) await this.uploadFile(file);
  }

  private async uploadFile(file: File): Promise<void> {
    this.isUploading.set(true);
    try {
      const { url, fileId } = await this.appwriteService.uploadTaskAttachmentFile(file);
      const newAttachment: TaskAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        fileId,
        createdAt: new Date().toISOString()
      };
      this.attachments = [...this.attachments, newAttachment];
      // Persist immediately so a page refresh doesn't lose the attachment
      await this.persistAttachments();
    } finally {
      this.isUploading.set(false);
    }
  }

  async removeAttachment(attachmentId: string): Promise<void> {
    const att = this.attachments.find(a => a.id === attachmentId);
    if (att?.fileId) {
      await this.appwriteService.deleteTaskAttachmentFile(att.fileId);
    }
    this.attachments = this.attachments.filter(a => a.id !== attachmentId);
    // Persist immediately
    await this.persistAttachments();
  }

  /** Directly writes the current attachments list to the Appwrite task document. */
  private async persistAttachments(): Promise<void> {
    // Only works in edit mode with a real (non-temp) cloud-synced task ID
    if (!this.isEditMode || !this.task) return;
    const taskId = this.task.id;
    if (!taskId || taskId.startsWith('task-')) return;

    const user = this.appwriteService.currentUser();
    if (!user) return;

    const serialized = this.attachments.map(a => JSON.stringify(a));
    console.log('[Planzy] Persisting attachments to task', taskId, serialized);
    try {
      await this.appwriteService.databases.updateDocument(
        this.appwriteService.databaseId,
        'tasks',
        taskId,
        { attachments: serialized }
      );
      console.log('[Planzy] Attachments persisted successfully.');
    } catch (err: any) {
      console.error('[Planzy] persistAttachments failed:', err?.message, err);
    }
  }


  getFileExt(name: string): string {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'file';
  }

  getFileTypeClass(name: string): string {
    const ext = this.getFileExt(name);
    if (ext === 'pdf') return 'type-pdf';
    if (['doc', 'docx'].includes(ext)) return 'type-doc';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'type-xls';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'type-img';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'type-zip';
    return 'type-txt';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  onAssigneeSelect(userId: string): void {
    this.selectedAssigneeUserId = userId;
    if (!userId) {
      this.assignee = undefined;
    } else {
      const mem = this.boardMembers().find(m => m.userId === userId);
      if (mem) {
        this.assignee = {
          userId: mem.userId,
          name: mem.name || mem.email || 'Member',
          email: mem.email
        };
      }
    }
  }

  postComment(): void {
    const text = this.newCommentText.trim();
    const user = this.appwriteService.currentUser();
    if (!text || !this.task || !user) return;

    const newComment: TaskComment = {
      id: `comm-${Date.now()}`,
      authorId: user.id,
      authorName: user.name || user.email,
      content: text,
      text,
      createdAt: new Date().toISOString()
    };

    this.comments = [...this.comments, newComment];
    this.newCommentText = '';

    this.taskStore.updateTask(this.task.id, {
      comments: this.comments
    });
  }

  isSubmitting = false;

  saveTask(): void {
    if (this.isSubmitting || !this.title.trim()) return;
    this.isSubmitting = true;

    const labels = this.labelsInput
      .split(',')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (this.isEditMode && this.task) {
      this.taskStore.updateTask(this.task.id, {
        title: this.title.trim(),
        description: this.description.trim(),
        priority: this.priority,
        columnId: this.columnId,
        dueDate: this.dueDate || undefined,
        estimatedHours: this.estimatedHours,
        sticker: this.sticker,
        labels,
        assignee: this.assignee,
        comments: this.comments,
        attachments: this.attachments
      });
    } else {
      this.taskStore.createTask({
        boardId: this.targetBoardId,
        columnId: this.columnId,
        title: this.title.trim(),
        description: this.description.trim(),
        priority: this.priority,
        dueDate: this.dueDate || undefined,
        estimatedHours: this.estimatedHours,
        sticker: this.sticker,
        labels,
        assignee: this.assignee,
        comments: this.comments,
        attachments: this.attachments
      });
    }

    this.closed.emit();
    setTimeout(() => {
      this.isSubmitting = false;
    }, 400);
  }

  deleteTaskConfirmed(): void {
    if (this.task) {
      this.taskStore.deleteTask(this.task.id);
      this.closed.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closed.emit();
    }
  }

  redirectToCreateBoard(): void {
    this.closed.emit();
    this.boardStore.openCreateModal();
  }
}
