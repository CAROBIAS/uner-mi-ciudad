import { Ionicons } from '@react-native-vector-icons/ionicons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { guardarFotoVisita } from '@/almacenamiento/archivos';
import { crearVisita } from '@/almacenamiento/visitas';
import { BloqueoCuenta } from '@/components/bloqueo-cuenta';
import { BotonGrande } from '@/components/boton-grande';
import { MensajeCargando, MensajeError, MensajeVacio } from '@/components/mensajes-estado';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSesion } from '@/hooks/use-sesion';
import { useTheme } from '@/hooks/use-theme';
import { ErrorServicio } from '@/servicios/comun';
import { obtenerLugar, obtenerLugares } from '@/servicios/lugares';
import type { Lugar } from '@/tipos';

// REGISTRAR VISITA (Integrante 1)
// - Solo con cuenta (5.1).
// - Si llega desde la ficha de un lugar, ya trae "lugarId" (5.2).
// - Si no, se elige el lugar a mano con buscador o escaneando el QR (5.3).
//   La opción "por cercanía" (5.3.2) aparece cuando exista la ubicación (Integrante 5).
// - Foto opcional con cámara o galería (5.4) y nota opcional de hasta 250 caracteres (5.5).
// - Al guardar: copia la foto, crea la visita, vibra y vuelve a Mi recorrido (5.6 a 5.8).

const LARGO_NOTA = 250;

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function mensajeDeError(error: unknown): string {
  return error instanceof ErrorServicio ? error.message : 'No se pudieron cargar los lugares.';
}

export default function RegistrarVisitaScreen() {
  const { lugarId } = useLocalSearchParams<{ lugarId?: string }>();
  const { estado, usuario } = useSesion();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Lugar elegido
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [cargandoLugar, setCargandoLugar] = useState(Boolean(lugarId));
  const [errorLugar, setErrorLugar] = useState<string | null>(null);

  // Lista para elegir a mano
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [versionLista, setVersionLista] = useState(0);

  // Foto y nota
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);

  // 5.2: si viene desde la ficha, se busca ese lugar.
  useEffect(() => {
    if (!lugarId) return;
    let activo = true;
    obtenerLugar(lugarId)
      .then((encontrado) => {
        if (activo) setLugar(encontrado);
      })
      .catch((error: unknown) => {
        if (activo) setErrorLugar(mensajeDeError(error));
      })
      .finally(() => {
        if (activo) setCargandoLugar(false);
      });
    return () => {
      activo = false;
    };
  }, [lugarId]);

  // 5.3.1: la lista se carga solo cuando todavía no hay lugar elegido.
  const necesitaLista = !lugar && !cargandoLugar;
  useEffect(() => {
    if (!necesitaLista) return;
    let activo = true;
    obtenerLugares()
      .then((todos) => {
        if (activo) setLugares([...todos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
      })
      .catch((error: unknown) => {
        if (activo) setErrorLista(mensajeDeError(error));
      })
      .finally(() => {
        if (activo) setCargandoLista(false);
      });
    return () => {
      activo = false;
    };
  }, [necesitaLista, versionLista]);

  const lugaresVisibles = useMemo(() => {
    const termino = normalizar(busqueda);
    if (!termino) return lugares;
    return lugares.filter((item) => normalizar(item.nombre).includes(termino));
  }, [busqueda, lugares]);

  // 5.4.1: sacar la foto con la cámara.
  async function sacarFoto() {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        'Sin permiso de cámara',
        'Podés elegir una foto de la galería o registrar la visita sin foto.',
        permiso.canAskAgain
          ? [{ text: 'Entendido' }]
          : [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Abrir configuración', onPress: () => void Linking.openSettings() },
            ],
      );
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!resultado.canceled) setFotoUri(resultado.assets[0].uri);
  }

  // 5.4.2: elegir la foto de la galería.
  async function elegirDeGaleria() {
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!resultado.canceled) setFotoUri(resultado.assets[0].uri);
  }

  // 5.4.3: cambiar la foto elegida por otra.
  function cambiarFoto() {
    Alert.alert('Cambiar foto', '¿De dónde querés tomar la nueva foto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cámara', onPress: () => void sacarFoto() },
      { text: 'Galería', onPress: () => void elegirDeGaleria() },
    ]);
  }

  // 5.6 a 5.8: guardar, vibrar y volver a Mi recorrido.
  async function guardar() {
    if (!usuario || !lugar || guardando) return;
    setGuardando(true);
    try {
      // La foto de la cámara o galería es temporal: se copia a una carpeta permanente.
      const fotoPermanente = fotoUri ? await guardarFotoVisita(fotoUri) : null;
      const textoNota = nota.trim();
      await crearVisita({
        usuarioId: usuario.id,
        lugarId: lugar.id,
        origen: 'manual',
        fotoUri: fotoPermanente,
        nota: textoNota.length > 0 ? textoNota : null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      router.replace('/recorrido');
    } catch {
      Alert.alert('No se pudo guardar', 'Probá de nuevo.');
      setGuardando(false);
    }
  }

  // ---------- Pantallas según el estado ----------

  if (estado === 'cargando') {
    return (
      <ThemedView style={styles.centro}>
        <MensajeCargando mensaje="Cargando sesión..." />
      </ThemedView>
    );
  }

  // 5.1: solo con cuenta.
  if (estado !== 'conSesion' || !usuario) {
    return (
      <ThemedView style={styles.centro}>
        <BloqueoCuenta mensaje="Ingresá para registrar tus visitas en tu recorrido." />
      </ThemedView>
    );
  }

  if (cargandoLugar) {
    return (
      <ThemedView style={styles.centro}>
        <MensajeCargando mensaje="Cargando lugar..." />
      </ThemedView>
    );
  }

  if (errorLugar) {
    return (
      <ThemedView style={styles.centro}>
        <MensajeError mensaje={errorLugar} />
        <BotonGrande
          titulo="Elegir otro lugar"
          variante="secundario"
          onPress={() => {
            setErrorLugar(null);
            router.setParams({ lugarId: undefined });
          }}
        />
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.pantalla}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.contenido,
            { paddingBottom: Math.max(Spacing.five, insets.bottom + Spacing.four) },
          ]}
        >
          {!lugar ? (
            // ---------- 5.3: elegir el lugar ----------
            <>
              <ThemedText type="subtitle">¿Qué lugar visitaste?</ThemedText>

              <BotonGrande
                titulo="Escanear el QR del cartel"
                variante="secundario"
                onPress={() => router.replace('/escanear-qr')}
              />

              <ThemedText type="smallBold">O elegilo de la lista</ThemedText>
              <View style={[styles.busqueda, { borderColor: theme.backgroundSelected }]}>
                <Ionicons name="search" size={20} color={theme.textSecondary} />
                <TextInput
                  accessibilityLabel="Buscar lugar por nombre"
                  placeholder="Buscar por nombre"
                  placeholderTextColor={theme.textSecondary}
                  value={busqueda}
                  onChangeText={setBusqueda}
                  style={[styles.campoBusqueda, { color: theme.text }]}
                />
              </View>

              {cargandoLista ? <MensajeCargando mensaje="Cargando lugares..." /> : null}
              {!cargandoLista && errorLista ? (
                <MensajeError
                  mensaje={errorLista}
                  onReintentar={() => {
                    setCargandoLista(true);
                    setErrorLista(null);
                    setVersionLista((actual) => actual + 1);
                  }}
                />
              ) : null}
              {!cargandoLista && !errorLista && lugaresVisibles.length === 0 ? (
                <MensajeVacio mensaje="No hay lugares con ese nombre." />
              ) : null}

              {!cargandoLista && !errorLista
                ? lugaresVisibles.map((item) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Elegir ${item.nombre}`}
                      onPress={() => setLugar(item)}
                      style={({ pressed }) => [pressed && styles.presionado]}
                    >
                      <ThemedView type="backgroundElement" style={styles.filaLugar}>
                        <Ionicons name="location-outline" size={22} color={theme.textSecondary} />
                        <View style={styles.textos}>
                          <ThemedText type="smallBold">{item.nombre}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                            {item.direccion}
                          </ThemedText>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                      </ThemedView>
                    </Pressable>
                  ))
                : null}
            </>
          ) : (
            // ---------- Lugar elegido: foto, nota y guardar ----------
            <>
              <ThemedView type="backgroundElement" style={styles.filaLugar}>
                <Ionicons name="location" size={22} color={theme.primary} />
                <View style={styles.textos}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Visita a
                  </ThemedText>
                  <ThemedText type="smallBold">{lugar.nombre}</ThemedText>
                </View>
                {!lugarId ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cambiar de lugar"
                    onPress={() => setLugar(null)}
                    hitSlop={8}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.primary }}>
                      Cambiar
                    </ThemedText>
                  </Pressable>
                ) : null}
              </ThemedView>

              {/* 5.4: foto opcional */}
              <ThemedText type="smallBold">Foto (opcional)</ThemedText>
              {fotoUri ? (
                <View style={styles.seccion}>
                  <Image
                    source={{ uri: fotoUri }}
                    style={styles.foto}
                    contentFit="cover"
                    accessibilityLabel="Foto elegida para la visita"
                  />
                  <View style={styles.filaBotones}>
                    <View style={styles.mitad}>
                      <BotonGrande titulo="Cambiar" variante="secundario" onPress={cambiarFoto} />
                    </View>
                    <View style={styles.mitad}>
                      <BotonGrande titulo="Quitar" variante="secundario" onPress={() => setFotoUri(null)} />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.filaBotones}>
                  <View style={styles.mitad}>
                    <BotonGrande titulo="Sacar foto" variante="secundario" onPress={() => void sacarFoto()} />
                  </View>
                  <View style={styles.mitad}>
                    <BotonGrande titulo="Galería" variante="secundario" onPress={() => void elegirDeGaleria()} />
                  </View>
                </View>
              )}

              {/* 5.5: nota opcional con contador */}
              <ThemedText type="smallBold">Nota (opcional)</ThemedText>
              <TextInput
                accessibilityLabel="Nota de la visita"
                placeholder="¿Qué te pareció?"
                placeholderTextColor={theme.textSecondary}
                value={nota}
                onChangeText={setNota}
                maxLength={LARGO_NOTA}
                multiline
                style={[
                  styles.campoNota,
                  { color: theme.text, borderColor: theme.backgroundSelected },
                ]}
              />
              <ThemedText type="small" themeColor="textSecondary" style={styles.contador}>
                {nota.length}/{LARGO_NOTA}
              </ThemedText>

              {guardando ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <BotonGrande titulo="Guardar visita" onPress={() => void guardar()} />
              )}
            </>
          )}
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  contenido: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  busqueda: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  campoBusqueda: { flex: 1, minHeight: 48, fontSize: 16 },
  filaLugar: {
    minHeight: 64,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  textos: { flex: 1, gap: 2 },
  seccion: { gap: Spacing.two },
  foto: { width: '100%', height: 220, borderRadius: 14 },
  filaBotones: { flexDirection: 'row', gap: Spacing.two },
  mitad: { flex: 1 },
  campoNota: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  contador: { alignSelf: 'flex-end', marginTop: -Spacing.two },
  presionado: { opacity: 0.6 },
});