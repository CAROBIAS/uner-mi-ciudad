import { Link } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Menú TEMPORAL para llegar a todas las pantallas mientras se desarrollan.
// Borrar antes de la entrega final.
export default function DevScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.lista}>
        <Link href="/lugares"><ThemedText type="linkPrimary">Listado de lugares (4)</ThemedText></Link>
        <Link href="/lugares/lug-004"><ThemedText type="linkPrimary">Ficha del lugar lug-004 (4)</ThemedText></Link>
        <Link href="/descargas"><ThemedText type="linkPrimary">Descargas (4)</ThemedText></Link>
        <Link href="/eventos/evt-001"><ThemedText type="linkPrimary">Ficha del evento evt-001 (6)</ThemedText></Link>
        <Link href="/ingresar"><ThemedText type="linkPrimary">Ingresar (3)</ThemedText></Link>
        <Link href="/desbloquear"><ThemedText type="linkPrimary">Desbloquear con huella (3)</ThemedText></Link>
        <Link href="/favoritos"><ThemedText type="linkPrimary">Favoritos (3)</ThemedText></Link>
        <Link href="/preferencias"><ThemedText type="linkPrimary">Preferencias (3)</ThemedText></Link>
        <Link href="/registrar-visita"><ThemedText type="linkPrimary">Registrar visita (1)</ThemedText></Link>
        <Link href="/escanear-qr"><ThemedText type="linkPrimary">Escanear QR (1)</ThemedText></Link>
        <Link href="/dev-servicios"><ThemedText type="linkPrimary">⚙️ Probar servicios</ThemedText></Link>
        <Link href="/dev-almacenamiento"><ThemedText type="linkPrimary">💾 Probar almacenamiento</ThemedText></Link>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  lista: { padding: 24, gap: 16 },
});
