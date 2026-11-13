import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useFocusEffect } from 'expo-router';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { obtenerDescarga } from '@/almacenamiento/archivos';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { hayInternet } from '@/almacenamiento/red';
import type { Audioguia, Lugar } from '@/tipos';

type Props = {
  lugar: Lugar;
  audioguia: Audioguia;
};

function tiempo(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const minutos = Math.floor(total / 60);
  return `${minutos}:${String(total % 60).padStart(2, '0')}`;
}

export function ReproductorAudioguia({ lugar, audioguia }: Props) {
  const theme = useTheme();
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const estado = useAudioPlayerStatus(player);
  const montado = useRef(true);
  const enfocado = useRef(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fuenteLista, setFuenteLista] = useState(false);

  useLayoutEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;

    async function prepararFuente() {
      setCargando(true);
      setError(null);
      setFuenteLista(false);
      try {
        const descarga = await obtenerDescarga(lugar.id);
        if (!activo) return;

        if (descarga?.audioUri) {
          player.replace(descarga.audioUri);
        } else if (await hayInternet()) {
          player.replace(audioguia.url);
        } else {
          setError('No hay conexión y esta audioguía no está descargada.');
          return;
        }

        if (activo) setFuenteLista(true);
      } catch {
        if (activo) setError('No se pudo preparar la audioguía. Probá de nuevo.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    void prepararFuente();
    return () => {
      activo = false;
    };
  }, [audioguia.url, lugar.id, player]);

  useFocusEffect(
    useCallback(
      () => {
        enfocado.current = true;
        return () => {
          enfocado.current = false;
          if (!montado.current) return;

          player.pause();
          player.setActiveForLockScreen(false);
        };
      },
      [player],
    ),
  );

  async function reproducirOPausar() {
    if (!fuenteLista || cargando) return;
    if (estado.playing) {
      player.pause();
      return;
    }

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });
      if (!montado.current || !enfocado.current) return;

      player.setActiveForLockScreen(true, {
        title: lugar.nombre,
        artist: 'Audioguía · Mi Ciudad Colón',
      });
      player.play();
    } catch {
      if (montado.current && enfocado.current) {
        Alert.alert('Audioguía', 'No se pudo iniciar la reproducción.');
      }
    }
  }

  async function adelantar(segundos: number) {
    const duracion = estado.duration || audioguia.duracionSegundos;
    const posicion = Math.min(duracion, Math.max(0, estado.currentTime + segundos));
    try {
      await player.seekTo(posicion);
    } catch {
      Alert.alert('Audioguía', 'No se pudo cambiar la posición del audio.');
    }
  }

  const duracion = estado.duration || audioguia.duracionSegundos;
  const progreso = duracion > 0 ? Math.min(1, estado.currentTime / duracion) : 0;

  return (
    <ThemedView type="backgroundElement" style={styles.tarjeta}>
      <View style={styles.titulo}>
        <Ionicons name="headset-outline" size={24} color={theme.text} />
        <View style={styles.textos}>
          <ThemedText type="smallBold">Audioguía</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {audioguia.idioma.toUpperCase()} · {tiempo(duracion)}
          </ThemedText>
        </View>
      </View>

      {cargando ? (
        <View style={styles.estado}>
          <ActivityIndicator />
          <ThemedText type="small" themeColor="textSecondary">Preparando audio...</ThemedText>
        </View>
      ) : null}
      {error ? <ThemedText type="small" style={styles.error}>{error}</ThemedText> : null}
      {estado.error ? (
        <ThemedText type="small" style={styles.error}>
          No se pudo reproducir la audioguía. Revisá la conexión e intentá de nuevo.
        </ThemedText>
      ) : null}

      {!cargando && !error ? (
        <>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="Progreso de la audioguía"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(progreso * 100) }}
            style={[styles.barra, { backgroundColor: theme.backgroundSelected }]}
          >
            <View style={[styles.progreso, { width: `${progreso * 100}%`, backgroundColor: theme.text }]} />
          </View>
          <View style={styles.tiempos}>
            <ThemedText type="small" themeColor="textSecondary">{tiempo(estado.currentTime)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              -{tiempo(Math.max(0, duracion - estado.currentTime))}
            </ThemedText>
          </View>
          <View style={styles.controles}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retroceder 15 segundos"
              onPress={() => void adelantar(-15)}
              style={styles.control}
            >
              <Ionicons name="play-back" size={24} color={theme.text} />
              <ThemedText type="small">15</ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={estado.playing ? 'Pausar audioguía' : 'Reproducir audioguía'}
              onPress={() => void reproducirOPausar()}
              style={[styles.botonReproducir, { backgroundColor: theme.text }]}
            >
              <Ionicons
                name={estado.playing ? 'pause' : 'play'}
                size={26}
                color={theme.background}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Adelantar 15 segundos"
              onPress={() => void adelantar(15)}
              style={styles.control}
            >
              <Ionicons name="play-forward" size={24} color={theme.text} />
              <ThemedText type="small">15</ThemedText>
            </Pressable>
          </View>
        </>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderRadius: 16, padding: 16, gap: 14 },
  titulo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textos: { flex: 1, gap: 2 },
  estado: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  error: { color: '#B3261E' },
  barra: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progreso: { height: '100%', borderRadius: 3 },
  tiempos: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 },
  controles: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  control: { alignItems: 'center', justifyContent: 'center', minWidth: 48, minHeight: 48 },
  botonReproducir: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
