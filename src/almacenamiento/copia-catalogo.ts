import type { Categoria, Lugar } from '@/tipos';

import { obtenerBase } from './base';

// COPIA DEL CATÁLOGO PARA USAR SIN SEÑAL (Integrante 2)
// La "puerta" de datos guarda acá lo último que recibió, y lo lee cuando no hay conexión.

type Tabla = 'lugares_copia' | 'categorias_copia';

// Reemplaza la copia anterior completa (así un lugar dado de baja no queda guardado).
async function reemplazarCopia(tabla: Tabla, elementos: { id: string }[]): Promise<void> {
  const base = await obtenerBase();
  await base.withTransactionAsync(async () => {
    await base.runAsync(`DELETE FROM ${tabla}`);
    for (const elemento of elementos) {
      await base.runAsync(
        `INSERT INTO ${tabla} (id, datos) VALUES (?, ?)`,
        elemento.id,
        JSON.stringify(elemento),
      );
    }
  });
}

// Devuelve null si nunca se guardó una copia.
async function leerCopia<T>(tabla: Tabla): Promise<T[] | null> {
  const base = await obtenerBase();
  const filas = await base.getAllAsync<{ datos: string }>(`SELECT datos FROM ${tabla} ORDER BY rowid`);
  return filas.length > 0 ? filas.map((fila) => JSON.parse(fila.datos) as T) : null;
}

export async function guardarCopiaLugares(lugares: Lugar[]): Promise<void> {
  await reemplazarCopia('lugares_copia', lugares);
}

export async function leerCopiaLugares(): Promise<Lugar[] | null> {
  return leerCopia<Lugar>('lugares_copia');
}

export async function leerCopiaLugar(id: string): Promise<Lugar | null> {
  const base = await obtenerBase();
  const fila = await base.getFirstAsync<{ datos: string }>(
    'SELECT datos FROM lugares_copia WHERE id = ?',
    id,
  );
  return fila ? (JSON.parse(fila.datos) as Lugar) : null;
}

export async function guardarCopiaCategorias(categorias: Categoria[]): Promise<void> {
  await reemplazarCopia('categorias_copia', categorias);
}

export async function leerCopiaCategorias(): Promise<Categoria[] | null> {
  return leerCopia<Categoria>('categorias_copia');
}
