import type { OrigenVisita, Visita } from '@/tipos';

// VISITAS (Integrante 2)
// PIEZA PROVISORIA: guarda en memoria (se borra al cerrar la app).
// Después se reemplaza por SQLite SIN cambiar los nombres de las funciones.

// Lo que hay que pasar para crear una visita. El resto lo completa esta función.
export type NuevaVisita = {
  usuarioId: string;
  lugarId: string;
  origen: OrigenVisita;
  fotoUri: string | null;
  nota: string | null;
};

// Se guardan con la más nueva primero.
let visitas: Visita[] = [];

function generarId(): string {
  return `vis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Toda visita nueva queda "pendiente de subir" (sincronizada: false).
export async function crearVisita(datos: NuevaVisita): Promise<Visita> {
  const nueva: Visita = {
    id: generarId(),
    ...datos,
    fechaHora: new Date().toISOString(),
    sincronizada: false,
  };
  visitas = [nueva, ...visitas];
  return nueva;
}

// Más nueva primero.
export async function listarVisitas(usuarioId: string): Promise<Visita[]> {
  return visitas.filter((v) => v.usuarioId === usuarioId);
}

export async function listarVisitasPendientes(usuarioId: string): Promise<Visita[]> {
  return visitas.filter((v) => v.usuarioId === usuarioId && !v.sincronizada);
}

export async function marcarVisitaSubida(id: string): Promise<void> {
  visitas = visitas.map((v) => (v.id === id ? { ...v, sincronizada: true } : v));
}
