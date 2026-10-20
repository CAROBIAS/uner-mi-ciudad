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

// El token queda en memoria hasta el paso de expo-secure-store
let tokenActual: string | null = null;

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

  tokenActual = cuenta.token;
  return { usuario: cuenta.usuario, token: cuenta.token };
}

export async function cerrarSesion(): Promise<void> {
  tokenActual = null;
}

export async function obtenerToken(): Promise<string | null> {
  return tokenActual;
}