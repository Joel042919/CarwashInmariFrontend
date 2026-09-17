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
