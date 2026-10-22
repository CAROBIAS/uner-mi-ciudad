import { Directory, File, Paths } from 'expo-file-system';

import type { Lugar } from '@/tipos';

// ARCHIVOS: FOTO DE VISITA Y LUGARES DESCARGADOS (Integrante 2) — usa expo-file-system.
//
// Carpetas (dentro de la carpeta de documentos de la app, que el sistema no borra):
//   fotos-visitas/                 fotos de las visitas
//   descargas/<lugarId>/audio.mp3  audioguía del lugar (si tiene)
//   descargas/<lugarId>/imagen-0.jpg, imagen-1.jpg...   fotos del lugar

export type LugarDescargado = {
  lugarId: string;
  audioUri: string | null; // ruta del audio guardado (o null si el lugar no tiene audioguía)
  imagenes: string[]; // rutas de las fotos guardadas, en orden
  bytes: number; // lo que ocupa en el celular
};

function carpetaFotos(): Directory {
  return new Directory(Paths.document, 'fotos-visitas');
}

function carpetaDescargas(): Directory {
  return new Directory(Paths.document, 'descargas');
}

function carpetaLugar(lugarId: string): Directory {
  return new Directory(carpetaDescargas(), lugarId);
}

// Toma la extensión de una ruta o dirección web. Si no tiene una conocida, usa la indicada.
function extensionDe(texto: string, porDefecto: string): string {
  const coincidencia = /\.(jpg|jpeg|png|webp|mp3|m4a|aac|wav)(\?|$)/i.exec(texto);
  return coincidencia ? `.${coincidencia[1].toLowerCase()}` : porDefecto;
}

// "imagen-3.jpg" → 3 (para ordenar las fotos correctamente).
function numeroDeImagen(nombre: string): number {
  return Number(nombre.replace('imagen-', '').split('.')[0]);
}

// ---------- Foto de visita (tarea 7.2) ----------

// Recibe la ruta temporal de la cámara o galería y devuelve una ruta permanente.
export async function guardarFotoVisita(uriTemporal: string): Promise<string> {
  const carpeta = carpetaFotos();
  carpeta.create({ intermediates: true, idempotent: true });
  const origen = new File(uriTemporal);
  const destino = new File(carpeta, `foto-${Date.now()}${extensionDe(uriTemporal, '.jpg')}`);
  await origen.copy(destino);
  return destino.uri;
}

// ---------- Lugares descargados (tareas 7.3 a 7.6) ----------

// Necesita internet. Si falla a la mitad, borra lo bajado y avisa con un error.
export async function descargarLugar(lugar: Lugar): Promise<void> {
  const carpeta = carpetaLugar(lugar.id);
  carpeta.create({ intermediates: true, idempotent: true });
  try {
    if (lugar.audioguia) {
      const url = lugar.audioguia.url;
      await File.downloadFileAsync(url, new File(carpeta, `audio${extensionDe(url, '.mp3')}`), {
        idempotent: true,
      });
    }
    for (let i = 0; i < lugar.imagenes.length; i++) {
      const url = lugar.imagenes[i];
      await File.downloadFileAsync(url, new File(carpeta, `imagen-${i}${extensionDe(url, '.jpg')}`), {
        idempotent: true,
      });
    }
  } catch (error) {
    if (carpeta.exists) carpeta.delete();
    throw error;
  }
}

// Funciona sin señal: lee lo que ya está guardado en el celular.
export async function obtenerDescarga(lugarId: string): Promise<LugarDescargado | null> {
  const carpeta = carpetaLugar(lugarId);
  if (!carpeta.exists) return null;

  const archivos = carpeta.list().filter((item): item is File => item instanceof File);
  const audio = archivos.find((archivo) => archivo.name.startsWith('audio'));
  const imagenes = archivos
    .filter((archivo) => archivo.name.startsWith('imagen-'))
    .sort((a, b) => numeroDeImagen(a.name) - numeroDeImagen(b.name))
    .map((archivo) => archivo.uri);
  const bytes = archivos.reduce((total, archivo) => total + archivo.size, 0);

  return { lugarId, audioUri: audio?.uri ?? null, imagenes, bytes };
}

export async function eliminarDescarga(lugarId: string): Promise<void> {
  const carpeta = carpetaLugar(lugarId);
  if (carpeta.exists) carpeta.delete();
}

export async function listarDescargas(): Promise<LugarDescargado[]> {
  const raiz = carpetaDescargas();
  if (!raiz.exists) return [];
  const ids = raiz
    .list()
    .filter((item): item is Directory => item instanceof Directory)
    .map((carpeta) => carpeta.name);
  const descargas = await Promise.all(ids.map((id) => obtenerDescarga(id)));
  return descargas.filter((d): d is LugarDescargado => d !== null);
}