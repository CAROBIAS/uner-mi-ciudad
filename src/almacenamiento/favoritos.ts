import type { Favorito } from '@/tipos';

// FAVORITOS (Integrante 2)
// PIEZA PROVISORIA: guarda en memoria mientras la app está abierta (se borra al cerrarla).
// Después se reemplaza por SQLite SIN cambiar los nombres de las funciones.

let favoritos: Favorito[] = [];

function generarId(): string {
  return `fav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function agregarFavorito(usuarioId: string, lugarId: string): Promise<Favorito> {
  const existente = favoritos.find((f) => f.usuarioId === usuarioId && f.lugarId === lugarId);
  if (existente) return existente;

  const nuevo: Favorito = {
    id: generarId(),
    usuarioId,
    lugarId,
    creadoEn: new Date().toISOString(),
  };
  favoritos = [...favoritos, nuevo];
  return nuevo;
}

export async function quitarFavorito(usuarioId: string, lugarId: string): Promise<void> {
  favoritos = favoritos.filter((f) => !(f.usuarioId === usuarioId && f.lugarId === lugarId));
}

export async function esFavorito(usuarioId: string, lugarId: string): Promise<boolean> {
  return favoritos.some((f) => f.usuarioId === usuarioId && f.lugarId === lugarId);
}

// Más nuevo primero.
export async function listarFavoritos(usuarioId: string): Promise<Favorito[]> {
  return favoritos
    .filter((f) => f.usuarioId === usuarioId)
    .sort((a, b) => Date.parse(b.creadoEn) - Date.parse(a.creadoEn));
}