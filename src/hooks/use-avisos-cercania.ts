import { AppState } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { yaSeAvisoHoy, registrarAviso } from '@/almacenamiento/avisos-cercania';
import { obtenerPreferencias } from '@/almacenamiento/preferencias';
import { useSesion } from '@/hooks/use-sesion';
import { sendNotificationNow, registerForPushNotificationsAsync } from '@/services/notificationService';
import type { Coordenadas, Lugar } from '@/tipos';
import { calcularDistanciaMetros } from '@/utils/geo';

export function useAvisosCercania(
  ubicacion: Coordenadas | null,
  lugares: Lugar[],
  permisoUbicacion: boolean,
) {
  const { estado } = useSesion();
  const permisoAvisos = useRef<boolean | null>(null);
  const procesando = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    async function revisarProximidad() {
      if (
        !ubicacion ||
        !permisoUbicacion ||
        estado !== 'conSesion' ||
        AppState.currentState !== 'active' ||
        procesando.current
      ) {
        return;
      }

      procesando.current = true;
      try {
        const preferencias = await obtenerPreferencias();
        if (!activo || !preferencias.avisarProximidad) return;

        const cercanos = lugares.filter(
          (lugar) =>
            calcularDistanciaMetros(ubicacion, lugar.coordenadas) <= preferencias.radioAvisoMetros,
        );
        const pendientes = (
          await Promise.all(
            cercanos.map(async (lugar) =>
              (await yaSeAvisoHoy(lugar.id)) ? null : lugar,
            ),
          )
        ).filter((lugar): lugar is Lugar => lugar !== null);

        if (!activo || pendientes.length === 0 || permisoAvisos.current === false) return;

        if (permisoAvisos.current === null) {
          permisoAvisos.current = await registerForPushNotificationsAsync();
        }

        if (!activo || permisoAvisos.current !== true) return;

        await sendNotificationNow(
          'Mi Ciudad Colón',
          `Hay ${pendientes.length} ${pendientes.length === 1 ? 'lugar de interés' : 'lugares de interés'} cerca tuyo.`,
        );

        await Promise.all(pendientes.map((lugar) => registrarAviso(lugar.id)));
        if (activo) setError(null);
      } catch (errorAviso) {
        if (activo) {
          setError(
            errorAviso instanceof Error
              ? errorAviso.message
              : 'No se pudo enviar el aviso de lugares cercanos.',
          );
        }
      } finally {
        procesando.current = false;
      }
    }

    void revisarProximidad();

    return () => {
      activo = false;
    };
  }, [estado, ubicacion, lugares, permisoUbicacion]);

  return error;
}
