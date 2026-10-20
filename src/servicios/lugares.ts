import { categoriasMock } from '@/mocks/categorias';
import { lugaresMock } from '@/mocks/lugares';
import type { Categoria, Lugar } from '@/tipos';

import { ErrorServicio, simularRed, simularSinDatos } from './comun';

// "Puerta" de acceso a los datos de lugares.
// HOY: responde con datos de prueba.
// CUANDO LLEGUE LA API: se reemplaza el interior de cada función por un fetch.
// Las pantallas no cambian.

const PREFIJO_QR = 'COLON:';

export async function obtenerLugares(): Promise<Lugar[]> {
  await simularRed();
  if (simularSinDatos()) return [];
  return lugaresMock.filter((lugar) => lugar.activo);
}

export async function obtenerLugar(id: string): Promise<Lugar> {
  await simularRed();
  const lugar = simularSinDatos()
    ? undefined
    : lugaresMock.find((l) => l.id === id && l.activo);
  if (!lugar) throw new ErrorServicio('LUGAR_NO_ENCONTRADO');
  return lugar;
}

export async function obtenerCategorias(): Promise<Categoria[]> {
  await simularRed();
  if (simularSinDatos()) return [];
  return [...categoriasMock].sort((a, b) => a.orden - b.orden);
}

export async function buscarLugarPorQr(textoQr: string): Promise<Lugar> {
  // Un QR ajeno se detecta sin necesidad de red.
  if (!textoQr.startsWith(PREFIJO_QR)) throw new ErrorServicio('QR_INVALIDO');
  await simularRed();
  const lugar = simularSinDatos()
    ? undefined
    : lugaresMock.find((l) => l.codigoQr === textoQr && l.activo);
  if (!lugar) throw new ErrorServicio('LUGAR_NO_ENCONTRADO');
  return lugar;
}
