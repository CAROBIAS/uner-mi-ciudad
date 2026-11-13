import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

import type { Categoria, Coordenadas, Lugar } from "@/tipos";
import {
  calcularDistanciaMetros,
  formatearDistancia,
} from "@/utils/geo";

type Props = {
  categorias: Categoria[];
  lugares: Lugar[];
  ubicacion: Coordenadas | null;
  onLugarPress: (lugarId: string) => void;
};

export type MapaHandle = {
  centrarEn: (coordenadas: Coordenadas) => void;
};

const REGION_INICIAL = {
  latitude: -32.2212,
  longitude: -58.1388,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

export const Mapa = forwardRef<MapaHandle, Props>(function Mapa(
  { categorias, lugares, ubicacion, onLugarPress },
  ref,
) {
  const mapa = useRef<MapView>(null);
  const coloresPorCategoria = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.id, categoria.color])),
    [categorias],
  );

  useImperativeHandle(
    ref,
    () => ({
      centrarEn: (coordenadas) => {
        mapa.current?.animateToRegion(
          {
            latitude: coordenadas.latitud,
            longitude: coordenadas.longitud,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          },
          500,
        );
      },
    }),
    [],
  );

  return (
    <MapView
      ref={mapa}
      style={styles.mapa}
      initialRegion={REGION_INICIAL}
      showsUserLocation={ubicacion !== null}
      showsMyLocationButton={false}
      showsCompass
      toolbarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
    >
      {lugares.map((lugar) => {
        const distancia = ubicacion
          ? `A ${formatearDistancia(
              calcularDistanciaMetros(ubicacion, lugar.coordenadas),
            )}`
          : "Distancia no disponible";

        return (
          <Marker
            key={lugar.id}
            coordinate={{
              latitude: lugar.coordenadas.latitud,
              longitude: lugar.coordenadas.longitud,
            }}
            title={lugar.nombre}
            description={distancia}
            pinColor={coloresPorCategoria.get(lugar.categoriaId) ?? "#496b7a"}
            onCalloutPress={() => onLugarPress(lugar.id)}
          />
        );
      })}
    </MapView>
  );
});

const styles = StyleSheet.create({
  mapa: {
    flex: 1,
  },
});
