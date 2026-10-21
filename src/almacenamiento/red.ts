// ESTADO DE LA RED (Integrante 2)
// PIEZA PROVISORIA: por ahora siempre responde que SÍ hay internet.
// Después se reemplaza por expo-network SIN cambiar los nombres.

// Para preguntar una vez (por ejemplo, antes de subir visitas).
export async function hayInternet(): Promise<boolean> {
  return true;
}

// Para pantallas que se tienen que actualizar solas cuando cambia la conexión
// (por ejemplo, la franja "sin conexión").
export function useHayInternet(): boolean {
  return true;
}
