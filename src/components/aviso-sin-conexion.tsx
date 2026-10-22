import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHayInternet } from '@/almacenamiento/red';

// FRANJA "SIN CONEXIÓN" (Integrante 2). Envuelve toda la app y aparece arriba cuando no hay internet.
// El diseño puede ajustarlo el Integrante 6 (estilo de la app).
export function ConAvisoSinConexion({ children }: PropsWithChildren) {
  const hayInternet = useHayInternet();
  const insets = useSafeAreaInsets();

  // La estructura es siempre la misma, aparezca o no la franja,
  // para que la app no se reinicie ni pierda la pantalla actual al cambiar la conexión.
  return (
    <View style={styles.contenedor}>
      {!hayInternet && (
        <View
          accessibilityRole="alert"
          style={[styles.franja, { paddingTop: insets.top + 6 }]}
        >
          <Text style={styles.texto}>Sin conexión a internet</Text>
        </View>
      )}
      {/* Con la franja visible, la barra de estado ya quedó cubierta por ella:
          las pantallas de abajo no necesitan dejar ese espacio otra vez. */}
      <SafeAreaInsetsContext.Provider value={hayInternet ? insets : { ...insets, top: 0 }}>
        {children}
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  franja: {
    backgroundColor: '#B3261E',
    paddingBottom: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  texto: { color: '#FFFFFF', fontWeight: '600' },
});
