import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TarjetaLugar } from '@/components/tarjeta-lugar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUbicacion } from '@/hooks/use-ubicacion';
import { ErrorServicio } from '@/servicios/comun';
import { obtenerCategorias, obtenerLugares } from '@/servicios/lugares';
import type { Categoria, Lugar } from '@/tipos';
import { calcularDistanciaMetros, formatearDistancia, ordenarPorDistancia } from '@/utils/geo';

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR').trim();
}

function mensajeDeError(error: unknown): string {
  return error instanceof ErrorServicio ? error.message : 'No se pudieron cargar los lugares.';
}

export default function ListadoLugaresScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    coordenadas,
    estadoPermiso,
    error: errorUbicacion,
    solicitarPermiso,
  } = useUbicacion();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const [lugaresDisponibles, categoriasDisponibles] = await Promise.all([
          obtenerLugares(),
          obtenerCategorias(),
        ]);
        if (!activo) return;
        setLugares(lugaresDisponibles.filter((lugar) => lugar.activo));
        setCategorias(categoriasDisponibles);
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
  }, [version]);

  const categoriasPorId = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.id, categoria])),
    [categorias],
  );
  const lugaresVisibles = useMemo(() => {
    const termino = normalizar(busqueda);
    const filtrados = lugares
      .filter((lugar) => !categoriaSeleccionada || lugar.categoriaId === categoriaSeleccionada)
      .filter(
        (lugar) =>
          termino.length === 0 ||
          normalizar(lugar.nombre).includes(termino) ||
          normalizar(lugar.descripcionCorta).includes(termino),
      );
    if (estadoPermiso === 'concedido' && coordenadas) {
      return ordenarPorDistancia(filtrados, coordenadas);
    }
    return filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-AR'));
  }, [busqueda, categoriaSeleccionada, coordenadas, estadoPermiso, lugares]);
  const distanciasPorId = useMemo(
    () =>
      new Map(
        estadoPermiso === 'concedido' && coordenadas
          ? lugaresVisibles.map((lugar) => [
              lugar.id,
              formatearDistancia(calcularDistanciaMetros(coordenadas, lugar.coordenadas)),
            ])
          : [],
      ),
    [coordenadas, estadoPermiso, lugaresVisibles],
  );

  return (
    <ThemedView style={styles.pantalla}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.contenido,
          { paddingBottom: Math.max(Spacing.five, insets.bottom + Spacing.four) },
        ]}
      >
        <View style={styles.encabezado}>
          <ThemedText type="subtitle">Lugares</ThemedText>
          <ThemedText themeColor="textSecondary">
            Explorá sitios de interés en Colón.
          </ThemedText>
        </View>

        <View style={[styles.busqueda, { borderColor: theme.backgroundSelected }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            accessibilityLabel="Buscar lugar por nombre"
            placeholder="Buscar por nombre"
            placeholderTextColor={theme.textSecondary}
            value={busqueda}
            onChangeText={setBusqueda}
            returnKeyType="search"
            style={[styles.campoBusqueda, { color: theme.text }]}
          />
          {busqueda.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Borrar búsqueda"
              onPress={() => setBusqueda('')}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: categoriaSeleccionada === null }}
            onPress={() => setCategoriaSeleccionada(null)}
            style={[
              styles.filtro,
              {
                backgroundColor:
                  categoriaSeleccionada === null ? theme.text : theme.backgroundElement,
              },
            ]}
          >
            <ThemedText
              type="smallBold"
              style={{ color: categoriaSeleccionada === null ? theme.background : theme.text }}
            >
              Todas
            </ThemedText>
          </Pressable>
          {categorias.map((categoria) => {
            const seleccionada = categoriaSeleccionada === categoria.id;
            return (
              <Pressable
                key={categoria.id}
                accessibilityRole="button"
                accessibilityState={{ selected: seleccionada }}
                onPress={() => setCategoriaSeleccionada(seleccionada ? null : categoria.id)}
                style={[
                  styles.filtro,
                  { backgroundColor: seleccionada ? categoria.color : theme.backgroundElement },
                ]}
              >
                <ThemedText type="smallBold" style={{ color: seleccionada ? '#FFFFFF' : theme.text }}>
                  {categoria.nombre}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.ubicacion}>
          <ThemedText type="small" themeColor="textSecondary">
            {estadoPermiso === 'denegado'
              ? 'Orden alfabético. Permití la ubicación para ordenar por cercanía y ver distancias.'
              : errorUbicacion
                ? `${errorUbicacion} Podés volver a intentar.`
              : estadoPermiso === 'consultando'
                ? 'Consultando el permiso de ubicación...'
                : coordenadas
                  ? 'Lugares ordenados por cercanía.'
                  : 'Buscando tu ubicación...'}
          </ThemedText>
          {estadoPermiso === 'denegado' || errorUbicacion ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void solicitarPermiso()}
              style={({ pressed }) => [
                styles.botonUbicacion,
                { borderColor: theme.backgroundSelected },
                pressed && styles.presionado,
              ]}
            >
              <Ionicons name="location-outline" size={18} color={theme.text} />
              <ThemedText type="smallBold">
                {errorUbicacion ? 'Reintentar ubicación' : 'Permitir ubicación'}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        {cargando ? (
          <View style={styles.estado}>
            <ActivityIndicator />
            <ThemedText themeColor="textSecondary">Cargando lugares...</ThemedText>
          </View>
        ) : null}

        {!cargando && error ? (
          <View style={[styles.aviso, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">{error}</ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={() => setVersion((actual) => actual + 1)}
              style={[styles.boton, { backgroundColor: theme.text }]}
            >
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                Reintentar
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {!cargando && !error && lugaresVisibles.length === 0 ? (
          <View style={[styles.aviso, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="search-outline" size={36} color={theme.textSecondary} />
            <ThemedText type="smallBold">No hay lugares para mostrar.</ThemedText>
            <ThemedText themeColor="textSecondary">Probá con otra búsqueda o categoría.</ThemedText>
          </View>
        ) : null}

        {!cargando && !error ? (
          <View style={styles.lista}>
            {lugaresVisibles.map((lugar) => (
              <TarjetaLugar
                key={lugar.id}
                lugar={lugar}
                categoria={categoriasPorId.get(lugar.categoriaId)}
                distancia={distanciasPorId.get(lugar.id)}
                onPress={() =>
                  router.push({
                    pathname: '/lugares/[id]',
                    params: {
                      id: lugar.id,
                      ...(distanciasPorId.has(lugar.id)
                        ? { distancia: distanciasPorId.get(lugar.id) }
                        : {}),
                    },
                  })
                }
              />
            ))}
          </View>
        ) : null}
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
  busqueda: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  campoBusqueda: { flex: 1, minHeight: 48, fontSize: 16 },
  filtros: { gap: 8, paddingRight: 8 },
  filtro: { minHeight: 40, borderRadius: 20, justifyContent: 'center', paddingHorizontal: 16 },
  lista: { gap: Spacing.two },
  ubicacion: { gap: Spacing.two },
  botonUbicacion: {
    alignSelf: 'flex-start',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  estado: { alignItems: 'center', padding: Spacing.four, gap: Spacing.two },
  aviso: { borderRadius: 16, padding: Spacing.four, alignItems: 'center', gap: Spacing.three },
  boton: { minHeight: 48, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 20 },
  presionado: { opacity: 0.65 },
});
