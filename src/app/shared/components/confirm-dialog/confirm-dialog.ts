import { Component, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';

/** Ventana modal de confirmación con el estilo de la app. Se pinta una vez en App. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
  host: { '(document:keydown.escape)': 'cancelar()' },
})
export class ConfirmDialogComponent {
  readonly servicio = inject(ConfirmService);

  @ViewChild('cancelarBtn') cancelarBtn?: ElementRef<HTMLButtonElement>;

  /** Elemento que tenía el foco antes de abrir, para devolvérselo al cerrar. */
  private focoAnterior: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.servicio.actual()) {
        this.focoAnterior = document.activeElement as HTMLElement | null;
        // El foco va a Cancelar: la opción segura si se pulsa Enter sin querer.
        setTimeout(() => this.cancelarBtn?.nativeElement.focus());
      } else if (this.focoAnterior) {
        this.focoAnterior.focus?.();
        this.focoAnterior = null;
      }
    });
  }

  aceptar(): void {
    this.servicio.responder(true);
  }

  cancelar(): void {
    this.servicio.responder(false);
  }
}
