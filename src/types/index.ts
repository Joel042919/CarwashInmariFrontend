export type RolUsuario = 'cliente' | 'trabajador' | 'administrador';

export interface Usuario {
  id_usuario: string;
  id_sede: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  id_rol: string;
  rol: RolUsuario;
  activo: boolean;
  fecha_registro: string;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface ClientePerfil {
  id_usuario: string;
  id_sede: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  dni?: string;
  fecha_nacimiento?: string;
  direccion?: string;
  notas?: string;
  created_at: string;
}

export interface UpdateClienteRequest {
  nombre: string;
  apellido: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
}

// Historial RF-02
export interface ReservaHistorial {
  id_reserva: string;
  placa_vehiculo: string;
  modelo: string;
  codigo_espacio: string;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  total_estimado: number;
}

export interface AtencionHistorial {
  id_atencion: string;
  id_reserva: string;
  placa_vehiculo: string;
  estado: string;
  fecha_inicio_real?: string;
  fecha_fin_real?: string;
}

export interface PagoHistorial {
  id_pago: string;
  monto: number;
  metodo: string;
  estado: string;
  comprobante_interno: string;
  fecha_pago: string;
}

export interface PedidoHistorial {
  id_pedido: string;
  estado: string;
  total: number;
  observaciones?: string;
  fecha_registro: string;
  fecha_entrega?: string;
}

export interface HistorialClienteUnificado {
  reservas: ReservaHistorial[];
  atenciones: AtencionHistorial[];
  pagos: PagoHistorial[];
  pedidos: PedidoHistorial[];
}

// Reclamos RF-15
export type EstadoReclamo = 'registrado' | 'en_revision' | 'respondido' | 'cerrado';

export interface EvidenciaReclamo {
  id_evidencia: string;
  id_reclamo: string;
  ruta_archivo: string;
  descripcion?: string;
  created_at: string;
}

export interface Reclamo {
  id_reclamo: string;
  id_cliente: string;
  nombre_cliente?: string;
  correo_cliente?: string;
  id_atencion?: string;
  id_pago?: string;
  id_pedido?: string;
  asunto: string;
  descripcion: string;
  estado: EstadoReclamo;
  respuesta_admin?: string;
  respondido_por?: string;
  fecha_registro: string;
  fecha_respuesta?: string;
  evidencias: EvidenciaReclamo[];
}

export interface CrearReclamoPayload {
  asunto: string;
  descripcion: string;
  id_atencion?: string;
  id_pago?: string;
  id_pedido?: string;
  descripcion_evidencia?: string;
  imagenes?: { uri: string; name: string; type: string }[];
}

export interface ResponderReclamoRequest {
  respuesta_admin: string;
  nuevo_estado: EstadoReclamo;
}

// ---------------------------------------------------------------------------
// Servicios RF-04
// ---------------------------------------------------------------------------
export interface CategoriaServicio {
  id_categoria_servicio: string;
  categoria_servicio: string;
}

export interface Servicio {
  id_servicio: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  duracion_estimada_min: number;
  requiere_documento: boolean;
  disponible: boolean;
  id_categoria: string;
  categoria?: string;
  created_at: string;
}

export interface ServicioPayload {
  nombre: string;
  descripcion?: string;
  precio: number;
  duracion_estimada_min: number;
  requiere_documento: boolean;
  disponible: boolean;
  id_categoria: string;
}

// ---------------------------------------------------------------------------
// Documentación previa RF-07
// ---------------------------------------------------------------------------
export type EstadoDocumento = 'adjuntado' | 'validado' | 'rechazado';

export interface DocumentoPrevio {
  id_documento: string;
  id_reserva: string;
  id_servicio: string;
  nombre_servicio?: string;
  id_cliente: string;
  nombre_cliente?: string;
  correo_cliente?: string;
  ruta_pdf: string;
  estado: EstadoDocumento;
  admin_respuesta?: string;
  validado_por?: string;
  fecha_validacion?: string;
  created_at: string;
}

export interface RequisitoDocumento {
  id_servicio: string;
  nombre_servicio: string;
  id_documento?: string;
  estado_documento?: EstadoDocumento;
  cumplido: boolean;
}

export interface RequisitosReserva {
  id_reserva: string;
  requisitos: RequisitoDocumento[];
  puede_confirmarse: boolean;
}

export interface ResolverDocumentoRequest {
  estado: 'validado' | 'rechazado';
  admin_respuesta?: string;
}

export interface SubirDocumentoPayload {
  id_reserva: string;
  id_servicio: string;
  pdf: { uri: string; name: string; type: string };
}

// ---------------------------------------------------------------------------
// Productos y pedidos RF-12
// ---------------------------------------------------------------------------
export interface CategoriaProducto {
  id_categoria: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface Producto {
  id_producto: string;
  id_categoria: string;
  categoria?: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio_venta: number;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  stock_bajo: boolean;
}

export interface ProductoPayload {
  id_categoria: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio_venta: number;
  stock: number;
  stock_minimo: number;
  activo: boolean;
}

export type EstadoPedido = 'registrado' | 'pagado' | 'preparando' | 'entregado' | 'cancelado';

export interface DetallePedido {
  id_detalle: string;
  id_producto: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Pedido {
  id_pedido: string;
  id_cliente: string;
  nombre_cliente?: string;
  correo_cliente?: string;
  estado: EstadoPedido;
  total: number;
  observaciones?: string;
  fecha_registro: string;
  fecha_entrega?: string;
  detalle: DetallePedido[];
}

export interface ItemPedidoPayload {
  id_producto: string;
  cantidad: number;
}

// ---------------------------------------------------------------------------
// Vehículos (registro mínimo para reservar)
// ---------------------------------------------------------------------------
export interface Vehiculo {
  id_vehiculo: string;
  id_cliente: string;
  placa: string;
  marca: string;
  modelo: string;
  color?: string;
  anio?: number;
  tipo_vehiculo?: string;
  created_at: string;
}

export interface VehiculoPayload {
  placa: string;
  marca: string;
  modelo: string;
  color?: string;
  anio?: number;
  tipo_vehiculo?: string;
}

// ---------------------------------------------------------------------------
// Espacios y horarios RF-05
// ---------------------------------------------------------------------------
export interface HorarioAtencion {
  dia_semana: number; // 0 = domingo ... 6 = sábado
  hora_inicio: string; // HH:MM
  hora_fin: string; // HH:MM
}

export interface Espacio {
  id_espacio: string;
  codigo: string;
  activo: boolean;
  horarios: HorarioAtencion[];
}

// ---------------------------------------------------------------------------
// Reservas RF-06 y programación RF-09
// ---------------------------------------------------------------------------
export type EstadoReserva = 'pendiente' | 'confirmada' | 'reprogramada' | 'cancelada' | 'completada';

export interface ReservaServicio {
  id_servicio: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  duracion_min: number;
  requiere_documento: boolean;
}

export interface TrabajadorAsignado {
  id_trabajador: string;
  nombre: string;
}

export interface Reserva {
  id_reserva: string;
  id_cliente: string;
  nombre_cliente?: string;
  correo_cliente?: string;
  id_vehiculo: string;
  placa: string;
  vehiculo: string;
  id_espacio: string;
  codigo_espacio: string;
  fecha_reserva: string; // AAAA-MM-DD
  hora_inicio: string; // HH:MM
  hora_fin: string; // HH:MM
  estado: EstadoReserva;
  total_estimado: number;
  observaciones?: string;
  motivo_cancelacion?: string;
  fecha_creacion: string;
  id_atencion?: string;
  estado_atencion?: string;
  requiere_documento: boolean;
  servicios: ReservaServicio[];
  trabajadores: TrabajadorAsignado[];
}

export interface CrearReservaPayload {
  id_vehiculo: string;
  id_espacio: string;
  fecha: string;
  hora_inicio: string;
  servicios: string[];
  observaciones?: string;
}

export interface ReprogramarPayload {
  id_espacio: string;
  fecha: string;
  hora_inicio: string;
}

export interface SlotHorario {
  hora_inicio: string;
  hora_fin: string;
}

export interface EspacioDisponible {
  id_espacio: string;
  codigo: string;
  slots: SlotHorario[];
}

export interface DisponibilidadResponse {
  fecha: string;
  duracion_min: number;
  espacios: EspacioDisponible[];
}

export interface TrabajadorDisponible {
  id_trabajador: string;
  nombre: string;
  disponible: boolean;
  ocupado: boolean;
}

/** Agenda del día agrupada por espacio (RF-09). */
export interface AgendaEspacio {
  id_espacio: string;
  codigo: string;
  activo: boolean;
  reservas: Reserva[];
}

export interface AgendaDia {
  fecha: string;
  espacios: AgendaEspacio[];
}

// ---------------------------------------------------------------------------
// Trabajadores (alta mínima para asignar atenciones)
// ---------------------------------------------------------------------------
export type { Trabajador, CrearTrabajadorPayload, ActualizarTrabajadorPayload } from './trabajadores';
