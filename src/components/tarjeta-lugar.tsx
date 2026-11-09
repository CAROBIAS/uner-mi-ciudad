import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import type { Categoria, Lugar } from '@/tipos';
import { estadoHorarioLugar } from '@/utils/horarios';

type Props = {
  lugar: Lugar;
  categoria?: Categoria;
  distancia?: string | null;
  onPress?: (event: GestureResponderEvent) => void;
};

export function TarjetaLugar({ lugar, categoria, distancia, onPress }: Props) {
  const theme = useTheme();
  const estado = estadoHorarioLugar(lugar);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${lugar.nombre}`}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.presionada]}
    >
      <ThemedView type="backgroundElement" style={styles.tarjeta}>
        {lugar.imagenes[0] ? (
          <Image
            source={{ uri: lugar.imagenes[0] }}
            contentFit="cover"
            style={styles.imagen}
            accessibilityLabel={`Foto de ${lugar.nombre}`}
          />
        ) : (
          <View style={[styles.imagen, styles.imagenVacia, { backgroundColor: theme.backgroundSelected }]}>
            <Ionicons name="image-outline" size={32} color={theme.textSecondary} />
          </View>
        )}
        <View style={styles.detalle}>
          <View style={styles.tituloFila}>
            <ThemedText type="smallBold" style={styles.nombre}>
              {lugar.nombre}
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {categoria?.nombre ?? 'Lugar'}
          </ThemedText>
          <ThemedText type="small" numberOfLines={2}>
            {lugar.descripcionCorta}
          </ThemedText>
          <View style={styles.pie}>
            <ThemedText
              type="small"
              style={{ color: estado.abierto ? '#247A3D' : theme.textSecondary, flexShrink: 1 }}
            >
              {estado.mensaje}
            </ThemedText>
            {distancia ? (
              <ThemedText type="smallBold" themeColor="textSecondary">
                {distancia}
              </ThemedText>
            ) : null}
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    minHeight: 128,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imagen: { width: 112, minHeight: 128 },
  imagenVacia: { alignItems: 'center', justifyContent: 'center' },
  detalle: { flex: 1, padding: 12, gap: 5, justifyContent: 'center' },
  tituloFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nombre: { flex: 1, fontSize: 17 },
  pie: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  presionada: { opacity: 0.75 },
});
