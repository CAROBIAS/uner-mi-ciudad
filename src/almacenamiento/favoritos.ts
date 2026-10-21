import type { Favorito } from '@/tipos';

import { obtenerBase } from './base';

// FAVORITOS (Integrante 2) — guardados en SQLite (sobreviven al cerrar la app).

const COLUMNAS = 'id, usuario_id AS usuarioId, lugar_id AS lugarId, creado_en AS creadoEn';

function generarId(): string {
  return `fav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function agregarFavorito(usuarioId: string, lugarId: string): Promise<Favorito> {
  const base = await obtenerBase();
  // Si ya existía, no lo duplica (UNIQUE en la tabla).
  await base.runAsync(
    'INSERT OR IGNORE INTO favoritos (id, usuario_id, lugar_id, creado_en) VALUES (?, ?, ?, ?)',
    generarId(),
    usuarioId,
    lugarId,
    new Date().toISOString(),
  );
  const favorito = await base.getFirstAsync<Favorito>(
    `SELECT ${COLUMNAS} FROM favoritos WHERE usuario_id = ? AND lugar_id = ?`,
    usuarioId,
    lugarId,
  );
  if (!favorito) throw new Error('No se pudo guardar el favorito.');
  return favorito;
}

export async function quitarFavorito(usuarioId: string, lugarId: string): Promise<void> {
  const base = await obtenerBase();
  await base.runAsync('DELETE FROM favoritos WHERE usuario_id = ? AND lugar_id = ?', usuarioId, lugarId);
}

export async function esFavorito(usuarioId: string, lugarId: string): Promise<boolean> {
  const base = await obtenerBase();
  const fila = await base.getFirstAsync(
    'SELECT 1 FROM favoritos WHERE usuario_id = ? AND lugar_id = ?',
    usuarioId,
    lugarId,
  );
  return fila !== null;
}

// Más nuevo primero.
export async function listarFavoritos(usuarioId: string): Promise<Favorito[]> {
  const base = await obtenerBase();
  return base.getAllAsync<Favorito>(
    `SELECT ${COLUMNAS} FROM favoritos WHERE usuario_id = ? ORDER BY creado_en DESC, rowid DESC`,
    usuarioId,
  );
}