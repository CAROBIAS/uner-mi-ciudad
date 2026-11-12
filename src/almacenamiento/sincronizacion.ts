import { ErrorServicio } from '@/servicios/comun';
import {
  marcarFavoritoRemoto,
  obtenerFavoritosRemotos,
  obtenerVisitasRemotas,
  subirFoto,
  subirVisita,
} from '@/servicios/mis-datos';

import { guardarFavoritoDescargado, listarFavoritos } from './favoritos';
import {
  guardarVisitaDescargada,
  listarVisitasPendientes,
  marcarVisitaSubida,
} from './visitas';

// SINCRONIZAR CON LA CUENTA (Integrante 2, tareas 8 y 9)
// 1. Sube las visitas "pendientes de subir" (con su foto, si tiene).
// 2. Si se pide, baja los favoritos y las visitas que el usuario tiene en la API
//    (por ejemplo, al ingresar en un teléfono nuevo) y sube los favoritos que solo
//    estaban en este celular.
// Sin conexión o sin sesión, corta y lanza el error: se reintenta en la próxima ocasión.

function esErrorQueCorta(error: unknown): boolean {
  return (
    error instanceof ErrorServicio &&
    (error.codigo === 'SIN_CONEXION' || error.codigo === 'NO_AUTORIZADO')
  );
}

async function subirVisitasPendientes(usuarioId: string): Promise<void> {
  const pendientes = await listarVisitasPendientes(usuarioId);
  // De la más vieja a la más nueva.
  for (const visita of [...pendientes].reverse()) {
    try {
      // Una foto del celular empieza con "file:". Si ya es una dirección web, ya estaba subida.
      const fotoUrl =
        visita.fotoUri && visita.fotoUri.startsWith('file:')
          ? await subirFoto(visita.fotoUri)
          : visita.fotoUri;
      await subirVisita(visita, fotoUrl);
      await marcarVisitaSubida(visita.id);
    } catch (error) {
      if (esErrorQueCorta(error)) throw error;
      // Otro problema con esta visita: queda pendiente y se sigue con las demás.
      if (__DEV__) console.warn('No se pudo subir la visita', visita.id, error);
    }
  }
}

async function bajarFavoritos(usuarioId: string): Promise<void> {
  const remotos = await obtenerFavoritosRemotos();
  const locales = await listarFavoritos(usuarioId);
  const enLaCuenta = new Set(remotos.map((favorito) => favorito.lugarId));

  for (const favorito of remotos) {
    await guardarFavoritoDescargado({ ...favorito, usuarioId });
  }
  // Los que se marcaron en este celular sin conexión, se suben ahora.
  for (const favorito of locales) {
    if (!enLaCuenta.has(favorito.lugarId)) await marcarFavoritoRemoto(favorito.lugarId);
  }
}

async function bajarVisitas(usuarioId: string): Promise<void> {
  const remotas = await obtenerVisitasRemotas();
  for (const visita of remotas) {
    await guardarVisitaDescargada({ ...visita, usuarioId });
  }
}

export async function sincronizar(usuarioId: string, bajarDeLaCuenta: boolean): Promise<void> {
  await subirVisitasPendientes(usuarioId);
  if (bajarDeLaCuenta) {
    await bajarFavoritos(usuarioId);
    await bajarVisitas(usuarioId);
  }
}