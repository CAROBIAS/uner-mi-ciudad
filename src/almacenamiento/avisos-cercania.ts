import { obtenerBase } from './base';

// AVISOS DE CERCANÍA YA ENVIADOS (Integrante 2) — guardados en SQLite.
// Sirve para no avisar dos veces el mismo día del mismo lugar.

// Fecha de hoy en Argentina ("AAAA-MM-DD"), sin importar la zona horaria del celular.
function fechaDeHoy(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function yaSeAvisoHoy(lugarId: string): Promise<boolean> {
  const base = await obtenerBase();
  const fila = await base.getFirstAsync(
    'SELECT 1 FROM avisos_cercania WHERE lugar_id = ? AND fecha = ?',
    lugarId,
    fechaDeHoy(),
  );
  return fila !== null;
}

export async function registrarAviso(lugarId: string): Promise<void> {
  const base = await obtenerBase();
  await base.runAsync(
    'INSERT OR IGNORE INTO avisos_cercania (lugar_id, fecha) VALUES (?, ?)',
    lugarId,
    fechaDeHoy(),
  );
}