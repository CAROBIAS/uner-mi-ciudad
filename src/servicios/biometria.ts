import * as LocalAuthentication from 'expo-local-authentication'

// Envuelve expo-local-authentication: detecta si el celular tiene
// huella o rostro configurado y muestra el pedido de desbloqueo.
// El token de sesion ya lo guarda el servicio sesion en el almacén seguro;
// esto solo agrega la verificacion de identidad al abrir la app.

export async function biometriaPreparada(): Promise<boolean> {
  const tieneHardware = await LocalAuthentication.hasHardwareAsync()
  if (!tieneHardware) return false

  return LocalAuthentication.isEnrolledAsync()
}

export async function nombreBiometria(): Promise<string> {
  const tipos = await LocalAuthentication.supportedAuthenticationTypesAsync()

  if (tipos.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'huella digital'
  }
  if (tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'rostro'
  }
  if (tipos.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'iris'
  }

  return 'huella o rostro'
}

export async function pedirBiometria(): Promise<LocalAuthentication.LocalAuthenticationResult> {
  return LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloqueá tu cuenta',
    promptDescription: 'Verificá tu identidad con Mi Ciudad Colón.',
    cancelLabel: 'Cancelar',
    disableDeviceFallback: true,
  })
}