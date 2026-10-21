import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
    type PropsWithChildren,
} from 'react';

import {
    cerrarSesion as cerrarSesionServicio,
    ingresar as ingresarServicio,
    obtenerToken,
} from '@/servicios/sesion';
import type { Usuario } from '@/tipos';

// cargando: leyendo el token, bloqueado: falta huella o rostro, conSesion: token valido
export type EstadoSesion = 'cargando' | 'invitado' | 'bloqueado' | 'conSesion';

export type ValorSesion = {
    estado: EstadoSesion;
    usuario: Usuario | null;
    ingresar: (email: string, contrasena: string) => Promise<void>;
    cerrarSesion: () => Promise<void>;
};

export const SesionContext = createContext<ValorSesion | null>(null);

export function SesionProvider({ children }: PropsWithChildren) {
    const [estado, setEstado] = useState<EstadoSesion>('cargando');
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    // Si hay token guardado la sesion sigue abierta al reabrir app
    useEffect(() => {
        let activo = true;

        obtenerToken()
            .then((token) => {
                if (activo) setEstado(token ? 'conSesion' : 'invitado');
            })
            .catch(() => {
                if (activo) setEstado('invitado');
            });

        return () => {
            activo = false;
        };
    }, []);

    const ingresar = useCallback(async (email: string, contrasena: string) => {
        const sesion = await ingresarServicio(email, contrasena);
        setUsuario(sesion.usuario);
        setEstado('conSesion');
    }, []);

    const cerrarSesion = useCallback(async () => {
        await cerrarSesionServicio();
        setUsuario(null);
        setEstado('invitado');
    }, []);

    const valor = useMemo(
        () => ({ estado, usuario, ingresar, cerrarSesion }),
        [estado, usuario, ingresar, cerrarSesion],
    );

    return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}