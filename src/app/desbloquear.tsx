import { router } from 'expo-router'
import { Ionicons } from '@react-native-vector-icons/ionicons'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native'

import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Spacing } from '@/constants/theme'
import { useSesion } from '@/hooks/use-sesion'
import { useTheme } from '@/hooks/use-theme'
import { biometriaPreparada, nombreBiometria } from '@/servicios/biometria'

export default function DesbloquearScreen() {
  const { estado, usuario, desbloquear, cerrarSesion } = useSesion()
  const theme = useTheme()
  const [metodo, setMetodo] = useState<string | null>(null)
  const [preparada, setPreparada] = useState<boolean | null>(null)
  const [verificando, setVerificando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const yaPidio = useRef(false)

  // Se consulta una vez al abrir la pantalla para armar los textos
  useEffect(() => {
    let activo = true

    async function cargar() {
      const [nombre, disponible] = await Promise.all([
        nombreBiometria().catch(() => 'huella o rostro'),
        biometriaPreparada().catch(() => false),
      ])

      if (activo) {
        setMetodo(nombre)
        setPreparada(disponible)
      }
    }

    void cargar()

    return () => {
      activo = false
    }
  }, [])

  function volver() {
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  async function intentar() {
    if (verificando) return

    setVerificando(true)
    setError(null)

    try {
      const exito = await desbloquear()

      if (exito) volver()
      else setError('No se pudo desbloquear. Probá de nuevo o ingresá con tu contraseña.')
    } catch {
      setError('No se pudo desbloquear. Probá de nuevo o ingresá con tu contraseña.')
    } finally {
      setVerificando(false)
    }
  }

  useEffect(() => {
    if (!preparada || estado !== 'bloqueado' || yaPidio.current) return

    yaPidio.current = true
    void intentar()
  }, [preparada, estado])

  async function reingresar() {
    await cerrarSesion()
    router.replace('/ingresar')
  }

  if (estado === 'cargando' || preparada === null) {
    return (
      <ThemedView style={styles.centro}>
        <ActivityIndicator />
        <ThemedText themeColor="textSecondary">Verificando biometría...</ThemedText>
      </ThemedView>
    )
  }

  if (estado === 'invitado') {
    return (
      <ThemedView style={styles.centro}>
        <Ionicons name="person-circle-outline" size={64} color={theme.textSecondary} />
        <ThemedText type="subtitle">No hay sesión iniciada</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centrado}>
          Ingresá con tu cuenta para continuar.
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ingresar con contraseña"
          onPress={() => void reingresar()}
          style={({ pressed }) => [
            styles.boton,
            { backgroundColor: theme.text },
            pressed && styles.presionado,
          ]}
        >
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            Ingresar con contraseña
          </ThemedText>
        </Pressable>
      </ThemedView>
    )
  }

  if (estado === 'conSesion') {
    return (
      <ThemedView style={styles.centro}>
        <Ionicons name="lock-open-outline" size={64} color={theme.textSecondary} />
        <ThemedText type="subtitle">Ya está desbloqueada</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centrado}>
          Tu sesión sigue activa.{usuario ? ` Hola, ${usuario.nombre}.` : ''}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={volver}
          style={({ pressed }) => [
            styles.boton,
            { backgroundColor: theme.text },
            pressed && styles.presionado,
          ]}
        >
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            Volver
          </ThemedText>
        </Pressable>
      </ThemedView>
    )
  }

  if (verificando) {
    return (
      <ThemedView style={styles.centro}>
        <ActivityIndicator />
        <ThemedText themeColor="textSecondary">Esperando la verificación...</ThemedText>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.pantalla}>
      <ThemedView type="backgroundElement" style={styles.tarjeta}>
        <Ionicons
          name={preparada ? 'finger-print-outline' : 'alert-circle-outline'}
          size={64}
          color={theme.textSecondary}
        />
        <ThemedText type="subtitle">
          {preparada ? `Desbloqueá con ${metodo}` : 'Sin huella configurada'}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centrado}>
          {preparada
            ? 'Verificá tu identidad para continuar con tu sesión abierta.'
            : 'Este celular no tiene huella ni rostro configurado. Entrá con tu contraseña.'}
        </ThemedText>

        {error ? (
          <ThemedText type="small" style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </ThemedText>
        ) : null}

        {preparada ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Desbloquear con biometría"
            accessibilityState={{ busy: verificando, disabled: verificando }}
            disabled={verificando}
            onPress={() => void intentar()}
            style={({ pressed }) => [
              styles.boton,
              { backgroundColor: theme.text },
              (pressed || verificando) && styles.presionado,
            ]}
          >
            {verificando ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                {`Usar ${metodo}`}
              </ThemedText>
            )}
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ingresar con contraseña"
          onPress={() => void reingresar()}
          style={({ pressed }) => [styles.botonSecundario, pressed && styles.presionado]}
        >
          <ThemedText type="small" themeColor="textSecondary">
            Ingresar con contraseña
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  tarjeta: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
  },
  boton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  botonSecundario: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  error: { color: '#C62828', textAlign: 'center' },
  presionado: { opacity: 0.6 },
  centrado: { textAlign: 'center' },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
})