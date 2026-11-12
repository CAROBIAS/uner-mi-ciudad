import { useEffect } from 'react';

import { obtenerPreferencias } from '@/almacenamiento/preferencias';
import { aplicarTema } from '@/hooks/aplicar-tema';

// Se usa una sola vez, en src/app/_layout.tsx: al abrir la app aplica el tema guardado
// en Preferencias (Integrante 6, tarea 2.3). Si falla, queda el modo del sistema.
export function useTemaGuardado(): void {
  useEffect(() => {
    obtenerPreferencias()
      .then((preferencias) => aplicarTema(preferencias.tema))
      .catch(() => undefined);
  }, []);
}