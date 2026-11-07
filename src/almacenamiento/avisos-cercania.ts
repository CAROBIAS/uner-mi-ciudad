import * as Notifications from 'expo-notifications';
import { obtenerBase } from './base';

// Configurar cómo se deben comportar las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Solicitud/verificación de permisos de notificaciones
export async function solicitarPermisosNotificaciones(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

// Enviar notificación de cercanía a un lugar
export async function enviarNotificacionCercania(titulo: string, cuerpo: string): Promise<void> {
  const tienePermiso = await solicitarPermisosNotificaciones();
  if (!tienePermiso) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: cuerpo,
      sound: 'default',
    },
    trigger: null, // trigger: null la dispara inmediatamente
  });
}

// AVISOS DE CERCANÍA YA ENVIADOS guardados en SQLite.
// Sirve para no avisar dos veces el mismo día del mismo lugar.

// Fecha de hoy en Argentina ("AAAA-MM-DD"), sin importar la zona horaria del celular.
function fechaDeHoy(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function yaSeAvisoHoy(lugarId: string): Promise<boolean> {
  const base = await obtenerBase();
  const fila = await base.getFirstAsync(
    'SELECT 1 FROM avisos_cercania WHERE lugar_id = ? AND fecha = ?',
    lugarId,
    fechaDeHoy(),
  );
  return fila !== null;
}

export async function registrarAviso(lugarId: string): Promise<void> {
  const base = await obtenerBase();
  await base.runAsync(
    'INSERT OR IGNORE INTO avisos_cercania (lugar_id, fecha) VALUES (?, ?)',
    lugarId,
    fechaDeHoy(),
  );
}