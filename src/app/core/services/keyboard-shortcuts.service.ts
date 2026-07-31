import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutsService {
  commandPaletteRequested$ = new Subject<void>();
  undoRequested$ = new Subject<void>();
  redoRequested$ = new Subject<void>();

  commandPaletteOpen = signal(false);

  constructor() {
    this.listenGlobalEvents();
  }

  private listenGlobalEvents(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.commandPaletteOpen.update(v => !v);
        this.commandPaletteRequested$.next();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undoRequested$.next();
      } else if (isCmdOrCtrl && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        this.redoRequested$.next();
      }
    });
  }

  toggleCommandPalette(open?: boolean): void {
    if (open !== undefined) {
      this.commandPaletteOpen.set(open);
    } else {
      this.commandPaletteOpen.update(v => !v);
    }
  }
}
