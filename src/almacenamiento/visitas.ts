import type { OrigenVisita, Visita } from '@/tipos';

import { obtenerBase } from './base';

// VISITAS (Integrante 2) — guardadas en SQLite (sobreviven al cerrar la app).

export type NuevaVisita = {
  usuarioId: string;
  lugarId: string;
  origen: OrigenVisita;
  fotoUri: string | null;
  nota: string | null;
};

// En SQLite no hay true/false: "sincronizada" se guarda como 0 o 1.
type FilaVisita = Omit<Visita, 'sincronizada'> & { sincronizada: number };

const COLUMNAS = `id, usuario_id AS usuarioId, lugar_id AS lugarId, fecha_hora AS fechaHora,
  origen, foto_uri AS fotoUri, nota, sincronizada`;

function aVisita(fila: FilaVisita): Visita {
  return { ...fila, sincronizada: fila.sincronizada === 1 };
}

function generarId(): string {
  return `vis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Toda visita nueva queda "pendiente de subir" (sincronizada: false).
export async function crearVisita(datos: NuevaVisita): Promise<Visita> {
  const base = await obtenerBase();
  const nueva: Visita = {
    id: generarId(),
    ...datos,
    fechaHora: new Date().toISOString(),
    sincronizada: false,
  };
  await base.runAsync(
    `INSERT INTO visitas (id, usuario_id, lugar_id, fecha_hora, origen, foto_uri, nota, sincronizada)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    nueva.id,
    nueva.usuarioId,
    nueva.lugarId,
    nueva.fechaHora,
    nueva.origen,
    nueva.fotoUri,
    nueva.nota,
  );
  return nueva;
}

// Más nueva primero.
export async function listarVisitas(usuarioId: string): Promise<Visita[]> {
  const base = await obtenerBase();
  const filas = await base.getAllAsync<FilaVisita>(
    `SELECT ${COLUMNAS} FROM visitas WHERE usuario_id = ? ORDER BY fecha_hora DESC, rowid DESC`,
    usuarioId,
  );
  return filas.map(aVisita);
}

export async function listarVisitasPendientes(usuarioId: string): Promise<Visita[]> {
  const base = await obtenerBase();
  const filas = await base.getAllAsync<FilaVisita>(
    `SELECT ${COLUMNAS} FROM visitas WHERE usuario_id = ? AND sincronizada = 0
     ORDER BY fecha_hora DESC, rowid DESC`,
    usuarioId,
  );
  return filas.map(aVisita);
}

export async function marcarVisitaSubida(id: string): Promise<void> {
  const base = await obtenerBase();
  await base.runAsync('UPDATE visitas SET sincronizada = 1 WHERE id = ?', id);
}