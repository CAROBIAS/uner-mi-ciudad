import type { EstadoEvento } from '@/tipos';

// EVENTOS GUARDADOS (Integrante 2)
// PIEZA PROVISORIA: guarda en memoria (se borra al cerrar la app).
// Después se reemplaza por SQLite SIN cambiar los nombres de las funciones.

export type EventoGuardado = {
  usuarioId: string;
  eventoId: string;
  recordatorioId: string | null; // id del aviso programado (Integrante 6), para poder cancelarlo
  estado: EstadoEvento;
  guardadoEn: string;
};

let guardados: EventoGuardado[] = [];

function esDe(g: EventoGuardado, usuarioId: string, eventoId: string): boolean {
  return g.usuarioId === usuarioId && g.eventoId === eventoId;
}

// Si ya estaba guardado, lo reemplaza.
export async function guardarEvento(
  usuarioId: string,
  eventoId: string,
  recordatorioId: string | null,
  estado: EstadoEvento,
): Promise<EventoGuardado> {
  const nuevo: EventoGuardado = {
    usuarioId,
    eventoId,
    recordatorioId,
    estado,
    guardadoEn: new Date().toISOString(),
  };
  guardados = [nuevo, ...guardados.filter((g) => !esDe(g, usuarioId, eventoId))];
  return nuevo;
}

export async function quitarEventoGuardado(usuarioId: string, eventoId: string): Promise<void> {
  guardados = guardados.filter((g) => !esDe(g, usuarioId, eventoId));
}

// Sirve para saber si mostrar "Guardar" o "Quitar", y para obtener el recordatorioId.
export async function obtenerEventoGuardado(
  usuarioId: string,
  eventoId: string,
): Promise<EventoGuardado | null> {
  return guardados.find((g) => esDe(g, usuarioId, eventoId)) ?? null;
}

export async function listarEventosGuardados(usuarioId: string): Promise<EventoGuardado[]> {
  return guardados.filter((g) => g.usuarioId === usuarioId);
}

export async function actualizarEstadoEventoGuardado(
  usuarioId: string,
  eventoId: string,
  estado: EstadoEvento,
): Promise<void> {
  guardados = guardados.map((g) => (esDe(g, usuarioId, eventoId) ? { ...g, estado } : g));
}
