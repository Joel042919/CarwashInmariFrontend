export type EstadoAtencion = 'programada' | 'en_proceso' | 'en_pausa' | 'finalizada' | 'entregada';

export interface Atencion {
  id_atencion: string;
  id_reserva: string;
  estado: EstadoAtencion;
  estado_reserva: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  placa: string;
  cliente: string;
  fecha_inicio_real: string | null;
  fecha_fin_real: string | null;
  servicios: { nombre: string; cantidad: number }[];
}

export interface EventoAtencion {
  id_historial: string;
  estado: EstadoAtencion;
  fecha_cambio: string;
  responsable: string;
  comentario: string | null;
}

export interface FiltroAtenciones {
  trabajador?: string;
  estado?: EstadoAtencion;
  desde?: string;
  hasta?: string;
}
