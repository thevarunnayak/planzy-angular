import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { BoardDialogComponent } from './shared/components/board-dialog/board-dialog.component';
import { TaskDialogComponent } from './features/boards/task-dialog/task-dialog.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { CommandPaletteComponent } from './shared/components/command-palette/command-palette.component';
import { AuthDialogComponent } from './shared/components/auth-dialog/auth-dialog.component';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';
import { PoppiMascotComponent } from './shared/components/poppi-mascot/poppi-mascot.component';
import { BoardStore } from './core/stores/board.store';
import { TaskStore } from './core/stores/task.store';
import { AppwriteService } from './core/services/appwrite.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    SidebarComponent,
    BoardDialogComponent,
    TaskDialogComponent,
    ToastComponent,
    CommandPaletteComponent,
    AuthDialogComponent,
    SplashScreenComponent,
    PoppiMascotComponent
  ],
  template: `
    <div class="app-layout">
      <!-- Animated Splash Screen -->
      <app-splash-screen></app-splash-screen>

      <!-- Main Navigation Header -->
      <app-navbar></app-navbar>

      <!-- App Body Layout (Sidebar + Content Workspace) -->
      <div class="app-body">
        <app-sidebar></app-sidebar>
        <main class="app-content">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Floating Interactive AI Mascot -->
      <app-poppi-mascot></app-poppi-mascot>
      <app-command-palette></app-command-palette>
      <app-toast></app-toast>

      <!-- Global Authentication Modal -->
      @if (appwriteService.authModalOpen()) {
        <app-auth-dialog></app-auth-dialog>
      }

      <!-- Global Board Creation Modal -->
      @if (boardStore.createModalOpen()) {
        <app-board-dialog
          (submitted)="onBoardCreated($event)"
          (cancelled)="boardStore.closeCreateModal()"
        ></app-board-dialog>
      }

      <!-- Global Task Creation Modal -->
      @if (taskStore.createModalOpen()) {
        <app-task-dialog
          (closed)="taskStore.closeCreateModal()"
        ></app-task-dialog>
      }
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .app-body {
      display: flex;
      flex: 1;
      margin-top: 72px;
      min-height: calc(100vh - 72px);
    }

    .app-content {
      flex: 1;
      overflow-y: auto;
      background: var(--background);
      width: 100%;
    }

    @media (max-width: 768px) {
      .app-content {
        padding-bottom: 64px;
      }
    }
  `]
})
export class AppComponent {
  boardStore = inject(BoardStore);
  taskStore = inject(TaskStore);
  appwriteService = inject(AppwriteService);

  onBoardCreated(data: { name: string; description: string; emoji: string; isGroup: boolean }): void {
    this.boardStore.createBoard(data.name, data.description, data.emoji, data.isGroup);
  }
}
