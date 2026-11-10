import { Component, ElementRef, ViewChild, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, startWith, switchMap } from 'rxjs';
import { HeaderComponent } from './shared/components/header/header';
import { FooterComponent } from './shared/components/footer/footer';
import { ToastComponent } from './shared/components/toast/toast';
import { PlayersComponent } from './components/players/players';
import { DetailComponent } from './components/detail/detail';
import { MediaComponent } from './components/media/media';
import { PlayerFormComponent } from './components/player-form/player-form';
import { Player } from './shared/models/player.model';
import { PlayersService } from './shared/services/players.service';
import { ToastService } from './shared/services/toast.service';
import { TEAM_NAME, TEAM_SUBTITLE } from './data/team.config';

/** Qué se muestra en el panel derecho. */
export type ModoPanel = 'ver' | 'editar' | 'nuevo';

/**
 * Componente raíz: guarda qué jugador está seleccionado y en qué modo está el panel
 * derecho (ver ficha, editarla o crear un jugador nuevo).
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    ToastComponent,
    PlayersComponent,
    DetailComponent,
    MediaComponent,
    PlayerFormComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly service = inject(PlayersService);
  private readonly toast = inject(ToastService);

  readonly teamName = TEAM_NAME;
  readonly teamSubtitle = TEAM_SUBTITLE;

  readonly seleccionadoId = signal<string | null>(null);
  readonly modo = signal<ModoPanel>('ver');

  /**
   * Jugador seleccionado leído de Firestore en tiempo real (docData).
   * `undefined` = cargando, `null` = no hay selección o el documento se ha borrado.
   */
  readonly jugador = toSignal(
    toObservable(this.seleccionadoId).pipe(
      switchMap((id) => (id ? this.service.getPlayer(id).pipe(startWith(undefined)) : of(null))),
    ),
  );

  @ViewChild('panel') panel?: ElementRef<HTMLElement>;

  constructor() {
    inject(Title).setTitle(this.teamName);

    // Si alguien borra desde Firebase el jugador que se está viendo, se cierra la ficha.
    effect(() => {
      if (this.seleccionadoId() && this.jugador() === null) {
        this.toast.info('El jugador que estabas viendo se ha borrado.');
        this.cerrarPanel();
      }
    });
  }

  onPlayerSelected(player: Player): void {
    this.seleccionadoId.set(player.id);
    this.modo.set('ver');
    this.mostrarPanel();
  }

  onNuevo(): void {
    this.seleccionadoId.set(null);
    this.modo.set('nuevo');
    this.mostrarPanel();
  }

  onEditar(): void {
    this.modo.set('editar');
  }

  /** Tras guardar se muestra la ficha del jugador guardado; se puede elegir otro en la lista. */
  onGuardado(id: string): void {
    this.seleccionadoId.set(id);
    this.modo.set('ver');
  }

  onCancelarFormulario(): void {
    this.modo.set('ver');
  }

  onPlayerDeleted(id: string): void {
    if (this.seleccionadoId() === id) {
      this.cerrarPanel();
    }
  }

  onCloseDetail(): void {
    this.cerrarPanel();
  }

  private cerrarPanel(): void {
    this.seleccionadoId.set(null);
    this.modo.set('ver');
  }

  /** En móvil el panel queda debajo de la lista: se desplaza hasta él. */
  private mostrarPanel(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setTimeout(() => this.panel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }
}
