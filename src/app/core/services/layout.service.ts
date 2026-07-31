import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  mobileSidebarOpen = signal<boolean>(false);

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(val => !val);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }
}
