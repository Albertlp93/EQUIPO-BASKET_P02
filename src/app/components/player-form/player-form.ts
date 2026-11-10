import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { lastValueFrom, tap } from 'rxjs';
import { POSICIONES, Player, PlayerData, Posicion } from '../../shared/models/player.model';
import { PlayersService } from '../../shared/services/players.service';
import { CarpetaMedia, MediaStorageService } from '../../shared/services/media-storage.service';
import { ToastService } from '../../shared/services/toast.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar';
import {
  MAX_FOTO_MB,
  MAX_VIDEO_MB,
  TIPOS_FOTO,
  TIPOS_VIDEO,
  archivoValidator,
  dorsalUnicoValidator,
} from '../../shared/validators/player.validators';

/** Nombre de cada control del formulario. */
type Campo = keyof PlayerFormComponent['form']['controls'];

/** Mensajes para los campos con patrón. */
const MENSAJES_PATRON: Partial<Record<Campo, string>> = {
  dorsal: 'Tiene que ser un número entero.',
  edad: 'Tiene que ser un número entero.',
  infoUrl: 'Tiene que ser una dirección que empiece por http:// o https://',
};

/**
 * Formulario para crear un jugador nuevo o editar uno existente.
 * Sube la foto y el vídeo a Firebase Storage y guarda los datos en Firestore.
 */
@Component({
  selector: 'app-player-form',
  standalone: true,
  imports: [ReactiveFormsModule, AvatarComponent],
  templateUrl: './player-form.html',
  styleUrl: './player-form.css',
})
export class PlayerFormComponent implements OnChanges, OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly players = inject(PlayersService);
  private readonly media = inject(MediaStorageService);
  private readonly toast = inject(ToastService);

  /** Plantilla actual en tiempo real, para comprobar que el dorsal no se repite. */
  private readonly plantilla = toSignal(this.players.getPlayers(), { initialValue: [] as Player[] });

  /** Jugador a editar. `null` = alta de un jugador nuevo. */
  @Input() player: Player | null = null;

  /** Emite el id del jugador guardado. */
  @Output() guardado = new EventEmitter<string>();
  @Output() cancelado = new EventEmitter<void>();

  readonly posiciones = POSICIONES;
  readonly tiposFoto = TIPOS_FOTO.join(',');
  readonly tiposVideo = TIPOS_VIDEO.join(',');
  readonly maxFotoMb = MAX_FOTO_MB;
  readonly maxVideoMb = MAX_VIDEO_MB;

  readonly guardando = signal(false);
  readonly progresoFoto = signal<number | null>(null);
  readonly progresoVideo = signal<number | null>(null);
  /** Vista previa de la foto elegida (o la foto actual al editar). */
  readonly fotoPreview = signal('');

  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(40)]],
    apellidos: ['', [Validators.required, Validators.maxLength(60)]],
    posicion: this.fb.control<Posicion | ''>('', Validators.required),
    dorsal: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(99),
      Validators.pattern(/^\d+$/),
      dorsalUnicoValidator(() => this.dorsalesDeOtros()),
    ]),
    edad: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(16),
      Validators.max(50),
      Validators.pattern(/^\d+$/),
    ]),
    altura: this.fb.control<number | null>(null, [Validators.required, Validators.min(150), Validators.max(240)]),
    peso: this.fb.control<number | null>(null, [Validators.required, Validators.min(50), Validators.max(180)]),
    nacionalidad: ['', [Validators.required, Validators.maxLength(40)]],
    puntosPorPartido: this.fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(60)]),
    infoUrl: ['', Validators.pattern(/^https?:\/\/\S+$/)],
    biografia: ['', [Validators.required, Validators.maxLength(500)]],
    foto: this.fb.control<File | null>(null, archivoValidator(TIPOS_FOTO, MAX_FOTO_MB)),
    video: this.fb.control<File | null>(null, archivoValidator(TIPOS_VIDEO, MAX_VIDEO_MB)),
  });

  get esNuevo(): boolean {
    return this.player === null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const cambio = changes['player'];
    // Solo se rellena al abrir el formulario o al cambiar de jugador; si el mismo
    // jugador cambia en Firebase mientras se edita, no se pisan los cambios escritos.
    if (cambio && (cambio.firstChange || cambio.previousValue?.id !== cambio.currentValue?.id)) {
      this.rellenar();
    }
  }

  ngOnDestroy(): void {
    this.liberarPreview();
  }

  /** Mensaje de error de un campo, o `null` si es válido o aún no se ha tocado. */
  error(campo: Campo): string | null {
    const control = this.form.controls[campo];
    if (!control.errors || !(control.touched || control.dirty)) {
      return null;
    }
    const e = control.errors;
    if (e['required']) {
      return campo === 'foto' || campo === 'video'
        ? `Elige ${campo === 'foto' ? 'una foto' : 'un vídeo'} desde tu ordenador.`
        : 'Este campo es obligatorio.';
    }
    if (e['min']) return `El valor mínimo es ${e['min'].min}.`;
    if (e['max']) return `El valor máximo es ${e['max'].max}.`;
    if (e['maxlength']) return `Como máximo ${e['maxlength'].requiredLength} caracteres.`;
    if (e['pattern']) return MENSAJES_PATRON[campo] ?? 'El formato no es válido.';
    if (e['dorsalRepetido']) return 'Ese dorsal ya lo lleva otro jugador.';
    if (e['tipoArchivo']) return campo === 'foto' ? 'Formato no admitido: usa JPG, PNG o WebP.' : 'Formato no admitido: usa MP4 o WebM.';
    if (e['tamanoArchivo']) return `El archivo supera los ${e['tamanoArchivo'].maxMb} MB.`;
    return 'El valor no es válido.';
  }

  /** Guarda el archivo elegido en el control y actualiza la vista previa. */
  onArchivo(event: Event, campo: CarpetaMedia): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    const control = campo === 'fotos' ? this.form.controls.foto : this.form.controls.video;
    control.setValue(archivo);
    control.markAsTouched();

    if (campo === 'fotos') {
      this.liberarPreview();
      this.fotoPreview.set(archivo && control.valid ? URL.createObjectURL(archivo) : (this.player?.fotoUrl ?? ''));
    }
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toast.error('Revisa los campos marcados en rojo antes de guardar.');
      return;
    }

    this.guardando.set(true);
    const valores = this.form.getRawValue();
    const anterior = this.player;

    try {
      const fotoUrl = valores.foto
        ? await this.subir(valores.foto, 'fotos', this.progresoFoto)
        : (anterior?.fotoUrl ?? '');
      const videoUrl = valores.video
        ? await this.subir(valores.video, 'videos', this.progresoVideo)
        : (anterior?.videoUrl ?? '');

      const datos: PlayerData = {
        nombre: valores.nombre.trim(),
        apellidos: valores.apellidos.trim(),
        posicion: valores.posicion as Posicion,
        dorsal: Number(valores.dorsal),
        edad: Number(valores.edad),
        altura: Number(valores.altura),
        peso: Number(valores.peso),
        nacionalidad: valores.nacionalidad.trim(),
        puntosPorPartido: Number(valores.puntosPorPartido),
        infoUrl: valores.infoUrl.trim(),
        biografia: valores.biografia.trim(),
        fotoUrl,
        videoUrl,
      };

      let id: string;
      if (anterior) {
        id = anterior.id;
        await this.players.actualizar(id, datos);
        // Los archivos sustituidos ya no se usan: se borran de Storage.
        if (valores.foto) await this.media.borrar(anterior.fotoUrl);
        if (valores.video) await this.media.borrar(anterior.videoUrl);
        this.toast.exito('Los cambios se han guardado correctamente.');
      } else {
        id = await this.players.crear(datos);
        this.toast.exito(`${datos.nombre} ${datos.apellidos} se ha guardado correctamente.`);
      }
      this.guardado.emit(id);
    } catch (error) {
      console.error(error);
      this.toast.error('No se ha podido guardar. Comprueba la conexión e inténtalo de nuevo.');
    } finally {
      this.guardando.set(false);
      this.progresoFoto.set(null);
      this.progresoVideo.set(null);
    }
  }

  cancelar(): void {
    this.cancelado.emit();
  }

  /** Dorsales ocupados por los demás jugadores (el propio no cuenta al editar). */
  private dorsalesDeOtros(): number[] {
    return this.plantilla()
      .filter((p) => p.id !== this.player?.id)
      .map((p) => p.dorsal);
  }

  /** Sube un archivo y va actualizando su barra de progreso. Devuelve la URL. */
  private async subir(archivo: File, carpeta: CarpetaMedia, progreso: WritableSignal<number | null>): Promise<string> {
    progreso.set(0);
    const final = await lastValueFrom(this.media.subir(archivo, carpeta).pipe(tap((p) => progreso.set(p.porcentaje))));
    if (!final.url) {
      throw new Error('La subida no devolvió URL');
    }
    return final.url;
  }

  private rellenar(): void {
    const p = this.player;
    this.form.reset({
      nombre: p?.nombre ?? '',
      apellidos: p?.apellidos ?? '',
      posicion: p?.posicion ?? '',
      dorsal: p?.dorsal ?? null,
      edad: p?.edad ?? null,
      altura: p?.altura ?? null,
      peso: p?.peso ?? null,
      nacionalidad: p?.nacionalidad ?? '',
      puntosPorPartido: p?.puntosPorPartido ?? null,
      infoUrl: p?.infoUrl ?? '',
      biografia: p?.biografia ?? '',
      foto: null,
      video: null,
    });

    // Al crear, foto y vídeo son obligatorios; al editar, se mantienen los actuales si no se cambian.
    // Si el jugador aún no tiene foto o vídeo, también se piden.
    for (const [control, actual, validador] of [
      [this.form.controls.foto, p?.fotoUrl, archivoValidator(TIPOS_FOTO, MAX_FOTO_MB)],
      [this.form.controls.video, p?.videoUrl, archivoValidator(TIPOS_VIDEO, MAX_VIDEO_MB)],
    ] as const) {
      control.setValidators(actual ? [validador] : [Validators.required, validador]);
      control.updateValueAndValidity({ emitEvent: false });
    }

    this.liberarPreview();
    this.fotoPreview.set(p?.fotoUrl ?? '');
  }

  private liberarPreview(): void {
    const actual = this.fotoPreview();
    if (actual.startsWith('blob:')) {
      URL.revokeObjectURL(actual);
    }
  }
}
