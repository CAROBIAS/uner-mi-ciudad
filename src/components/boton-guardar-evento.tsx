import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  guardarEvento,
  obtenerEventoGuardado,
  quitarEventoGuardado,
  type EventoGuardado,
} from '@/almacenamiento/eventos-guardados';
import { cancelarAviso, programarAviso } from '@/avisos/avisos';
import { BotonGrande } from '@/components/boton-grande';
import { ThemedText } from '@/components/themed-text';
import { useSesion } from '@/hooks/use-sesion';
import type { Evento } from '@/tipos';

// GUARDAR EVENTO Y RECORDATORIO (Integrante 6, tarea 7)
// - Botón "Guardar" / "Quitar", solo con cuenta (7.1).
// - Al guardar, programa un aviso 30 minutos antes del inicio. No se programa si ya
//   empezó, está cancelado, suspendido o terminado (7.2).
// - Al quitar, cancela el aviso (7.3).

const MINUTOS_ANTES = 30;

function horaDe(iso: string): string {
  const fecha = new Date(iso);
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
}

type Props = { evento: Evento };

export function BotonGuardarEvento({ evento }: Props) {
  const { estado, usuario } = useSesion();
  const usuarioId = estado === 'conSesion' ? (usuario?.id ?? null) : null;
  const [guardado, setGuardado] = useState<EventoGuardado | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Al abrir la ficha: ¿este evento ya está guardado?
  useEffect(() => {
    if (!usuarioId) return;
    let activo = true;
    obtenerEventoGuardado(usuarioId, evento.id)
      .then((fila) => {
        if (activo) setGuardado(fila);
      })
      .catch(() => undefined);
    return () => {
      activo = false;
    };
  }, [usuarioId, evento.id]);

  const estaGuardado = usuarioId !== null && guardado !== null;

  async function guardar(id: string) {
    const aviso = new Date(Date.parse(evento.inicio) - MINUTOS_ANTES * 60_000);
    // programarAviso devuelve null si la fecha ya pasó o no hay permiso de avisos.
    const recordatorioId =
      evento.estado === 'programado'
        ? await programarAviso(
            'Tu evento empieza pronto',
            `"${evento.titulo}" empieza a las ${horaDe(evento.inicio)}.`,
            aviso,
            { eventoId: evento.id },
          )
        : null;
    const fila = await guardarEvento(id, evento.id, recordatorioId, evento.estado);
    setGuardado(fila);
    setMensaje(
      recordatorioId
        ? `Guardado. Te avisamos ${MINUTOS_ANTES} minutos antes.`
        : 'Guardado. No se programó recordatorio (el evento ya empezó, no está programado o los avisos están desactivados).',
    );
  }

  async function quitar(id: string, fila: EventoGuardado) {
    if (fila.recordatorioId) await cancelarAviso(fila.recordatorioId);
    await quitarEventoGuardado(id, evento.id);
    setGuardado(null);
    setMensaje('Lo quitaste de tus guardados.');
  }

  async function alternar() {
    if (!usuarioId) {
      Alert.alert('Necesitás una cuenta', 'Ingresá para guardar eventos y recibir un recordatorio.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ingresar', onPress: () => router.push('/ingresar') },
      ]);
      return;
    }
    if (ocupado) return;
    setOcupado(true);
    try {
      if (guardado) await quitar(usuarioId, guardado);
      else await guardar(usuarioId);
    } catch {
      Alert.alert('Eventos guardados', 'No se pudo actualizar. Probá de nuevo.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <View style={styles.contenedor}>
      <BotonGrande
        titulo={estaGuardado ? 'Quitar de guardados' : 'Guardar evento'}
        variante={estaGuardado ? 'secundario' : 'principal'}
        deshabilitado={ocupado}
        onPress={() => void alternar()}
      />
      {mensaje ? (
        <ThemedText type="small" themeColor="textSecondary">
          {mensaje}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: 4 },
});