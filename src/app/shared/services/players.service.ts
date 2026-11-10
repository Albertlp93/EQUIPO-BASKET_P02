import { EnvironmentInjector, Injectable, inject, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  orderBy,
  query,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Player, PlayerData } from '../models/player.model';
import { MediaStorageService } from './media-storage.service';

/** Nombre de la colección de jugadores en Firestore. */
export const PLAYERS_COLLECTION = 'players';

/**
 * Acceso a la colección `players` de Firestore.
 * Las lecturas son suscripciones en tiempo real: cualquier cambio en la base de datos
 * (desde la app o desde la consola de Firebase) llega solo, sin refrescar la página.
 */
@Injectable({ providedIn: 'root' })
export class PlayersService {
  private readonly firestore = inject(Firestore);
  private readonly media = inject(MediaStorageService);
  private readonly injector = inject(EnvironmentInjector);
  private readonly coleccion = collection(this.firestore, PLAYERS_COLLECTION);

  /** AngularFire pide que sus funciones se llamen dentro de un contexto de inyección. */
  private enContexto<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }

  /** Todos los jugadores ordenados por dorsal, en tiempo real. */
  getPlayers(): Observable<Player[]> {
    return this.enContexto(
      () => collectionData(query(this.coleccion, orderBy('dorsal')), { idField: 'id' }) as Observable<Player[]>,
    );
  }

  /** Un jugador concreto en tiempo real. Emite `null` si el documento se borra. */
  getPlayer(id: string): Observable<Player | null> {
    return this.enContexto(() => docData(doc(this.firestore, PLAYERS_COLLECTION, id), { idField: 'id' })).pipe(
      map((datos) => (datos as Player | undefined) ?? null),
    );
  }

  /** Crea un jugador y devuelve el id que le asigna Firestore. */
  async crear(datos: PlayerData): Promise<string> {
    const ref = await this.enContexto(() => addDoc(this.coleccion, datos));
    return ref.id;
  }

  /** Actualiza los campos indicados de un jugador. */
  async actualizar(id: string, datos: Partial<PlayerData>): Promise<void> {
    await this.enContexto(() => updateDoc(doc(this.firestore, PLAYERS_COLLECTION, id), datos));
  }

  /** Borra el jugador y, después, su foto y su vídeo de Storage. */
  async borrar(player: Player): Promise<void> {
    await this.enContexto(() => deleteDoc(doc(this.firestore, PLAYERS_COLLECTION, player.id)));
    await Promise.all([this.media.borrar(player.fotoUrl), this.media.borrar(player.videoUrl)]);
  }
}
