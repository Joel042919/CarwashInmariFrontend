export type TipoOperacionPago = 'atencion' | 'pedido';
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'billetera_digital';
export type EstadoPago = 'pendiente' | 'pagado' | 'anulado' | 'reembolsado';

export interface DetallePago {
  cliente?: string;
  correo?: string;
  placa?: string;
  id_reserva?: string;
  fecha_reserva?: string;
  servicios?: { nombre: string; cantidad: number; precio_unitario: number | string }[];
  productos?: { nombre: string; cantidad: number; precio_unitario: number | string }[];
}

export interface Pago {
  id_pago: string;
  id_atencion?: string;
  id_pedido?: string;
  tipo: TipoOperacionPago;
  monto: string;
  moneda: 'PEN';
  metodo: MetodoPago;
  estado: EstadoPago;
  comprobante_interno: string;
  referencia_externa?: string;
  fecha_pago: string;
  fecha_reversion?: string;
  motivo_reversion?: string;
  cliente: string;
  detalle: DetallePago;
}

export interface OperacionPendiente {
  tipo: TipoOperacionPago;
  id_operacion: string;
  cliente: string;
  descripcion: string;
  monto: string;
  moneda: 'PEN';
  fecha: string;
  detalle: DetallePago;
}

export interface RegistrarPagoPayload {
  tipo: TipoOperacionPago;
  id_operacion: string;
  metodo: MetodoPago;
  referencia_externa?: string;
  idempotency_key: string;
}
