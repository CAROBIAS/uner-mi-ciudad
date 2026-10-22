import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { listarVisitas } from '@/almacenamiento/visitas';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSesion } from '@/hooks/use-sesion';
import { useTheme } from '@/hooks/use-theme';
import { ErrorServicio } from '@/servicios/comun';
import { obtenerLugar } from '@/servicios/lugares';
import type { Lugar, Visita } from '@/tipos';

type ItemVisita = {
  visita: Visita;
  lugar: Lugar;
};

const ORIGEN: Record<Visita['origen'], string> = {
  qr: 'QR',
  gps: 'GPS',
  manual: 'Manual',
};

function formatearFecha(fechaHora: string): string {
  const fecha = new Date(fechaHora);

  if (Number.isNaN(fecha.getTime())) return fechaHora;

  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');

  return `${dia}/${mes}/${anio} ${hora}:${minutos}`;
}

function mensajeError(error: unknown): string {
  return error instanceof ErrorServicio
    ? error.message
    : 'No se pudo cargar tu recorrido.';
}

export default function RecorridoScreen() {
  const { estado, usuario } = useSesion();
  const theme = useTheme();
  const [items, setItems] = useState<ItemVisita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const usuarioId = usuario?.id ?? null;

  useFocusEffect(
    useCallback(() => {
      if (!usuarioId) {
        setItems([]);
        setCargando(false);
        setError(null);
        return;
      }

      const id = usuarioId;
      let activo = true;

      async function cargar() {
        setCargando(true);
        setError(null);

        try {
          const visitas = await listarVisitas(id);
          const resultados = await Promise.all(
            visitas.map(async (visita) => {
              try {
                return { visita, lugar: await obtenerLugar(visita.lugarId) };
              } catch {
                return null;
              }
            }),
          );

          if (!activo) return;
          setItems(resultados.filter((item): item is ItemVisita => item !== null));
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
    }, [usuarioId, version]),
  );

  function abrirLugar(lugarId: string) {
    router.push({ pathname: '/lugares/[id]', params: { id: lugarId } });
  }

  if (estado === 'cargando' || cargando) {
    return (
      <ThemedView style={styles.centro}>
        <ActivityIndicator />
        <ThemedText themeColor="textSecondary">Cargando recorrido...</ThemedText>
      </ThemedView>
    );
  }

  if (!usuarioId) {
    return (
      <ThemedView style={styles.centro}>
        <Ionicons name="person-circle-outline" size={64} color={theme.textSecondary} />
        <ThemedText type="smallBold">Ingresá para ver tu recorrido.</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centrado}>
          Las visitas se guardan en tu cuenta.
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

  return (
    <ThemedView style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.encabezado}>
          <ThemedText type="subtitle">Mi recorrido</ThemedText>
          <ThemedText themeColor="textSecondary">Los lugares que visitaste.</ThemedText>
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
            <Ionicons name="footsteps-outline" size={48} color={theme.textSecondary} />
            <ThemedText type="smallBold">Todavía no registraste visitas.</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.centrado}>
              Escaneá el QR de un lugar o registrá la visita manualmente.
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Escanear un lugar"
              onPress={() => router.push('/escanear-qr')}
              style={({ pressed }) => [
                styles.boton,
                { backgroundColor: theme.text },
                pressed && styles.presionado,
              ]}
            >
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                Escanear un lugar
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}

        {items.length > 0 ? (
          <View style={styles.lista}>
            {items.map(({ visita, lugar }) => {
              const colorEstado = visita.sincronizada ? '#2E7D32' : '#B26A00';

              return (
                <ThemedView key={visita.id} type="backgroundElement" style={styles.fila}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir ${lugar.nombre}`}
                    onPress={() => abrirLugar(lugar.id)}
                    style={({ pressed }) => [styles.filaInfo, pressed && styles.presionado]}
                  >
                    <Ionicons name="location-outline" size={22} color={theme.textSecondary} />
                    <View style={styles.textos}>
                      <ThemedText type="smallBold">{lugar.nombre}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {formatearFecha(visita.fechaHora)} · {ORIGEN[visita.origen]}
                      </ThemedText>
                      {visita.nota ? (
                        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                          {visita.nota}
                        </ThemedText>
                      ) : null}
                      <View style={styles.estadoFila}>
                        <Ionicons
                          name={
                            visita.sincronizada
                              ? 'checkmark-circle-outline'
                              : 'cloud-upload-outline'
                          }
                          size={14}
                          color={colorEstado}
                        />
                        <ThemedText type="small" style={{ color: colorEstado }}>
                          {visita.sincronizada ? 'Sincronizada' : 'Pendiente de subir'}
                        </ThemedText>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                  </Pressable>
                </ThemedView>
              );
            })}
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
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  encabezado: { gap: Spacing.two },
  lista: { gap: Spacing.two },
  fila: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  filaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  textos: { flex: 1, gap: 2 },
  estadoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
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