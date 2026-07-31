import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Browser global fallback for process.env
if (typeof window !== 'undefined' && !(window as any).process) {
  (window as any).process = { env: {} };
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
