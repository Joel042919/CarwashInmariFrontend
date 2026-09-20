import { api } from './api';
import type { ReporteDashboard } from '@/types/reportes';

export const reportesService = {
  consultar: (desde: string, hasta: string) =>
    api.get<ReporteDashboard>(
      `/admin/reportes?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`,
    ),
};
