import { eventosMock } from '@/mocks/eventos';
import type { Evento } from '@/tipos';

import { ErrorServicio, simularRed, simularSinDatos } from './comun';

// "Puerta" de acceso a los datos de eventos.
// HOY: responde con datos de prueba. CUANDO LLEGUE LA API: se reemplaza por un fetch.

// desde y hasta: fechas en texto ISO 8601 (regla del PRD).
// Devuelve los eventos que EMPIEZAN entre esas dos fechas, ordenados por inicio.
export async function obtenerEventos(desde: string, hasta: string): Promise<Evento[]> {
  await simularRed();
  if (simularSinDatos()) return [];
  const desdeMs = Date.parse(desde);
  const hastaMs = Date.parse(hasta);
  return eventosMock
    .filter((evento) => {
      const inicioMs = Date.parse(evento.inicio);
      return inicioMs >= desdeMs && inicioMs <= hastaMs;
    })
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
}

export async function obtenerEvento(id: string): Promise<Evento> {
  await simularRed();
  const evento = simularSinDatos() ? undefined : eventosMock.find((e) => e.id === id);
  if (!evento) throw new ErrorServicio('EVENTO_NO_ENCONTRADO');
  return evento;
}
