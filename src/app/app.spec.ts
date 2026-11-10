import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { TEAM_NAME } from './data/team.config';
import { PLAYERS_FIXTURE } from './testing/players.fixture';
import { crearPlayersServiceMock, proveedoresFirebaseMock } from './testing/firebase.mocks';

describe('App', () => {
  let players: ReturnType<typeof crearPlayersServiceMock>;

  beforeEach(async () => {
    players = crearPlayersServiceMock();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: proveedoresFirebaseMock(players),
    }).compileComponents();
  });

  it('muestra el nombre del equipo en la cabecera', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(TEAM_NAME);
  });

  it('al seleccionar un jugador muestra su ficha leída de Firebase', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.onPlayerSelected(PLAYERS_FIXTURE[0]);
    await fixture.whenStable();
    expect(players.getPlayer).toHaveBeenCalledWith('curry');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-detail')?.textContent).toContain('Curry');
  });

  it('la ficha se actualiza sola cuando el jugador cambia en Firebase', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.onPlayerSelected(PLAYERS_FIXTURE[0]);
    await fixture.whenStable();
    players.datos$.next([{ ...PLAYERS_FIXTURE[0], nacionalidad: 'Canadá' }, PLAYERS_FIXTURE[1]]);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-detail')?.textContent).toContain('Canadá');
  });

  it('si el jugador se borra en Firebase, se cierra la ficha', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.onPlayerSelected(PLAYERS_FIXTURE[0]);
    await fixture.whenStable();
    players.datos$.next([PLAYERS_FIXTURE[1]]);
    await fixture.whenStable();
    expect(app.seleccionadoId()).toBeNull();
  });

  it('el botón Nuevo abre el formulario vacío', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.onNuevo();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-player-form')).toBeTruthy();
  });

  it('tras guardar vuelve a la ficha del jugador guardado', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.onNuevo();
    app.onGuardado('jokic');
    expect(app.modo()).toBe('ver');
    expect(app.seleccionadoId()).toBe('jokic');
  });
});
