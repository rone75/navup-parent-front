import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';
import { Icon } from './icon';

/** Notes volantes en bas de l'écran (le résultat d'un geste) ; un appui les referme. */
@Component({
  selector: 'app-toasts',
  imports: [Icon],
  template: `
    <div class="volantes" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <button type="button" class="volante" [class.erreur]="t.type === 'error'" (click)="toasts.dismiss(t.id)">
          <app-icon [nom]="t.type === 'error' ? 'alerte' : 'coche'" />
          <span>{{ t.message }}</span>
        </button>
      }
    </div>
  `,
})
export class Toasts {
  readonly toasts = inject(ToastService);
}
