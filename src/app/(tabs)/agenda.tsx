import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { listarEventosGuardados } from '@/almacenamiento/eventos-guardados';
import { BloqueoCuenta } from '@/components/bloqueo-cuenta';
import { BotonFiltro } from '@/components/boton-filtro';
import { MensajeCargando, MensajeError, MensajeVacio } from '@/components/mensajes-estado';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSesion } from '@/hooks/use-sesion';
import { useTheme } from '@/hooks/use-theme';
import { ErrorServicio } from '@/servicios/comun';
import { obtenerEvento, obtenerEventos } from '@/servicios/eventos';
import { obtenerLugares } from '@/servicios/lugares';
import type { Evento } from '@/tipos';

// AGENDA (Integrante 6)
// - Fila de días: hoy y los 6 siguientes (5.1, 5.2). Al cambiar el día, se actualiza sola.
// - Eventos del día elegido, ordenados por hora, sin los que ya terminaron (5.3, 5.4).
// - Mensajes de cargando, sin eventos y error (5.5).
// - Sección "Guardados", solo con cuenta (5.6).

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const CANTIDAD_DIAS = 7;

type Dia = { clave: string; etiqueta: string; fecha: Date };

// "AAAA-MM-DD" del día en el horario del celular.
function claveDelDia(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// Recibe el día de hoy como "AAAA-MM-DD".
function armarDias(claveHoy: string): Dia[] {
  const [anio, mes, dia] = claveHoy.split('-').map(Number);
  const hoy = new Date(anio, mes - 1, dia);
  const dias: Dia[] = [];
  for (let i = 0; i < CANTIDAD_DIAS; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
    const etiqueta =
      i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : `${DIAS_SEMANA[fecha.getDay()]} ${fecha.getDate()}`;
    dias.push({ clave: claveDelDia(fecha), etiqueta, fecha });
  }
  return dias;
}

function hora(iso: string): string {
  const fecha = new Date(iso);
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
}

function fechaCorta(iso: string): string {
  const fecha = new Date(iso);
  return `${DIAS_SEMANA[fecha.getDay()]} ${fecha.getDate()}/${fecha.getMonth() + 1} · ${hora(iso)}`;
}

function textoPrecio(precio: number | null): string | null {
  if (precio === null) return null;
  return precio === 0 ? 'Gratis' : `$${precio.toLocaleString('es-AR')}`;
}

// 5.4: ya terminó si está finalizado o si su hora de fin ya pasó.
function yaTermino(evento: Evento, ahora: number): boolean {
  if (evento.estado === 'finalizado') return true;
  return evento.fin !== null && Date.parse(evento.fin) < ahora;
}

function mensajeDeError(error: unknown): string {
  return error instanceof ErrorServicio ? error.message : 'No se pudieron cargar los eventos.';
}

function FilaEvento({
  evento,
  lugarNombre,
  conFecha = false,
}: {
  evento: Evento;
  lugarNombre: string | null;
  conFecha?: boolean;
}) {
  const theme = useTheme();
  const precio = textoPrecio(evento.precio);
  const donde = lugarNombre ?? evento.direccionLibre ?? 'Lugar a confirmar';
  const colorEstado = evento.estado === 'cancelado' ? theme.error : '#B26A00';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${evento.titulo}`}
      onPress={() => router.push({ pathname: '/eventos/[id]', params: { id: evento.id } })}
      style={({ pressed }) => [pressed && styles.presionado]}
    >
      <ThemedView type="backgroundElement" style={styles.fila}>
        <ThemedText type="smallBold" style={styles.hora}>
          {conFecha ? fechaCorta(evento.inicio) : hora(evento.inicio)}
        </ThemedText>
        <View style={styles.textos}>
          <ThemedText type="smallBold">{evento.titulo}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {donde}
          </ThemedText>
          <View style={styles.etiquetas}>
            {precio ? (
              <ThemedText type="small" themeColor="textSecondary">
                {precio}
              </ThemedText>
            ) : null}
            {evento.estado === 'suspendido' || evento.estado === 'cancelado' ? (
              <View style={[styles.etiquetaEstado, { borderColor: colorEstado }]}>
                <ThemedText type="smallBold" style={{ color: colorEstado }}>
                  {evento.estado === 'cancelado' ? 'Cancelado' : 'Suspendido'}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </ThemedView>
    </Pressable>
  );
}

export default function AgendaScreen() {
  const { estado, usuario } = useSesion();
  const [hoy, setHoy] = useState(() => claveDelDia(new Date()));
  const dias = useMemo(() => armarDias(hoy), [hoy]);
  const [diaElegido, setDiaElegido] = useState(hoy);
  const [ahora, setAhora] = useState(() => Date.now()); // se actualiza cada minuto

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [nombresLugares, setNombresLugares] = useState<Map<string, string>>(new Map());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const [guardados, setGuardados] = useState<Evento[]>([]);

  const usuarioId = estado === 'conSesion' ? (usuario?.id ?? null) : null;

  // 5.2 y 5.4: cada minuto se actualiza la hora (para ocultar los que terminan)
  // y, si cambió el día (pasó la medianoche), la agenda se rehace sola.
  useEffect(() => {
    const temporizador = setInterval(() => {
      setAhora(Date.now());
      const nuevo = claveDelDia(new Date());
      if (nuevo !== hoy) {
        setHoy(nuevo);
        setDiaElegido(nuevo);
        setCargando(true);
      }
    }, 60_000);
    return () => clearInterval(temporizador);
  }, [hoy]);

  // Eventos de los 7 días y nombres de los lugares del catálogo.
  useEffect(() => {
    let activo = true;
    const desde = dias[0].fecha;
    const hasta = new Date(dias[CANTIDAD_DIAS - 1].fecha);
    hasta.setHours(23, 59, 59, 999);

    async function cargar() {
      try {
        const [lista, lugares] = await Promise.all([
          obtenerEventos(desde.toISOString(), hasta.toISOString()),
          obtenerLugares().catch(() => []), // si falla, se muestra la dirección
        ]);
        if (!activo) return;
        setEventos(lista);
        setNombresLugares(new Map(lugares.map((lugar) => [lugar.id, lugar.nombre])));
        setError(null);
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
  }, [dias, version]);

  // 5.6: guardados del usuario. Se recargan al volver a la pestaña (por si guardó o quitó uno).
  useFocusEffect(
    useCallback(() => {
      if (!usuarioId) return;
      let activo = true;

      async function cargarGuardados(id: string) {
        try {
          const filas = await listarEventosGuardados(id);
          const detalles = await Promise.all(
            filas.map((fila) => obtenerEvento(fila.eventoId).catch(() => null)),
          );
          if (!activo) return;
          const momento = Date.now();
          setGuardados(
            detalles
              .filter((evento): evento is Evento => evento !== null && !yaTermino(evento, momento))
              .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio)),
          );
        } catch {
          if (activo) setGuardados([]);
        }
      }

      void cargarGuardados(usuarioId);
      return () => {
        activo = false;
      };
    }, [usuarioId]),
  );

  const eventosDelDia = useMemo(
    () =>
      eventos.filter(
        (evento) => claveDelDia(new Date(evento.inicio)) === diaElegido && !yaTermino(evento, ahora),
      ),
    [eventos, diaElegido, ahora],
  );

  function reintentar() {
    setCargando(true);
    setError(null);
    setVersion((actual) => actual + 1);
  }

  function nombreLugar(evento: Evento): string | null {
    return evento.lugarId ? (nombresLugares.get(evento.lugarId) ?? null) : null;
  }

  return (
    <ThemedView style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <ThemedText type="subtitle">Agenda</ThemedText>

        {/* 5.1: fila de días */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dias}
        >
          {dias.map((dia) => (
            <BotonFiltro
              key={dia.clave}
              titulo={dia.etiqueta}
              seleccionado={dia.clave === diaElegido}
              onPress={() => setDiaElegido(dia.clave)}
            />
          ))}
        </ScrollView>

        {/* 5.3 a 5.5: eventos del día */}
        {cargando ? <MensajeCargando mensaje="Cargando eventos..." /> : null}
        {!cargando && error ? <MensajeError mensaje={error} onReintentar={reintentar} /> : null}
        {!cargando && !error && eventosDelDia.length === 0 ? (
          <MensajeVacio mensaje="No hay eventos este día." />
        ) : null}
        {!cargando && !error
          ? eventosDelDia.map((evento) => (
              <FilaEvento key={evento.id} evento={evento} lugarNombre={nombreLugar(evento)} />
            ))
          : null}

        {/* 5.6: guardados, solo con cuenta */}
        <ThemedText type="subtitle" style={styles.tituloSeccion}>
          Guardados
        </ThemedText>
        {!usuarioId ? (
          <BloqueoCuenta mensaje="Ingresá para guardar eventos y recibir un recordatorio antes de que empiecen." />
        ) : guardados.length === 0 ? (
          <MensajeVacio mensaje="Todavía no guardaste eventos. Abrí uno y tocá Guardar." />
        ) : (
          guardados.map((evento) => (
            <FilaEvento
              key={evento.id}
              evento={evento}
              lugarNombre={nombreLugar(evento)}
              conFecha
            />
          ))
        )}
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
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  dias: { gap: Spacing.two, paddingRight: Spacing.two },
  fila: {
    minHeight: 72,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  hora: { minWidth: 52 },
  textos: { flex: 1, gap: 2 },
  etiquetas: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  etiquetaEstado: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 6 },
  tituloSeccion: { marginTop: Spacing.three },
  presionado: { opacity: 0.6 },
});