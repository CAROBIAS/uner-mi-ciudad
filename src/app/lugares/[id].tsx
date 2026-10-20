import { useLocalSearchParams } from 'expo-router';

import { PantallaPendiente } from '@/components/pantalla-pendiente';

export default function FichaLugarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PantallaPendiente nombre="Ficha del lugar" integrante={4} detalle={`id: ${id}`} />;
}