export interface Trabajador {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  dni: string;
  fecha_contratacion: string;
  disponible: boolean;
  activo: boolean;
  fecha_cese?: string;
}

export interface ActualizarTrabajadorPayload {
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  dni: string;
  fecha_contratacion: string;
}

export interface CrearTrabajadorPayload extends Omit<ActualizarTrabajadorPayload, 'fecha_contratacion'> {
  contrasena: string;
  fecha_contratacion?: string;
}

export interface RendimientoTrabajador {
  atenciones_finalizadas: number;
  servicios_en_equipo: number;
  duracion_promedio_min: number | null;
}
