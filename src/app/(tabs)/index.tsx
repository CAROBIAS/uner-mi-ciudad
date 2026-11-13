import { Mapa, type MapaHandle } from "@/components/mapa";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useAvisosCercania } from "@/hooks/use-avisos-cercania";
import { useBrujula } from "@/hooks/use-brujula";
import { useTheme } from "@/hooks/use-theme";
import { useUbicacion } from "@/hooks/use-ubicacion";
import { ErrorServicio } from "@/servicios/comun";
import { obtenerCategorias, obtenerLugares } from "@/servicios/lugares";
import type { Categoria, Lugar } from "@/tipos";
import {
  calcularDistanciaMetros,
  calcularRotacionFlecha,
  formatearDistancia,
  ordenarPorDistancia,
} from "@/utils/geo";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Link, router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

function mensajeError(error: unknown): string {
  return error instanceof ErrorServicio
    ? error.message
    : "No se pudieron cargar los lugares. Probá de nuevo.";
}

export default function MapaScreen() {
  const theme = useTheme();
  const mapa = useRef<MapaHandle>(null);
  const {
    coordenadas,
    estadoPermiso,
    error: errorUbicacion,
    solicitarPermiso,
  } = useUbicacion();
  const rumboCelular = useBrujula();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargandoLugares, setCargandoLugares] = useState(true);
  const [errorLugares, setErrorLugares] = useState<string | null>(null);
  const [errorCategorias, setErrorCategorias] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<
    string | null
  >(null);

  useEffect(() => {
    let activo = true;

    void obtenerLugares()
      .then((resultado) => {
        if (!activo) return;
        setLugares(resultado.filter((lugar) => lugar.activo));
        setErrorLugares(null);
      })
      .catch((error) => {
        if (activo) setErrorLugares(mensajeError(error));
      })
      .finally(() => {
        if (activo) setCargandoLugares(false);
      });

    void obtenerCategorias()
      .then((resultado) => {
        if (!activo) return;
        setCategorias(resultado);
        setErrorCategorias(null);
      })
      .catch((error) => {
        if (activo) setErrorCategorias(mensajeError(error));
      });

    return () => {
      activo = false;
    };
  }, [reintento]);

  const lugaresVisibles = useMemo(
    () =>
      categoriaSeleccionada
        ? lugares.filter((lugar) => lugar.categoriaId === categoriaSeleccionada)
        : lugares,
    [categoriaSeleccionada, lugares],
  );
  const lugaresCercanos = useMemo(
    () =>
      coordenadas
        ? ordenarPorDistancia(lugaresVisibles, coordenadas).slice(0, 5)
        : [],
    [coordenadas, lugaresVisibles],
  );
  const errorAvisos = useAvisosCercania(
    lugares.length > 0 ? coordenadas : null,
    lugares,
    estadoPermiso === "concedido",
  );

  function reintentarCatalogo() {
    setErrorLugares(null);
    setErrorCategorias(null);
    setCargandoLugares(true);
    setReintento((actual) => actual + 1);
  }

  function centrarEnUsuario() {
    if (!coordenadas) return;

    mapa.current?.centrarEn(coordenadas);
  }

  function abrirDetalle(lugar: Lugar) {
    const distancia = coordenadas
      ? formatearDistancia(
          calcularDistanciaMetros(coordenadas, lugar.coordenadas),
        )
      : undefined;
    router.push({
      pathname: "/lugares/[id]",
      params: { id: lugar.id, ...(distancia ? { distancia } : {}) },
    });
  }
  return (
    <ThemedView style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.encabezado}>
          <ThemedText type="subtitle">Colón</ThemedText>
          <Link href="/lugares" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Buscar lugares"
              style={({ pressed }) => [
                styles.botonBuscar,
                { borderColor: theme.backgroundSelected },
                pressed && styles.presionado,
              ]}
            >
              <Ionicons name="search-outline" size={20} color={theme.text} />
              <ThemedText type="smallBold">Buscar</ThemedText>
            </Pressable>
          </Link>
        </View>

        {categorias.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtros}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: categoriaSeleccionada === null }}
              onPress={() => setCategoriaSeleccionada(null)}
              style={({ pressed }) => [
                styles.filtro,
                {
                  backgroundColor:
                    categoriaSeleccionada === null
                      ? theme.text
                      : theme.backgroundElement,
                },
                pressed && styles.presionado,
              ]}
            >
              <ThemedText
                type="smallBold"
                style={{
                  color:
                    categoriaSeleccionada === null
                      ? theme.background
                      : theme.text,
                }}
              >
                Todas
              </ThemedText>
            </Pressable>
            {categorias.map((categoria) => {
              const seleccionada = categoriaSeleccionada === categoria.id;
              return (
                <Pressable
                  key={categoria.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Filtrar por ${categoria.nombre}`}
                  accessibilityState={{ selected: seleccionada }}
                  onPress={() =>
                    setCategoriaSeleccionada(seleccionada ? null : categoria.id)
                  }
                  style={({ pressed }) => [
                    styles.filtro,
                    {
                      backgroundColor: seleccionada
                        ? theme.text
                        : theme.backgroundElement,
                    },
                    pressed && styles.presionado,
                  ]}
                >
                  <View
                    style={[
                      styles.puntoCategoria,
                      { backgroundColor: categoria.color },
                    ]}
                  />
                  <ThemedText
                    type="smallBold"
                    style={{
                      color: seleccionada ? theme.background : theme.text,
                    }}
                  >
                    {categoria.nombre}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {errorCategorias ? (
          <View style={styles.avisoCategorias}>
            <ThemedText type="small" themeColor="textSecondary">
              No se pudieron cargar los filtros por categoría: {errorCategorias}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={reintentarCatalogo}
              style={({ pressed }) => [
                styles.botonReintentar,
                pressed && styles.presionado,
              ]}
            >
              <ThemedText type="smallBold" themeColor="textSecondary">
                Reintentar
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.contenedorMapa}>
          <Mapa
            ref={mapa}
            categorias={categorias}
            lugares={lugaresVisibles}
            ubicacion={coordenadas}
            onLugarPress={(lugarId) => {
              const lugar = lugaresVisibles.find(
                (actual) => actual.id === lugarId,
              );
              if (lugar) abrirDetalle(lugar);
            }}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Centrar mapa en mi ubicación"
            disabled={!coordenadas}
            onPress={centrarEnUsuario}
            style={({ pressed }) => [
              styles.botonCentrar,
              {
                backgroundColor: theme.background,
                opacity: coordenadas ? 1 : 0.5,
              },
              pressed && styles.presionado,
            ]}
          >
            <Ionicons name="locate-outline" size={22} color={theme.text} />
          </Pressable>
        </View>
        {errorLugares ? (
          <ThemedView type="backgroundElement" style={styles.estado}>
            <ThemedText type="smallBold">{errorLugares}</ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reintentar cargar lugares"
              onPress={reintentarCatalogo}
              style={({ pressed }) => [
                styles.botonPrincipal,
                { backgroundColor: theme.text },
                pressed && styles.presionado,
              ]}
            >
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                Reintentar
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : cargandoLugares ? (
          <ThemedView type="backgroundElement" style={styles.estado}>
            <ActivityIndicator color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              Cargando lugares...
            </ThemedText>
          </ThemedView>
        ) : lugaresVisibles.length === 0 ? (
          <ThemedView type="backgroundElement" style={styles.estado}>
            <ThemedText type="smallBold">
              No hay lugares en esta categoría.
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView type="backgroundElement" style={styles.tarjetaCercanos}>
            <ThemedText type="smallBold">Cerca tuyo</ThemedText>
            {estadoPermiso === "denegado" ? (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  Para ordenar por cercanía y calcular distancias, Mi Ciudad
                  necesita tu ubicación mientras usás la app.
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void solicitarPermiso()}
                  style={({ pressed }) => [
                    styles.botonSecundario,
                    { borderColor: theme.backgroundSelected },
                    pressed && styles.presionado,
                  ]}
                >
                  <ThemedText type="smallBold">Permitir ubicación</ThemedText>
                </Pressable>
                <Link href="/lugares" asChild>
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.botonSecundario,
                      { borderColor: theme.backgroundSelected },
                      pressed && styles.presionado,
                    ]}
                  >
                    <ThemedText type="smallBold">
                      Ver todos los lugares
                    </ThemedText>
                  </Pressable>
                </Link>
              </>
            ) : errorUbicacion ? (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  {errorUbicacion} Podés seguir mirando el mapa y reintentar.
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void solicitarPermiso()}
                  style={({ pressed }) => [
                    styles.botonSecundario,
                    { borderColor: theme.backgroundSelected },
                    pressed && styles.presionado,
                  ]}
                >
                  <ThemedText type="smallBold">Reintentar ubicación</ThemedText>
                </Pressable>
              </>
            ) : estadoPermiso === "consultando" || !coordenadas ? (
              <View style={styles.cargandoUbicacion}>
                <ActivityIndicator color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  Buscando tu ubicación...
                </ThemedText>
              </View>
            ) : lugaresCercanos.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                No hay lugares para mostrar.
              </ThemedText>
            ) : (
              lugaresCercanos.map((lugar) => {
                const distancia = formatearDistancia(
                  calcularDistanciaMetros(coordenadas, lugar.coordenadas),
                );
                const rotacionFlecha =
                  rumboCelular === null
                    ? null
                    : calcularRotacionFlecha(
                        coordenadas,
                        lugar.coordenadas,
                        rumboCelular,
                      );
                return (
                  <Pressable
                    key={lugar.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir ${lugar.nombre}, a ${distancia}${rotacionFlecha === null ? "" : ", dirección indicada por la brújula"}`}
                    onPress={() => abrirDetalle(lugar)}
                    style={({ pressed }) => [
                      styles.filaLugar,
                      pressed && styles.presionado,
                    ]}
                  >
                    {rotacionFlecha === null ? (
                      <Ionicons
                        name="location-outline"
                        size={22}
                        color={theme.textSecondary}
                      />
                    ) : (
                      <Ionicons
                        name="navigate-outline"
                        size={22}
                        color={theme.textSecondary}
                        style={{
                          transform: [{ rotate: `${rotacionFlecha}deg` }],
                        }}
                      />
                    )}
                    <View style={styles.infoLugar}>
                      <ThemedText type="smallBold">{lugar.nombre}</ThemedText>
                      <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        numberOfLines={2}
                      >
                        {lugar.descripcionCorta}
                      </ThemedText>
                    </View>
                    <ThemedText type="smallBold" themeColor="textSecondary">
                      {distancia}
                    </ThemedText>
                  </Pressable>
                );
              })
            )}
          </ThemedView>
        )}

        {errorAvisos ? (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
          >
            {errorAvisos}
          </ThemedText>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  botonBuscar: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
  },
  filtros: {
    flexDirection: "row",
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  filtro: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
  },
  puntoCategoria: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  avisoCategorias: {
    gap: Spacing.one,
  },
  botonReintentar: {
    alignSelf: "flex-start",
    paddingVertical: Spacing.one,
  },
  contenedorMapa: {
    width: "100%",
    height: 340,
    borderRadius: 14,
    overflow: "hidden",
  },
  botonCentrar: {
    position: "absolute",
    right: Spacing.two,
    bottom: Spacing.two,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  estado: {
    alignItems: "center",
    gap: Spacing.two,
    borderRadius: 14,
    padding: Spacing.three,
  },
  tarjetaCercanos: {
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cargandoUbicacion: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  filaLugar: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  infoLugar: {
    flex: 1,
    gap: 2,
  },
  botonPrincipal: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
  },
  botonSecundario: {
    minHeight: 44,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
  },
  presionado: { opacity: 0.6 },
});
