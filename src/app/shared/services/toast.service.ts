import { Injectable, signal } from '@angular/core';

export type TipoToast = 'exito' | 'error' | 'info';

export interface Toast {
  id: number;
  tipo: TipoToast;
  texto: string;
}

/** Mensajes emergentes (guardado correcto, errores...). Desaparecen solos. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private siguienteId = 1;
  readonly toasts = signal<Toast[]>([]);

  exito(texto: string): void {
    // Un éxito deja obsoletos los errores anteriores.
    this.toasts.update((lista) => lista.filter((t) => t.tipo !== 'error'));
    this.mostrar('exito', texto);
  }

  error(texto: string): void {
    this.mostrar('error', texto, 6000);
  }

  info(texto: string): void {
    this.mostrar('info', texto);
  }

  cerrar(id: number): void {
    this.toasts.update((lista) => lista.filter((t) => t.id !== id));
  }

  private mostrar(tipo: TipoToast, texto: string, duracionMs = 4000): void {
    const id = this.siguienteId++;
    this.toasts.update((lista) => [...lista, { id, tipo, texto }]);
    setTimeout(() => this.cerrar(id), duracionMs);
  }
}
