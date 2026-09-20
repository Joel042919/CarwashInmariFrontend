import type { RolUsuario } from '../types/index';

const clientRoutes = new Set(['historial', 'reclamos', 'servicios', 'productos', 'documentos', 'pedidos', 'reservas', 'nueva-reserva', 'vehiculos', 'mis-pagos']);

export function canAccessRoute(pathname: string, role: RolUsuario | null): boolean {
  const route = pathname.split('/').filter(Boolean)[0] ?? '';
  if (route === 'login' || route === 'register') return true;
  if (!role) return false;
  if (route.startsWith('admin-')) return role === 'administrador';
  if (route === 'mis-asignaciones') return role === 'trabajador';
  if (route === 'comprobante') return role === 'administrador' || role === 'cliente';
  if (route === 'atenciones') return true;
  if (clientRoutes.has(route)) return role === 'cliente';
  return route === '' || route === 'perfil';
}
