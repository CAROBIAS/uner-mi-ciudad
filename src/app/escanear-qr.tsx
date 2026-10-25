import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { crearVisita } from '@/almacenamiento/visitas';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSesion } from '@/hooks/use-sesion';
import { ErrorServicio } from '@/servicios/comun';
import { buscarLugarPorQr } from '@/servicios/lugares';

// ESCANEAR QR (Integrante 1)
// - Sin cuenta: lee el cartel y abre la ficha del lugar.
// - Con cuenta: además registra la visita (origen "qr").
// - Un QR ajeno o roto muestra un mensaje y deja escanear otra vez.

type Estado = { tipo: 'escaneando' } | { tipo: 'buscando' } | { tipo: 'error'; mensaje: string };

function Boton({ texto, alPresionar }: { texto: string; alPresionar: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={alPresionar}
      style={({ pressed }) => [styles.boton, pressed && styles.botonPresionado]}
    >
      <ThemedText style={styles.textoBoton}>{texto}</ThemedText>
    </Pressable>
  );
}

export default function EscanearQrScreen() {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const { estado: estadoSesion, usuario } = useSesion();
  const [estado, setEstado] = useState<Estado>({ tipo: 'escaneando' });
  // La cámara puede avisar varias veces el mismo código en un segundo: se procesa uno solo.
  const leyendo = useRef(false);

  async function alLeerCodigo({ data }: BarcodeScanningResult) {
    if (leyendo.current) return;
    leyendo.current = true;
    setEstado({ tipo: 'buscando' });
    try {
      const lugar = await buscarLugarPorQr(data);
      if (estadoSesion === 'conSesion' && usuario) {
        await crearVisita({
          usuarioId: usuario.id,
          lugarId: lugar.id,
          origen: 'qr',
          fotoUri: null,
          nota: null,
        });
        Alert.alert('Visita registrada', `Registramos tu visita a ${lugar.nombre}.`);
      }
      router.replace({ pathname: '/lugares/[id]', params: { id: lugar.id } });
    } catch (error) {
      const mensaje =
        error instanceof ErrorServicio ? error.message : 'No pudimos leer el código. Probá de nuevo.';
      setEstado({ tipo: 'error', mensaje });
    }
  }

  function escanearOtraVez() {
    leyendo.current = false;
    setEstado({ tipo: 'escaneando' });
  }

  // Todavía no se sabe si hay permiso.
  if (!permiso) {
    return (
      <ThemedView style={styles.centrado}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  // Sin permiso de cámara (tarea 6.1).
  if (!permiso.granted) {
    return (
      <ThemedView style={styles.centrado}>
        <ThemedText type="subtitle" style={styles.textoCentrado}>
          Necesitamos la cámara
        </ThemedText>
        <ThemedText style={styles.textoCentrado}>
          La usamos solo para leer el código QR de los carteles de cada lugar.
        </ThemedText>
        {permiso.canAskAgain ? (
          <Boton texto="Permitir cámara" alPresionar={() => void pedirPermiso()} />
        ) : (
          <Boton texto="Abrir configuración" alPresionar={() => void Linking.openSettings()} />
        )}
        <Boton texto="Elegir el lugar a mano" alPresionar={() => router.replace('/lugares')} />
      </ThemedView>
    );
  }

  return (
    <View style={styles.contenedor}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={estado.tipo === 'escaneando' ? alLeerCodigo : undefined}
      />
      <ThemedView style={styles.panel}>
        {estado.tipo === 'escaneando' && (
          <ThemedText style={styles.textoCentrado}>Apuntá al código QR del cartel.</ThemedText>
        )}
        {estado.tipo === 'buscando' && (
          <View style={styles.fila}>
            <ActivityIndicator />
            <ThemedText>Buscando el lugar...</ThemedText>
          </View>
        )}
        {estado.tipo === 'error' && (
          <>
            <ThemedText style={styles.textoCentrado}>{estado.mensaje}</ThemedText>
            <Boton texto="Escanear otra vez" alPresionar={escanearOtraVez} />
          </>
        )}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'flex-end' },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  textoCentrado: { textAlign: 'center' },
  panel: { margin: 16, padding: 16, borderRadius: 12, gap: 12, alignItems: 'center' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  boton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 220,
    alignItems: 'center',
  },
  botonPresionado: { opacity: 0.7 },
  textoBoton: { color: '#FFFFFF', fontWeight: '600' },
});