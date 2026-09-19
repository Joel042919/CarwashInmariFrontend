import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TextStyle,
  useColorScheme,
} from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled || loading) return '#1f2925';
    switch (variant) {
      case 'accent':
        return pressed ? theme.primaryHover : theme.primary;
      case 'secondary':
        return pressed ? '#2b3c35' : theme.secondary;
      case 'danger':
        return pressed ? '#b44a4a' : theme.danger;
      case 'outline':
        return pressed ? 'rgba(63,174,136,0.12)' : 'transparent';
      case 'primary':
      default:
        return pressed ? theme.primaryHover : theme.primary;
    }
  };

  const getTextColor = () => {
    if (disabled || loading) return '#5f7068';
    switch (variant) {
      case 'primary':
      case 'accent':
        return '#ffffff'; // Texto blanco sobre el verde profundo
      case 'secondary':
        return theme.accentDark; // verde claro sobre el gris verdoso del botón secundario
      case 'outline':
        return theme.accent;
      case 'danger':
      default:
        return '#ffffff';
    }
  };

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBackgroundColor(pressed),
          borderColor:
            variant === 'outline' ? theme.accent : variant === 'secondary' ? '#33463e' : 'transparent',
          borderWidth: variant === 'secondary' || variant === 'outline' ? 1 : 0,
        },
        isSmall && styles.buttonSm,
        isLarge && styles.buttonLg,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.text,
              { color: getTextColor() },
              isSmall && styles.textSm,
              isLarge && styles.textLg,
              textStyle,
            ]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    // Ancho según el contenido y alineado a la izquierda, en lugar de estirarse al 100%.
    // Para forzar otro comportamiento se puede pasar style (p. ej. flex: 1 o alignSelf).
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: Spacing.five,
    borderRadius: BorderRadius.full, // Full pill shape
    gap: Spacing.two,
  },
  buttonSm: {
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: Spacing.three,
  },
  buttonLg: {
    paddingVertical: 16,
    paddingHorizontal: Spacing.six,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  textSm: {
    fontSize: 12,
  },
  textLg: {
    fontSize: 16,
  },
});
