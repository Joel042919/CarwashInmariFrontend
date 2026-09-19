import { api } from './api';
import {
  CategoriaProducto,
  EstadoPedido,
  ItemPedidoPayload,
  Pedido,
  Producto,
  ProductoPayload,
} from '@/types';

export const productosService = {
  listar: (params?: { q?: string; categoria?: string; stockBajo?: boolean }): Promise<Producto[]> => {
    const qs: string[] = [];
    if (params?.q) qs.push(`q=${encodeURIComponent(params.q)}`);
    if (params?.categoria) qs.push(`categoria=${params.categoria}`);
    if (params?.stockBajo) qs.push('stock_bajo=true');
    return api.get<Producto[]>(`/productos${qs.length ? `?${qs.join('&')}` : ''}`);
  },

  listarCategorias: (): Promise<CategoriaProducto[]> =>
    api.get<CategoriaProducto[]>('/productos/categorias'),

  crear: (data: ProductoPayload): Promise<Producto> =>
    api.post<Producto>('/admin/productos', data),

  actualizar: (id: string, data: ProductoPayload): Promise<Producto> =>
    api.put<Producto>(`/admin/productos/${id}`, data),

  ajustarStock: (id: string, cantidad: number): Promise<Producto> =>
    api.patch<Producto>(`/admin/productos/${id}/stock`, { cantidad }),

  crearCategoria: (nombre: string): Promise<CategoriaProducto> =>
    api.post<CategoriaProducto>('/admin/productos/categorias', { nombre }),
};

export const pedidosService = {
  crear: (items: ItemPedidoPayload[], observaciones?: string): Promise<Pedido> =>
    api.post<Pedido>('/pedidos', { items, observaciones: observaciones ?? '' }),

  misPedidos: (): Promise<Pedido[]> => api.get<Pedido[]>('/pedidos/mis-pedidos'),

  cancelar: (id: string): Promise<Pedido> => api.patch<Pedido>(`/pedidos/${id}/cancelar`),

  listarAdmin: (estado?: string): Promise<Pedido[]> =>
    api.get<Pedido[]>(estado ? `/admin/pedidos?estado=${estado}` : '/admin/pedidos'),

  cambiarEstado: (id: string, estado: EstadoPedido): Promise<Pedido> =>
    api.patch<Pedido>(`/admin/pedidos/${id}/estado`, { estado }),
};
