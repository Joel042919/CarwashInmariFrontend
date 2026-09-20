import { api } from './api';
import type { Atencion, EventoAtencion, FiltroAtenciones } from '@/types/atenciones';

export const atencionesService = {
  listar: (filtro: FiltroAtenciones = {}) => {
    const query = Object.entries(filtro).filter(([, value]) => !!value)
      .map(([key, value]) => `${key}=${encodeURIComponent(value ?? '')}`).join('&');
    return api.get<Atencion[]>(`/atenciones?${query}`);
  },
  historial: (id: string) => api.get<EventoAtencion[]>(`/atenciones/${id}/historial`),
  cambiarEstado: (id: string, estado: 'en_proceso' | 'finalizada') =>
    api.patch<void>(`/atenciones/${id}/estado`, { estado }),
};
