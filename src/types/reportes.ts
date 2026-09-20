export interface PeriodoReporte {
  desde: string;
  hasta: string;
}

export interface MovimientoCategoria {
  categoria: string;
  bruto: string;
  reembolso: string;
  neto: string;
}

export interface PuntoFinanciero {
  fecha: string;
  bruto: string;
  reembolsado: string;
  neto: string;
}

export interface IngresosReporte {
  brutos: string;
  reembolsados: string;
  netos: string;
  por_tipo: MovimientoCategoria[];
  por_metodo: MovimientoCategoria[];
  serie_diaria: PuntoFinanciero[];
}

export interface ServicioReporte {
  id_servicio: string;
  nombre: string;
  cantidad: number;
  valor_operativo: string;
}

export interface EstadoConteo {
  estado: string;
  cantidad: number;
}

export interface VentasReporte {
  pedidos_por_estado: EstadoConteo[];
  unidades_vendidas: number;
  cobrado_bruto: string;
  reembolsado: string;
  cobrado_neto: string;
}

export interface ReservasReporte {
  total: number;
  canceladas: number;
  tasa_cancelacion: number;
  por_estado: EstadoConteo[];
}

export interface DemandaDia {
  fecha: string;
  total: number;
  canceladas: number;
}

export interface DemandaCategoria {
  categoria: string;
  total: number;
  canceladas: number;
}

export interface ProductividadReporte {
  id_trabajador: string;
  trabajador: string;
  atenciones_finalizadas: number;
  servicios_en_equipo: number;
  duracion_promedio_min: number | null;
}

export interface TipoVehiculoReporte {
  tipo: string;
  atenciones: number;
  vehiculos_distintos: number;
}

export interface ReporteDashboard {
  periodo: PeriodoReporte;
  ingresos: IngresosReporte;
  servicios: ServicioReporte[];
  ventas: VentasReporte;
  reservas: ReservasReporte;
  demanda: {
    por_dia: DemandaDia[];
    por_horario: DemandaCategoria[];
    por_servicio: DemandaCategoria[];
  };
  productividad: ProductividadReporte[];
  tipos_vehiculo: TipoVehiculoReporte[];
  notas: string[];
}
