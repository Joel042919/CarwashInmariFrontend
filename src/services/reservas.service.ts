import { api } from './api';
import {
  CrearReservaPayload,
  DisponibilidadResponse,
  Espacio,
  HorarioAtencion,
  ReprogramarPayload,
  Reserva,
  TrabajadorDisponible,
  Vehiculo,
  VehiculoPayload,
} from '@/types';

export const vehiculosService = {
  misVehiculos: (): Promise<Vehiculo[]> => api.get<Vehiculo[]>('/vehiculos/mis-vehiculos'),
  registrar: (data: VehiculoPayload): Promise<Vehiculo> => api.post<Vehiculo>('/vehiculos', data),
};

export const espaciosService = {
  listar: (): Promise<Espacio[]> => api.get<Espacio[]>('/espacios'),
  crear: (codigo: string, activo = true): Promise<Espacio> =>
    api.post<Espacio>('/admin/espacios', { codigo, activo }),
  actualizar: (id: string, codigo: string, activo: boolean): Promise<Espacio> =>
    api.put<Espacio>(`/admin/espacios/${id}`, { codigo, activo }),
  guardarHorarios: (id: string, horarios: HorarioAtencion[]): Promise<Espacio> =>
    api.put<Espacio>(`/admin/espacios/${id}/horarios`, { horarios }),
};

export const reservasService = {
  disponibilidad: (params: {
    fecha: string;
    servicios?: string[];
    excluirReserva?: string;
  }): Promise<DisponibilidadResponse> => {
    const qs = [`fecha=${params.fecha}`];
    if (params.servicios && params.servicios.length > 0) qs.push(`servicios=${params.servicios.join(',')}`);
    if (params.excluirReserva) qs.push(`excluir_reserva=${params.excluirReserva}`);
    return api.get<DisponibilidadResponse>(`/reservas/disponibilidad?${qs.join('&')}`);
  },

  crear: (data: CrearReservaPayload): Promise<Reserva> => api.post<Reserva>('/reservas', data),
  misReservas: (): Promise<Reserva[]> => api.get<Reserva[]>('/reservas/mis-reservas'),
  obtener: (id: string): Promise<Reserva> => api.get<Reserva>(`/reservas/${id}`),
  reprogramar: (id: string, data: ReprogramarPayload): Promise<Reserva> =>
    api.patch<Reserva>(`/reservas/${id}/reprogramar`, data),
  cancelar: (id: string, motivo?: string): Promise<Reserva> =>
    api.patch<Reserva>(`/reservas/${id}/cancelar`, { motivo: motivo ?? '' }),

  // Administrador (RF-09)
  listarAdmin: (params?: { estado?: string; fecha?: string }): Promise<Reserva[]> => {
    const qs: string[] = [];
    if (params?.estado) qs.push(`estado=${params.estado}`);
    if (params?.fecha) qs.push(`fecha=${params.fecha}`);
    return api.get<Reserva[]>(`/admin/reservas${qs.length ? `?${qs.join('&')}` : ''}`);
  },
  trabajadoresDisponibles: (id: string): Promise<TrabajadorDisponible[]> =>
    api.get<TrabajadorDisponible[]>(`/admin/reservas/${id}/trabajadores`),
  programar: (id: string, trabajadores: string[]): Promise<Reserva> =>
    api.post<Reserva>(`/admin/reservas/${id}/programar`, { trabajadores }),
  cancelarAdmin: (id: string, motivo?: string): Promise<Reserva> =>
    api.patch<Reserva>(`/admin/reservas/${id}/cancelar`, { motivo: motivo ?? '' }),
};
