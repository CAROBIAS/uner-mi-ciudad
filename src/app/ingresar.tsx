import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSesion } from '@/hooks/use-sesion';
import { useTheme } from '@/hooks/use-theme';
import { ErrorServicio } from '@/servicios/comun';
import { ErrorSesion } from '@/servicios/sesion';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar(email: string, contrasena: string) {
  const correo = email.trim();
  let errorEmail: string | null = null;
  let errorContrasena: string | null = null;

  if (!correo) errorEmail = 'Ingresá tu email.';
  else if (!EMAIL_VALIDO.test(correo)) errorEmail = 'El email no tiene un formato válido.';

  if (!contrasena) errorContrasena = 'Ingresá tu contraseña.';
  else if (contrasena.length < 8) {
    errorContrasena = 'La contraseña tiene que tener al menos 8 caracteres.';
  }

  return { errorEmail, errorContrasena };
}

export default function IngresarScreen() {
  const { estado, usuario, ingresar } = useSesion();
  const theme = useTheme();
  const contrasenaRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errorEmail, setErrorEmail] = useState<string | null>(null);
  const [errorContrasena, setErrorContrasena] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function volver() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function cambiarEmail(texto: string) {
    setEmail(texto);
    if (errorEmail) setErrorEmail(null);
    if (errorGeneral) setErrorGeneral(null);
  }

  function cambiarContrasena(texto: string) {
    setContrasena(texto);
    if (errorContrasena) setErrorContrasena(null);
    if (errorGeneral) setErrorGeneral(null);
  }

  async function enviar() {
    if (cargando) return;

    const errores = validar(email, contrasena);
    setErrorEmail(errores.errorEmail);
    setErrorContrasena(errores.errorContrasena);
    setErrorGeneral(null);

    if (errores.errorEmail || errores.errorContrasena) return;

    Keyboard.dismiss();
    setCargando(true);

    try {
      await ingresar(email.trim(), contrasena);
      volver();
    } catch (error) {
      if (error instanceof ErrorSesion || error instanceof ErrorServicio) {
        setErrorGeneral(error.message);
      } else {
        setErrorGeneral('No se pudo ingresar. Intentá de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  }

  if (estado === 'cargando') {
    return (
      <ThemedView style={styles.centro}>
        <ActivityIndicator />
        <ThemedText themeColor="textSecondary">Cargando sesión...</ThemedText>
      </ThemedView>
    );
  }

  if (estado === 'conSesion') {
    return (
      <ThemedView style={styles.centro}>
        <ThemedText type="subtitle">Ya ingresaste</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centrado}>
          Estás como {usuario?.nombre ?? 'tu cuenta'}.
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={volver}
          style={({ pressed }) => [
            styles.boton,
            { backgroundColor: theme.text },
            pressed && styles.botonPresionado,
          ]}
        >
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            Volver
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.pantalla}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
        >
          <View style={styles.formulario}>
            <ThemedText type="subtitle">Tu cuenta</ThemedText>
            <ThemedText themeColor="textSecondary">
              Ingresá para guardar favoritos, eventos y tu recorrido.
            </ThemedText>

            <View style={styles.campo}>
              <ThemedText type="smallBold">Email</ThemedText>
              <TextInput
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!cargando}
                keyboardType="email-address"
                onChangeText={cambiarEmail}
                onSubmitEditing={() => contrasenaRef.current?.focus()}
                placeholder="tu@email.com"
                placeholderTextColor={theme.textSecondary}
                returnKeyType="next"
                selectionColor={theme.textSecondary}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.backgroundSelected,
                    color: theme.text,
                  },
                ]}
                textContentType="emailAddress"
                value={email}
              />
              {errorEmail ? (
                <ThemedText type="small" style={styles.error}>
                  {errorEmail}
                </ThemedText>
              ) : null}
            </View>

            <View style={styles.campo}>
              <ThemedText type="smallBold">Contraseña</ThemedText>
              <TextInput
                ref={contrasenaRef}
                accessibilityLabel="Contraseña"
                autoComplete="current-password"
                editable={!cargando}
                onChangeText={cambiarContrasena}
                onSubmitEditing={enviar}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={theme.textSecondary}
                returnKeyType="go"
                secureTextEntry
                selectionColor={theme.textSecondary}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.backgroundSelected,
                    color: theme.text,
                  },
                ]}
                textContentType="password"
                value={contrasena}
              />
              {errorContrasena ? (
                <ThemedText type="small" style={styles.error}>
                  {errorContrasena}
                </ThemedText>
              ) : null}
            </View>

            {errorGeneral ? (
              <ThemedText
                type="small"
                style={styles.error}
                accessibilityLiveRegion="polite"
              >
                {errorGeneral}
              </ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ingresar"
              accessibilityState={{ busy: cargando, disabled: cargando }}
              disabled={cargando}
              onPress={enviar}
              style={({ pressed }) => [
                styles.boton,
                { backgroundColor: theme.text },
                (pressed || cargando) && styles.botonPresionado,
              ]}
            >
              {cargando ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <ThemedText type="smallBold" style={{ color: theme.background }}>
                  Ingresar
                </ThemedText>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  flex: { flex: 1 },
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
  },
  formulario: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  campo: { gap: Spacing.two },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    textAlignVertical: 'center',
  },
  error: { color: '#C62828' },
  boton: {
    width: '100%',
    maxWidth: 480,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  botonPresionado: { opacity: 0.6 },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  centrado: { textAlign: 'center' },
});