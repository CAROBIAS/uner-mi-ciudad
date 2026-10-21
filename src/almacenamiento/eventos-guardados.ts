import type { EstadoEvento } from '@/tipos';

import { obtenerBase } from './base';

// EVENTOS GUARDADOS (Integrante 2) — guardados en SQLite (sobreviven al cerrar la app).

export type EventoGuardado = {
  usuarioId: string;
  eventoId: string;
  recordatorioId: string | null; // id del aviso programado (Integrante 6), para poder cancelarlo
  estado: EstadoEvento;
  guardadoEn: string;
};

const COLUMNAS = `usuario_id AS usuarioId, evento_id AS eventoId, recordatorio_id AS recordatorioId,
  estado, guardado_en AS guardadoEn`;

// Si ya estaba guardado, lo reemplaza.
export async function guardarEvento(
  usuarioId: string,
  eventoId: string,
  recordatorioId: string | null,
  estado: EstadoEvento,
): Promise<EventoGuardado> {
  const base = await obtenerBase();
  const nuevo: EventoGuardado = {
    usuarioId,
    eventoId,
    recordatorioId,
    estado,
    guardadoEn: new Date().toISOString(),
  };
  await base.runAsync(
    `INSERT OR REPLACE INTO eventos_guardados (usuario_id, evento_id, recordatorio_id, estado, guardado_en)
     VALUES (?, ?, ?, ?, ?)`,
    nuevo.usuarioId,
    nuevo.eventoId,
    nuevo.recordatorioId,
    nuevo.estado,
    nuevo.guardadoEn,
  );
  return nuevo;
}

export async function quitarEventoGuardado(usuarioId: string, eventoId: string): Promise<void> {
  const base = await obtenerBase();
  await base.runAsync(
    'DELETE FROM eventos_guardados WHERE usuario_id = ? AND evento_id = ?',
    usuarioId,
    eventoId,
  );
}

// Sirve para saber si mostrar "Guardar" o "Quitar", y para obtener el recordatorioId.
export async function obtenerEventoGuardado(
  usuarioId: string,
  eventoId: string,
): Promise<EventoGuardado | null> {
  const base = await obtenerBase();
  return base.getFirstAsync<EventoGuardado>(
    `SELECT ${COLUMNAS} FROM eventos_guardados WHERE usuario_id = ? AND evento_id = ?`,
    usuarioId,
    eventoId,
  );
}

export async function listarEventosGuardados(usuarioId: string): Promise<EventoGuardado[]> {
  const base = await obtenerBase();
  return base.getAllAsync<EventoGuardado>(
    `SELECT ${COLUMNAS} FROM eventos_guardados WHERE usuario_id = ? ORDER BY guardado_en DESC`,
    usuarioId,
  );
}

export async function actualizarEstadoEventoGuardado(
  usuarioId: string,
  eventoId: string,
  estado: EstadoEvento,
): Promise<void> {
  const base = await obtenerBase();
  await base.runAsync(
    'UPDATE eventos_guardados SET estado = ? WHERE usuario_id = ? AND evento_id = ?',
    estado,
    usuarioId,
    eventoId,
  );
}