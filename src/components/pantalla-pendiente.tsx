import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type Props = {
  nombre: string;
  integrante: number;
  detalle?: string;
};

// Componente temporal: cada integrante lo reemplaza al completar su pantalla.
export function PantallaPendiente({ nombre, integrante, detalle }: Props) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText>
        Pantalla {nombre} — Integrante {integrante}
      </ThemedText>
      {detalle ? <ThemedText type="small">{detalle}</ThemedText> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
});