import { esUrlDeStorage, nombreSeguro } from './media-storage.service';

describe('MediaStorageService (utilidades)', () => {
  it('limpia el nombre del archivo', () => {
    expect(nombreSeguro('Foto Jokić 2026.JPG')).toBe('foto-jokic-2026.jpg');
  });

  it('solo reconoce URLs de Firebase Storage', () => {
    expect(esUrlDeStorage('https://firebasestorage.googleapis.com/v0/b/x/o/a.jpg')).toBe(true);
    expect(esUrlDeStorage('assets/image/jugadores/curry.jpg')).toBe(false);
  });
});
