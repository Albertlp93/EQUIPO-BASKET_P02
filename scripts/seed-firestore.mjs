/**
 * Carga inicial de la base de datos de EQUIPO BASKET.
 *
 * Crea (o sobrescribe) un documento por jugador en la colección `players` de Firestore
 * con los datos de `scripts/players.seed.json` y sube su foto y su vídeo a Firebase Storage
 * (`players/fotos/<id>.jpg` y `players/videos/<id>.mp4`). Se puede ejecutar varias veces:
 * cada jugador usa siempre el mismo id, así que no se duplican.
 *
 * Uso, desde la raíz del proyecto:
 *   node scripts/seed-firestore.mjs                 -> carga todos los jugadores
 *   node scripts/seed-firestore.mjs tatum edwards   -> solo los indicados (por su slug)
 * Requisito: reglas de Firestore y Storage que permitan escribir (modo de prueba o firestore.rules/storage.rules).
 */
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { initializeApp } from 'firebase/app';
import { doc, getFirestore, setDoc, terminate } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

const TIPOS = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4' };

/** Lee la configuración de Firebase de src/environments/environment.ts para no duplicarla. */
async function leerConfig() {
  const ts = await readFile(new URL('../src/environments/environment.ts', import.meta.url), 'utf8');
  const bloque = ts.match(/firebase:\s*(\{[\s\S]*?\})/)?.[1];
  if (!bloque) throw new Error('No encuentro la configuración de Firebase en environment.ts');
  return Function(`return (${bloque});`)();
}

async function subir(storage, rutaLocal, carpeta, id) {
  if (!rutaLocal) return '';
  const extension = extname(rutaLocal).toLowerCase();
  const destino = ref(storage, `players/${carpeta}/${id}${extension}`);
  const bytes = await readFile(new URL(`../${rutaLocal}`, import.meta.url));
  await uploadBytes(destino, bytes, { contentType: TIPOS[extension] });
  return getDownloadURL(destino);
}

const app = initializeApp(await leerConfig());
const db = getFirestore(app);
const storage = getStorage(app);
const todos = JSON.parse(await readFile(new URL('./players.seed.json', import.meta.url), 'utf8'));
const elegidos = process.argv.slice(2);
const jugadores = elegidos.length ? todos.filter((j) => elegidos.includes(j.slug)) : todos;
if (elegidos.length && jugadores.length !== elegidos.length) {
  throw new Error(`Slugs no encontrados. Disponibles: ${todos.map((j) => j.slug).join(', ')}`);
}

for (const { slug, foto, video, ...datos } of jugadores) {
  const fotoUrl = await subir(storage, foto, 'fotos', slug);
  const videoUrl = await subir(storage, video, 'videos', slug);
  await setDoc(doc(db, 'players', slug), { ...datos, fotoUrl, videoUrl });
  console.log(`✔ ${datos.nombre} ${datos.apellidos}${fotoUrl ? '' : ' (sin foto)'}${videoUrl ? '' : ' (sin vídeo)'}`);
}

console.log(`\n${jugadores.length} jugadores cargados en Firestore.`);
await terminate(db);
process.exit(0);
