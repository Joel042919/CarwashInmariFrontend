import { Platform } from 'react-native';
import { api } from './api';
import {
  DocumentoPrevio,
  RequisitosReserva,
  ResolverDocumentoRequest,
  SubirDocumentoPayload,
} from '@/types';

export const documentosService = {
  misDocumentos: (idReserva?: string): Promise<DocumentoPrevio[]> =>
    api.get<DocumentoPrevio[]>(
      idReserva ? `/documentos/mis-documentos?id_reserva=${idReserva}` : '/documentos/mis-documentos'
    ),

  requisitosReserva: (idReserva: string): Promise<RequisitosReserva> =>
    api.get<RequisitosReserva>(`/reservas/${idReserva}/requisitos-documentales`),

  subir: async (payload: SubirDocumentoPayload): Promise<DocumentoPrevio> => {
    const formData = new FormData();
    formData.append('id_reserva', payload.id_reserva);
    formData.append('id_servicio', payload.id_servicio);

    if (Platform.OS === 'web') {
      const resp = await fetch(payload.pdf.uri);
      const blob = await resp.blob();
      formData.append('pdf', blob, payload.pdf.name);
    } else {
      formData.append('pdf', {
        uri: payload.pdf.uri,
        name: payload.pdf.name,
        type: payload.pdf.type || 'application/pdf',
      } as unknown as Blob);
    }
    return api.uploadMultipart<DocumentoPrevio>('/documentos', formData);
  },

  listarAdmin: (estado?: string): Promise<DocumentoPrevio[]> =>
    api.get<DocumentoPrevio[]>(estado ? `/admin/documentos?estado=${estado}` : '/admin/documentos'),

  resolver: (id: string, data: ResolverDocumentoRequest): Promise<DocumentoPrevio> =>
    api.patch<DocumentoPrevio>(`/admin/documentos/${id}/resolver`, data),
};
