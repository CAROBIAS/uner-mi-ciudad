import type { Favorito, Visita } from '@/tipos';

import { ErrorServicio, pedir, pedirTodos } from './comun';
import { obtenerToken } from './sesion';

// "PUERTA" PARA LOS DATOS DE LA CUENTA (Integrante 2, tareas 8 y 9)
// Favoritos y visitas que se guardan en la API, asociados al usuario que ingresó.
// Según la cátedra, tienen que poder recuperarse al cambiar de teléfono.
// Todas necesitan sesión: si no hay token, lanzan NO_AUTORIZADO.

async function token(): Promise<string> {
  const guardado = await obtenerToken();
  if (!guardado) throw new ErrorServicio('NO_AUTORIZADO');
  return guardado;
}

// ---------- Favoritos ----------

export async function obtenerFavoritosRemotos(): Promise<Favorito[]> {
  return pedirTodos<Favorito>('/yo/favoritos', {}, { token: await token() });
}

// Si ya era favorito, la API no lo duplica.
export async function marcarFavoritoRemoto(lugarId: string): Promise<void> {
  await pedir<Favorito>(`/yo/favoritos/${encodeURIComponent(lugarId)}`, undefined, {
    metodo: 'PUT',
    token: await token(),
  });
}

// Si no estaba, la API responde bien igual.
export async function quitarFavoritoRemoto(lugarId: string): Promise<void> {
  await pedir<null>(`/yo/favoritos/${encodeURIComponent(lugarId)}`, undefined, {
    metodo: 'DELETE',
    token: await token(),
  });
}

// ---------- Visitas ----------

export async function obtenerVisitasRemotas(): Promise<Visita[]> {
  return pedirTodos<Visita>('/yo/visitas', { porPagina: 500 }, { token: await token() });
}

// Sube la foto guardada en el celular y devuelve la dirección web que da la API.
export async function subirFoto(uriLocal: string): Promise<string> {
  const extension = (/\.(jpg|jpeg|png|webp)$/i.exec(uriLocal)?.[1] ?? 'jpg').toLowerCase();
  const tipo = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  const formulario = new FormData();
  // En React Native, un archivo del celular se agrega con { uri, name, type }.
  formulario.append('archivo', { uri: uriLocal, name: `foto.${extension}`, type: tipo } as unknown as Blob);
  const { datos } = await pedir<{ url: string }>('/archivos', undefined, {
    metodo: 'POST',
    cuerpo: formulario,
    token: await token(),
  });
  return datos.url;
}

// Registra la visita en la API con el mismo id que tiene en el celular:
// si se manda dos veces, la API no la duplica.
export async function subirVisita(visita: Visita, fotoUrl: string | null): Promise<void> {
  await pedir<Visita>('/yo/visitas', undefined, {
    metodo: 'POST',
    token: await token(),
    cuerpo: {
      id: visita.id,
      lugarId: visita.lugarId,
      fechaHora: visita.fechaHora,
      origen: visita.origen,
      fotoUri: fotoUrl,
      nota: visita.nota,
    },
  });
}