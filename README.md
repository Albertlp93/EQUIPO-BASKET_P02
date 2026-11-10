# EQUIPO BASKET · Producto 2 (Angular + Firebase)

Aplicación Angular 21 (standalone, Bootstrap 5.3) que gestiona la plantilla de un equipo de baloncesto.
Los datos se guardan en **Cloud Firestore** y las fotos y vídeos en **Firebase Storage**, con `@angular/fire`.

## Funcionalidades

- Listado de jugadores suscrito a Firestore en tiempo real: altas, cambios y bajas hechos desde la app
  o desde la consola de Firebase aparecen sin refrescar.
- Buscador por nombre y filtro por posición (pipe `playerFilter`).
- Icono de borrar en cada jugador (con confirmación); borra también sus archivos de Storage.
- Ficha del jugador en tiempo real (`docData`) con reproductor de vídeo propio y botón **Editar**.
- Botón **Nuevo** con formulario reactivo: campos obligatorios, rangos, dorsal único, subida de foto
  y vídeo desde el ordenador con barra de progreso y mensaje de guardado.

## Puesta en marcha

```bash
npm install
npm start            # http://localhost:4200
npm test             # tests unitarios (Vitest)
npm run build
```

La configuración del proyecto Firebase está en `src/environments/environment.ts`.

## Base de datos

- Colección `players`: un documento por jugador con 13 campos (nombre, apellidos, posición, dorsal, edad,
  altura, peso, nacionalidad, puntos por partido, fotoUrl, videoUrl, infoUrl y biografía).
- Carga inicial: `node scripts/seed-firestore.mjs` sube los jugadores de `scripts/players.seed.json`
  y sus archivos de `public/assets` a Storage. Se puede repetir sin duplicar datos.
- Reglas: `firestore.rules` y `storage.rules` (se publican desde la consola de Firebase).

## Estructura

```
src/app/
├─ components/       players (lista), detail (ficha), player-form (alta/edición), media (vídeo)
├─ shared/
│  ├─ services/      players.service (Firestore), media-storage.service (Storage), toast.service
│  ├─ validators/    dorsal único, tipo y tamaño de archivo
│  ├─ components/    header, footer, avatar, toast
│  ├─ models/ pipes/ styles/ icons/
└─ testing/          datos y dobles de Firebase para los tests
```
