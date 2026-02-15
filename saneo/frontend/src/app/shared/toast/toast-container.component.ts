import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="fixed top-4 right-4 z-50 space-y-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
      <article
        *ngFor="let toast of notificationService.toasts$ | async"
        class="pointer-events-auto rounded-lg shadow-lg p-3 text-sm border"
        [class.bg-yellow-50]="toast.type === 'success'"
        [class.border-yellow-300]="toast.type === 'success'"
        [class.text-yellow-800]="toast.type === 'success'"
        [class.bg-red-50]="toast.type === 'error'"
        [class.border-red-300]="toast.type === 'error'"
        [class.text-red-800]="toast.type === 'error'"
        [class.bg-orange-50]="toast.type === 'info'"
        [class.border-orange-300]="toast.type === 'info'"
        [class.text-orange-800]="toast.type === 'info'"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="space-y-1">
            <p>{{ toast.message }}</p>
            <button
              *ngIf="toast.actionLabel"
              type="button"
              class="text-xs font-semibold underline underline-offset-2"
              (click)="notificationService.runAction(toast.id)"
            >
              {{ toast.actionLabel }}
            </button>
          </div>
          <button
            type="button"
            class="text-xs opacity-70 hover:opacity-100"
            (click)="notificationService.dismiss(toast.id)"
          >
            ✕
          </button>
        </div>
      </article>
    </section>
  `,
})
export class ToastContainerComponent {
  constructor(readonly notificationService: NotificationService) {}
}
