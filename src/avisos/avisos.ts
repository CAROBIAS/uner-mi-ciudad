import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// AVISOS DEL CELULAR (Integrante 6) — notificaciones locales con expo-notifications.
// Ninguna función lanza errores: si algo falla o no hay permiso, devuelven null/false
// y la app sigue funcionando (tarea 4.2).

const CANAL_ANDROID = 'avisos';

// Datos extra que viajan con el aviso (por ejemplo, qué pantalla abrir al tocarlo).
export type DatosAviso = Record<string, string>;

// Se llama una sola vez al iniciar la app.
// Define cómo se muestran los avisos si llegan con la app abierta.
export function configurarAvisos(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// En Android los avisos necesitan un "canal". Se crea antes de pedir permiso.
async function crearCanalAndroid(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL_ANDROID, {
    name: 'Avisos de Mi Ciudad',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

// Pide permiso solo si todavía no lo tiene. Devuelve true si se puede avisar.
export async function pedirPermisoAvisos(): Promise<boolean> {
  try {
    await crearCanalAndroid();
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted) return true;
    if (!actual.canAskAgain) return false;
    const respuesta = await Notifications.requestPermissionsAsync();
    return respuesta.granted;
  } catch {
    return false;
  }
}

// Envía un aviso inmediato. Devuelve su id, o null si no se pudo.
export async function enviarAvisoAhora(
  titulo: string,
  cuerpo: string,
  datos?: DatosAviso,
): Promise<string | null> {
  try {
    if (!(await pedirPermisoAvisos())) return null;
    return await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: cuerpo, data: datos ?? {} },
      trigger: { channelId: CANAL_ANDROID }, // sin fecha = sale ya
    });
  } catch {
    return null;
  }
}

// Programa un aviso para una fecha y hora. Devuelve su id (guardarlo para poder
// cancelarlo), o null si no se pudo o si la fecha ya pasó.
export async function programarAviso(
  titulo: string,
  cuerpo: string,
  fecha: Date,
  datos?: DatosAviso,
): Promise<string | null> {
  try {
    if (fecha.getTime() <= Date.now()) return null;
    if (!(await pedirPermisoAvisos())) return null;
    return await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: cuerpo, data: datos ?? {} },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fecha,
        channelId: CANAL_ANDROID,
      },
    });
  } catch {
    return null;
  }
}

// Cancela un aviso programado que todavía no salió.
export async function cancelarAviso(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Si ya salió o no existe, no hay nada que cancelar.
  }
}