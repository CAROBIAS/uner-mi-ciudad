import Storage from 'expo-sqlite/kv-store';

import type { Preferencias, Usuario } from '@/tipos';

// PREFERENCIAS Y DATOS DEL USUARIO (Integrante 2)
// Guardados con expo-sqlite/kv-store (sobreviven al cerrar la app).

const CLAVE_PREFERENCIAS = 'preferencias';
const CLAVE_USUARIO = 'usuario';

// Valores iniciales (documento de división, tarea 4.2).
export const PREFERENCIAS_INICIALES: Preferencias = {
  categoriasFavoritas: [],
  avisarProximidad: true,
  radioAvisoMetros: 250,
  tema: 'sistema',
};

export async function obtenerPreferencias(): Promise<Preferencias> {
  const texto = await Storage.getItem(CLAVE_PREFERENCIAS);
  if (!texto) return { ...PREFERENCIAS_INICIALES, categoriasFavoritas: [] };
  // Se mezcla con los iniciales por si falta algún dato guardado.
  return { ...PREFERENCIAS_INICIALES, ...(JSON.parse(texto) as Partial<Preferencias>) };
}

export async function guardarPreferencias(nuevas: Preferencias): Promise<void> {
  await Storage.setItem(CLAVE_PREFERENCIAS, JSON.stringify(nuevas));
}

// ---------- Datos del usuario que ingresó (tarea 4.3) ----------
// Solo nombre, email y datos públicos. NUNCA la contraseña ni el token:
// el token lo guarda el Integrante 3 en el almacenamiento seguro.

export async function guardarUsuario(usuario: Usuario): Promise<void> {
  await Storage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

export async function obtenerUsuarioGuardado(): Promise<Usuario | null> {
  const texto = await Storage.getItem(CLAVE_USUARIO);
  return texto ? (JSON.parse(texto) as Usuario) : null;
}

export async function borrarUsuarioGuardado(): Promise<void> {
  await Storage.removeItem(CLAVE_USUARIO);
}