import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

export type ModalKind = 'warning' | 'error' | 'success' | 'confirm';

// Por debajo de este ancho los botones se apilan a lo ancho del modal.
const NARROW_WIDTH = 420;

interface WarningModalProps {
  visible: boolean;
  kind?: ModalKind;
  title: string;
  message: string;
  /** Texto del botón principal (por defecto "Entendido" o "Confirmar" según el tipo). */
  buttonLabel?: string;
  /** Solo en kind="confirm": se llama al pulsar el botón principal. */
  onConfirm?: () => void;
  onClose: () => void;
}

// Modal de avisos: desenfoca la vista que queda detrás (no el modal) con BlurView.
export const WarningModal: React.FC<WarningModalProps> = ({
  visible,
  kind = 'warning',
  title,
  message,
  buttonLabel,
  onConfirm,
  onClose,
}) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { width, height } = useWindowDimensions();
  const narrow = width < NARROW_WIDTH;

  const look = {
    warning: { icon: 'warning' as const, color: theme.warning, bg: theme.warningBg },
    error: { icon: 'close-circle' as const, color: theme.danger, bg: theme.dangerBg },
    success: { icon: 'checkmark-circle' as const, color: theme.success, bg: theme.successBg },
    confirm: { icon: 'help-circle' as const, color: theme.sky, bg: theme.skyBg },
  }[kind];

  const isConfirm = kind === 'confirm';

  // Apilado: el botón principal arriba (column-reverse deja "Cancelar" al final).
  const buttonStyle = narrow ? styles.buttonStacked : styles.buttonInline;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}>
      <BlurView intensity={40} tint="dark" style={[styles.backdrop, narrow && styles.backdropNarrow]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.box,
            narrow && styles.boxNarrow,
            { maxHeight: height * 0.9, backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          {/* Si el mensaje es largo o la pantalla es baja (landscape), el contenido hace scroll */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <View style={[styles.iconCircle, { backgroundColor: look.bg }]}>
              <Ionicons name={look.icon} size={32} color={look.color} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {message ? (
              <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
            ) : null}

            <View style={[styles.actions, narrow && styles.actionsStacked]}>
              {isConfirm && (
                <Button title="Cancelar" variant="outline" onPress={onClose} style={buttonStyle} />
              )}
              <Button
                title={buttonLabel ?? (isConfirm ? 'Confirmar' : 'Entendido')}
                variant={kind === 'error' ? 'danger' : 'primary'}
                onPress={isConfirm ? (onConfirm ?? onClose) : onClose}
                style={buttonStyle}
              />
            </View>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdropNarrow: { padding: Spacing.three },
  box: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  boxNarrow: { borderRadius: BorderRadius.lg },
  scrollContent: {
    alignItems: 'center',
    padding: Spacing.five,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: Spacing.two },
  message: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: Spacing.four },
  actions: { flexDirection: 'row', gap: Spacing.two, alignSelf: 'stretch', marginTop: Spacing.two },
  actionsStacked: { flexDirection: 'column-reverse' },
  buttonInline: { flex: 1, paddingHorizontal: Spacing.three },
  buttonStacked: { alignSelf: 'stretch' },
});
