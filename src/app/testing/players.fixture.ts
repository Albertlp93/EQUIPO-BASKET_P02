import { Player } from '../shared/models/player.model';

/** Jugadores de prueba para los tests unitarios (la app real los lee de Firestore). */
export const PLAYERS_FIXTURE: Player[] = [
  {
    id: 'curry',
    nombre: 'Stephen',
    apellidos: 'Curry',
    posicion: 'Base',
    edad: 38,
    altura: 188,
    peso: 84,
    dorsal: 30,
    nacionalidad: 'Estados Unidos',
    puntosPorPartido: 24.5,
    fotoUrl: 'assets/image/jugadores/curry.jpg',
    videoUrl: 'assets/videos/curry.mp4',
    infoUrl: 'https://espndeportes.espn.com/basquetbol/nba/jugador/_/id/3975/stephen-curry',
    biografia: 'Base de los Golden State Warriors.',
  },
  {
    id: 'jokic',
    nombre: 'Nikola',
    apellidos: 'Jokić',
    posicion: 'Pívot',
    edad: 31,
    altura: 211,
    peso: 129,
    dorsal: 15,
    nacionalidad: 'Serbia',
    puntosPorPartido: 29.6,
    fotoUrl: '',
    videoUrl: '',
    infoUrl: '',
    biografia: 'Pívot de los Denver Nuggets.',
  },
];
