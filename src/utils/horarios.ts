import type { Horario, Lugar } from '@/tipos';

const NOMBRES_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export type EstadoHorario = {
  abierto: boolean;
  mensaje: string;
};

function minutos(hora: string): number {
  const [horas, minutosHora] = hora.split(':').map(Number);
  return horas * 60 + minutosHora;
}

function inicioDelDia(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  resultado.setHours(0, 0, 0, 0);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

function construirIntervalos(horarios: Horario[], ahora: Date) {
  const intervalos: { inicio: Date; fin: Date }[] = [];

  for (let desplazamiento = -1; desplazamiento <= 7; desplazamiento++) {
    const fechaDia = inicioDelDia(ahora, desplazamiento);
    const diaSemana = fechaDia.getDay();

    for (const horario of horarios) {
      if (horario.dia !== diaSemana) continue;

      const inicio = new Date(fechaDia);
      inicio.setMinutes(minutos(horario.abre));
      const fin = new Date(fechaDia);
      fin.setMinutes(minutos(horario.cierra));

      if (fin <= inicio) fin.setDate(fin.getDate() + 1);
      intervalos.push({ inicio, fin });
    }
  }

  return intervalos.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
}

function horaLegible(fecha: Date): string {
  return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function diferenciaEnDias(fecha: Date, referencia: Date): number {
  const fechaUtc = Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const referenciaUtc = Date.UTC(
    referencia.getFullYear(),
    referencia.getMonth(),
    referencia.getDate(),
  );
  return Math.round((fechaUtc - referenciaUtc) / 86_400_000);
}

export function calcularEstadoHorario(horarios: Horario[], ahora = new Date()): EstadoHorario {
  const intervalos = construirIntervalos(horarios, ahora);
  const ahoraMs = ahora.getTime();
  const abiertoHasta = intervalos.find(
    (intervalo) => intervalo.inicio.getTime() <= ahoraMs && ahoraMs < intervalo.fin.getTime(),
  );

  if (abiertoHasta) {
    const minutosRestantes = Math.ceil((abiertoHasta.fin.getTime() - ahoraMs) / 60_000);
    const cierre = horaLegible(abiertoHasta.fin);
    return {
      abierto: true,
      mensaje:
        minutosRestantes <= 30
          ? `Cierra pronto · cierra ${cierre}`
          : `Abierto ahora · cierra ${cierre}`,
    };
  }

  const proximaApertura = intervalos.find((intervalo) => intervalo.inicio.getTime() > ahoraMs);
  if (!proximaApertura) return { abierto: false, mensaje: 'Cerrado' };

  const diasHastaApertura = diferenciaEnDias(proximaApertura.inicio, ahora);
  const etiquetaDia =
    diasHastaApertura === 0
      ? 'Abre hoy'
      : diasHastaApertura === 1
        ? 'Abre mañana'
        : `Abre el ${NOMBRES_DIA[proximaApertura.inicio.getDay()]}`;

  return {
    abierto: false,
    mensaje: `${etiquetaDia} ${horaLegible(proximaApertura.inicio)}`,
  };
}

export function horarioPorDia(horarios: Horario[], dia: number): string {
  const delDia = horarios
    .filter((horario) => horario.dia === dia)
    .sort((a, b) => minutos(a.abre) - minutos(b.abre));

  if (delDia.length === 0) return 'Cerrado';
  return delDia.map(({ abre, cierra }) => `${abre}–${cierra}`).join(' · ');
}

export function nombreDia(dia: number): string {
  return NOMBRES_DIA[dia];
}

export function estadoHorarioLugar(lugar: Lugar, ahora = new Date()): EstadoHorario {
  return calcularEstadoHorario(lugar.horarios, ahora);
}
