import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerFormComponent } from './player-form';
import { PLAYERS_FIXTURE } from '../../testing/players.fixture';
import {
  crearMediaServiceMock,
  crearPlayersServiceMock,
  proveedoresFirebaseMock,
} from '../../testing/firebase.mocks';

describe('PlayerFormComponent', () => {
  let component: PlayerFormComponent;
  let fixture: ComponentFixture<PlayerFormComponent>;
  let players: ReturnType<typeof crearPlayersServiceMock>;
  let media: ReturnType<typeof crearMediaServiceMock>;
  const el = () => fixture.nativeElement as HTMLElement;

  async function crear(player: (typeof PLAYERS_FIXTURE)[number] | null) {
    fixture = TestBed.createComponent(PlayerFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('player', player);
    await fixture.whenStable();
  }

  function rellenarValidos() {
    component.form.patchValue({
      nombre: 'Jayson',
      apellidos: 'Tatum',
      posicion: 'Alero',
      dorsal: 0,
      edad: 28,
      altura: 203,
      peso: 95,
      nacionalidad: 'Estados Unidos',
      puntosPorPartido: 26.8,
      biografia: 'Alero de los Boston Celtics.',
    });
  }

  beforeEach(async () => {
    players = crearPlayersServiceMock();
    media = crearMediaServiceMock();
    await TestBed.configureTestingModule({
      imports: [PlayerFormComponent],
      providers: proveedoresFirebaseMock(players, media),
    }).compileComponents();
  });

  it('al enviar vacío muestra errores y no guarda', async () => {
    await crear(null);
    await component.guardar();
    await fixture.whenStable();
    expect(el().querySelectorAll('.invalid-feedback').length).toBeGreaterThan(5);
    expect(el().textContent).toContain('Este campo es obligatorio.');
    expect(players.crear).not.toHaveBeenCalled();
  });

  it('en un alta la foto y el vídeo son obligatorios', async () => {
    await crear(null);
    rellenarValidos();
    await component.guardar();
    expect(component.form.controls.foto.hasError('required')).toBe(true);
    expect(component.form.controls.video.hasError('required')).toBe(true);
    expect(players.crear).not.toHaveBeenCalled();
  });

  it('no deja repetir el dorsal de otro jugador', async () => {
    await crear(null);
    component.form.controls.dorsal.setValue(PLAYERS_FIXTURE[1].dorsal);
    expect(component.form.controls.dorsal.hasError('dorsalRepetido')).toBe(true);
  });

  it('rechaza archivos que no son imagen o que pesan demasiado', async () => {
    await crear(null);
    const control = component.form.controls.foto;
    control.setValue(new File(['x'], 'doc.pdf', { type: 'application/pdf' }));
    expect(control.hasError('tipoArchivo')).toBe(true);
    control.setValue(new File([new Uint8Array(3 * 1024 * 1024)], 'grande.jpg', { type: 'image/jpeg' }));
    expect(control.hasError('tamanoArchivo')).toBe(true);
  });

  it('alta completa: sube foto y vídeo, crea el jugador y emite su id', async () => {
    await crear(null);
    rellenarValidos();
    component.form.controls.foto.setValue(new File(['x'], 'tatum.jpg', { type: 'image/jpeg' }));
    component.form.controls.video.setValue(new File(['x'], 'tatum.mp4', { type: 'video/mp4' }));
    let id = '';
    component.guardado.subscribe((v) => (id = v));
    await component.guardar();
    expect(media.subir).toHaveBeenCalledTimes(2);
    expect(players.crear).toHaveBeenCalledWith(
      expect.objectContaining({ apellidos: 'Tatum', fotoUrl: 'https://firebasestorage.googleapis.com/x' }),
    );
    expect(id).toBe('nuevo-id');
  });

  it('al editar carga los datos y guarda sin volver a subir archivos si no se cambian', async () => {
    await crear(PLAYERS_FIXTURE[0]);
    expect(component.form.controls.nombre.value).toBe('Stephen');
    // Su propio dorsal no cuenta como repetido.
    expect(component.form.controls.dorsal.valid).toBe(true);
    component.form.controls.nacionalidad.setValue('Canadá');
    await component.guardar();
    expect(media.subir).not.toHaveBeenCalled();
    expect(players.actualizar).toHaveBeenCalledWith(
      'curry',
      expect.objectContaining({ nacionalidad: 'Canadá', fotoUrl: PLAYERS_FIXTURE[0].fotoUrl }),
    );
  });
});
