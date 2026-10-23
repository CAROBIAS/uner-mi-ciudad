import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  mensaje?: string;
};

export function BloqueoCuenta({
  mensaje = 'Ingresá para guardar tus datos en tu cuenta.',
}: Props) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.aviso}>
      <Ionicons name="person-circle-outline" size={64} color={theme.textSecondary} />
      <ThemedText type="smallBold">Necesitás una cuenta</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.centrado}>
        {mensaje}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ingresar"
        onPress={() => router.push('/ingresar')}
        style={({ pressed }) => [
          styles.boton,
          { backgroundColor: theme.text },
          pressed && styles.presionado,
        ]}
      >
        <ThemedText type="smallBold" style={{ color: theme.background }}>
          Ingresar
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  aviso: {
    width: '100%',
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
  },
  centrado: { textAlign: 'center' },
  boton: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  presionado: { opacity: 0.6 },
});