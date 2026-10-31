import { router } from 'expo-router';
import {
    borrarUsuarioGuardado,
    guardarUsuario,
    obtenerUsuarioGuardado,
} from '@/almacenamiento/preferencias';

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
import { biometriaPreparada, pedirBiometria } from '@/servicios/biometria';
import type { Usuario } from '@/tipos';
import { ErrorServicio } from '@/servicios/comun';

// cargando: leyendo el token, bloqueado: falta huella o rostro, conSesion: token valido
export type EstadoSesion = 'cargando' | 'invitado' | 'bloqueado' | 'conSesion';

export type ValorSesion = {
    estado: EstadoSesion;
    usuario: Usuario | null;
    ingresar: (email: string, contrasena: string) => Promise<void>;
    desbloquear: () => Promise<boolean>;
    cerrarSesion: () => Promise<void>;
    ejecutarConToken: <T>(operacion: () => Promise<T>) => Promise<T>;
};

export const SesionContext = createContext<ValorSesion | null>(null);

export function SesionProvider({ children }: PropsWithChildren) {
    const [estado, setEstado] = useState<EstadoSesion>('cargando');
    const [usuario, setUsuario] = useState<Usuario | null>(null);

    // Si hay token guardado la sesion sigue abierta al reabrir app
    useEffect(() => {
        let activo = true;

        async function restaurar() {
            try {
                const [token, usuarioGuardado] = await Promise.all([
                    obtenerToken(),
                    obtenerUsuarioGuardado(),
                ]);

                if (!activo) return;

                if (token && usuarioGuardado) {
                    // Con token guardado, al abrir la app se pide huella o rostro
                    // Si el celular no tiene, la pantalla ofrece
                    // entrar con la contrasena
                    setUsuario(usuarioGuardado);
                    setEstado('bloqueado');
                } else {
                    setEstado('invitado');
                }
            } catch {
                if (activo) setEstado('invitado');
            }
        }

        void restaurar();

        return () => {
            activo = false;
        };
    }, []);

    const ingresar = useCallback(async (email: string, contrasena: string) => {
        const sesion = await ingresarServicio(email, contrasena);
        await guardarUsuario(sesion.usuario);
        setUsuario(sesion.usuario);
        setEstado('conSesion');
    }, []);

    const desbloquear = useCallback(async () => {
        let disponible = false;
        try {
            disponible = await biometriaPreparada();
        } catch {
            disponible = false;
        }

        if (!disponible) return false;

        const resultado = await pedirBiometria();
        if (resultado.success) {
            setEstado('conSesion');
            return true;
        }

        return false;
    }, []);

    const cerrarSesion = useCallback(async () => {
        await cerrarSesionServicio();
        await borrarUsuarioGuardado().catch(() => undefined);
        setUsuario(null);
        setEstado('invitado');
    }, []);

    const ejecutarConToken = useCallback(async <T,>(operacion: () => Promise<T>): Promise<T> => {
        try {
            return await operacion();
        } catch (error) {
            if (error instanceof ErrorServicio && error.codigo === 'NO_AUTORIZADO') {
                await cerrarSesionServicio();
                await borrarUsuarioGuardado().catch(() => undefined);
                setUsuario(null);
                setEstado('invitado');
                router.replace('/ingresar');
            }
            throw error;
        }
    }, []);

    const valor = useMemo(
        () => ({ estado, usuario, ingresar, desbloquear, cerrarSesion, ejecutarConToken }),
        [estado, usuario, ingresar, desbloquear, cerrarSesion, ejecutarConToken],
    );

    return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}