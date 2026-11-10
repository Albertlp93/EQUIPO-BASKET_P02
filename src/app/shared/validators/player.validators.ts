import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Tamaño máximo de los archivos que se suben a Storage. */
export const MAX_FOTO_MB = 2;
export const MAX_VIDEO_MB = 30;

/** Tipos de archivo aceptados. */
export const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
export const TIPOS_VIDEO = ['video/mp4', 'video/webm'];

/** El dorsal no puede repetirse con el de otro jugador. */
export function dorsalUnicoValidator(dorsalesOcupados: () => number[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (valor === null || valor === '') {
      return null;
    }
    return dorsalesOcupados().includes(Number(valor)) ? { dorsalRepetido: true } : null;
  };
}

/** Comprueba tipo y tamaño de un archivo elegido con <input type="file">. */
export function archivoValidator(tipos: string[], maxMb: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const archivo = control.value as File | null;
    if (!archivo) {
      return null;
    }
    if (!tipos.includes(archivo.type)) {
      return { tipoArchivo: { tipos } };
    }
    if (archivo.size > maxMb * 1024 * 1024) {
      return { tamanoArchivo: { maxMb } };
    }
    return null;
  };
}
