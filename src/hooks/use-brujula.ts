import { Magnetometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";

export function useBrujula() {
  const [rumboGrados, setRumboGrados] = useState<number | null>(null);
  const ultimoRumbo = useRef<number | null>(null);

  useEffect(() => {
    let activa = true;
    let suscripcion: ReturnType<typeof Magnetometer.addListener> | null = null;

    async function iniciar() {
      try {
        if (!(await Magnetometer.isAvailableAsync()) || !activa) return;

        Magnetometer.setUpdateInterval(250);
        suscripcion = Magnetometer.addListener(({ x, y }) => {
          if (!activa) return;

          const medido = (Math.atan2(y, x) * 180) / Math.PI;
          const normalizado = (medido + 360) % 360;
          const anterior = ultimoRumbo.current;
          const suavizado =
            anterior === null
              ? normalizado
              : (anterior +
                  (((normalizado - anterior + 540) % 360) - 180) * 0.25 +
                  360) %
                360;

          ultimoRumbo.current = suavizado;
          setRumboGrados(suavizado);
        });
      } catch {
        if (activa) setRumboGrados(null);
      }
    }

    void iniciar();

    return () => {
      activa = false;
      suscripcion?.remove();
    };
  }, []);

  return rumboGrados;
}
