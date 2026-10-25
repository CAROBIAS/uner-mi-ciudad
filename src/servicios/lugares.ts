import {
  guardarCopiaCategorias,
  guardarCopiaLugares,
  leerCopiaCategorias,
  leerCopiaLugar,
  leerCopiaLugares,
} from '@/almacenamiento/copia-catalogo';
import type { Categoria, Lugar } from '@/tipos';

import { ErrorServicio, pedir, pedirTodos } from './comun';

// "Puerta" de acceso a los datos de lugares: pide a la API publicada.
// SIN SEÑAL (Integrante 2): cada respuesta se guarda como copia en el celular.
// Si no hay conexión, se devuelve esa copia. Si no hay copia, error SIN_CONEXION.

const PREFIJO_QR = 'COLON:';

function esSinConexion(error: unknown): boolean {
  return error instanceof ErrorServicio && error.codigo === 'SIN_CONEXION';
}

// Si falla guardar la copia, no debe fallar la pantalla.
async function intentarGuardar(guardar: () => Promise<void>): Promise<void> {
  try {
    await guardar();
  } catch (error) {
    console.warn('No se pudo guardar la copia para usar sin señal:', error);
  }
}

export async function obtenerLugares(): Promise<Lugar[]> {
  try {
    // La API ya devuelve solo los activos. Hasta 500 por página: todo el catálogo de una vez.
    const lugares = await pedirTodos<Lugar>('/lugares', { porPagina: 500 });
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
    const { datos } = await pedir<Lugar>(`/lugares/${encodeURIComponent(id)}`);
    // La API devuelve también los dados de baja: para la app no existen.
    if (!datos.activo) throw new ErrorServicio('LUGAR_NO_ENCONTRADO');
    return datos;
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
    const categorias = await pedirTodos<Categoria>('/categorias');
    const ordenadas = [...categorias].sort((a, b) => a.orden - b.orden);
    await intentarGuardar(() => guardarCopiaCategorias(ordenadas));
    return ordenadas;
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
  if (!textoQr.trim().startsWith(PREFIJO_QR)) throw new ErrorServicio('QR_INVALIDO');
  try {
    const { datos } = await pedir<Lugar>(`/lugares/qr/${encodeURIComponent(textoQr)}`);
    if (!datos.activo) throw new ErrorServicio('LUGAR_NO_ENCONTRADO');
    return datos;
  } catch (error) {
    // Con el formato correcto pero sin lugar, la API dice QR_NO_RECONOCIDO:
    // para la app es "no existe ese lugar" (como prometía el contrato).
    if (error instanceof ErrorServicio && error.codigo === 'QR_INVALIDO') {
      throw new ErrorServicio('LUGAR_NO_ENCONTRADO');
    }
    // Sin señal: el texto del QR ya trae el id del lugar, se busca en la copia guardada.
    if (esSinConexion(error)) {
      const texto = textoQr.trim();
      const copia = await leerCopiaLugar(texto.slice(PREFIJO_QR.length));
      if (copia && copia.codigoQr === texto) return copia;
    }
    throw error;
  }
}