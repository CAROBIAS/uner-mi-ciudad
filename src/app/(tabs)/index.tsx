import { StyleSheet } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MapaScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText>Pantalla Mapa — Integrante 5</ThemedText>
      <Link href="/dev">
        <ThemedText type="linkPrimary">Menú de pruebas (temporal)</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
