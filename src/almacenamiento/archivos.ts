import type { Lugar } from '@/tipos';

// ARCHIVOS: FOTO DE VISITA Y LUGARES DESCARGADOS (Integrante 2)
// PIEZA PROVISORIA: no guarda archivos de verdad todavía.
// - guardarFotoVisita devuelve la misma ruta que recibe.
// - descargarLugar registra el lugar usando las direcciones de internet originales.
// Después se reemplaza por expo-file-system SIN cambiar los nombres de las funciones.

export type LugarDescargado = {
  lugarId: string;
  audioUri: string | null; // ruta del audio guardado (o null si el lugar no tiene audioguía)
  imagenes: string[]; // rutas de las fotos guardadas
  bytes: number; // lo que ocupa en el celular
};

let descargas: LugarDescargado[] = [];

// Recibe la ruta temporal de la cámara o galería y devuelve una ruta permanente.
export async function guardarFotoVisita(uriTemporal: string): Promise<string> {
  return uriTemporal;
}

export async function descargarLugar(lugar: Lugar): Promise<void> {
  const descarga: LugarDescargado = {
    lugarId: lugar.id,
    audioUri: lugar.audioguia?.url ?? null,
    imagenes: [...lugar.imagenes],
    bytes: 0,
  };
  descargas = [descarga, ...descargas.filter((d) => d.lugarId !== lugar.id)];
}

export async function obtenerDescarga(lugarId: string): Promise<LugarDescargado | null> {
  return descargas.find((d) => d.lugarId === lugarId) ?? null;
}

export async function eliminarDescarga(lugarId: string): Promise<void> {
  descargas = descargas.filter((d) => d.lugarId !== lugarId);
}

export async function listarDescargas(): Promise<LugarDescargado[]> {
  return descargas;
}