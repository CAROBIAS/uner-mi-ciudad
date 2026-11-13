import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

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

export type MapaLeafletHandle = {
  centrarEn: (coordenadas: Coordenadas) => void;
};

type MensajeMapa =
  | { tipo: "listo" }
  | { tipo: "seleccionar-lugar"; lugarId: string }
  | { tipo: "error-teselas" }
  | { tipo: "error-mapa" };

const USER_AGENT = "MiCiudadColon/1.0";

const HTML_MAPA = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #dce5e8; }
    .leaflet-control-attribution { font-size: 10px; }
    .lugar-popup { min-width: 150px; }
    .lugar-popup strong { display: block; margin-bottom: 4px; }
    .lugar-popup button { margin-top: 8px; padding: 6px 10px; }
  </style>
  <script>
    function enviar(mensaje) {
      window.ReactNativeWebView?.postMessage(JSON.stringify(mensaje));
    }
  </script>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    onerror="enviar({ tipo: 'error-mapa' })"></script>
</head>
<body>
  <div id="map" aria-label="Mapa de Colón, Entre Ríos"></div>
  <script>
    if (!window.L) {
      enviar({ tipo: 'error-mapa' });
    } else {
      const mapa = L.map('map', { zoomControl: true }).setView([-32.2212, -58.1388], 13);
      const capaLugares = L.layerGroup().addTo(mapa);
      let marcadorUsuario = null;
      let avisoTeselasEnviado = false;

      const teselas = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
      }).addTo(mapa);

      teselas.on('tileerror', () => {
        if (avisoTeselasEnviado) return;
        avisoTeselasEnviado = true;
        enviar({ tipo: 'error-teselas' });
      });

      function escaparHtml(valor) {
        return String(valor).replace(/[&<>"']/g, (caracter) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        })[caracter]);
      }

      function actualizar(datos) {
        capaLugares.clearLayers();
        (datos.lugares || []).forEach((lugar) => {
          if (!Number.isFinite(lugar.latitud) || !Number.isFinite(lugar.longitud)) return;
          const marcador = L.circleMarker([lugar.latitud, lugar.longitud], {
            radius: 8,
            color: '#ffffff',
            weight: 2,
            fillColor: lugar.color,
            fillOpacity: 1,
            bubblingMouseEvents: false
          }).bindTooltip(escaparHtml(lugar.nombre));

          marcador.bindPopup(
            '<div class="lugar-popup"><strong>' + escaparHtml(lugar.nombre) +
            '</strong><span>' + escaparHtml(lugar.distancia) +
            '</span><br><button type="button" data-lugar-id="' +
            escaparHtml(lugar.id) + '">Ver ficha</button></div>'
          );
          marcador.on('popupopen', (evento) => {
            const boton = evento.popup.getElement()?.querySelector('[data-lugar-id]');
            boton?.addEventListener('click', () =>
              enviar({ tipo: 'seleccionar-lugar', lugarId: lugar.id })
            );
          });
          marcador.addTo(capaLugares);
        });

        if (datos.ubicacion) {
          const punto = [datos.ubicacion.latitud, datos.ubicacion.longitud];
          if (!marcadorUsuario) {
            marcadorUsuario = L.circleMarker(punto, {
              radius: 9,
              color: '#ffffff',
              weight: 3,
              fillColor: '#1877f2',
              fillOpacity: 1
            }).bindTooltip('Tu ubicación').addTo(mapa);
          } else {
            marcadorUsuario.setLatLng(punto);
          }
        } else if (marcadorUsuario) {
          mapa.removeLayer(marcadorUsuario);
          marcadorUsuario = null;
        }
      }

      function recibir(evento) {
        let mensaje;
        try {
          mensaje = JSON.parse(evento.data);
        } catch {
          return;
        }
        if (mensaje.tipo === 'actualizar') actualizar(mensaje.datos);
        if (mensaje.tipo === 'centrar' && mensaje.coordenadas) {
          mapa.flyTo([mensaje.coordenadas.latitud, mensaje.coordenadas.longitud], 15);
        }
      }

      document.addEventListener('message', recibir);
      window.addEventListener('message', recibir);
      enviar({ tipo: 'listo' });
    }
  </script>
</body>
</html>`;

function esMensajeMapa(valor: unknown): valor is MensajeMapa {
  if (typeof valor !== "object" || valor === null) return false;
  const mensaje = valor as Record<string, unknown>;
  if (
    mensaje.tipo === "listo" ||
    mensaje.tipo === "error-teselas" ||
    mensaje.tipo === "error-mapa"
  ) {
    return true;
  }
  return (
    mensaje.tipo === "seleccionar-lugar" &&
    typeof mensaje.lugarId === "string"
  );
}

export const MapaLeaflet = forwardRef<MapaLeafletHandle, Props>(
  function MapaLeaflet({ categorias, lugares, ubicacion, onLugarPress }, ref) {
    const webView = useRef<WebView>(null);
    const listo = useRef(false);
    const mensajePendiente = useRef<string | null>(null);
    const [mapaListo, setMapaListo] = useState(false);
    const [errorMapa, setErrorMapa] = useState<string | null>(null);

    const enviar = useCallback((mensaje: object) => {
      const contenido = JSON.stringify(mensaje);
      if (!listo.current) {
        mensajePendiente.current = contenido;
        return;
      }
      webView.current?.postMessage(contenido);
    }, []);

    const datosMapa = useMemo(
      () => ({
        lugares: lugares.map((lugar) => ({
          id: lugar.id,
          nombre: lugar.nombre,
          latitud: lugar.coordenadas.latitud,
          longitud: lugar.coordenadas.longitud,
          distancia: ubicacion
            ? `A ${formatearDistancia(
                calcularDistanciaMetros(ubicacion, lugar.coordenadas),
              )}`
            : "Distancia no disponible",
          color:
            categorias.find((categoria) => categoria.id === lugar.categoriaId)
              ?.color ?? "#496b7a",
        })),
        ubicacion,
      }),
      [categorias, lugares, ubicacion],
    );

    useEffect(() => {
      if (mapaListo) enviar({ tipo: "actualizar", datos: datosMapa });
    }, [datosMapa, enviar, mapaListo]);

    useImperativeHandle(
      ref,
      () => ({
        centrarEn: (coordenadas) => enviar({ tipo: "centrar", coordenadas }),
      }),
      [enviar],
    );

    const manejarMensaje = useCallback(
      (evento: WebViewMessageEvent) => {
        let valor: unknown;
        try {
          valor = JSON.parse(evento.nativeEvent.data);
        } catch {
          setErrorMapa("El mapa devolvió una respuesta inválida.");
          return;
        }
        if (!esMensajeMapa(valor)) {
          setErrorMapa("El mapa devolvió una respuesta inválida.");
          return;
        }

        switch (valor.tipo) {
          case "listo":
            listo.current = true;
            setMapaListo(true);
            setErrorMapa(null);
            if (mensajePendiente.current) {
              webView.current?.postMessage(mensajePendiente.current);
              mensajePendiente.current = null;
            }
            break;
          case "seleccionar-lugar":
            onLugarPress(valor.lugarId);
            break;
          case "error-teselas":
            setErrorMapa(
              "No se pudieron cargar las teselas. Revisá tu conexión a internet.",
            );
            break;
          case "error-mapa":
            setErrorMapa(
              "No se pudo iniciar el mapa. Revisá tu conexión a internet e intentá de nuevo.",
            );
            break;
        }
      },
      [onLugarPress],
    );

    return (
      <View style={styles.contenedor}>
        <WebView
          ref={webView}
          source={{ html: HTML_MAPA }}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          nestedScrollEnabled
          scrollEnabled={false}
          userAgent={USER_AGENT}
          onMessage={manejarMensaje}
          onLoadStart={() => {
            listo.current = false;
            setMapaListo(false);
          }}
          onError={() => setErrorMapa("No se pudo abrir el mapa web.")}
          style={styles.webView}
        />
        {!mapaListo && !errorMapa ? (
          <View pointerEvents="none" style={styles.estado}>
            <ActivityIndicator />
            <Text style={styles.textoEstado}>Cargando mapa...</Text>
          </View>
        ) : null}
        {errorMapa ? (
          <View pointerEvents="none" style={styles.estadoError}>
            <Text style={styles.textoEstado}>{errorMapa}</Text>
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  webView: { flex: 1, backgroundColor: "#dce5e8" },
  estado: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#dce5e8",
  },
  estadoError: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },
  textoEstado: { color: "#222", textAlign: "center" },
});
