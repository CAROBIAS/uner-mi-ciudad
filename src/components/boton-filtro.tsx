import { Ionicons } from '@react-native-vector-icons/ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type NombreIcono = ComponentProps<typeof Ionicons>['name'];

type Props = {
  titulo: string;
  seleccionado: boolean;
  onPress: () => void;
  icono?: string; // nombre de Ionicons, por ejemplo el campo "icono" de una Categoria
  color?: string; // color del ícono, por ejemplo el campo "color" de una Categoria
};

// Botón de filtro por categoría (tarea 3.2 del Integrante 6).
// Lo usan el listado de lugares (Integrante 4) y el mapa (Integrante 5).
export function BotonFiltro({ titulo, seleccionado, onPress, icono, color }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Filtrar por ${titulo}`}
      accessibilityState={{ selected: seleccionado }}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.boton,
        {
          backgroundColor: seleccionado ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: seleccionado ? theme.primary : 'transparent',
        },
        pressed && styles.presionado,
      ]}
    >
      {icono ? (
        <Ionicons name={icono as NombreIcono} size={20} color={color ?? theme.textSecondary} />
      ) : null}
      <ThemedText type={seleccionado ? 'smallBold' : 'small'}>{titulo}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 24,
    borderWidth: 2,
  },
  presionado: { opacity: 0.7 },
});