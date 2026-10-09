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