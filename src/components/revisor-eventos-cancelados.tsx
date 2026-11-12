import { useEffect, useRef } from 'react';

import { useHayInternet } from '@/almacenamiento/red';
import {
    actualizarEstadoEventoGuardado,
    listarEventosGuardados,
    quitarEventoGuardado,
    type EventoGuardado,
} from '@/almacenamiento/eventos-guardados';
import { cancelarAviso, enviarAvisoAhora } from '@/avisos/avisos';
import { useSesion } from '@/hooks/use-sesion';
import { obtenerEvento } from '@/servicios/eventos';
import { ErrorServicio } from '@/servicios/comun';

// Al abrir la app, con sesión y con señal, revisa los eventos guardados
// si alguno se cancelo/suspendio avisa, cancela su recordatorio y actualiza el estado
export function RevisorEventosCancelados() {
    const { estado, usuario } = useSesion();
    const hayInternet = useHayInternet();
    const revisadoPara = useRef<string | null>(null);

    useEffect(() => {
        if (estado !== 'conSesion' || !usuario) {
            revisadoPara.current = null;
            return;
        }
        if (!hayInternet || revisadoPara.current === usuario.id) return;
        revisadoPara.current = usuario.id;
        void revisar(usuario.id);
    }, [estado, usuario, hayInternet]);

    return null;
}

async function revisar(usuarioId: string): Promise<void> {
    let guardados: EventoGuardado[];
    try {
        guardados = await listarEventosGuardados(usuarioId);
    } catch {
        return;
    }

    for (const guardado of guardados) {
        if (guardado.estado === 'cancelado' || guardado.estado === 'suspendido') continue;

        try {
            const evento = await obtenerEvento(guardado.eventoId);

            if (evento.estado === 'cancelado' || evento.estado === 'suspendido') {
                const quePaso = evento.estado === 'cancelado' ? 'se canceló' : 'se suspendió';
                await enviarAvisoAhora(
                    evento.estado === 'cancelado' ? 'Evento cancelado' : 'Evento suspendido',
                    `"${evento.titulo}" ${quePaso}.`,
                );
                if (guardado.recordatorioId) await cancelarAviso(guardado.recordatorioId);
                await actualizarEstadoEventoGuardado(usuarioId, evento.id, evento.estado);
            } else if (evento.estado !== guardado.estado) {
                await actualizarEstadoEventoGuardado(usuarioId, evento.id, evento.estado);
            }
        } catch (error) {
            // Un evento no puede cortar la revisión completa.
            if (error instanceof ErrorServicio) {
                if (error.codigo === 'EVENTO_NO_ENCONTRADO') {
                    // Lo borraron de la API: se puede limpiar el guardado.
                    await quitarEventoGuardado(usuarioId, guardado.eventoId).catch(() => undefined);
                    continue;
                }
                if (error.codigo === 'SIN_CONEXION') {
                    // Sin red no tiene sentido seguir pidiendo el resto.
                    return;
                }
            }
            if (__DEV__) console.warn('No se pudo revisar el evento', guardado.eventoId, error);
        }
    }
}