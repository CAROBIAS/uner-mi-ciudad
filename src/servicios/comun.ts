import { DEMORA_MS, MODO_SIMULACION } from '@/mocks/simulacion';

// Errores con nombre claro que pueden devolver los servicios.
export type CodigoError =
  | 'SIN_CONEXION'
  | 'LUGAR_NO_ENCONTRADO'
  | 'EVENTO_NO_ENCONTRADO'
  | 'QR_INVALIDO'
  | 'NO_AUTORIZADO';

const MENSAJES: Record<CodigoError, string> = {
  SIN_CONEXION: 'No hay conexión a internet.',
  LUGAR_NO_ENCONTRADO: 'No existe ese lugar.',
  EVENTO_NO_ENCONTRADO: 'No existe ese evento.',
  QR_INVALIDO: 'Este código QR no es de Mi Ciudad Colón.',
  NO_AUTORIZADO: 'Tenés que volver a ingresar.',
};

// Error que lanzan los servicios. Se distingue por su "codigo".
export class ErrorServicio extends Error {
  codigo: CodigoError;

  constructor(codigo: CodigoError) {
    super(MENSAJES[codigo]);
    this.name = 'ErrorServicio';
    this.codigo = codigo;
  }
}

// Simula la demora de la red y el modo "sin conexión" (ver src/mocks/simulacion.ts).
export async function simularRed(): Promise<void> {
  await new Promise((resolver) => setTimeout(resolver, DEMORA_MS));
  if (MODO_SIMULACION === 'sinConexion') {
    throw new ErrorServicio('SIN_CONEXION');
  }
}

// Indica si está activo el modo "sin datos".
export function simularSinDatos(): boolean {
  return MODO_SIMULACION === 'sinDatos';
}