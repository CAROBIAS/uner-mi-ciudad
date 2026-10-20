import { useContext } from 'react';

import { SesionContext } from '@/providers/sesion';

export function useSesion() {
  const sesion = useContext(SesionContext);

  if (!sesion) {
    throw new Error('useSesion tiene que usarse dentro de SesionProvider');
  }

  return sesion;
}