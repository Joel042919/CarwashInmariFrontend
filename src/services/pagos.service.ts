import { api } from './api';
import type { EstadoPago, OperacionPendiente, Pago, RegistrarPagoPayload, TipoOperacionPago } from '@/types/pagos';

const query = (params: Record<string, string | undefined>) => {
  const value = Object.entries(params).filter(([, item]) => !!item)
    .map(([key, item]) => `${key}=${encodeURIComponent(item ?? '')}`).join('&');
  return value ? `?${value}` : '';
};

export const pagosService = {
  listarAdmin: (estado?: EstadoPago) => api.get<Pago[]>(`/admin/pagos${query({ estado })}`),
  pendientes: (tipo?: TipoOperacionPago) => api.get<OperacionPendiente[]>(`/admin/pagos/pendientes${query({ tipo })}`),
  misPagos: () => api.get<Pago[]>('/pagos/mis-pagos'),
  registrar: (data: RegistrarPagoPayload) => api.post<Pago>('/admin/pagos', data),
  comprobante: (id: string) => api.get<Pago>(`/pagos/${id}/comprobante`),
  revertir: (id: string, motivo: string) => api.post<Pago>(`/admin/pagos/${id}/reversar`, {
    motivo,
    reembolso_confirmado: true,
  }),
};

export function nuevaClaveIdempotencia(tipo: string, id: string): string {
  return `${tipo}-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
