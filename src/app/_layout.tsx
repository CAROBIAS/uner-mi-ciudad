import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ConAvisoSinConexion } from '@/components/aviso-sin-conexion';
import { useSesion } from '@/hooks/use-sesion';
import { SesionProvider } from '@/providers/sesion';

SplashScreen.preventAutoHideAsync();

function GuardiaSesion() {
  const { estado } = useSesion();
  const segments = useSegments();

  useEffect(() => {
    if (estado === 'bloqueado' && segments[0] !== 'desbloquear') {
      router.replace('/desbloquear');
    }
  }, [estado, segments]);

  return null;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <SesionProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <GuardiaSesion />
        <AnimatedSplashOverlay />
        <ConAvisoSinConexion>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="lugares/index" options={{ title: 'Lugares' }} />
            <Stack.Screen name="lugares/[id]" options={{ title: 'Lugar' }} />
            <Stack.Screen name="descargas" options={{ title: 'Descargas' }} />
            <Stack.Screen name="eventos/[id]" options={{ title: 'Evento' }} />
            <Stack.Screen name="ingresar" options={{ title: 'Ingresar' }} />
            <Stack.Screen name="desbloquear" options={{ title: 'Desbloquear' }} />
            <Stack.Screen name="favoritos" options={{ title: 'Favoritos' }} />
            <Stack.Screen name="preferencias" options={{ title: 'Preferencias' }} />
            <Stack.Screen name="registrar-visita" options={{ title: 'Registrar visita' }} />
            <Stack.Screen name="escanear-qr" options={{ title: 'Escanear QR' }} />
            <Stack.Screen name="dev" options={{ title: 'Menú de pruebas' }} />
            <Stack.Screen name="dev-servicios" options={{ title: 'Probar servicios' }} />
            <Stack.Screen name="dev-almacenamiento" options={{ title: 'Probar almacenamiento' }} />
          </Stack>
        </ConAvisoSinConexion>
      </ThemeProvider>
    </SesionProvider>
  );
}
