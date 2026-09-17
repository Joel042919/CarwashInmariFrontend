import { api } from './api';
import { ClientePerfil, UpdateClienteRequest, HistorialClienteUnificado } from '@/types';

export const clienteService = {
  getPerfil: async (): Promise<ClientePerfil> => {
    return api.get<ClientePerfil>('/clientes/perfil');
  },

  updatePerfil: async (data: UpdateClienteRequest): Promise<{ message: string }> => {
    return api.put<{ message: string }>('/clientes/perfil', data);
  },

  getHistorial: async (): Promise<HistorialClienteUnificado> => {
    return api.get<HistorialClienteUnificado>('/clientes/historial');
  },
};
