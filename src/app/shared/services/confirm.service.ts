import { Injectable, signal } from '@angular/core';

/** Datos del diálogo de confirmación. */
export interface ConfirmOptions {
  titulo: string;
  mensaje: string;
  textoAceptar?: string;
  textoCancelar?: string;
  /** Pinta el botón de aceptar en rojo (acciones destructivas como borrar). */
  peligro?: boolean;
}

interface ConfirmPendiente extends ConfirmOptions {
  responder: (aceptado: boolean) => void;
}

/**
 * Diálogo de confirmación propio de la app (sustituye al confirm() del navegador).
 * `preguntar()` devuelve una promesa que se resuelve a true (Aceptar) o false (Cancelar).
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly actual = signal<ConfirmPendiente | null>(null);

  preguntar(opciones: ConfirmOptions): Promise<boolean> {
    // Si había otro diálogo abierto, se da por cancelado.
    this.actual()?.responder(false);
    return new Promise<boolean>((resolve) => {
      this.actual.set({
        ...opciones,
        responder: (aceptado) => {
          this.actual.set(null);
          resolve(aceptado);
        },
      });
    });
  }

  responder(aceptado: boolean): void {
    this.actual()?.responder(aceptado);
  }
}
