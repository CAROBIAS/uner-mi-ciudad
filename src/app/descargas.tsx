import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  descargarLugar,
  eliminarDescarga,
  listarDescargas,
  type LugarDescargado,
} from '@/almacenamiento/archivos';
import { BloqueoCuenta } from '@/components/bloqueo-cuenta';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSesion } from '@/hooks/use-sesion';
import { useTheme } from '@/hooks/use-theme';
import { ErrorServicio } from '@/servicios/comun';
import { obtenerLugares } from '@/servicios/lugares';
import type { Lugar } from '@/tipos';

function bytesLegibles(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function estimarTamano(lugar: Lugar): number {
  const tamanoAudio = lugar.audioguia ? lugar.audioguia.duracionSegundos * 16_000 : 0;
  return tamanoAudio + lugar.imagenes.length * 350_000;
}

function mensajeDeError(error: unknown): string {
  return error instanceof ErrorServicio ? error.message : 'No se pudieron cargar las descargas.';
}

export default function DescargasScreen() {
  const { estado, usuario } = useSesion();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [descargas, setDescargas] = useState<LugarDescargado[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState(false);
  const [progreso, setProgreso] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (estado === 'cargando') return;
    if (!usuario) return;

    let activo = true;
    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const [catalogo, archivos] = await Promise.all([obtenerLugares(), listarDescargas()]);
        if (!activo) return;
        setLugares(catalogo.filter((lugar) => lugar.activo));
        setDescargas(archivos);
      } catch (errorCarga) {
        if (activo) setError(mensajeDeError(errorCarga));
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar();
    return () => {
      activo = false;
    };
  }, [estado, usuario, version]);

  const descargasPorId = useMemo(
    () => new Map(descargas.map((descarga) => [descarga.lugarId, descarga])),
    [descargas],
  );
  const seleccionables = useMemo(
    () =>
      lugares.filter((lugar) => lugar.audioguia !== null || lugar.imagenes.length > 0),
    [lugares],
  );

  function alternarSeleccion(id: string) {
    setSeleccionados((actuales) =>
      actuales.includes(id) ? actuales.filter((actual) => actual !== id) : [...actuales, id],
    );
  }

  async function actualizarDescargas() {
    setDescargas(await listarDescargas());
  }

  async function descargarSeleccionados() {
    if (descargando) return;
    const elegidos = seleccionables.filter(
      (lugar) => seleccionados.includes(lugar.id) && !descargasPorId.has(lugar.id),
    );
    if (elegidos.length === 0) {
      Alert.alert('Descargas', 'Elegí al menos un lugar que todavía no esté descargado.');
      return;
    }

    setDescargando(true);
    setError(null);
    const fallidos: string[] = [];
    try {
      for (let indice = 0; indice < elegidos.length; indice++) {
        const lugar = elegidos[indice];
        setProgreso(`Lugar ${indice + 1} de ${elegidos.length}: ${lugar.nombre}`);
        try {
          await descargarLugar(lugar, (completados, total) => {
            setProgreso(
              `Lugar ${indice + 1} de ${elegidos.length}: ${lugar.nombre} · archivo ${completados} de ${total}`,
            );
          });
        } catch {
          fallidos.push(lugar.nombre);
        }
      }
      await actualizarDescargas();
      setSeleccionados([]);
      if (fallidos.length > 0) {
        setError(`No se pudieron descargar: ${fallidos.join(', ')}. Revisá tu conexión e intentá de nuevo.`);
      }
    } catch {
      setError('No se pudo actualizar la lista de descargas.');
    } finally {
      setDescargando(false);
      setProgreso('');
    }
  }

  function confirmarEliminar(lugar: Lugar) {
    Alert.alert('Eliminar descarga', `¿Querés borrar las fotos y audioguía de "${lugar.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void eliminarYActualizar(lugar.id);
        },
      },
    ]);
  }

  async function eliminarYActualizar(lugarId: string) {
    try {
      await eliminarDescarga(lugarId);
      await actualizarDescargas();
    } catch {
      setError('No se pudo eliminar esta descarga.');
    }
  }

  if (estado === 'cargando') {
    return (
      <ThemedView style={styles.centro}>
        <ActivityIndicator />
        <ThemedText themeColor="textSecondary">Cargando sesión...</ThemedText>
      </ThemedView>
    );
  }

  if (!usuario) {
    return (
      <ThemedView style={styles.centro}>
        <BloqueoCuenta mensaje="Ingresá para guardar lugares y sus audioguías en este teléfono." />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.pantalla}>
      <ScrollView
        contentContainerStyle={[
          styles.contenido,
          { paddingBottom: Math.max(Spacing.five, insets.bottom + Spacing.four) },
        ]}
      >
        <View style={styles.encabezado}>
          <ThemedText type="subtitle">Descargas</ThemedText>
          <ThemedText themeColor="textSecondary">
            Elegí qué lugares querés consultar sin internet. El tamaño es aproximado.
          </ThemedText>
        </View>

        {cargando ? (
          <View style={styles.estado}>
            <ActivityIndicator />
            <ThemedText themeColor="textSecondary">Cargando catálogo y archivos...</ThemedText>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.aviso, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">{error}</ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={() => setVersion((actual) => actual + 1)}
              style={[styles.boton, { backgroundColor: theme.text }]}
            >
              <ThemedText type="smallBold" style={{ color: theme.background }}>Reintentar</ThemedText>
            </Pressable>
          </View>
        ) : null}

        {!cargando && seleccionables.length === 0 && !error ? (
          <ThemedText themeColor="textSecondary">No hay fotos ni audioguías disponibles para descargar.</ThemedText>
        ) : null}

        {!cargando ? (
          <View style={styles.lista}>
            {seleccionables.map((lugar) => {
              const descarga = descargasPorId.get(lugar.id);
              const seleccionado = seleccionados.includes(lugar.id);
              return (
                <ThemedView key={lugar.id} type="backgroundElement" style={styles.fila}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: seleccionado, disabled: Boolean(descarga) }}
                    accessibilityLabel={`Seleccionar ${lugar.nombre} para descargar`}
                    disabled={Boolean(descarga) || descargando}
                    onPress={() => alternarSeleccion(lugar.id)}
                    style={styles.selector}
                  >
                    <Ionicons
                      name={descarga ? 'checkmark-circle' : seleccionado ? 'checkbox' : 'square-outline'}
                      size={26}
                      color={descarga ? '#247A3D' : seleccionado ? theme.text : theme.textSecondary}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: '/lugares/[id]', params: { id: lugar.id } })
                    }
                    style={styles.detalle}
                  >
                    <ThemedText type="smallBold">{lugar.nombre}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {lugar.audioguia ? 'Audioguía' : 'Sin audioguía'} · {lugar.imagenes.length}{' '}
                      {lugar.imagenes.length === 1 ? 'foto' : 'fotos'}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {descarga ? bytesLegibles(descarga.bytes) : `Aprox. ${bytesLegibles(estimarTamano(lugar))}`}
                    </ThemedText>
                  </Pressable>
                  {descarga ? (
                    <View style={styles.accionesDescarga}>
                      <ThemedText type="smallBold" style={styles.descargado}>Descargado</ThemedText>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Eliminar descarga de ${lugar.nombre}`}
                        disabled={descargando}
                        onPress={() => confirmarEliminar(lugar)}
                        hitSlop={10}
                        style={styles.botonEliminar}
                      >
                        <Ionicons name="trash-outline" size={21} color="#B3261E" />
                      </Pressable>
                    </View>
                  ) : null}
                </ThemedView>
              );
            })}
          </View>
        ) : null}

        {descargando ? (
          <View style={[styles.progreso, { backgroundColor: theme.backgroundElement }]}>
            <ActivityIndicator />
            <ThemedText type="smallBold">{progreso}</ThemedText>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Descargar lugares seleccionados"
          disabled={descargando || cargando}
          onPress={() => void descargarSeleccionados()}
          style={({ pressed }) => [
            styles.botonDescargar,
            { backgroundColor: theme.text },
            (pressed || descargando || cargando) && styles.presionado,
          ]}
        >
          <Ionicons name="download-outline" size={21} color={theme.background} />
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            {descargando ? 'Descargando...' : `Descargar seleccionados (${seleccionados.length})`}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  encabezado: { gap: Spacing.two },
  lista: { gap: Spacing.two },
  fila: { minHeight: 88, borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  selector: { minWidth: 42, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  detalle: { flex: 1, gap: 3 },
  accionesDescarga: { alignItems: 'center', gap: 4 },
  descargado: { color: '#247A3D', fontSize: 12 },
  botonEliminar: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  estado: { alignItems: 'center', padding: Spacing.four, gap: Spacing.two },
  aviso: { borderRadius: 16, padding: Spacing.three, alignItems: 'center', gap: Spacing.three },
  progreso: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: 12 },
  boton: { minHeight: 48, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 20 },
  botonDescargar: {
    minHeight: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  presionado: { opacity: 0.65 },
});
