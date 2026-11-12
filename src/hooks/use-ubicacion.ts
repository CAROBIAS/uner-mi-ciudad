import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Coordenadas } from '@/tipos';

type EstadoPermiso = 'consultando' | 'concedido' | 'denegado';

export function useUbicacion() {
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [estadoPermiso, setEstadoPermiso] = useState<EstadoPermiso>('consultando');
  const [error, setError] = useState<string | null>(null);
  const suscripcion = useRef<Location.LocationSubscription | null>(null);
  const montado = useRef(false);
  const solicitudActual = useRef(0);

  const iniciarSeguimiento = useCallback(async (solicitarPermiso: boolean) => {
    const solicitud = ++solicitudActual.current;

    try {
      const permiso = solicitarPermiso
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();

      if (!montado.current || solicitud !== solicitudActual.current) return;

      setError(null);

      if (permiso.status !== 'granted') {
        suscripcion.current?.remove();
        suscripcion.current = null;
        setEstadoPermiso('denegado');
        return;
      }

      setEstadoPermiso('concedido');
      const posicionActual = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!montado.current || solicitud !== solicitudActual.current) return;

      setCoordenadas({
        latitud: posicionActual.coords.latitude,
        longitud: posicionActual.coords.longitude,
      });

      const nuevaSuscripcion = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 20,
          timeInterval: 5_000,
        },
        (posicion) => {
          if (!montado.current || solicitud !== solicitudActual.current) return;

          setCoordenadas({
            latitud: posicion.coords.latitude,
            longitud: posicion.coords.longitude,
          });
        },
      );
      if (!montado.current || solicitud !== solicitudActual.current) {
        nuevaSuscripcion.remove();
        return;
      }

      suscripcion.current?.remove();
      suscripcion.current = nuevaSuscripcion;
    } catch (errorUbicacion) {
      if (!montado.current || solicitud !== solicitudActual.current) return;

      setError(
        errorUbicacion instanceof Error
          ? errorUbicacion.message
          : 'No se pudo obtener tu ubicación.',
      );
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    void Promise.resolve().then(() => iniciarSeguimiento(false));

    return () => {
      montado.current = false;
      solicitudActual.current += 1;
      suscripcion.current?.remove();
      suscripcion.current = null;
    };
  }, [iniciarSeguimiento]);

  const solicitarPermiso = useCallback(
    () => iniciarSeguimiento(true),
    [iniciarSeguimiento],
  );

  return {
    coordenadas,
    estadoPermiso,
    error,
    solicitarPermiso,
  };
}
