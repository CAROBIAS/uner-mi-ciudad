import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { guardarPreferencias, obtenerPreferencias } from '@/almacenamiento/preferencias';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { obtenerCategorias } from '@/servicios/lugares';
import type { Categoria, Preferencias } from '@/tipos';

const TEMAS = ['claro', 'oscuro', 'sistema'] as const;
const ETIQUETAS_TEMA: Record<Preferencias['tema'], string> = {
  claro: 'Claro',
  oscuro: 'Oscuro',
  sistema: 'Sistema',
};

const RADIOS = [100, 250, 500] as const;

export default function PreferenciasScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [preferencias, setPreferencias] = useState<Preferencias | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const [preferenciasGuardadas, categoriasDisponibles] = await Promise.all([
          obtenerPreferencias(),
          obtenerCategorias(),
        ]);

        if (!activo) return;
        setPreferencias(preferenciasGuardadas);
        setCategorias(categoriasDisponibles);
        // Si falla la carga se muestra Reintentar en vez de un formulario vacío
      } catch {
        if (activo) setError('No se pudieron cargar las preferencias.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar();

    return () => {
      activo = false;
    };
  }, [version]);

  // Los cambios quedan en pantalla y solo se guardan al tocar el botón
  function cambiar(cambio: Partial<Preferencias>) {
    setPreferencias((previas) => (previas ? { ...previas, ...cambio } : previas));
    setGuardado(false);
    setError(null);
  }

  // Se guardan ids, no nombres para que sigan valiendo si cambia una categoria
  function alternarCategoria(id: string) {
    if (!preferencias) return;

    const activa = preferencias.categoriasFavoritas.includes(id);
    cambiar({
      categoriasFavoritas: activa
        ? preferencias.categoriasFavoritas.filter((categoria) => categoria !== id)
        : [...preferencias.categoriasFavoritas, id],
    });
  }

  async function guardar() {
    if (!preferencias || guardando) return;

    setGuardando(true);
    setError(null);
    setGuardado(false);

    try {
      await guardarPreferencias(preferencias);
      setGuardado(true);
    } catch {
      setError('No se pudieron guardar las preferencias.');
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <ThemedView style={styles.centro}>
        <ActivityIndicator />
        <ThemedText themeColor="textSecondary">Cargando preferencias...</ThemedText>
      </ThemedView>
    );
  }

  if (!preferencias) {
    return (
      <ThemedView style={styles.centro}>
        <ThemedText type="smallBold">
          {error ?? 'No se pudieron cargar las preferencias.'}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
          onPress={() => setVersion((valor) => valor + 1)}
          style={({ pressed }) => [
            styles.boton,
            { backgroundColor: theme.text },
            pressed && styles.presionado,
          ]}
        >
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            Reintentar
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.pantalla}>
      <ScrollView contentContainerStyle={[
        styles.contenido,
        { paddingBottom: Math.max(Spacing.five, insets.bottom + Spacing.four) },
      ]}>
        <View style={styles.encabezado}>
          <ThemedText type="subtitle">Preferencias</ThemedText>
          <ThemedText themeColor="textSecondary">Ajustá cómo querés usar la app.</ThemedText>
        </View>

        <ThemedView type="backgroundElement" style={styles.seccion}>
          <ThemedText type="smallBold">Tema</ThemedText>
          <View style={styles.opciones}>
            {TEMAS.map((tema) => {
              const activo = preferencias.tema === tema;

              return (
                <Pressable
                  key={tema}
                  accessibilityRole="button"
                  accessibilityLabel={`Tema ${ETIQUETAS_TEMA[tema]}`}
                  onPress={() => cambiar({ tema })}
                  style={({ pressed }) => [
                    styles.opcion,
                    { backgroundColor: activo ? theme.text : theme.backgroundSelected },
                    pressed && styles.presionado,
                  ]}
                >
                  <ThemedText
                    type="smallBold"
                    style={{ color: activo ? theme.background : theme.text }}
                  >
                    {ETIQUETAS_TEMA[tema]}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.seccion}>
          <View style={styles.fila}>
            <View style={styles.textoFila}>
              <ThemedText type="smallBold">Avisos de proximidad</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Avisarte cuando estés cerca de un lugar.
              </ThemedText>
            </View>
            <Switch
              accessibilityLabel="Avisos de proximidad"
              onValueChange={(valor) => cambiar({ avisarProximidad: valor })}
              thumbColor={theme.background}
              trackColor={{ false: theme.backgroundSelected, true: theme.textSecondary }}
              value={preferencias.avisarProximidad}
            />
          </View>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.seccion}>
          <ThemedText type="smallBold">Distancia del aviso</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            A qué distancia querés que te avisemos.
          </ThemedText>
          <View style={styles.opciones}>
            {RADIOS.map((radio) => {
              const activo = preferencias.radioAvisoMetros === radio;

              return (
                <Pressable
                  key={radio}
                  accessibilityRole="button"
                  accessibilityLabel={`Avisar a ${radio} metros`}
                  onPress={() => cambiar({ radioAvisoMetros: radio })}
                  style={({ pressed }) => [
                    styles.opcion,
                    { backgroundColor: activo ? theme.text : theme.backgroundSelected },
                    pressed && styles.presionado,
                  ]}
                >
                  <ThemedText
                    type="smallBold"
                    style={{ color: activo ? theme.background : theme.text }}
                  >
                    {radio} m
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.seccion}>
          <ThemedText type="smallBold">Categorías favoritas</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Elegí las que más te interesan.
          </ThemedText>
          <View style={styles.chips}>
            {categorias.map((categoria) => {
              const activa = preferencias.categoriasFavoritas.includes(categoria.id);

              return (
                <Pressable
                  key={categoria.id}
                  accessibilityRole="button"
                  accessibilityLabel={categoria.nombre}
                  onPress={() => alternarCategoria(categoria.id)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: activa ? theme.backgroundSelected : 'transparent',
                      borderColor: activa ? theme.text : theme.backgroundSelected,
                    },
                    pressed && styles.presionado,
                  ]}
                >
                  <View style={[styles.punto, { backgroundColor: categoria.color }]} />
                  <ThemedText
                    type="small"
                    style={activa ? styles.chipActivo : undefined}
                  >
                    {categoria.nombre}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </ThemedView>

        {error ? (
          <ThemedText type="small" style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </ThemedText>
        ) : null}

        {guardado ? (
          <ThemedText type="small" style={styles.exito} accessibilityLiveRegion="polite">
            Preferencias guardadas.
          </ThemedText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Guardar preferencias"
          accessibilityState={{ busy: guardando, disabled: guardando }}
          disabled={guardando}
          onPress={guardar}
          style={({ pressed }) => [
            styles.boton,
            { backgroundColor: theme.text },
            (pressed || guardando) && styles.presionado,
          ]}
        >
          {guardando ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              Guardar preferencias
            </ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  encabezado: { gap: Spacing.two },
  seccion: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  textoFila: { flex: 1, gap: 2 },
  opciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  opcion: {
    flexGrow: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  punto: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chipActivo: { fontWeight: 700 },
  boton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  presionado: { opacity: 0.6 },
  error: { color: '#C62828' },
  exito: { color: '#2E7D32' },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
});