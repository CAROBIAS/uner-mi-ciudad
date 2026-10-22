import { router } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listarFavoritos, quitarFavorito } from '@/almacenamiento/favoritos';
import { BloqueoCuenta } from '@/components/bloqueo-cuenta';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSesion } from '@/hooks/use-sesion';
import { useTheme } from '@/hooks/use-theme';
import { ErrorServicio } from '@/servicios/comun';
import { obtenerLugar } from '@/servicios/lugares';
import type { Favorito, Lugar } from '@/tipos';

type ItemFavorito = {
  favorito: Favorito;
  lugar: Lugar;
};

function mensajeError(error: unknown): string {
  return error instanceof ErrorServicio
    ? error.message
    : 'No se pudieron cargar los favoritos.';
}

export default function FavoritosScreen() {
  const { estado, usuario } = useSesion();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [items, setItems] = useState<ItemFavorito[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quitando, setQuitando] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const usuarioId = usuario?.id ?? null;

  useEffect(() => {
    if (!usuarioId) {
      setItems([]);
      setCargando(false);
      setError(null);
      return;
    }

    const id = usuarioId;
    // Si la sesion cambia mientras carga, no se actualiza esta pantalla
    let activo = true;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const favoritos = await listarFavoritos(id);
        // El favorito guarda solo el id; si el lugar ya no existe, se omite
        const resultados = await Promise.all(
          favoritos.map(async (favorito) => {
            try {
              return { favorito, lugar: await obtenerLugar(favorito.lugarId) };
            } catch {
              return null;
            }
          }),
        );

        if (!activo) return;
        setItems(resultados.filter((item): item is ItemFavorito => item !== null));
      } catch (errorCarga) {
        if (activo) setError(mensajeError(errorCarga));
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar();

    return () => {
      activo = false;
    };
  }, [usuarioId, version]);

  async function quitar(lugarId: string) {
    if (!usuarioId || quitando) return;

    const id = usuarioId;
    setQuitando(lugarId);

    try {
      await quitarFavorito(id, lugarId);
      // Se saca de la lista en memoria para no volver a consultar la base
      setItems((previos) => previos.filter((item) => item.favorito.lugarId !== lugarId));
    } catch {
      Alert.alert('No se pudo quitar', 'Intentá de nuevo.');
    } finally {
      setQuitando(null);
    }
  }

  function confirmarQuitar(lugar: Lugar) {
    Alert.alert('Quitar de favoritos', `¿Querés quitar "${lugar.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => {
          void quitar(lugar.id);
        },
      },
    ]);
  }

  function abrirLugar(lugarId: string) {
    router.push({ pathname: '/lugares/[id]', params: { id: lugarId } });
  }

  if (estado === 'cargando' || cargando) {
    return (
      <ThemedView style={styles.centro}>
        <ActivityIndicator />
        <ThemedText themeColor="textSecondary">Cargando favoritos...</ThemedText>
      </ThemedView>
    );
  }

  if (!usuarioId) {
    return (
      <ThemedView style={styles.centro}>
        <BloqueoCuenta mensaje="Ingresá para ver tus favoritos. Se guardan en tu cuenta." />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.pantalla}>
      <ScrollView contentContainerStyle={[
        styles.contenido,
        { paddingBottom: Math.max(Spacing.five, insets.bottom + Spacing.four) },
      ]}>
        <View style={styles.encabezado}>
          <ThemedText type="subtitle">Favoritos</ThemedText>
          <ThemedText themeColor="textSecondary">Los lugares que guardaste.</ThemedText>
        </View>

        {error ? (
          <ThemedView type="backgroundElement" style={styles.aviso}>
            <ThemedText type="smallBold">{error}</ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reintentar"
              onPress={() => setVersion((valor) => valor + 1)}
              style={({ pressed }) => [
                styles.boton,
                { backgroundColor: theme.text },
                pressed && styles.presionado,
              ]}
            >
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                Reintentar
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}

        {!error && items.length === 0 ? (
          <ThemedView type="backgroundElement" style={styles.aviso}>
            <Ionicons name="heart-outline" size={48} color={theme.textSecondary} />
            <ThemedText type="smallBold">Todavía no tenés favoritos.</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.centrado}>
              Guardá un lugar desde su ficha para verlo acá.
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver lugares"
              onPress={() => router.push('/lugares')}
              style={({ pressed }) => [
                styles.boton,
                { backgroundColor: theme.text },
                pressed && styles.presionado,
              ]}
            >
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                Ver lugares
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}

        {items.length > 0 ? (
          <View style={styles.lista}>
            {items.map(({ favorito, lugar }) => (
              <ThemedView key={favorito.id} type="backgroundElement" style={styles.fila}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${lugar.nombre}`}
                  onPress={() => abrirLugar(lugar.id)}
                  style={({ pressed }) => [styles.filaInfo, pressed && styles.presionado]}
                >
                  <Ionicons name="location-outline" size={22} color={theme.textSecondary} />
                  <View style={styles.textos}>
                    <ThemedText type="smallBold">{lugar.nombre}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {lugar.direccion}
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ${lugar.nombre} de favoritos`}
                  disabled={quitando === lugar.id}
                  onPress={() => confirmarQuitar(lugar)}
                  style={({ pressed }) => [styles.quitar, pressed && styles.presionado]}
                >
                  {quitando === lugar.id ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Ionicons name="trash-outline" size={20} color="#C62828" />
                  )}
                </Pressable>
              </ThemedView>
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
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  encabezado: { gap: Spacing.two },
  lista: { gap: Spacing.two },
  fila: {
    minHeight: 64,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  filaInfo: {
    flex: 1,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingLeft: Spacing.three,
  },
  textos: { flex: 1, gap: 2 },
  quitar: {
    width: 52,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aviso: {
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
  },
  boton: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  presionado: { opacity: 0.6 },
  centrado: { textAlign: 'center' },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
});