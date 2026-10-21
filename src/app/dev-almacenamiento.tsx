import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import {
  agregarFavorito,
  esFavorito,
  listarFavoritos,
  quitarFavorito,
} from '@/almacenamiento/favoritos';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Pantalla TEMPORAL para probar el almacenamiento. Borrar antes de la entrega.

async function probarFavoritos(): Promise<string[]> {
  const u = 'usr-001';
  const lineas: string[] = ['— FAVORITOS —'];

  await agregarFavorito(u, 'lug-004');
  await agregarFavorito(u, 'lug-004'); // repetido a propósito
  await agregarFavorito(u, 'lug-005');
  lineas.push(`Cantidad tras agregar 3 (uno repetido): ${(await listarFavoritos(u)).length} (esperado 2)`);
  lineas.push(`¿lug-004 es favorito?: ${await esFavorito(u, 'lug-004')} (esperado true)`);

  await quitarFavorito(u, 'lug-004');
  lineas.push(`¿lug-004 después de quitarlo?: ${await esFavorito(u, 'lug-004')} (esperado false)`);
  lineas.push(`Favoritos de otro usuario: ${(await listarFavoritos('usr-002')).length} (esperado 0)`);

  await quitarFavorito(u, 'lug-005'); // limpiar para que la prueba se pueda repetir
  return lineas;
}

export default function DevAlmacenamientoScreen() {
  const [resultados, setResultados] = useState<string[]>(['Probando...']);

  useEffect(() => {
    probarFavoritos()
      .then(setResultados)
      .catch((error) => setResultados([`❌ Error inesperado: ${String(error)}`]));
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.lista}>
        {resultados.map((linea) => (
          <ThemedText key={linea}>{linea}</ThemedText>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  lista: { padding: 24, gap: 12 },
});
