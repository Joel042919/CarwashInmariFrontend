import { api } from './api';
import type { Atencion, EventoAtencion, FiltroAtenciones } from '@/types/atenciones';
import type { EvidenciaAtencion } from '@/types/atenciones';
import { Platform } from 'react-native';

export const atencionesService = {
  listar: (filtro: FiltroAtenciones = {}) => {
    const query = Object.entries(filtro).filter(([, value]) => !!value)
      .map(([key, value]) => `${key}=${encodeURIComponent(value ?? '')}`).join('&');
    return api.get<Atencion[]>(`/atenciones?${query}`);
  },
  historial: (id: string) => api.get<EventoAtencion[]>(`/atenciones/${id}/historial`),
  cambiarEstado: (id: string, estado: 'en_proceso' | 'en_pausa' | 'finalizada' | 'entregada') =>
    api.patch<void>(`/atenciones/${id}/estado`, { estado }),
};

export const evidenciasService = {
  listar: (idAtencion: string) => api.get<EvidenciaAtencion[]>(`/atenciones/${idAtencion}/evidencias`),
  registrar: async (idAtencion: string, idVehiculo: string, descripcion: string, foto: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    form.append('id_vehiculo', idVehiculo);
    form.append('descripcion', descripcion);
    if (Platform.OS === 'web') {
      const response = await fetch(foto.uri);
      form.append('foto', await response.blob(), foto.name);
    } else {
      form.append('foto', foto as unknown as Blob);
    }
    return api.uploadMultipart<EvidenciaAtencion>(`/atenciones/${idAtencion}/evidencias`, form);
  },
};
