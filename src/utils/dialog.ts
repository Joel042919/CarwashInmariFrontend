import { Alert, Platform } from 'react-native';
import type { ModalKind } from '@/components/ui/WarningModal';

// notify() y confirmAction() muestran un modal con fondo desenfocado a través del
// <DialogHost /> montado en el layout raíz. Si el host aún no está montado se usa
// el diálogo nativo del sistema como respaldo.

export interface DialogRequest {
  kind: ModalKind;
  title: string;
  message: string;
  /** Solo para confirmaciones: se resuelve con la decisión del usuario. */
  resolve?: (accepted: boolean) => void;
}

type DialogHandler = (request: DialogRequest) => void;

let handler: DialogHandler | null = null;

export const registerDialogHandler = (h: DialogHandler): (() => void) => {
  handler = h;
  return () => {
    if (handler === h) handler = null;
  };
};

export const notify = (
  title: string,
  message?: string,
  kind: Exclude<ModalKind, 'confirm'> = 'warning'
): void => {
  if (handler) {
    handler({ kind, title, message: message ?? '' });
    return;
  }
  if (Platform.OS === 'web') window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
};

export const confirmAction = (title: string, message: string): Promise<boolean> =>
  new Promise((resolve) => {
    if (handler) {
      handler({ kind: 'confirm', title, message, resolve });
      return;
    }
    if (Platform.OS === 'web') {
      resolve(window.confirm(`${title}\n\n${message}`));
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Confirmar', onPress: () => resolve(true) },
    ]);
  });

export const errorMessage = (err: unknown, fallback = 'Ocurrió un error inesperado'): string =>
  err instanceof Error && err.message ? err.message : fallback;

export const formatSoles = (value: number): string => `S/ ${value.toFixed(2)}`;

// El componente Badge colorea por coincidencia de texto; estos alias mapean los
// estados de documentos y pedidos a las variantes que ya reconoce.
export const badgeStatus = (estado: string): string => {
  switch (estado) {
    case 'validado':
    case 'confirmada':
      return 'completada';
    case 'adjuntado':
      return 'pendiente';
    case 'preparando':
    case 'reprogramada':
      return 'en_proceso';
    default:
      return estado;
  }
};
