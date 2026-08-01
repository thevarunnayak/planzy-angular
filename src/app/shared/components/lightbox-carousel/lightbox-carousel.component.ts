import { Component, Input, Output, EventEmitter, signal, computed, HostListener, ElementRef, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskAttachment } from '../../../core/models/task.model';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-lightbox-carousel',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="lbx-overlay fade-in" (click)="onOverlayClick($event)">
      <div class="lbx-shell" (click)="$event.stopPropagation()">

        <!-- Top bar -->
        <div class="lbx-topbar">
          <div class="lbx-title-group">
            <span class="lbx-title" [title]="currentItem().name">{{ currentItem().name }}</span>
            @if (attachments.length > 1) {
              <span class="lbx-count-badge">{{ activeIndex() + 1 }} of {{ attachments.length }}</span>
            }
          </div>

          <div class="lbx-topbar-actions">
            <a
              [href]="currentItem().url"
              [attr.download]="currentItem().name"
              target="_blank"
              class="lbx-icon-btn"
              title="Download File"
              (click)="$event.stopPropagation()"
            >
              <app-icon name="star" [size]="18"></app-icon>
            </a>
            <button class="lbx-icon-btn close-btn" (click)="close.emit()" title="Close (Esc)">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>
        </div>

        <!-- Main viewer -->
        <div class="lbx-viewer">
          <!-- Prev arrow -->
          @if (attachments.length > 1) {
            <button class="lbx-arrow lbx-prev" (click)="prev()" title="Previous Image (Left Arrow)">
              <app-icon name="chevron-left" [size]="24"></app-icon>
            </button>
          }

          <!-- Image or file placeholder -->
          <div class="lbx-media-wrap">
            @if (isImage(currentItem())) {
              <img
                [src]="currentItem().url"
                [alt]="currentItem().name"
                class="lbx-img pop-in"
              />
            } @else {
              <div class="lbx-file-placeholder">
                <div class="lbx-file-ext-box" [class]="getTypeClass(currentItem().name)">
                  <span>{{ getExt(currentItem().name) }}</span>
                </div>
                <p class="lbx-file-name">{{ currentItem().name }}</p>
                <a [href]="currentItem().url" target="_blank" [attr.download]="currentItem().name" class="lbx-download-link">
                  <app-icon name="star" [size]="16"></app-icon>
                  Download File
                </a>
              </div>
            }
          </div>

          <!-- Next arrow -->
          @if (attachments.length > 1) {
            <button class="lbx-arrow lbx-next" (click)="next()" title="Next Image (Right Arrow)">
              <app-icon name="chevron-right" [size]="24"></app-icon>
            </button>
          }
        </div>

        <!-- Thumbnail strip -->
        @if (attachments.length > 1) {
          <div class="lbx-thumb-strip">
            @for (att of attachments; track att.id; let i = $index) {
              <button
                class="lbx-thumb-btn"
                [class.active]="i === activeIndex()"
                (click)="goTo(i)"
                [title]="att.name"
              >
                @if (isImage(att)) {
                  <img [src]="att.url" [alt]="att.name" class="lbx-thumb-img" />
                } @else {
                  <div class="lbx-thumb-file" [class]="getTypeClass(att.name)">
                    <span>{{ getExt(att.name) }}</span>
                  </div>
                }
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 999999;
      display: block;
      pointer-events: auto;
    }

    .lbx-overlay {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(8, 11, 20, 0.94);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .lbx-shell {
      display: flex;
      flex-direction: column;
      width: 100vw;
      height: 100vh;
      max-width: 100vw;
      max-height: 100vh;
    }

    /* Top bar */
    .lbx-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      flex-shrink: 0;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      background: rgba(0,0,0,0.3);

      .lbx-title-group {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .lbx-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: rgba(255,255,255,0.92);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 50vw;
      }

      .lbx-count-badge {
        font-size: 0.72rem;
        font-weight: 800;
        color: var(--primary);
        background: rgba(80,120,255,0.18);
        border: 1px solid rgba(80,120,255,0.3);
        padding: 3px 9px;
        border-radius: 99px;
        flex-shrink: 0;
      }

      .lbx-topbar-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }
    }

    .lbx-icon-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.85);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255,255,255,0.2);
        color: white;
        transform: scale(1.05);
      }

      &.close-btn:hover {
        background: var(--danger);
        border-color: var(--danger);
        color: white;
      }
    }

    /* Viewer */
    .lbx-viewer {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      min-height: 0;
    }

    .lbx-media-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      padding: 24px;
      box-sizing: border-box;
    }

    .lbx-img {
      max-width: 90vw;
      max-height: 75vh;
      object-fit: contain;
      border-radius: 12px;
      box-shadow: 0 16px 50px rgba(0,0,0,0.6);
      animation: lbxFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes lbxFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    /* Non-image file placeholder */
    .lbx-file-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      padding: 44px 36px;
      background: rgba(255,255,255,0.05);
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.12);
      max-width: 380px;
      text-align: center;

      .lbx-file-ext-box {
        width: 88px;
        height: 88px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 1px;
        background: rgba(255,255,255,0.12);
        color: white;
      }

      .lbx-file-name {
        font-size: 1rem;
        font-weight: 800;
        color: rgba(255,255,255,0.92);
        word-break: break-all;
        margin: 0;
      }

      .lbx-download-link {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--primary);
        color: white;
        font-size: 0.88rem;
        font-weight: 800;
        text-decoration: none;
        padding: 10px 22px;
        border-radius: 10px;
        transition: transform 0.15s, opacity 0.15s;
        &:hover { transform: scale(1.03); opacity: 0.9; }
      }
    }

    /* Navigation arrows */
    .lbx-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.25);
      background: rgba(0,0,0,0.55);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      transition: all 0.2s ease;

      &:hover {
        background: var(--primary);
        border-color: var(--primary);
        transform: translateY(-50%) scale(1.1);
      }

      &.lbx-prev { left: 24px; }
      &.lbx-next { right: 24px; }
    }

    /* Thumbnail strip */
    .lbx-thumb-strip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px 24px 20px;
      overflow-x: auto;
      flex-shrink: 0;
      border-top: 1px solid rgba(255,255,255,0.08);
      background: rgba(0,0,0,0.25);

      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.2) transparent;
    }

    .lbx-thumb-btn {
      width: 60px;
      height: 60px;
      border-radius: 10px;
      border: 2px solid transparent;
      background: transparent;
      cursor: pointer;
      padding: 0;
      overflow: hidden;
      flex-shrink: 0;
      opacity: 0.5;
      transition: all 0.2s ease;

      &.active {
        border-color: var(--primary);
        opacity: 1;
        transform: scale(1.06);
        box-shadow: 0 0 0 3px rgba(80,120,255,0.35);
      }

      &:hover:not(.active) {
        opacity: 0.85;
        border-color: rgba(255,255,255,0.4);
      }
    }

    .lbx-thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .lbx-thumb-file {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.75);
      border-radius: 8px;
    }

    /* File type colours */
    .type-pdf { background: rgba(197,48,48,0.35) !important; color: #fc8181 !important; }
    .type-doc { background: rgba(43,108,176,0.35) !important; color: #90cdf4 !important; }
    .type-xls { background: rgba(39,103,73,0.35) !important; color: #9ae6b4 !important; }
    .type-zip { background: rgba(151,90,22,0.35) !important; color: #f6ad55 !important; }
    .type-txt { background: rgba(255,255,255,0.1) !important; color: rgba(255,255,255,0.6) !important; }
  `]
})
export class LightboxCarouselComponent implements OnInit, OnDestroy {
  @Input() attachments: TaskAttachment[] = [];
  @Input() startIndex: number = 0;
  @Output() close = new EventEmitter<void>();

  private el = inject(ElementRef);

  activeIndex = signal<number>(0);

  currentItem = computed(() => this.attachments[this.activeIndex()]);

  ngOnInit() {
    this.activeIndex.set(this.startIndex ?? 0);
    // Teleport element directly to document.body so CSS position:fixed is never trapped inside parent transforms!
    document.body.appendChild(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.el.nativeElement.parentNode) {
      this.el.nativeElement.parentNode.removeChild(this.el.nativeElement);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') this.next();
    else if (e.key === 'ArrowLeft') this.prev();
    else if (e.key === 'Escape') this.close.emit();
  }

  next() {
    this.activeIndex.update(i => (i + 1) % this.attachments.length);
  }

  prev() {
    this.activeIndex.update(i => (i - 1 + this.attachments.length) % this.attachments.length);
  }

  goTo(i: number) {
    this.activeIndex.set(i);
  }

  onOverlayClick(e: MouseEvent) {
    this.close.emit();
  }

  isImage(att: TaskAttachment): boolean {
    return !!att.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(att.name);
  }

  getExt(name: string): string {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'file';
  }

  getTypeClass(name: string): string {
    const ext = this.getExt(name);
    if (ext === 'pdf') return 'type-pdf';
    if (['doc', 'docx'].includes(ext)) return 'type-doc';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'type-xls';
    if (['zip', 'rar', '7z'].includes(ext)) return 'type-zip';
    return 'type-txt';
  }
}
