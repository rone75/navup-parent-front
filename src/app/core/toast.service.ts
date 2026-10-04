import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

/** Notifications non intrusives (CDC 6.2), affichées par le composant Toasts du shell. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly items = signal<Toast[]>([]);
  private seq = 0;

  readonly toasts = this.items.asReadonly();

  show(message: string, type: ToastType = 'info', durationMs = 4000): void {
    const id = ++this.seq;
    this.items.update((list) => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error', 7000);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((t) => t.id !== id));
  }
}
