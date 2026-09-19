import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WarningModal } from '@/components/ui/WarningModal';
import { DialogRequest, registerDialogHandler } from '@/utils/dialog';

// Se monta una sola vez en el layout raíz. Atiende en orden los avisos pedidos con
// notify() y confirmAction() (si llegan varios seguidos, se muestran uno tras otro).
export const DialogHost: React.FC = () => {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const lastShown = useRef<DialogRequest | null>(null);

  useEffect(() => registerDialogHandler((req) => setQueue((q) => [...q, req])), []);

  const current = queue[0];
  if (current) lastShown.current = current;

  // Al cerrar, el modal sigue visible durante su animación de salida. Se mantiene el
  // último contenido para que no se vea un modal vacío con "Entendido" en ese instante.
  const shown = current ?? lastShown.current;

  const close = useCallback(
    (accepted: boolean) => {
      current?.resolve?.(accepted);
      setQueue((q) => q.slice(1));
    },
    [current]
  );

  return (
    <WarningModal
      visible={!!current}
      kind={shown?.kind}
      title={shown?.title ?? ''}
      message={shown?.message ?? ''}
      onConfirm={() => close(true)}
      onClose={() => close(false)}
    />
  );
};
