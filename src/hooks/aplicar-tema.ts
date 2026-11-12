import { Appearance } from 'react-native';

import type { Preferencias } from '@/tipos';

// TEMA ELEGIDO POR EL USUARIO (Integrante 6, tarea 2.3)
// Le dice a React Native qué modo usar en toda la app. Así, useColorScheme()
// (y por lo tanto useTheme() y los colores de la navegación) devuelven el modo elegido
// en Preferencias en lugar del modo del sistema.
// Lo llama guardarPreferencias() (al guardar) y useTemaGuardado() (al abrir la app).

const MODO: Record<Preferencias['tema'], 'light' | 'dark' | 'unspecified'> = {
  claro: 'light',
  oscuro: 'dark',
  sistema: 'unspecified', // "unspecified" = seguir al sistema
};

export function aplicarTema(tema: Preferencias['tema']): void {
  Appearance.setColorScheme(MODO[tema]);
}