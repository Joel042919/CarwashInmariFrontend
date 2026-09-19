import { api } from './api';
import { CategoriaServicio, Servicio, ServicioPayload } from '@/types';

export const serviciosService = {
  listar: (idCategoria?: string): Promise<Servicio[]> =>
    api.get<Servicio[]>(idCategoria ? `/servicios?categoria=${idCategoria}` : '/servicios'),

  listarCategorias: (): Promise<CategoriaServicio[]> =>
    api.get<CategoriaServicio[]>('/servicios/categorias'),

  crear: (data: ServicioPayload): Promise<Servicio> =>
    api.post<Servicio>('/admin/servicios', data),

  actualizar: (id: string, data: ServicioPayload): Promise<Servicio> =>
    api.put<Servicio>(`/admin/servicios/${id}`, data),

  cambiarDisponibilidad: (id: string, disponible: boolean): Promise<Servicio> =>
    api.patch<Servicio>(`/admin/servicios/${id}/disponibilidad`, { disponible }),

  crearCategoria: (categoria_servicio: string): Promise<CategoriaServicio> =>
    api.post<CategoriaServicio>('/admin/servicios/categorias', { categoria_servicio }),
};
