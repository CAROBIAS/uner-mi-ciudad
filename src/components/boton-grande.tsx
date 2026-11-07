import { Pressable, StyleSheet, Text } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: 'principal' | 'secundario';
  deshabilitado?: boolean;
};

// Botón grande y fácil de tocar, para usar en toda la app.
// "principal": fondo de color. "secundario": solo borde.
export function BotonGrande({ titulo, onPress, variante = 'principal', deshabilitado = false }: Props) {
  const theme = useTheme();
  const esPrincipal = variante === 'principal';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        styles.boton,
        {
          backgroundColor: esPrincipal ? theme.primary : 'transparent',
          borderColor: theme.primary,
        },
        pressed && styles.presionado,
        deshabilitado && styles.deshabilitado,
      ]}
    >
      <Text style={[styles.texto, { color: esPrincipal ? theme.onPrimary : theme.primary }]}>
        {titulo}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: Spacing.four,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.one,
  },
  texto: {
    fontSize: 18,
    fontWeight: 700,
    textAlign: 'center',
  },
  presionado: { opacity: 0.7 },
  deshabilitado: { opacity: 0.4 },
});