# Mi Ciudad — Colón

> ⚠️ Avisos importantes para el equipo. Leer antes de empezar.

## 1. Versión de Expo Go (IMPORTANTE)

El proyecto usa **Expo SDK 57**.

Expo Go va a sacar pronto una versión nueva que **solo abre proyectos SDK 58**.
Si se les actualiza, **no van a poder abrir la app** desde el celular.

**Qué hacer (una sola vez):**
1. Abrir Play Store y buscar **Expo Go**.
2. Entrar a la ficha de la app.
3. Tocar los tres puntitos (⋮) arriba a la derecha.
4. Desmarcar **"Habilitar actualización automática"**.

**Si ya se actualizó:** abrir Expo Go, buscar el aviso que menciona el SDK y tocar
el enlace **"compatible version"** para instalar la versión que abre SDK 57.

> Esto no afecta la entrega final: el APK es una app independiente y no usa Expo Go.

## 2. Expo Go muestra "Packager is not running"

El celular no logra conectarse con la computadora. Casi siempre es porque Windows
tiene la red WiFi marcada como **Pública** y el Firewall bloquea la conexión.

**Solución:**
1. Verificar que el celular y la computadora estén en **la misma red WiFi**
   (el celular no puede estar usando datos móviles).
2. En la computadora: **Inicio → Configuración → Red e Internet → Wi-Fi →**
   tocar el nombre de la red **→ Tipo de perfil de red: Privada**.
3. En la terminal, frenar el servidor con `Ctrl + C` y volver a ejecutar:
   `npx expo start`
4. Cuando aparezca el aviso del Firewall de Windows para **Node.js**,
   tocar **Permitir acceso**.
5. Volver a escanear el código QR desde Expo Go.

> No usar `npx expo start --tunnel` como primera opción: en Windows suele
> quedar en un bucle pidiendo instalar `@expo/ngrok`.

## 3. La app se queda trabada cargando ("Bundling 99%")

Pasa a veces en la primera carga. Probar en este orden y frenar apenas funcione:

1. Hacer clic en la terminal de VS Code y apretar la tecla **`r`** (sin Enter).
2. Cerrar Expo Go del todo (botón de apps recientes → deslizar hacia arriba)
   y volver a escanear el QR.
3. Frenar el servidor con `Ctrl + C` y ejecutar `npx expo start -c`
   (borra la caché). Después volver a escanear el QR nuevo.

## 4. Comandos que NO hay que ejecutar

- **`npm audit fix --force`**: aunque npm muestre "vulnerabilities", no lo ejecuten.
  Cambia versiones de paquetes por su cuenta y rompe la compatibilidad con Expo.
- **`npm run reset-project`**: borra pantallas y componentes de la plantilla,
  incluido el soporte de modo oscuro. Se decide en la tarea de navegación,
  no lo ejecuten por su cuenta.

## 5. Cómo instalar y abrir el proyecto

**Requisitos:** Node.js (probado con v24), VS Code, GitHub Desktop y la app **Expo Go**
en el celular Android, con la actualización automática desactivada (ver sección 1).

1. Clonar el repositorio con GitHub Desktop.
2. Abrir la carpeta `uner-mi-ciudad` en VS Code (**File → Open Folder**).
3. Abrir una terminal (**Terminal → New Terminal**) e instalar las dependencias:
   `npm install`
   (solo la primera vez, o cuando alguien agrega un paquete nuevo).
4. Iniciar la app:
   `npx expo start`
5. Escanear el código QR con Expo Go. El celular y la computadora tienen que estar
   en la misma red WiFi (si falla, ver sección 2).

**Para instalar un paquete nuevo**, usar siempre `npx expo install <paquete>`,
nunca `npm install <paquete>`: así se instala la versión compatible con nuestro SDK.

## 6. Dónde va cada cosa

```
src/
  app/          Pantallas (Expo Router). Cada archivo es una pantalla.
    (tabs)/     Las 4 pestañas: Mapa, Agenda, Mi recorrido, Yo.
  components/   Componentes compartidos.
  constants/    Colores (modo claro y oscuro).
  hooks/        Funciones reutilizables de React.
  tipos/        Moldes de datos del PRD. NO SE MODIFICAN.
  mocks/        Datos de prueba. NINGUNA PANTALLA LOS IMPORTA DIRECTAMENTE.
  servicios/    La "puerta" de datos. Toda pantalla pide datos desde acá.
```

### Pantallas y sus dueños

| Pantalla | Archivo | Integrante |
|---|---|---|
| Mapa | `src/app/(tabs)/index.tsx` | 5 |
| Agenda | `src/app/(tabs)/agenda.tsx` | 6 |
| Mi recorrido | `src/app/(tabs)/recorrido.tsx` | 3 |
| Yo | `src/app/(tabs)/yo.tsx` | 3 |
| Listado de lugares | `src/app/lugares/index.tsx` | 4 |
| Ficha del lugar | `src/app/lugares/[id].tsx` | 4 |
| Descargas | `src/app/descargas.tsx` | 4 |
| Ficha del evento | `src/app/eventos/[id].tsx` | 6 |
| Ingresar | `src/app/ingresar.tsx` | 3 |
| Desbloquear con huella | `src/app/desbloquear.tsx` | 3 |
| Favoritos | `src/app/favoritos.tsx` | 3 |
| Preferencias | `src/app/preferencias.tsx` | 3 |
| Registrar visita | `src/app/registrar-visita.tsx` | 1 |
| Escanear QR | `src/app/escanear-qr.tsx` | 1 |

Cada pantalla vacía usa el componente temporal `PantallaPendiente`.
Al completar tu pantalla, reemplazalo por tu contenido.

**Para abrir una pantalla desde otra:**
```tsx
import { Link, router } from 'expo-router';

<Link href="/lugares/lug-004">Ver Molino</Link>   // como enlace
router.push(`/lugares/${lugar.id}`);               // desde un botón
```

**Íconos:** `import { Ionicons } from '@react-native-vector-icons/ionicons';`
(nunca `@expo/vector-icons`). Nombres de íconos: https://ionic.io/ionicons

## 7. Cómo pedir datos (la "puerta")

Regla del PRD: **ninguna pantalla importa `src/mocks/`**. Todo se pide a `src/servicios/`.
Hoy las funciones devuelven datos de prueba; cuando llegue la API de la cátedra
solo cambia el interior de estas funciones y **las pantallas no se tocan**.

| Función | Archivo | Devuelve | Errores posibles |
|---|---|---|---|
| `obtenerLugares()` | `servicios/lugares` | lugares activos | `SIN_CONEXION` |
| `obtenerLugar(id)` | `servicios/lugares` | un lugar | `LUGAR_NO_ENCONTRADO`, `SIN_CONEXION` |
| `obtenerCategorias()` | `servicios/lugares` | categorías ordenadas | `SIN_CONEXION` |
| `buscarLugarPorQr(texto)` | `servicios/lugares` | el lugar del QR | `QR_INVALIDO`, `LUGAR_NO_ENCONTRADO`, `SIN_CONEXION` |
| `obtenerEventos(desde, hasta)` | `servicios/eventos` | eventos que empiezan entre esas fechas | `SIN_CONEXION` |
| `obtenerEvento(id)` | `servicios/eventos` | un evento | `EVENTO_NO_ENCONTRADO`, `SIN_CONEXION` |

Todas son **asíncronas** (se usan con `await` o `.then`). Si algo falla lanzan un
`ErrorServicio`, que tiene un `codigo` (para decidir qué hacer) y un `message`
(texto listo para mostrar).

**Ejemplo de uso en una pantalla** (con mensaje de carga y de error):
```tsx
import { useEffect, useState } from 'react';

import { ErrorServicio } from '@/servicios/comun';
import { obtenerLugares } from '@/servicios/lugares';
import type { Lugar } from '@/tipos';

const [lugares, setLugares] = useState<Lugar[]>([]);
const [cargando, setCargando] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  obtenerLugares()
    .then(setLugares)
    .catch((e) => setError(e instanceof ErrorServicio ? e.message : 'Ocurrió un error.'))
    .finally(() => setCargando(false));
}, []);

// Mostrar: "Cargando..." si cargando, el error si hay error,
// "No hay lugares" si la lista está vacía, y la lista en otro caso.
```

**Reglas de los datos (PRD):** las fechas son texto ISO (`"2026-11-14T21:00:00-03:00"`)
y se convierten a `Date` recién al mostrar. Un dato que falta viene como `null`.
Precio `0` = gratis; `null` = no aplica.

### Casos raros para probar tu pantalla
- Sin teléfono: `lug-002`, `lug-006` · Sin fotos: `lug-006` · Texto larguísimo: `lug-007`
- Sin audioguía: casi todos · Con audioguía: `lug-004` a `lug-007`
- Dado de baja (no debe aparecer nunca): `lug-013`
- Evento suspendido: `evt-004` · Cancelado: `evt-006` · Dirección suelta: `evt-001`, `evt-009`

## 8. Herramientas de prueba (temporales)

- **Menú de pruebas:** en la pestaña Mapa, tocar "Menú de pruebas (temporal)".
  Tiene accesos a todas las pantallas y a **"Probar servicios"**.
- **Simular sin datos o sin conexión:** en `src/mocks/simulacion.ts` cambiar
  `MODO_SIMULACION` a `'sinDatos'` o `'sinConexion'`.
  **Volver a `'normal'` antes de hacer commit.**
- El menú de pruebas se borra antes de la entrega final.

## 9. VS Code marca en rojo una ruta nueva

Al crear una pantalla nueva, VS Code puede marcar en rojo el `href` que la usa
(error `TS2322 ... is not assignable to type ...`). No es un error real: la lista de
rutas se actualiza recién al iniciar Expo.

1. Ejecutar `npx expo start`.
2. En VS Code: `Ctrl + Shift + P` → **TypeScript: Restart TS Server**.

-------------------------------------------------------------------------------------------------------

## 10. Guardar datos en el celular (`src/almacenamiento/`)

- **`src/servicios/`** = datos que vienen de afuera (la API).
- **`src/almacenamiento/`** = datos guardados en el celular.

> ✅ **Ya guardan de verdad** (SQLite y kv-store): favoritos, visitas, eventos guardados,
> avisos de cercanía, preferencias y usuario sobreviven al cerrar la app.
> ⚠️ **Siguen provisorias:** `archivos` (no copia archivos todavía) y `red` (siempre "sí").

| Archivo | Funciones |
|---|---|
| `favoritos` | `agregarFavorito(usuarioId, lugarId)`, `quitarFavorito(usuarioId, lugarId)`, `esFavorito(usuarioId, lugarId)`, `listarFavoritos(usuarioId)` |
| `visitas` | `crearVisita({ usuarioId, lugarId, origen, fotoUri, nota })`, `listarVisitas(usuarioId)`, `listarVisitasPendientes(usuarioId)`, `marcarVisitaSubida(id)` |
| `preferencias` | `obtenerPreferencias()`, `guardarPreferencias(preferencias)`, `guardarUsuario(usuario)`, `obtenerUsuarioGuardado()`, `borrarUsuarioGuardado()` |
| `eventos-guardados` | `guardarEvento(usuarioId, eventoId, recordatorioId, estado)`, `quitarEventoGuardado(usuarioId, eventoId)`, `obtenerEventoGuardado(usuarioId, eventoId)`, `listarEventosGuardados(usuarioId)`, `actualizarEstadoEventoGuardado(usuarioId, eventoId, estado)` |
| `avisos-cercania` | `yaSeAvisoHoy(lugarId)`, `registrarAviso(lugarId)` |
| `archivos` | `guardarFotoVisita(uriTemporal)`, `descargarLugar(lugar)`, `obtenerDescarga(lugarId)`, `eliminarDescarga(lugarId)`, `listarDescargas()` |
| `red` | `hayInternet()` (para preguntar una vez), `useHayInternet()` (para pantallas que se actualizan solas) |

**Notas:**
- Una visita nueva queda siempre "pendiente de subir" (`sincronizada: false`).
- `preferencias` guarda nombre y email del usuario, **nunca** la contraseña ni el token
  (el token va en el almacenamiento seguro, Integrante 3).
- `guardarEvento` recibe el `recordatorioId` del aviso programado, para poder cancelarlo al quitar.

Ejemplo:
```tsx
import { agregarFavorito, esFavorito } from '@/almacenamiento/favoritos';

const { usuario } = useSesion();
if (usuario) await agregarFavorito(usuario.id, lugar.id);
```

Para probar todas las piezas: Mapa → Menú de pruebas → **💾 Probar almacenamiento**.

## 11. Cuenta del usuario (Integrante 3)

### Archivos principales

| Archivo | Qué hace |
|---|---|
| `src/servicios/sesion.ts` | Ingreso, cierre de sesión y `obtenerToken()`. |
| `src/providers/sesion.tsx` | Estado global de la sesión: `ingresar`, `desbloquear`, `cerrarSesion`. |
| `src/servicios/biometria.ts` | Detecta huella/rostro y pide el desbloqueo. |
| `src/hooks/use-sesion.ts` | Hook para leer la sesión desde cualquier pantalla. |
| `src/app/ingresar.tsx` | Pantalla de ingreso. |
| `src/app/desbloquear.tsx` | Pantalla de desbloqueo con huella o rostro. |
| `src/app/(tabs)/yo.tsx` | Perfil, accesos y cierre de sesión. |
| `src/app/favoritos.tsx` | Lista de favoritos. |
| `src/app/preferencias.tsx` | Preferencias del usuario. |
| `src/app/(tabs)/recorrido.tsx` | Lista de visitas. |
| `src/components/bloqueo-cuenta.tsx` | Aviso reutilizable "Necesitás una cuenta". |
| `src/components/boton-favorito.tsx` | Estrella de favorito reutilizable. |

### 11.1 Ingreso y sesión

Cuentas de prueba (solo hasta que nos den la API):

| Email | Contraseña |
|---|---|
| `turista@colon.gob.ar` | `Colon2026` |
| `guia@colon.gob.ar` | `Guia2026` |

- La pantalla valida email y contraseña de al menos 8 caracteres.
- Muestra error con credenciales incorrectas y también sin conexión
  (`MODO_SIMULACION = 'sinConexion'`).
- El teclado no tapa el botón (`KeyboardAvoidingView` + `ScrollView`).
- Al ingresar vuelve a la pantalla anterior (`router.back()`); si no hay
  historial, va a Inicio.
- El token se guarda con `expo-secure-store` en la clave `token-sesion`,
  nunca en kv-store. Los datos públicos del usuario se guardan en
  `src/almacenamiento/preferencias.ts`.
- `obtenerToken()` devuelve `string | null` y es la función que debe usar la
  "puerta" cuando se conecte la API. No leer SecureStore directamente.

Estados del provider (`useSesion()`):

| Estado | Qué significa |
|---|---|
| `cargando` | Está leyendo el token y el usuario guardado. |
| `invitado` | No hay sesión. |
| `bloqueado` | Hay token y usuario guardados, pero falta huella o rostro. |
| `conSesion` | Token válido y sesión desbloqueada. |

Al abrir la app con token guardado, la sesión sigue abierta pero queda en
`bloqueado` hasta pasar la biometría. Cerrar sesión borra el token y el usuario
guardado.

### 11.2 Desbloqueo con huella o rostro

- Al abrir la app con sesión guardada se pide la huella o el rostro
  automáticamente.
- Si el celular no tiene biometría configurada, si falla o si se cancela,
  queda el botón **Ingresar con contraseña**. Ese botón cierra la sesión
  guardada y lleva a la pantalla de ingreso.
- `disableDeviceFallback: true`: no se puede usar el PIN o patrón del celular;
  la alternativa es la contraseña de la app.
- También se puede desbloquear desde Yo.

### 11.3 Yo

- Sin cuenta: botón **Ingresar** y una línea que explica qué se gana.
- Con cuenta: inicial, nombre, email, accesos a **Favoritos**,
  **Preferencias** y **Descargas**, y **Cerrar sesión**.
- Bloqueado: botón para desbloquear.
- La fila **Descargas** lleva a `/descargas`, pantalla del Integrante 4.

### 11.4 Favoritos

La estrella está en `src/components/boton-favorito.tsx`:

```tsx
import { BotonFavorito } from '@/components/boton-favorito';

<BotonFavorito lugarId={lugar.id} />
```

- Un toque marca o desmarca.
- Sin cuenta pide ingresar.
- Guarda con las funciones de `src/almacenamiento/favoritos.ts`.
- **Pendiente de integración:** el Integrante 4 la coloca en la ficha del lugar.

La pantalla `src/app/favoritos.tsx` muestra la lista, el estado vacío, permite
quitar con confirmación y bloquea el acceso sin cuenta. Hoy usa una fila propia;
cuando el Integrante 4 entregue la tarjeta de lugar, se reemplaza por esa tarjeta.

### 11.5 Preferencias

- Interruptor "Avisarme de lugares cercanos".
- Distancia: 100, 250 o 500 m.
- Categorías favoritas: se pueden marcar varias.
- Tema: claro, oscuro o según el sistema.
- Se guardan con `src/almacenamiento/preferencias.ts` (kv-store).
- **Pendiente:** el cambio de tema lo aplica el Integrante 6 en el tema global;
  hoy `useTheme` solo lee el sistema.

### 11.6 Mi recorrido

- Botón **Registrar visita**: solo con cuenta.
- Botón **Escanear QR**: también visible sin cuenta.
- Lista de visitas con foto, nombre del lugar, fecha, nota, origen y estado
  de sincronización.
- Estado vacío con botón para registrar la primera visita.
- Sin cuenta muestra el bloqueo compartido; la lista solo se ve con sesión.

### 11.7 Bloqueo "Necesitás una cuenta"

Componente reutilizable:

```tsx
import { BloqueoCuenta } from '@/components/bloqueo-cuenta';

<BloqueoCuenta mensaje="Ingresá para ..." />
```

Ya se usa en Favoritos y Mi recorrido. **Pendiente de integración:** Integrante 1
en Registrar visita e Integrante 6 en Guardar evento.

### 11.8 Cómo probar

1. Ingresar con una cuenta de prueba.
2. Cerrar la app y volver a abrirla: debe pedir huella o rostro.
3. Probar en un celular sin biometría: debe quedar el botón de contraseña.
4. Probar credenciales incorrectas y el modo `'sinConexion'`.
5. En Yo: Favoritos, Preferencias, Descargas y Cerrar sesión.
6. En Favoritos: marcar/desmarcar desde la ficha (cuando el 4 coloque la
   estrella), quitar y probar sin cuenta.
7. En Mi recorrido: probar los botones (por ahora abren los placeholders del
   Integrante 1), el estado vacío y el bloqueo sin cuenta.
8. En Preferencias: cambiar los valores, guardar y reabrir la app.
9. Sin conexión: `MODO_SIMULACION = 'sinConexion'`, volver a `'normal'` antes de
   commitear. Favoritos y Mi recorrido guardan los IDs, pero hoy las listas no
   muestran los lugares sin conexión: falta una copia local del lugar.

### 11.9 Pendientes conocidos

- Integrar la estrella en la ficha y la tarjeta de lugar en Favoritos (Integrante 4).
- Usar el bloqueo en Registrar visita y Guardar evento (Integrantes 1 y 6).
- Aplicar el tema elegido en Preferencias (Integrante 6).
- Copia local del lugar para que Favoritos y Mi recorrido funcionen sin conexión.
- Aviso de evento cancelado (depende de los avisos del Integrante 6 y del
  guardado del Integrante 2).
- Registro: la consigna pide "Registro e ingreso"; falta definición de cátedra.
- API real: reemplazar las cuentas de prueba y manejar "no autorizado".