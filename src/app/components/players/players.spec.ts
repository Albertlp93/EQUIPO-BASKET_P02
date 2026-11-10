import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayersComponent } from './players';
import { PLAYERS_FIXTURE } from '../../testing/players.fixture';
import { crearPlayersServiceMock, proveedoresFirebaseMock } from '../../testing/firebase.mocks';

describe('PlayersComponent', () => {
  let component: PlayersComponent;
  let fixture: ComponentFixture<PlayersComponent>;
  let players: ReturnType<typeof crearPlayersServiceMock>;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    players = crearPlayersServiceMock();
    await TestBed.configureTestingModule({
      imports: [PlayersComponent],
      providers: proveedoresFirebaseMock(players),
    }).compileComponents();

    fixture = TestBed.createComponent(PlayersComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('pinta todos los jugadores de la base de datos', () => {
    expect(el().querySelectorAll('.eb-jugador').length).toBe(PLAYERS_FIXTURE.length);
  });

  it('se actualiza solo cuando Firebase emite cambios', async () => {
    players.datos$.next([PLAYERS_FIXTURE[0]]);
    await fixture.whenStable();
    expect(el().querySelectorAll('.eb-jugador').length).toBe(1);
  });

  it('emite el jugador al hacer clic', () => {
    let emitido = null;
    component.playerSelected.subscribe((p) => (emitido = p));
    el().querySelector<HTMLButtonElement>('.eb-jugador__seleccion')?.click();
    expect(emitido).toEqual(PLAYERS_FIXTURE[0]);
  });

  it('marca como activo el jugador seleccionado', async () => {
    fixture.componentRef.setInput('selectedId', PLAYERS_FIXTURE[1].id);
    await fixture.whenStable();
    const activos = el().querySelectorAll('.eb-jugador--activo');
    expect(activos.length).toBe(1);
    expect(activos[0].textContent).toContain(PLAYERS_FIXTURE[1].nombre);
  });

  it('cada jugador tiene botón de borrar que, tras confirmar, lo borra de Firebase', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const botones = el().querySelectorAll<HTMLButtonElement>('.eb-btn--borrar');
    expect(botones.length).toBe(PLAYERS_FIXTURE.length);
    botones[0].click();
    await fixture.whenStable();
    expect(players.borrar).toHaveBeenCalledWith(PLAYERS_FIXTURE[0]);
    expect(el().querySelectorAll('.eb-jugador').length).toBe(PLAYERS_FIXTURE.length - 1);
  });

  it('si se cancela la confirmación no borra nada', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    el().querySelector<HTMLButtonElement>('.eb-btn--borrar')?.click();
    expect(players.borrar).not.toHaveBeenCalled();
  });

  it('el botón Nuevo emite el evento nuevo', () => {
    let pulsado = false;
    component.nuevo.subscribe(() => (pulsado = true));
    el().querySelector<HTMLButtonElement>('.eb-btn--primario')?.click();
    expect(pulsado).toBe(true);
  });
});
