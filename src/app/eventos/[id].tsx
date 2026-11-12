import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotonGrande } from '@/components/boton-grande';
import { BotonGuardarEvento } from '@/components/boton-guardar-evento';
import { MensajeCargando, MensajeError } from '@/components/mensajes-estado';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ErrorServicio } from '@/servicios/comun';
import { obtenerEvento } from '@/servicios/eventos';
import { obtenerLugar } from '@/servicios/lugares';
import type { Coordenadas, Evento, Lugar } from '@/tipos';

// FICHA DEL EVENTO (Integrante 6)
// - Título, imagen, descripción, inicio y duración (6.1).
// - Dónde es: lugar del catálogo con enlace a su ficha, o la dirección suelta (6.2).
// - Precio: 0 se muestra como "Gratis" (6.3).
// - Suspendido o cancelado se ve claramente arriba (6.4).

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function dosDigitos(numero: number): string {
  return String(numero).padStart(2, '0');
}

// "sábado 14 de noviembre, 21:00"
function fechaLarga(iso: string): string {
  const fecha = new Date(iso);
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}, ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

// "1 h 30 min", o "Sin hora de fin".
function duracion(evento: Evento): string {
  if (!evento.fin) return 'Sin hora de fin';
  const minutos = Math.round((Date.parse(evento.fin) - Date.parse(evento.inicio)) / 60_000);
  if (minutos <= 0) return 'Sin hora de fin';
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

function textoPrecio(precio: number | null): string | null {
  if (precio === null) return null;
  return precio === 0 ? 'Gratis' : `$${precio.toLocaleString('es-AR')}`;
}

type ErrorCarga = { mensaje: string; noExiste: boolean };

function errorDeCarga(error: unknown): ErrorCarga {
  if (error instanceof ErrorServicio) {
    return { mensaje: error.message, noExiste: error.codigo === 'EVENTO_NO_ENCONTRADO' };
  }
  return { mensaje: 'No se pudo cargar el evento.', noExiste: false };
}

function Fila({ icono, texto }: { icono: 'time-outline' | 'hourglass-outline' | 'ticket-outline' | 'location-outline'; texto: string }) {
  const theme = useTheme();
  return (
    <View style={styles.filaInfo}>
      <Ionicons name={icono} size={21} color={theme.textSecondary} />
      <ThemedText style={styles.textoInfo}>{texto}</ThemedText>
    </View>
  );
}

export default function FichaEventoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<ErrorCarga | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!id) return;
    let activo = true;

    async function cargar(eventoId: string) {
      try {
        const encontrado = await obtenerEvento(eventoId);
        // Si es en un lugar del catálogo, se busca su nombre (si falla, se sigue sin él).
        const lugarDelEvento = encontrado.lugarId
          ? await obtenerLugar(encontrado.lugarId).catch(() => null)
          : null;
        if (!activo) return;
        setEvento(encontrado);
        setLugar(lugarDelEvento);
        setError(null);
      } catch (errorCarga) {
        if (activo) setError(errorDeCarga(errorCarga));
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar(id);
    return () => {
      activo = false;
    };
  }, [id, version]);

  function reintentar() {
    setCargando(true);
    setError(null);
    setVersion((actual) => actual + 1);
  }

  // Abre la app de navegación predeterminada del celular (como pidió la cátedra).
  // PENDIENTE: unificar con el "Cómo llegar" de la ficha del lugar (rama integrante-4 / Integrante 5).
  async function comoLlegar(destino: Coordenadas, nombre: string) {
    const punto = `${destino.latitud},${destino.longitud}`;
    try {
      await Linking.openURL(`geo:${punto}?q=${encodeURIComponent(`${punto}(${nombre})`)}`);
    } catch {
      try {
        await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(punto)}`);
      } catch {
        Alert.alert('Cómo llegar', 'No se pudo abrir una aplicación de mapas.');
      }
    }
  }

  if (cargando) {
    return (
      <ThemedView style={styles.centro}>
        <MensajeCargando mensaje="Cargando evento..." />
      </ThemedView>
    );
  }

  if (error || !evento) {
    return (
      <ThemedView style={styles.centro}>
        <MensajeError
          mensaje={error?.mensaje ?? 'No existe ese evento.'}
          onReintentar={error?.noExiste ? undefined : reintentar}
        />
      </ThemedView>
    );
  }

  const precio = textoPrecio(evento.precio);
  const destino = lugar?.coordenadas ?? evento.coordenadas;
  const nombreDestino = lugar?.nombre ?? evento.direccionLibre ?? evento.titulo;
  const avisoEstado =
    evento.estado === 'cancelado'
      ? 'Este evento fue cancelado.'
      : evento.estado === 'suspendido'
        ? 'Este evento está suspendido.'
        : evento.estado === 'finalizado'
          ? 'Este evento ya terminó.'
          : null;

  return (
    <ThemedView style={styles.pantalla}>
      <ScrollView
        contentContainerStyle={[
          styles.contenido,
          { paddingBottom: Math.max(Spacing.five, insets.bottom + Spacing.four) },
        ]}
      >
        {evento.imagenUrl ? (
          <Image
            source={{ uri: evento.imagenUrl }}
            style={styles.imagen}
            contentFit="cover"
            accessibilityLabel={`Imagen de ${evento.titulo}`}
          />
        ) : (
          <ThemedView type="backgroundElement" style={[styles.imagen, styles.sinImagen]}>
            <Ionicons name="calendar-outline" size={48} color={theme.textSecondary} />
          </ThemedView>
        )}

        <View style={styles.cuerpo}>
          {/* 6.4: estado bien visible */}
          {avisoEstado ? (
            <View
              accessibilityRole="alert"
              style={[
                styles.avisoEstado,
                { backgroundColor: evento.estado === 'cancelado' ? theme.error : '#B26A00' },
              ]}
            >
              <Ionicons name="alert-circle" size={22} color="#FFFFFF" />
              <ThemedText type="smallBold" style={styles.textoAviso}>
                {avisoEstado}
              </ThemedText>
            </View>
          ) : null}

          <ThemedText type="title" style={styles.titulo}>
            {evento.titulo}
          </ThemedText>

          {/* 6.1 y 6.3 */}
          <Fila icono="time-outline" texto={fechaLarga(evento.inicio)} />
          <Fila icono="hourglass-outline" texto={duracion(evento)} />
          {precio ? <Fila icono="ticket-outline" texto={precio} /> : null}

          {/* 7: guardar evento y recordatorio */}
          <BotonGuardarEvento evento={evento} />

          {/* 6.2: dónde es */}
          <ThemedText type="subtitle" style={styles.subtitulo}>
            Dónde
          </ThemedText>
          {lugar ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Ver la ficha de ${lugar.nombre}`}
              onPress={() => router.push({ pathname: '/lugares/[id]', params: { id: lugar.id } })}
            >
              <View style={styles.filaInfo}>
                <Ionicons name="location-outline" size={21} color={theme.textSecondary} />
                <ThemedText style={[styles.textoInfo, { color: theme.primary, textDecorationLine: 'underline' }]}>
                  {lugar.nombre}
                </ThemedText>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </View>
            </Pressable>
          ) : (
            <Fila
              icono="location-outline"
              texto={evento.direccionLibre ?? 'Lugar a confirmar'}
            />
          )}
          {destino ? (
            <BotonGrande
              titulo="Cómo llegar"
              variante="secundario"
              onPress={() => void comoLlegar(destino, nombreDestino)}
            />
          ) : null}

          <ThemedText type="subtitle" style={styles.subtitulo}>
            Sobre el evento
          </ThemedText>
          <ThemedText>{evento.descripcion}</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  contenido: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  imagen: { width: '100%', height: 220 },
  sinImagen: { alignItems: 'center', justifyContent: 'center' },
  cuerpo: { padding: Spacing.three, gap: Spacing.three },
  avisoEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  textoAviso: { color: '#FFFFFF', flex: 1 },
  titulo: { fontSize: 30, lineHeight: 38 },
  subtitulo: { fontSize: 22, lineHeight: 30, marginTop: Spacing.two },
  filaInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 40 },
  textoInfo: { flex: 1 },
});