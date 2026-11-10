import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

/** Pinta los mensajes del ToastService en la esquina inferior derecha. */
@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class ToastComponent {
  readonly servicio = inject(ToastService);
}
