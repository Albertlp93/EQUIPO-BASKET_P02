import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog';
import { ConfirmService } from '../../services/confirm.service';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let servicio: ConfirmService;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConfirmDialogComponent] }).compileComponents();
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    servicio = TestBed.inject(ConfirmService);
    await fixture.whenStable();
  });

  it('no se ve hasta que se pregunta algo', () => {
    expect(el().querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('muestra el mensaje y resuelve true al aceptar', async () => {
    const respuesta = servicio.preguntar({ titulo: 'Borrar jugador', mensaje: '¿Seguro?', textoAceptar: 'Borrar', peligro: true });
    await fixture.whenStable();
    expect(el().textContent).toContain('¿Seguro?');
    el().querySelector<HTMLButtonElement>('.eb-btn--peligro')?.click();
    expect(await respuesta).toBe(true);
    await fixture.whenStable();
    expect(el().querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('resuelve false al cancelar o al pulsar fuera', async () => {
    let respuesta = servicio.preguntar({ titulo: 'T', mensaje: 'M' });
    await fixture.whenStable();
    el().querySelector<HTMLButtonElement>('.eb-btn--borde')?.click();
    expect(await respuesta).toBe(false);

    respuesta = servicio.preguntar({ titulo: 'T', mensaje: 'M' });
    await fixture.whenStable();
    el().querySelector<HTMLElement>('.eb-modal-fondo')?.click();
    expect(await respuesta).toBe(false);
  });
});
