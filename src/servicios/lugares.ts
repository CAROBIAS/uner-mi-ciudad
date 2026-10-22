import {
  guardarCopiaCategorias,
  guardarCopiaLugares,
  leerCopiaCategorias,
  leerCopiaLugar,
  leerCopiaLugares,
} from '@/almacenamiento/copia-catalogo';
import { categoriasMock } from '@/mocks/categorias';
import { lugaresMock } from '@/mocks/lugares';
import type { Categoria, Lugar } from '@/tipos';

import { ErrorServicio, simularRed, simularSinDatos } from './comun';

// "Puerta" de acceso a los datos de lugares.
// HOY: responde con datos de prueba.
// CUANDO LLEGUE LA API: se reemplaza el interior de cada función por un fetch.
// Las pantallas no cambian.
//
// SIN SEÑAL (Integrante 2): cada respuesta se guarda como copia en el celular.
// Si no hay conexión, se devuelve esa copia. Si no hay copia, error SIN_CONEXION.

const PREFIJO_QR = 'COLON:';

function esSinConexion(error: unknown): boolean {
  return error instanceof ErrorServicio && error.codigo === 'SIN_CONEXION';
}

// Si falla guardar la copia, no debe fallar la pantalla: solo se pierde la copia esta vez.
async function intentarGuardar(guardar: () => Promise<void>): Promise<void> {
  try {
    await guardar();
  } catch (error) {
    // La pantalla sigue funcionando, pero el problema queda visible en la terminal.
    console.warn('No se pudo guardar la copia para usar sin señal:', error);
  }
}

export async function obtenerLugares(): Promise<Lugar[]> {
  try {
    await simularRed();
    if (simularSinDatos()) return [];
    const lugares = lugaresMock.filter((lugar) => lugar.activo);
    await intentarGuardar(() => guardarCopiaLugares(lugares));
    return lugares;
  } catch (error) {
    if (esSinConexion(error)) {
      const copia = await leerCopiaLugares();
      if (copia) return copia;
    }
    throw error;
  }
}

export async function obtenerLugar(id: string): Promise<Lugar> {
  try {
    await simularRed();
    const lugar = simularSinDatos()
      ? undefined
      : lugaresMock.find((l) => l.id === id && l.activo);
    if (!lugar) throw new ErrorServicio('LUGAR_NO_ENCONTRADO');
    return lugar;
  } catch (error) {
    if (esSinConexion(error)) {
      const copia = await leerCopiaLugar(id);
      if (copia) return copia;
    }
    throw error;
  }
}

export async function obtenerCategorias(): Promise<Categoria[]> {
  try {
    await simularRed();
    if (simularSinDatos()) return [];
    const categorias = [...categoriasMock].sort((a, b) => a.orden - b.orden);
    await intentarGuardar(() => guardarCopiaCategorias(categorias));
    return categorias;
  } catch (error) {
    if (esSinConexion(error)) {
      const copia = await leerCopiaCategorias();
      if (copia) return copia;
    }
    throw error;
  }
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