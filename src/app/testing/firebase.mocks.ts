import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { vi } from 'vitest';
import { Player } from '../shared/models/player.model';
import { PlayersService } from '../shared/services/players.service';
import { MediaStorageService } from '../shared/services/media-storage.service';
import { PLAYERS_FIXTURE } from './players.fixture';

/**
 * Sustituto de PlayersService para los tests: guarda los jugadores en memoria
 * y emite igual que Firestore (cada cambio vuelve a emitir la lista).
 */
export function crearPlayersServiceMock(iniciales: Player[] = PLAYERS_FIXTURE) {
  const datos$ = new BehaviorSubject<Player[]>([...iniciales]);
  const mock = {
    datos$,
    getPlayers: vi.fn((): Observable<Player[]> => datos$),
    getPlayer: vi.fn(
      (id: string): Observable<Player | null> => datos$.pipe(map((l) => l.find((p) => p.id === id) ?? null)),
    ),
    crear: vi.fn(async () => 'nuevo-id'),
    actualizar: vi.fn(async () => undefined),
    borrar: vi.fn(async (player: Player) => datos$.next(datos$.value.filter((p) => p.id !== player.id))),
  };
  return mock;
}

export function crearMediaServiceMock() {
  return {
    subir: vi.fn(() => of({ porcentaje: 50 }, { porcentaje: 100, url: 'https://firebasestorage.googleapis.com/x' })),
    borrar: vi.fn(async () => undefined),
  };
}

/** Proveedores listos para TestBed. */
export function proveedoresFirebaseMock(
  players = crearPlayersServiceMock(),
  media = crearMediaServiceMock(),
) {
  return [
    { provide: PlayersService, useValue: players },
    { provide: MediaStorageService, useValue: media },
  ];
}
