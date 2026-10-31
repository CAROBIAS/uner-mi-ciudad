import * as SecureStore from 'expo-secure-store';

import type { Usuario } from '@/tipos';

import { pedir } from './comun';

// El token va a almacenamiento seguro del sistema, nunca a kv-store
const CLAVE_TOKEN = 'token-sesion';

export type Sesion = {
  usuario: Usuario;
  token: string;
};

export async function ingresar(email: string, contrasena: string): Promise<Sesion> {
  const { datos } = await pedir<Sesion>('/auth/ingreso', undefined, {
    metodo: 'POST',
    cuerpo: { email: email.trim(), contrasena },
  });

  await SecureStore.setItemAsync(CLAVE_TOKEN, datos.token);
  return datos;
}

export async function cerrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE_TOKEN);
}

export async function obtenerToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_TOKEN);
}