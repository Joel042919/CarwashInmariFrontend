import { Screen } from '@/components/layout/Screen';
import { AtencionesPanel } from '@/components/atenciones/AtencionesPanel';

export default function MisAsignacionesScreen() {
  return <Screen title="Mis asignaciones" subtitle="Consulta tus atenciones y registra el inicio y la finalización del trabajo."><AtencionesPanel /></Screen>;
}
