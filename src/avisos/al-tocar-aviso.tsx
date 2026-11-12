import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

// AL TOCAR UN AVISO (Integrante 6, tarea 4.4)
// Lee los "datos" que viajan con el aviso y abre la pantalla que corresponde:
//   { eventoId: 'evt-017' }  → Ficha del evento
//   { pantalla: 'inicio' }   → Inicio (mapa)
//   { pantalla: 'agenda' }   → Agenda
// Un aviso sin datos solo abre la app.
// Se coloca una sola vez, en src/app/_layout.tsx.

function abrirPantalla(respuesta: Notifications.NotificationResponse): void {
  const datos = respuesta.notification.request.content.data ?? {};
  if (typeof datos.eventoId === 'string') {
    router.push({ pathname: '/eventos/[id]', params: { id: datos.eventoId } });
  } else if (datos.pantalla === 'agenda') {
    router.push('/agenda');
  } else if (datos.pantalla === 'inicio') {
    router.push('/');
  }
}

export function AlTocarAviso() {
  useEffect(() => {
    // Caso 1: la app estaba cerrada y se abrió tocando un aviso.
    const ultima = Notifications.getLastNotificationResponse();
    if (ultima) {
      abrirPantalla(ultima);
      Notifications.clearLastNotificationResponse(); // para no abrirla otra vez
    }

    // Caso 2: la app ya estaba abierta (o en segundo plano) y se toca un aviso.
    const suscripcion = Notifications.addNotificationResponseReceivedListener((respuesta) => {
      abrirPantalla(respuesta);
      Notifications.clearLastNotificationResponse();
    });
    return () => suscripcion.remove();
  }, []);

  return null;
}