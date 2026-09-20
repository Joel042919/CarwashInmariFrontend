import { api } from './api';
import type { ActualizarTrabajadorPayload, CrearTrabajadorPayload, Trabajador, RendimientoTrabajador } from '@/types/trabajadores';

export const trabajadoresService = {
  listar: () => api.get<Trabajador[]>('/admin/trabajadores'),
  crear: (data: CrearTrabajadorPayload) => api.post<Trabajador>('/admin/trabajadores', data),
  actualizar: (id: string, data: ActualizarTrabajadorPayload) => api.put<Trabajador>(`/admin/trabajadores/${id}`, data),
  darBaja: (id: string) => api.post<void>(`/admin/trabajadores/${id}/baja`),
  cambiarDisponibilidad: (id: string, disponible: boolean) =>
    api.patch<{ disponible: boolean }>(`/admin/trabajadores/${id}/disponibilidad`, { disponible }),
  rendimiento: (id?: string, desde = '', hasta = '') => {
    const ruta = id ? `/admin/trabajadores/${id}/rendimiento` : '/trabajadores/mi-rendimiento';
    return api.get<RendimientoTrabajador>(`${ruta}?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`);
  },
};
