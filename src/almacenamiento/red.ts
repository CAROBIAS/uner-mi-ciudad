import * as Network from 'expo-network';

// ESTADO DE LA RED (Integrante 2) — usa expo-network.

// Hay internet salvo que el celular diga claramente que no.
// Mientras el dato es "desconocido", se asume que sí, para no mostrar la franja por error.
function hayConexion(estado: Network.NetworkState): boolean {
  return estado.isConnected !== false && estado.isInternetReachable !== false;
}

// Para preguntar una vez (por ejemplo, antes de subir visitas).
export async function hayInternet(): Promise<boolean> {
  try {
    return hayConexion(await Network.getNetworkStateAsync());
  } catch {
    return true;
  }
}

// Para pantallas que se tienen que actualizar solas cuando cambia la conexión.
export function useHayInternet(): boolean {
  return hayConexion(Network.useNetworkState());
}