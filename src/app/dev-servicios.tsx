import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ErrorServicio, pedir } from '@/servicios/comun';
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

// Pedidos con cuenta contra la API real (tarea 4.4). Solo de prueba: no usa el ingreso de la app.
async function probarCuenta(): Promise<string[]> {
  const l: string[] = ['— CUENTA (API) —'];
  const ingreso = (email: string, contrasena: string) =>
    pedir<{ token: string; usuario: { nombre: string } }>('/auth/ingreso', undefined, {
      metodo: 'POST',
      cuerpo: { email, contrasena },
    });

  l.push(
    await probar('Ingreso con contraseña incorrecta', async () => {
      await ingreso('lucia@mail.com', 'clave-incorrecta');
      return 'entró (NO debería)';
    }),
  );

  let token: string | null = null;
  l.push(
    await probar('Ingreso de Lucía', async () => {
      const { datos } = await ingreso('lucia@mail.com', 'lucia1234');
      token = datos.token;
      return datos.usuario.nombre;
    }),
  );
  l.push(
    await probar('/yo con token', async () =>
      (await pedir<{ nombre: string }>('/yo', undefined, { token })).datos.nombre,
    ),
  );
  l.push(
    await probar('/yo sin token', async () => (await pedir<{ nombre: string }>('/yo')).datos.nombre),
  );
  l.push(
    await probar('Registro con email ya usado', async () => {
      await pedir('/auth/registro', undefined, {
        metodo: 'POST',
        cuerpo: { nombre: 'Prueba', email: 'lucia@mail.com', contrasena: 'una-clave-segura' },
      });
      return 'registró (NO debería)';
    }),
  );
  return l;
}

export default function DevServiciosScreen() {
  const [resultados, setResultados] = useState<string[]>(['Cargando...']);

  useEffect(() => {
    const ahora = new Date();
    const enSieteDias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);

    Promise.all([
      probar('Lugares (activos en la API)', async () => `${(await obtenerLugares()).length}`),
      probar('Categorías', async () => `${(await obtenerCategorias()).length}`),
      probar('Lugar lug-004', async () => (await obtenerLugar('lug-004')).nombre),
      probar('Lugar dado de baja lug-026', async () => (await obtenerLugar('lug-026')).nombre),
      probar('Eventos próximos 7 días', async () =>
        `${(await obtenerEventos(ahora.toISOString(), enSieteDias.toISOString())).length}`,
      ),
      probar('Evento evt-017', async () => (await obtenerEvento('evt-017')).titulo),
      probar('QR COLON:lug-004', async () => (await buscarLugarPorQr('COLON:lug-004')).nombre),
      probar('QR "hola"', async () => (await buscarLugarPorQr('hola')).nombre),
      ]).then(async (lineas) => setResultados([...lineas, ...(await probarCuenta())]));
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
