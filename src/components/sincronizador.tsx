import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useHayInternet } from '@/almacenamiento/red';
import { sincronizar } from '@/almacenamiento/sincronizacion';
import { useSesion } from '@/hooks/use-sesion';

// SINCRONIZADOR (Integrante 2, tarea 8.2 y 8.3)
// No dibuja nada. Con sesión y con señal, sincroniza con la API:
// - al abrir la app y al ingresar,
// - cuando vuelve la señal,
// - cuando la app vuelve a primer plano.
// La primera vez de cada usuario (por apertura de la app) además baja sus datos de la cuenta.
// Se coloca una sola vez, en src/app/_layout.tsx.

export function Sincronizador() {
  const { estado, usuario, ejecutarConToken } = useSesion();
  const hayInternet = useHayInternet();
  const [vuelta, setVuelta] = useState(0);
  const bajadoPara = useRef<string | null>(null);
  const enCurso = useRef(false);

  // Cuando la app vuelve a primer plano, se intenta de nuevo.
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estadoApp) => {
      if (estadoApp === 'active') setVuelta((actual) => actual + 1);
    });
    return () => suscripcion.remove();
  }, []);

  useEffect(() => {
    if (estado !== 'conSesion' || !usuario || !hayInternet || enCurso.current) return;
    const usuarioId = usuario.id;
    const bajar = bajadoPara.current !== usuarioId;
    enCurso.current = true;
    // ejecutarConToken (Integrante 3): si la API dice "no autorizado", cierra la sesión.
    ejecutarConToken(() => sincronizar(usuarioId, bajar))
      .then(() => {
        if (bajar) bajadoPara.current = usuarioId;
      })
      .catch(() => undefined) // sin señal o con error: se reintenta en la próxima ocasión
      .finally(() => {
        enCurso.current = false;
      });
  }, [estado, usuario, hayInternet, vuelta, ejecutarConToken]);

  return null;
}