import type { Coordenadas, Lugar } from "@/tipos";

const RADIO_TIERRA_M = 6_371_000;

export function calcularDistanciaMetros(
  origen: Coordenadas,
  destino: Coordenadas,
): number {
  const lat1 = (origen.latitud * Math.PI) / 180;
  const lat2 = (destino.latitud * Math.PI) / 180;
  const deltaLat = ((destino.latitud - origen.latitud) * Math.PI) / 180;
  const deltaLon = ((destino.longitud - origen.longitud) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  return 2 * RADIO_TIERRA_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatearDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)} m`;
  const kilometros = metros / 1000;
  if (kilometros < 10) return `${kilometros.toFixed(1).replace(".", ",")} km`;
  return `${Math.round(kilometros)} km`;
}

export function calcularRumboGrados(
  origen: Coordenadas,
  destino: Coordenadas,
): number {
  const lat1 = (origen.latitud * Math.PI) / 180;
  const lat2 = (destino.latitud * Math.PI) / 180;
  const lonDelta = ((destino.longitud - origen.longitud) * Math.PI) / 180;

  const y = Math.sin(lonDelta) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lonDelta);

  const grados = (Math.atan2(y, x) * 180) / Math.PI;
  return (grados + 360) % 360;
}

export function calcularRotacionFlecha(
  origen: Coordenadas,
  destino: Coordenadas,
  rumboCelularGrados: number,
): number {
  return (
    (calcularRumboGrados(origen, destino) - rumboCelularGrados + 360) % 360
  );
}

export function ordenarPorDistancia(
  lugares: Lugar[],
  puntoReferencia: Coordenadas,
): Lugar[] {
  return [...lugares].sort(
    (a, b) =>
      calcularDistanciaMetros(puntoReferencia, a.coordenadas) -
      calcularDistanciaMetros(puntoReferencia, b.coordenadas),
  );
}
