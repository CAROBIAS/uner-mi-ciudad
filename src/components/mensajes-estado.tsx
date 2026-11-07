import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BotonGrande } from '@/components/boton-grande';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Mensajes comunes para pantallas que cargan datos:
// "cargando", "no hay nada" y "hubo un error" con botón Reintentar.

type MensajeProps = {
  mensaje?: string;
};

export function MensajeCargando({ mensaje = 'Cargando...' }: MensajeProps) {
  const theme = useTheme();

  return (
    <View style={styles.contenedor} accessibilityRole="progressbar" accessibilityLabel={mensaje}>
      <ActivityIndicator size="large" color={theme.primary} />
      <ThemedText themeColor="textSecondary" style={styles.texto}>
        {mensaje}
      </ThemedText>
    </View>
  );
}

export function MensajeVacio({ mensaje = 'No hay nada para mostrar.' }: MensajeProps) {
  return (
    <View style={styles.contenedor}>
      <ThemedText themeColor="textSecondary" style={styles.texto}>
        {mensaje}
      </ThemedText>
    </View>
  );
}

type MensajeErrorProps = MensajeProps & {
  onReintentar?: () => void;
};

export function MensajeError({ mensaje = 'Hubo un error.', onReintentar }: MensajeErrorProps) {
  return (
    <View style={styles.contenedor} accessibilityRole="alert">
      <ThemedText themeColor="error" style={styles.texto}>
        {mensaje}
      </ThemedText>
      {onReintentar ? (
        <BotonGrande titulo="Reintentar" onPress={onReintentar} variante="secundario" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  texto: {
    textAlign: 'center',
  },
});