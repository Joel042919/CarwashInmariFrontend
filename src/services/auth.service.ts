import { api } from './api';
import { AuthResponse } from '@/types';

export interface LoginParams {
  correo: string;
  contrasena: string;
}

export interface RegisterClienteParams {
  id_sede?: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  dni?: string;
  contrasena: string;
}

export const authService = {
  login: async (params: LoginParams): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', params);
  },

  register: async (params: RegisterClienteParams): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/registro-cliente', params);
  },
};
