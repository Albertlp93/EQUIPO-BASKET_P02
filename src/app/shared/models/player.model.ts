/** Posiciones posibles de un jugador en pista. */
export type Posicion = 'Base' | 'Escolta' | 'Alero' | 'Ala-Pívot' | 'Pívot';

/** Posiciones disponibles para el desplegable del filtro y del formulario. */
export const POSICIONES: Posicion[] = ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot'];

/** Datos de un jugador del equipo (documento de la colección `players` de Firestore). */
export interface Player {
  /** Id del documento en Firestore. */
  id: string;
  nombre: string;
  apellidos: string;
  posicion: Posicion;
  edad: number;
  altura: number; // en cm
  peso: number; // en kg
  dorsal: number;
  nacionalidad: string;
  puntosPorPartido: number;
  /** URL de descarga de la foto en Firebase Storage. */
  fotoUrl: string;
  /** URL de descarga del vídeo en Firebase Storage. */
  videoUrl: string;
  infoUrl: string;
  biografia: string;
}

/** Campos que se guardan en Firestore (el id es el del propio documento). */
export type PlayerData = Omit<Player, 'id'>;
