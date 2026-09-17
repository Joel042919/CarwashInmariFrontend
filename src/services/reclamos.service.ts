import { Platform } from 'react-native';
import { api } from './api';
import {
  Reclamo,
  CrearReclamoPayload,
  ResponderReclamoRequest,
} from '@/types';

export const reclamosService = {
  getMisReclamos: async (): Promise<Reclamo[]> => {
    return api.get<Reclamo[]>('/reclamos/mis-reclamos');
  },

  getAdminReclamos: async (): Promise<Reclamo[]> => {
    return api.get<Reclamo[]>('/admin/reclamos');
  },

  crearReclamo: async (payload: CrearReclamoPayload): Promise<Reclamo> => {
    const formData = new FormData();
    formData.append('asunto', payload.asunto);
    formData.append('descripcion', payload.descripcion);

    if (payload.id_atencion) {
      formData.append('id_atencion', payload.id_atencion);
    }
    if (payload.id_pago) {
      formData.append('id_pago', payload.id_pago);
    }
    if (payload.id_pedido) {
      formData.append('id_pedido', payload.id_pedido);
    }
    if (payload.descripcion_evidencia) {
      formData.append('descripcion_evidencia', payload.descripcion_evidencia);
    }

    if (payload.imagenes && payload.imagenes.length > 0) {
      for (let i = 0; i < payload.imagenes.length; i++) {
        const img = payload.imagenes[i];
        if (Platform.OS === 'web') {
          // En web, convertir URI a Blob
          try {
            const resp = await fetch(img.uri);
            const blob = await resp.blob();
            formData.append('evidencias', blob, img.name || `evidencia_${i}.jpg`);
          } catch {
            // Fallback
            formData.append('evidencias', {
              uri: img.uri,
              name: img.name || `evidencia_${i}.jpg`,
              type: img.type || 'image/jpeg',
            } as unknown as Blob);
          }
        } else {
          // En React Native Android / iOS
          formData.append('evidencias', {
            uri: img.uri,
            name: img.name || `evidencia_${i}.jpg`,
            type: img.type || 'image/jpeg',
          } as unknown as Blob);
        }
      }
    }

    return api.uploadMultipart<Reclamo>('/reclamos', formData);
  },

  responderReclamo: async (
    idReclamo: string,
    data: ResponderReclamoRequest
  ): Promise<{ message: string }> => {
    return api.patch<{ message: string }>(`/admin/reclamos/${idReclamo}/responder`, data);
  },
};
