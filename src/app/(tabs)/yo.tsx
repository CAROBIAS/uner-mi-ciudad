import { router } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSesion } from '@/hooks/use-sesion';
import { useTheme } from '@/hooks/use-theme';

type NombreIcono = 'heart-outline' | 'download-outline' | 'settings-outline' | 'finger-print-outline';

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';

  return partes
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
}

function Fila({
  icono,
  texto,
  onPress,
}: {
  icono: NombreIcono;
  texto: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={texto}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fila,
        pressed && { backgroundColor: theme.backgroundSelected },
      ]}
    >
      <Ionicons name={icono} size={22} color={theme.text} />
      <ThemedText style={styles.filaTexto}>{texto}</ThemedText>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function YoScreen() {
  const { estado, usuario, cerrarSesion } = useSesion();
  const theme = useTheme();

  function confirmarCierre() {
    Alert.alert('Cerrar sesión', '¿Querés salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: () => {
          void cerrarSesion();
        },
      },
    ]);
  }

  if (estado === 'cargando') {
    return (
      <ThemedView style={styles.centro}>
        <ActivityIndicator />
        <ThemedText themeColor="textSecondary">Cargando sesión...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <ThemedText type="subtitle">Yo</ThemedText>

        {estado === 'invitado' ? (
          <ThemedView type="backgroundElement" style={styles.tarjeta}>
            <Ionicons name="person-circle-outline" size={64} color={theme.textSecondary} />
            <ThemedText type="subtitle">Invitado</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.centrado}>
              Ingresá para guardar favoritos, eventos y tu recorrido.
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ingresar"
              onPress={() => router.push('/ingresar')}
              style={({ pressed }) => [
                styles.boton,
                { backgroundColor: theme.text },
                pressed && styles.presionado,
              ]}
            >
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                Ingresar
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}

        {estado === 'bloqueado' ? (
          <ThemedView type="backgroundElement" style={styles.tarjeta}>
            <Ionicons name="lock-closed-outline" size={64} color={theme.textSecondary} />
            <ThemedText type="subtitle">Sesión bloqueada</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.centrado}>
              Desbloqueá con tu huella o rostro para continuar.
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Desbloquear"
              onPress={() => router.push('/desbloquear')}
              style={({ pressed }) => [
                styles.boton,
                { backgroundColor: theme.text },
                pressed && styles.presionado,
              ]}
            >
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                Desbloquear
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}

        {estado === 'conSesion' ? (
          <>
            <ThemedView type="backgroundElement" style={styles.tarjeta}>
              <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="subtitle">{iniciales(usuario?.nombre ?? '')}</ThemedText>
              </View>
              <ThemedText type="subtitle">{usuario?.nombre ?? 'Sesión activa'}</ThemedText>
              {usuario ? (
                <ThemedText themeColor="textSecondary">{usuario.email}</ThemedText>
              ) : null}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.filas}>
              <Fila
                icono="heart-outline"
                texto="Favoritos"
                onPress={() => router.push('/favoritos')}
              />
              <View style={[styles.separador, { backgroundColor: theme.backgroundSelected }]} />
              <Fila
                icono="settings-outline"
                texto="Preferencias"
                onPress={() => router.push('/preferencias')}
              />
              <View style={[styles.separador, { backgroundColor: theme.backgroundSelected }]} />
              <Fila
                icono="download-outline"
                texto="Descargas"
                onPress={() => router.push('/descargas')}
              />
              <View style={[styles.separador, { backgroundColor: theme.backgroundSelected }]} />
              <Fila
                icono="finger-print-outline"
                texto="Desbloquear con huella"
                onPress={() => router.push('/desbloquear')}
              />
            </ThemedView>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              onPress={confirmarCierre}
              style={({ pressed }) => [
                styles.cerrarBoton,
                { borderColor: theme.backgroundSelected },
                pressed && styles.presionado,
              ]}
            >
              <Ionicons name="log-out-outline" size={20} color="#C62828" />
              <ThemedText type="smallBold" style={styles.cerrarTexto}>
                Cerrar sesión
              </ThemedText>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  tarjeta: {
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  filas: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  fila: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  filaTexto: { flex: 1 },
  separador: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.three + 22 + Spacing.three,
  },
  boton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  cerrarBoton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  cerrarTexto: { color: '#C62828' },
  presionado: { opacity: 0.6 },
  centrado: { textAlign: 'center' },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
});