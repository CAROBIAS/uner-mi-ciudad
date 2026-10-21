import type { Preferencias, Usuario } from '@/tipos';

// PREFERENCIAS Y DATOS DEL USUARIO (Integrante 2)
// PIEZA PROVISORIA: guarda en memoria (se borra al cerrar la app).
// Después se reemplaza por expo-sqlite/kv-store SIN cambiar los nombres de las funciones.

// Valores iniciales (documento de división, tarea 4.2).
export const PREFERENCIAS_INICIALES: Preferencias = {
  categoriasFavoritas: [],
  avisarProximidad: true,
  radioAvisoMetros: 250,
  tema: 'sistema',
};

let preferencias: Preferencias = { ...PREFERENCIAS_INICIALES };

export async function obtenerPreferencias(): Promise<Preferencias> {
  return { ...preferencias, categoriasFavoritas: [...preferencias.categoriasFavoritas] };
}

export async function guardarPreferencias(nuevas: Preferencias): Promise<void> {
  preferencias = { ...nuevas, categoriasFavoritas: [...nuevas.categoriasFavoritas] };
}

// ---------- Datos del usuario que ingresó (tarea 4.3) ----------
// Solo nombre, email y datos públicos. NUNCA la contraseña ni el token:
// el token lo guarda el Integrante 3 en el almacenamiento seguro.

let usuarioGuardado: Usuario | null = null;

export async function guardarUsuario(usuario: Usuario): Promise<void> {
  usuarioGuardado = usuario;
}

export async function obtenerUsuarioGuardado(): Promise<Usuario | null> {
  return usuarioGuardado;
}

export async function borrarUsuarioGuardado(): Promise<void> {
  usuarioGuardado = null;
}
