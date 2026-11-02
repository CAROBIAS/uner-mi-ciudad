// src/services/notificationService.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuración básica de cómo se muestran los avisos al recibirlos
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 4.2 Pedir permisos al celular
export const registerForPushNotificationsAsync = async () => {
  let token;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permiso de notificaciones rechazado');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return true;
};

// 4.3 Enviar aviso inmediato
export const sendNotificationNow = async (title, body) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: null, // null indica envío inmediato
  });
};

// 4.3 Programar aviso en X segundos/minutos
export const scheduleNotification = async (title, body, seconds) => {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: {
      seconds,
    },
  });
};

// 4.3 Cancelar aviso programado
export const cancelScheduledNotification = async (notificationId) => {
  if (notificationId) {
    await Notifications.dismissNotificationAsync(notificationId);
  }
};
