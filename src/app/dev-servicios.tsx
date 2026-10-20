import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ErrorServicio } from '@/servicios/comun';
import { obtenerEvento, obtenerEventos } from '@/servicios/eventos';
import {
  buscarLugarPorQr,
  obtenerCategorias,
  obtenerLugar,
  obtenerLugares,
} from '@/servicios/lugares';

// Pantalla TEMPORAL para probar la capa de servicios. Borrar antes de la entrega.

async function probar(nombre: string, prueba: () => Promise<string>): Promise<string> {
  try {
    return `✅ ${nombre}: ${await prueba()}`;
  } catch (error) {
    if (error instanceof ErrorServicio) return `⚠️ ${nombre}: ${error.codigo}`;
    return `❌ ${nombre}: error inesperado`;
  }
}

export default function DevServiciosScreen() {
  const [resultados, setResultados] = useState<string[]>(['Cargando...']);

  useEffect(() => {
    const ahora = new Date();
    const enSieteDias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);

    Promise.all([
      probar('Lugares', async () => `${(await obtenerLugares()).length} (esperado 12)`),
      probar('Categorías', async () => `${(await obtenerCategorias()).length} (esperado 7)`),
      probar('Lugar lug-004', async () => (await obtenerLugar('lug-004')).nombre),
      probar('Lugar dado de baja lug-013', async () => (await obtenerLugar('lug-013')).nombre),
      probar('Eventos próximos 7 días', async () =>
        `${(await obtenerEventos(ahora.toISOString(), enSieteDias.toISOString())).length}`,
      ),
      probar('Evento evt-002', async () => (await obtenerEvento('evt-002')).inicio),
      probar('QR COLON:lug-004', async () => (await buscarLugarPorQr('COLON:lug-004')).nombre),
      probar('QR "hola"', async () => (await buscarLugarPorQr('hola')).nombre),
    ]).then(setResultados);
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
