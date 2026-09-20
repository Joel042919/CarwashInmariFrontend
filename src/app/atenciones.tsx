import { Screen } from '@/components/layout/Screen';
import { AtencionesPanel } from '@/components/atenciones/AtencionesPanel';
import { useAuth } from '@/context/AuthContext';

export default function AtencionesScreen() {
  const { isAdmin } = useAuth();
  return <Screen title={isAdmin ? 'Atenciones' : 'Seguimiento de mi vehículo'} subtitle="Estado e historial actualizado de las atenciones."><AtencionesPanel /></Screen>;
}
