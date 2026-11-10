import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { POSICIONES, Player, Posicion } from '../../shared/models/player.model';
import { PlayerFilterPipe } from '../../shared/pipes/player-filter.pipe';
import { AvatarComponent } from '../../shared/components/avatar/avatar';
import { PlayersService } from '../../shared/services/players.service';
import { ToastService } from '../../shared/services/toast.service';
import { ConfirmService } from '../../shared/services/confirm.service';

/**
 * Listado de jugadores leído de Firestore en tiempo real,
 * con buscador, filtro por posición, botón de borrar en cada jugador y botón Nuevo.
 */
@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, FormsModule, PlayerFilterPipe, AvatarComponent],
  templateUrl: './players.html',
  styleUrl: './players.css',
})
export class PlayersComponent {
  private readonly service = inject(PlayersService);
  private readonly toast = inject(ToastService);
  private readonly confirmar = inject(ConfirmService);

  /**
   * Suscripción a la colección `players`. `undefined` mientras llega la primera respuesta.
   * Cada alta, cambio o baja en Firebase vuelve a emitir la lista completa.
   */
  readonly players = toSignal(
    this.service.getPlayers().pipe(
      catchError((error) => {
        console.error(error);
        this.errorCarga.set(true);
        return of([] as Player[]);
      }),
    ),
  );
  readonly errorCarga = signal(false);
  /** Id del jugador que se está borrando (para desactivar su botón). */
  readonly borrandoId = signal<string | null>(null);

  posiciones: Posicion[] = POSICIONES;

  /** Parámetros del pipe de filtrado. */
  texto = '';
  posicion = '';

  /** Jugador seleccionado (lo controla el componente padre). */
  @Input() selectedId: string | null = null;
  @Output() playerSelected = new EventEmitter<Player>();
  @Output() nuevo = new EventEmitter<void>();
  @Output() playerDeleted = new EventEmitter<string>();

  onSelectPlayer(player: Player): void {
    this.playerSelected.emit(player);
  }

  onNuevo(): void {
    this.nuevo.emit();
  }

  /** Pide confirmación y borra el jugador de Firestore (y sus archivos de Storage). */
  async borrar(player: Player): Promise<void> {
    const nombre = `${player.nombre} ${player.apellidos}`;
    const aceptado = await this.confirmar.preguntar({
      titulo: 'Borrar jugador',
      mensaje: `¿Seguro que quieres borrar a ${nombre}? Se eliminarán también su foto y su vídeo. Esta acción no se puede deshacer.`,
      textoAceptar: 'Borrar',
      peligro: true,
    });
    if (!aceptado) {
      return;
    }
    this.borrandoId.set(player.id);
    try {
      await this.service.borrar(player);
      this.playerDeleted.emit(player.id);
      this.toast.exito(`${nombre} se ha borrado correctamente.`);
    } catch (error) {
      console.error(error);
      this.toast.error(`No se ha podido borrar a ${nombre}.`);
    } finally {
      this.borrandoId.set(null);
    }
  }

  limpiarFiltros(): void {
    this.texto = '';
    this.posicion = '';
  }

  trackById(_index: number, player: Player): string {
    return player.id;
  }
}
