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