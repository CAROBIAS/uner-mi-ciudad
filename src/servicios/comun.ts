import { hayInternet } from '@/almacenamiento/red';

import { URL_API } from './config';

// Errores con nombre claro que pueden devolver los servicios.
export type CodigoError =
  | 'SIN_CONEXION'
  | 'LUGAR_NO_ENCONTRADO'
  | 'EVENTO_NO_ENCONTRADO'
  | 'QR_INVALIDO'
  | 'NO_AUTORIZADO'
  | 'CREDENCIALES_INVALIDAS'
  | 'EMAIL_YA_REGISTRADO'
  | 'VALIDACION_FALLIDA'
  | 'ERROR_DESCONOCIDO';

// Mensajes por defecto. Si la API manda su propio mensaje, se usa el de la API.
const MENSAJES: Record<CodigoError, string> = {
  SIN_CONEXION: 'No hay conexión a internet.',
  LUGAR_NO_ENCONTRADO: 'No existe ese lugar.',
  EVENTO_NO_ENCONTRADO: 'No existe ese evento.',
  QR_INVALIDO: 'Este código QR no es de Mi Ciudad Colón.',
  NO_AUTORIZADO: 'Tenés que volver a ingresar.',
  CREDENCIALES_INVALIDAS: 'El email o la contraseña no son correctos.',
  EMAIL_YA_REGISTRADO: 'Ya hay una cuenta con ese email.',
  VALIDACION_FALLIDA: 'Revisá los datos que cargaste.',
  ERROR_DESCONOCIDO: 'Ocurrió un error. Probá de nuevo más tarde.',
};

// Error que lanzan los servicios. Se distingue por su "codigo".
export class ErrorServicio extends Error {
  codigo: CodigoError;

  constructor(codigo: CodigoError, mensaje?: string) {
    super(mensaje ?? MENSAJES[codigo]);
    this.name = 'ErrorServicio';
    this.codigo = codigo;
  }
}

// Códigos de error de la API → los nuestros (así las pantallas no cambian).
const TRADUCCION: Record<string, CodigoError> = {
  LUGAR_NO_ENCONTRADO: 'LUGAR_NO_ENCONTRADO',
  EVENTO_NO_ENCONTRADO: 'EVENTO_NO_ENCONTRADO',
  QR_NO_RECONOCIDO: 'QR_INVALIDO',
  NO_AUTENTICADO: 'NO_AUTORIZADO',
  CREDENCIALES_INVALIDAS: 'CREDENCIALES_INVALIDAS',
  EMAIL_YA_REGISTRADO: 'EMAIL_YA_REGISTRADO',
  VALIDACION_FALLIDA: 'VALIDACION_FALLIDA',
};

// Render gratis puede tardar cerca de un minuto en "despertar".
const ESPERA_MAXIMA_MS = 75_000;

type Meta = { total: number; pagina: number; porPagina: number };

// El "sobre" en el que la API manda cada respuesta.
export type Sobre<T> = { datos: T; meta: Meta | null };

// Opciones para los pedidos que envían datos o necesitan cuenta (tarea 4.4).
export type OpcionesPedido = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; // por defecto GET
  cuerpo?: unknown; // se envía como JSON (o tal cual si es FormData, para subir fotos)
  token?: string | null; // el de obtenerToken() de '@/servicios/sesion', para lo que pide cuenta
};

function armarConsulta(parametros?: Record<string, string | number>): string {
  if (!parametros) return '';
  const partes = Object.entries(parametros).map(
    ([clave, valor]) => `${encodeURIComponent(clave)}=${encodeURIComponent(String(valor))}`,
  );
  return partes.length > 0 ? `?${partes.join('&')}` : '';
}

// Hace un pedido a la API y devuelve el "sobre". Traduce cualquier falla a ErrorServicio.
export async function pedir<T>(
  ruta: string,
  parametros?: Record<string, string | number>,
  opciones: OpcionesPedido = {},
): Promise<Sobre<T>> {
  if (!(await hayInternet())) throw new ErrorServicio('SIN_CONEXION');

  const encabezados: Record<string, string> = { Accept: 'application/json' };
  let cuerpo: BodyInit | undefined;
  if (opciones.cuerpo instanceof FormData) {
    cuerpo = opciones.cuerpo; // fotos: el tipo lo arma fetch solo
  } else if (opciones.cuerpo !== undefined) {
    encabezados['Content-Type'] = 'application/json';
    cuerpo = JSON.stringify(opciones.cuerpo);
  }
  if (opciones.token) encabezados.Authorization = `Bearer ${opciones.token}`;

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), ESPERA_MAXIMA_MS);
  let respuesta: Response;
  try {
    respuesta = await fetch(`${URL_API}${ruta}${armarConsulta(parametros)}`, {
      method: opciones.metodo ?? 'GET',
      headers: encabezados,
      body: cuerpo,
      signal: controlador.signal,
    });
  } catch {
    // Sin red, o la API no respondió a tiempo.
    throw new ErrorServicio('SIN_CONEXION');
  } finally {
    clearTimeout(temporizador);
  }

  if (!respuesta.ok) {
    let codigoApi: string | undefined;
    let mensajeApi: string | undefined;
    try {
      const cuerpoError = await respuesta.json();
      codigoApi = cuerpoError?.error?.codigo;
      mensajeApi = cuerpoError?.error?.mensaje;
    } catch {
      // La respuesta de error no traía el formato esperado.
    }
    const codigo: CodigoError = (codigoApi !== undefined && TRADUCCION[codigoApi]) || 'ERROR_DESCONOCIDO';
    throw new ErrorServicio(codigo, mensajeApi);
  }

  // 204: respuesta sin contenido (por ejemplo, al borrar).
  if (respuesta.status === 204) return { datos: null as T, meta: null };
  return (await respuesta.json()) as Sobre<T>;
}

// COMPATIBILIDAD: src/servicios/sesion.ts (Integrante 3) todavía simula el ingreso con
// cuentas de prueba y usa esta función para imitar la espera de la red.
// Se borra cuando el ingreso use la API real (POST /auth/ingreso).
export async function simularRed(): Promise<void> {
  await new Promise((resolver) => setTimeout(resolver, 500));
  if (!(await hayInternet())) throw new ErrorServicio('SIN_CONEXION');
}

// Pide todas las páginas de una lista y devuelve los elementos juntos.
export async function pedirTodos<T>(
  ruta: string,
  parametros: Record<string, string | number> = {},
  opciones: OpcionesPedido = {},
): Promise<T[]> {
  const todos: T[] = [];
  for (let pagina = 1; ; pagina++) {
    const { datos, meta } = await pedir<T[]>(ruta, { ...parametros, pagina }, opciones);
    todos.push(...datos);
    if (!meta || datos.length === 0 || todos.length >= meta.total) return todos;
  }
}