import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  actionLabel?: string;
  action?: () => void;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  private readonly toastsSubject = new BehaviorSubject<ToastMessage[]>([]);

  readonly toasts$ = this.toastsSubject.asObservable();

  show(message: string, type: ToastType = 'info', durationMs = 3000): void {
    const toast: ToastMessage = {
      id: this.nextId++,
      message,
      type,
    };

    this.toastsSubject.next([...this.toastsSubject.value, toast]);

    if (durationMs > 0) {
      setTimeout(() => this.dismiss(toast.id), durationMs);
    }
  }

  showAction(
    message: string,
    actionLabel: string,
    action: () => void,
    type: ToastType = 'info',
    durationMs = 5000
  ): void {
    const toast: ToastMessage = {
      id: this.nextId++,
      message,
      type,
      actionLabel,
      action,
    };

    this.toastsSubject.next([...this.toastsSubject.value, toast]);

    if (durationMs > 0) {
      setTimeout(() => this.dismiss(toast.id), durationMs);
    }
  }

  dismiss(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((toast) => toast.id !== id));
  }

  runAction(id: number): void {
    const toast = this.toastsSubject.value.find((item) => item.id === id);
    if (!toast?.action) {
      return;
    }

    toast.action();
    this.dismiss(id);
  }
}
