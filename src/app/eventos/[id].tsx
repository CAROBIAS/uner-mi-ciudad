import { useLocalSearchParams } from 'expo-router';

import { PantallaPendiente } from '@/components/pantalla-pendiente';

export default function FichaEventoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PantallaPendiente nombre="Ficha del evento" integrante={6} detalle={`id: ${id}`} />;
}
