import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  descargarLugar,
  obtenerDescarga,
  type LugarDescargado,
} from '@/almacenamiento/archivos';
import { BotonFavorito } from '@/components/boton-favorito';
import { ReproductorAudioguia } from '@/components/reproductor-audioguia';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useBrujula } from '@/hooks/use-brujula';
import { useSesion } from '@/hooks/use-sesion';
import { useTheme } from '@/hooks/use-theme';
import { useUbicacion } from '@/hooks/use-ubicacion';
import { ErrorServicio } from '@/servicios/comun';
import { obtenerCategorias, obtenerLugar } from '@/servicios/lugares';
import type { Categoria, Lugar } from '@/tipos';
import { calcularDistanciaMetros, calcularRotacionFlecha, formatearDistancia } from '@/utils/geo';
import { estadoHorarioLugar, horarioPorDia, nombreDia } from '@/utils/horarios';

type ErrorCargaLugar = { mensaje: string; noExiste: boolean };

function errorDeCarga(error: unknown): ErrorCargaLugar {
  if (error instanceof ErrorServicio) {
    return { mensaje: error.message, noExiste: error.codigo === 'LUGAR_NO_ENCONTRADO' };
  }
  return {
    mensaje: 'No se pudo cargar este lugar. Revisá tu conexión e intentá de nuevo.',
    noExiste: false,
  };
}

function BotonAccion({
  etiqueta,
  icono,
  onPress,
  secundario = false,
  deshabilitado = false,
}: {
  etiqueta: string;
  icono: 'navigate-outline' | 'footsteps-outline' | 'download-outline';
  onPress: () => void;
  secundario?: boolean;
  deshabilitado?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        styles.botonAccion,
        secundario
          ? { borderColor: theme.backgroundSelected, borderWidth: 1 }
          : { backgroundColor: theme.text },
        pressed && styles.presionado,
        deshabilitado && styles.deshabilitado,
      ]}
    >
      <Ionicons name={icono} size={20} color={secundario ? theme.text : theme.background} />
      <ThemedText
        type="smallBold"
        style={secundario ? { color: theme.text, flexShrink: 1 } : { color: theme.background, flexShrink: 1 }}
      >
        {etiqueta}
      </ThemedText>
    </Pressable>
  );
}

export default function FichaLugarScreen() {
  const { id, distancia } = useLocalSearchParams<{ id: string; distancia?: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { usuario } = useSesion();
  const {
    coordenadas,
    estadoPermiso,
    error: errorUbicacion,
    solicitarPermiso,
  } = useUbicacion();
  const rumboCelular = useBrujula();
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [descarga, setDescarga] = useState<LugarDescargado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<ErrorCargaLugar | null>(null);
  const [version, setVersion] = useState(0);
  const [indiceFoto, setIndiceFoto] = useState(0);
  const [ahora, setAhora] = useState(() => new Date());
  const [descargando, setDescargando] = useState(false);
  const [progresoDescarga, setProgresoDescarga] = useState('');

  useEffect(() => {
    const temporizador = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(temporizador);
  }, []);

  useEffect(() => {
    if (!id) return;

    let activo = true;
    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const [lugarEncontrado, categoriasDisponibles, archivosGuardados] = await Promise.all([
          obtenerLugar(id),
          obtenerCategorias(),
          obtenerDescarga(id),
        ]);
        if (!activo) return;
        setLugar(lugarEncontrado);
        setCategorias(categoriasDisponibles);
        setDescarga(archivosGuardados);
        setIndiceFoto(0);
      } catch (errorCarga) {
        if (activo) setError(errorDeCarga(errorCarga));
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar();
    return () => {
      activo = false;
    };
  }, [id, version]);

  const categoria = useMemo(
    () => categorias.find((item) => item.id === lugar?.categoriaId),
    [categorias, lugar?.categoriaId],
  );
  const fotos = descarga?.imagenes.length ? descarga.imagenes : lugar?.imagenes ?? [];
  const estadoHorario = lugar ? estadoHorarioLugar(lugar, ahora) : null;
  const ubicacionDisponible = estadoPermiso === 'concedido' && coordenadas !== null;
  const distanciaActual =
    lugar && ubicacionDisponible
      ? formatearDistancia(calcularDistanciaMetros(coordenadas, lugar.coordenadas))
      : distancia;
  const rotacionFlecha =
    lugar && ubicacionDisponible && rumboCelular !== null
      ? calcularRotacionFlecha(coordenadas, lugar.coordenadas, rumboCelular)
      : null;
  const tieneArchivosDescargables =
    lugar !== null && (lugar.audioguia !== null || lugar.imagenes.length > 0);

  async function descargarEsteLugar() {
    if (!lugar || descargando || descarga) return;
    if (!usuario) {
      router.push('/descargas');
      return;
    }

    setDescargando(true);
    setProgresoDescarga('');
    try {
      await descargarLugar(lugar, (completados, total) => {
        setProgresoDescarga(`Archivo ${completados} de ${total}`);
      });
      setDescarga(await obtenerDescarga(lugar.id));
    } catch {
      Alert.alert(
        'No se pudo descargar',
        'Revisá tu conexión e intentá descargar este lugar de nuevo.',
      );
    } finally {
      setDescargando(false);
      setProgresoDescarga('');
    }
  }

  async function abrirEnMapas() {
    if (!lugar) return;
    const destino = `${lugar.coordenadas.latitud},${lugar.coordenadas.longitud}`;
    try {
      await Linking.openURL(`geo:${destino}?q=${encodeURIComponent(`${destino}(${lugar.nombre})`)}`);
    } catch {
      try {
        await Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}`,
        );
      } catch {
        Alert.alert('Cómo llegar', 'No se pudo abrir una aplicación de mapas.');
      }
    }
  }

  async function abrirEnlace(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('No se pudo abrir', 'Revisá que haya una aplicación disponible para visualizar en el teléfono.');
    }
  }

  if (!id) {
    return (
      <ThemedView style={styles.centro}>
        <ThemedText type="smallBold">No existe ese lugar.</ThemedText>
      </ThemedView>
    );
  }

  if (cargando) {
    return (
      <ThemedView style={styles.centro}>
        <ActivityIndicator />
        <ThemedText themeColor="textSecondary">Cargando lugar...</ThemedText>
      </ThemedView>
    );
  }

  if (!lugar || error) {
    return (
      <ThemedView style={styles.centro}>
        <Ionicons name="location-outline" size={44} color={theme.textSecondary} />
        <ThemedText type="smallBold">{error?.mensaje ?? 'No existe ese lugar.'}</ThemedText>
        {!error?.noExiste ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setVersion((actual) => actual + 1)}
            style={[styles.botonReintentar, { backgroundColor: theme.text }]}
          >
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              Reintentar
            </ThemedText>
          </Pressable>
        ) : null}
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
        {fotos.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) =>
                setIndiceFoto(Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width))
              }
            >
              {fotos.map((uri, indice) => (
                <Image
                  key={`${uri}-${indice}`}
                  source={{ uri }}
                  contentFit="cover"
                  style={styles.foto}
                  accessibilityLabel={`Foto ${indice + 1} de ${lugar.nombre}`}
                />
              ))}
            </ScrollView>
            <View style={styles.superpuesto}>
              <ThemedView type="background" style={styles.botonFavorito}>
                <BotonFavorito lugarId={lugar.id} tamano={24} />
              </ThemedView>
            </View>
            {fotos.length > 1 ? (
              <ThemedText type="small" style={styles.contadorFotos}>
                {indiceFoto + 1} / {fotos.length}
              </ThemedText>
            ) : null}
          </View>
        ) : (
          <ThemedView type="backgroundElement" style={styles.fotoSinImagen}>
            <Ionicons name="image-outline" size={48} color={theme.textSecondary} />
            <ThemedText themeColor="textSecondary">Este lugar no tiene fotos.</ThemedText>
            <View style={styles.favoritoSinImagen}>
              <BotonFavorito lugarId={lugar.id} tamano={24} />
            </View>
          </ThemedView>
        )}

        <View style={styles.encabezado}>
          <ThemedText type="title" style={styles.titulo}>{lugar.nombre}</ThemedText>
          <View style={styles.etiquetas}>
            {categoria ? (
              <ThemedView style={[styles.etiquetaCategoria, { backgroundColor: categoria.color }]}>
                <ThemedText type="smallBold" style={styles.textoEtiqueta}>{categoria.nombre}</ThemedText>
              </ThemedView>
            ) : null}
            {estadoHorario ? (
              <ThemedText
                type="smallBold"
                style={{ color: estadoHorario.abierto ? '#247A3D' : theme.textSecondary }}
              >
                {estadoHorario.mensaje}
              </ThemedText>
            ) : null}
            {distanciaActual ? (
              <View style={styles.distancia}>
                {rotacionFlecha !== null ? (
                  <Ionicons
                    name="navigate-outline"
                    size={18}
                    color={theme.textSecondary}
                    style={{ transform: [{ rotate: `${rotacionFlecha}deg` }] }}
                  />
                ) : null}
                <ThemedText type="smallBold" themeColor="textSecondary">
                  A {distanciaActual}
                </ThemedText>
              </View>
            ) : null}
            {estadoPermiso === 'denegado' || errorUbicacion ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void solicitarPermiso()}
                hitSlop={8}
              >
                <ThemedText type="smallBold" style={{ color: '#2674C8' }}>
                  {errorUbicacion ? 'Reintentar ubicación' : 'Activar ubicación'}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.acciones}>
          <BotonAccion etiqueta="Cómo llegar" icono="navigate-outline" onPress={() => void abrirEnMapas()} />
          <BotonAccion
            etiqueta="Registrar visita"
            icono="footsteps-outline"
            secundario
            onPress={() => router.push({ pathname: '/registrar-visita', params: { lugarId: lugar.id } })}
          />
          <BotonAccion
            etiqueta={
              descarga
                ? 'Disponible sin señal'
                : descargando
                  ? 'Descargando...'
                  : tieneArchivosDescargables
                    ? 'Descargar para usar sin señal'
                    : 'Sin archivos para descargar'
            }
            icono="download-outline"
            secundario
            onPress={() => void descargarEsteLugar()}
            deshabilitado={Boolean(descarga) || descargando || !tieneArchivosDescargables}
          />
        </View>
        {descargando ? (
          <View style={styles.progresoDescarga}>
            <ActivityIndicator color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {progresoDescarga || 'Descargando fotos y audioguía...'}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.seccion}>
          <ThemedText type="subtitle" style={styles.subtitulo}>Sobre este lugar</ThemedText>
          <ThemedText>{lugar.descripcion}</ThemedText>
        </View>

        <View style={styles.seccion}>
          <ThemedText type="subtitle" style={styles.subtitulo}>Información</ThemedText>
          <FilaInformacion icono="location-outline" texto={lugar.direccion} />
          {lugar.telefono ? (
            <Pressable onPress={() => void abrirEnlace(`tel:${lugar.telefono?.replace(/[^\d+]/g, '')}`)}>
              <FilaInformacion icono="call-outline" texto={lugar.telefono} enlazable />
            </Pressable>
          ) : null}
          {lugar.sitioWeb ? (
            <Pressable onPress={() => void abrirEnlace(lugar.sitioWeb!)}>
              <FilaInformacion icono="globe-outline" texto={lugar.sitioWeb} enlazable />
            </Pressable>
          ) : null}
          {lugar.precioEntrada !== null ? (
            <FilaInformacion
              icono="ticket-outline"
              texto={lugar.precioEntrada === 0 ? 'Gratis' : `$${lugar.precioEntrada.toLocaleString('es-AR')}`}
            />
          ) : null}
          <FilaInformacion
            icono={lugar.accesible ? 'accessibility-outline' : 'walk-outline'}
            texto={lugar.accesible ? 'Accesible en silla de ruedas' : 'Accesibilidad no informada'}
          />
        </View>

        <View style={styles.seccion}>
          <ThemedText type="subtitle" style={styles.subtitulo}>Horarios</ThemedText>
          <View style={styles.horarios}>
            {[0, 1, 2, 3, 4, 5, 6].map((dia) => (
              <View key={dia} style={[styles.filaHorario, { borderBottomColor: theme.backgroundSelected }]}>
                <ThemedText type="smallBold" style={styles.nombreDia}>
                  {nombreDia(dia).charAt(0).toUpperCase() + nombreDia(dia).slice(1)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {horarioPorDia(lugar.horarios, dia)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {lugar.audioguia ? (
          <ReproductorAudioguia lugar={lugar} audioguia={lugar.audioguia} />
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

function FilaInformacion({
  icono,
  texto,
  enlazable = false,
}: {
  icono: 'location-outline' | 'call-outline' | 'globe-outline' | 'ticket-outline' | 'accessibility-outline' | 'walk-outline';
  texto: string;
  enlazable?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.filaInformacion}>
      <Ionicons name={icono} size={21} color={theme.textSecondary} />
      <ThemedText style={[styles.textoInformacion, enlazable && { color: '#2674C8', textDecorationLine: 'underline' }]}>
        {texto}
      </ThemedText>
      {enlazable ? <Ionicons name="open-outline" size={17} color={theme.textSecondary} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.four,
  },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  foto: { width: '100%', height: 260 },
  fotoSinImagen: { height: 220, alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative' },
  superpuesto: { position: 'absolute', top: 12, right: 12 },
  botonFavorito: { borderRadius: 24 },
  favoritoSinImagen: { position: 'absolute', top: 12, right: 12 },
  contadorFotos: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    overflow: 'hidden',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: '#FFFFFF',
    backgroundColor: '#00000099',
  },
  encabezado: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  titulo: { fontSize: 32, lineHeight: 40 },
  etiquetas: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  distancia: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  etiquetaCategoria: { alignSelf: 'flex-start', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  textoEtiqueta: { color: '#FFFFFF' },
  acciones: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  progresoDescarga: {
    marginHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  botonAccion: {
    minHeight: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  seccion: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  subtitulo: { fontSize: 22, lineHeight: 30 },
  filaInformacion: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 40 },
  textoInformacion: { flex: 1 },
  horarios: { gap: 0 },
  filaHorario: {
    minHeight: 42,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  nombreDia: { minWidth: 90, textTransform: 'capitalize' },
  botonReintentar: { minHeight: 48, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  presionado: { opacity: 0.75 },
  deshabilitado: { opacity: 0.65 },
});
