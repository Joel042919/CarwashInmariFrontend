import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconTextProps {
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  /** Estilo del texto; su color también se usa para el ícono salvo que se indique iconColor. */
  style?: StyleProp<TextStyle>;
  iconColor?: string;
  iconSize?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

// Ícono de Ionicons alineado con un texto (reemplaza a los emojis usados como ícono).
export const IconText: React.FC<IconTextProps> = ({
  icon,
  children,
  style,
  iconColor,
  iconSize = 14,
  containerStyle,
}) => {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const color = iconColor ?? (typeof flat?.color === 'string' ? flat.color : '#a7b5ae');

  return (
    <View style={[styles.row, containerStyle]}>
      <Ionicons name={icon} size={iconSize} color={color} />
      <Text style={[style, styles.text]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  text: { flexShrink: 1 },
});
