import * as SecureStore from 'expo-secure-store';

import type { CuentaPrueba } from '@/mocks/usuarios';
import { cuentasPrueba } from '@/mocks/usuarios';
import type { Usuario } from '@/tipos';

import { simularRed } from './comun';

// Mismo formato que ErrorServicio
export type CodigoErrorSesion = 'CREDENCIALES_INVALIDAS';

const MENSAJES: Record<CodigoErrorSesion, string> = {
  CREDENCIALES_INVALIDAS: 'El email o la contraseña no son correctos.',
};

export class ErrorSesion extends Error {
  codigo: CodigoErrorSesion;

  constructor(codigo: CodigoErrorSesion) {
    super(MENSAJES[codigo]);
    this.name = 'ErrorSesion';
    this.codigo = codigo;
  }
}

export type Sesion = {
  usuario: Usuario;
  token: string;
};

// El token va a almacenamiento seguro del sistema, nunca a kv-store
const CLAVE_TOKEN = 'token-sesion';

function buscarCuenta(email: string, contrasena: string): CuentaPrueba | undefined {
  const correo = email.trim().toLowerCase();
  return cuentasPrueba.find(
    (cuenta) => cuenta.email.toLowerCase() === correo && cuenta.contrasena === contrasena,
  );
}

export async function ingresar(email: string, contrasena: string): Promise<Sesion> {
  await simularRed();

  const cuenta = buscarCuenta(email, contrasena);
  if (!cuenta) throw new ErrorSesion('CREDENCIALES_INVALIDAS');

  await SecureStore.setItemAsync(CLAVE_TOKEN, cuenta.token);
  return { usuario: cuenta.usuario, token: cuenta.token };
}

export async function cerrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE_TOKEN);
}

export async function obtenerToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_TOKEN);
}