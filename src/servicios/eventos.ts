import type { Evento } from '@/tipos';

import { pedir, pedirTodos } from './comun';

// "Puerta" de acceso a los datos de eventos: pide a la API publicada.

// Día en Argentina ("AAAA-MM-DD") de un instante ISO. La API filtra por días.
function diaArgentina(iso: string): string {
  return new Date(Date.parse(iso) - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// desde y hasta: fechas en texto ISO 8601 (regla del PRD).
// Devuelve los eventos que EMPIEZAN entre esas dos fechas, ordenados por inicio.
export async function obtenerEventos(desde: string, hasta: string): Promise<Evento[]> {
  const eventos = await pedirTodos<Evento>('/eventos', {
    desde: diaArgentina(desde),
    hasta: diaArgentina(hasta),
  });
  const desdeMs = Date.parse(desde);
  const hastaMs = Date.parse(hasta);
  return eventos
    .filter((evento) => {
      const inicioMs = Date.parse(evento.inicio);
      return inicioMs >= desdeMs && inicioMs <= hastaMs;
    })
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
}

export async function obtenerEvento(id: string): Promise<Evento> {
  const { datos } = await pedir<Evento>(`/eventos/${encodeURIComponent(id)}`);
  return datos;
}