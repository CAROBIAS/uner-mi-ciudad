import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';

import { agregarFavorito, esFavorito, quitarFavorito } from '@/almacenamiento/favoritos';
import { useSesion } from '@/hooks/use-sesion';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  lugarId: string;
  tamano?: number;
};

const COLOR_FAVORITO = '#F2A900';

export function BotonFavorito({ lugarId, tamano = 28 }: Props) {
  const { usuario } = useSesion();
  const theme = useTheme();
  const [favorito, setFavorito] = useState(false);
  const [cargando, setCargando] = useState(false);

  const usuarioId = usuario?.id ?? null;

  useEffect(() => {
    let activo = true;

    if (!usuarioId) {
      setFavorito(false);
      return;
    }

    esFavorito(usuarioId, lugarId)
      .then((valor) => {
        if (activo) setFavorito(valor);
      })
      .catch(() => {
        if (activo) setFavorito(false);
      });

    return () => {
      activo = false;
    };
  }, [usuarioId, lugarId]);

  async function alternar() {
    if (!usuarioId) {
      Alert.alert('Necesitás una cuenta', 'Ingresá para guardar tus favoritos.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ingresar', onPress: () => router.push('/ingresar') },
      ]);
      return;
    }

    if (cargando) return;

    setCargando(true);

    try {
      if (favorito) {
        await quitarFavorito(usuarioId, lugarId);
        setFavorito(false);
      } else {
        await agregarFavorito(usuarioId, lugarId);
        setFavorito(true);
      }
    } catch {
      Alert.alert('Favoritos', 'No se pudo actualizar el favorito. Probá de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      accessibilityState={{ selected: favorito, disabled: cargando, busy: cargando }}
      disabled={cargando}
      hitSlop={8}
      onPress={() => void alternar()}
      style={({ pressed }) => [
        styles.boton,
        { width: tamano + 8, height: tamano + 8 },
        pressed && styles.presionado,
      ]}
    >
      {cargando ? (
        <ActivityIndicator size="small" color={theme.textSecondary} />
      ) : (
        <Ionicons
          name={favorito ? 'star' : 'star-outline'}
          size={tamano}
          color={favorito ? COLOR_FAVORITO : theme.textSecondary}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: { opacity: 0.6 },
});