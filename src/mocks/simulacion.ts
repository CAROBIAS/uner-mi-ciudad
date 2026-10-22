// INTERRUPTOR DE SIMULACIÓN para probar mensajes de las pantallas.
// Lo lee la capa de servicios (src/servicios).
//
// - 'normal': devuelve los datos de prueba.
// - 'sinDatos': devuelve listas vacías (para probar "No hay resultados").
// - 'sinConexion': devuelve el error de sin conexión (para probar el mensaje de error).
//
// IMPORTANTE: cambialo solo para probar en tu computadora.
// NO subas a GitHub un valor distinto de 'normal'.

export type ModoSimulacion = 'normal' | 'sinDatos' | 'sinConexion';

export const MODO_SIMULACION: ModoSimulacion = 'sinConexion';

// Demora simulada de cada respuesta, en milisegundos.
// Sirve para que se vean los mensajes de "Cargando...".
export const DEMORA_MS = 500;
