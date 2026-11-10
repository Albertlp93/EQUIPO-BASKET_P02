import { EnvironmentInjector, Injectable, inject, runInInjectionContext } from '@angular/core';
import {
  Storage,
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from '@angular/fire/storage';
import { Observable } from 'rxjs';

/** Carpetas de Storage donde se guardan los archivos de los jugadores. */
export type CarpetaMedia = 'fotos' | 'videos';

/** Estado de una subida: porcentaje y, al terminar, la URL de descarga. */
export interface ProgresoSubida {
  porcentaje: number;
  url?: string;
}

/** Sube, y borra, fotos y vídeos en Firebase Storage. */
@Injectable({ providedIn: 'root' })
export class MediaStorageService {
  private readonly storage = inject(Storage);
  private readonly injector = inject(EnvironmentInjector);

  /** AngularFire pide que sus funciones se llamen dentro de un contexto de inyección. */
  private enContexto<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }

  /**
   * Sube un archivo a `players/<carpeta>/<nombre único>`.
   * Emite el porcentaje durante la subida y, al final, la URL de descarga pública.
   */
  subir(archivo: File, carpeta: CarpetaMedia): Observable<ProgresoSubida> {
    return new Observable<ProgresoSubida>((observer) => {
      const ruta = `players/${carpeta}/${Date.now()}-${nombreSeguro(archivo.name)}`;
      const tarea = this.enContexto(() =>
        uploadBytesResumable(ref(this.storage, ruta), archivo, { contentType: archivo.type }),
      );

      const cancelar = tarea.on(
        'state_changed',
        (snap) =>
          observer.next({
            porcentaje: snap.totalBytes ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0,
          }),
        (error) => observer.error(error),
        async () => {
          try {
            const url = await this.enContexto(() => getDownloadURL(tarea.snapshot.ref));
            observer.next({ porcentaje: 100, url });
            observer.complete();
          } catch (error) {
            observer.error(error);
          }
        },
      );

      // Si el componente se destruye a mitad de subida, se cancela.
      return () => {
        cancelar();
        if (tarea.snapshot.state === 'running') {
          tarea.cancel();
        }
      };
    });
  }

  /** Borra un archivo a partir de su URL. Ignora URLs que no sean de este Storage. */
  async borrar(url: string | undefined): Promise<void> {
    if (!url || !esUrlDeStorage(url)) {
      return;
    }
    try {
      await this.enContexto(() => deleteObject(ref(this.storage, url)));
    } catch (error) {
      // Si el archivo ya no existe no es un error para el usuario; se deja constancia en consola.
      console.warn('No se ha podido borrar el archivo de Storage', url, error);
    }
  }
}

/** true si la URL apunta a Firebase Storage. */
export function esUrlDeStorage(url: string): boolean {
  return url.startsWith('https://firebasestorage.googleapis.com/') || url.startsWith('gs://');
}

/** Quita tildes, espacios y símbolos del nombre del archivo. */
export function nombreSeguro(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-');
}
