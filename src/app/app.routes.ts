import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'focus',
    loadComponent: () =>
      import('./features/focus-session/focus-session.component').then(m => m.FocusSessionComponent)
  },
  {
    path: 'starred',
    loadComponent: () =>
      import('./features/boards/starred-tasks/starred-tasks.component').then(m => m.StarredTasksComponent)
  },
  {
    path: 'boards',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/boards/board-list/board-list.component').then(m => m.BoardListComponent)
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/boards/board-detail/board-detail.component').then(m => m.BoardDetailComponent)
      }
    ]
  },
  {
    path: 'calendar',
    loadComponent: () =>
      import('./features/calendar/calendar.component').then(m => m.CalendarComponent)
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
