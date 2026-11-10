import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  it('añade mensajes y los quita al cerrarlos', () => {
    const servicio = TestBed.inject(ToastService);
    servicio.exito('Guardado');
    servicio.error('Fallo');
    expect(servicio.toasts().map((t) => t.tipo)).toEqual(['exito', 'error']);
    servicio.cerrar(servicio.toasts()[0].id);
    expect(servicio.toasts().length).toBe(1);
  });
});
