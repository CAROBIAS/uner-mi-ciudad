import type { Evento } from '@/tipos';

// Datos de prueba. Ninguna pantalla importa este archivo directamente:
// se accede a través de src/servicios (regla del PRD).
//
// Las fechas se calculan RELATIVAS A HOY para que la agenda nunca quede vacía.
//
// CASOS INCLUIDOS A PROPÓSITO:
// - Hoy: evt-001, evt-002
// - Mañana: evt-003, evt-004
// - Próximos días: evt-005 a evt-009
// - Suspendido: evt-004
// - Cancelado: evt-006
// - Ya terminó (ayer, finalizado): evt-010
// - En un lugar del catálogo (lugarId): evt-002, evt-003, evt-004, evt-006, evt-007, evt-008, evt-010, evt-017
// - Dirección suelta, sin lugar (costanera): evt-001, evt-009
// - Gratis (precio 0): evt-001, evt-005
// - Termina después de medianoche: evt-007
// - Sin imagen: evt-005, evt-009
// - evt-017: ejemplo del PRD con fecha fija (fuera de los 7 días de la agenda)

// Devuelve una fecha en formato ISO con zona de Argentina (-03:00),
// contando días desde hoy. Ej.: fecha(1, '10:00') = mañana a las 10.
function fecha(diasDesdeHoy: number, hora: string): string {
  // Se resta 3 horas para obtener la fecha de Argentina sin importar la zona del celular.
  const dia = new Date(Date.now() - 3 * 60 * 60 * 1000);
  dia.setUTCDate(dia.getUTCDate() + diasDesdeHoy);
  const anio = dia.getUTCFullYear();
  const mes = String(dia.getUTCMonth() + 1).padStart(2, '0');
  const numeroDia = String(dia.getUTCDate()).padStart(2, '0');
  return `${anio}-${mes}-${numeroDia}T${hora}:00-03:00`;
}

export const eventosMock: Evento[] = [
  {
    id: 'evt-001',
    titulo: 'Visita guiada por la costanera',
    descripcion: 'Recorrido a pie por la costanera con un guía de la Dirección de Turismo.',
    lugarId: null,
    direccionLibre: 'Costanera Gobernador Quirós, frente al muelle',
    coordenadas: { latitud: -32.2195, longitud: -58.1330 },
    inicio: fecha(0, '17:00'),
    fin: fecha(0, '18:30'),
    imagenUrl: 'https://picsum.photos/seed/evtcostanera/800/600',
    precio: 0,
    estado: 'programado',
  },
  {
    id: 'evt-002',
    titulo: 'Recital en el anfiteatro',
    descripcion: 'Bandas de rock de la región en el anfiteatro de la costanera.',
    lugarId: 'lug-009',
    direccionLibre: null,
    coordenadas: null,
    inicio: fecha(0, '21:00'),
    fin: fecha(0, '23:30'),
    imagenUrl: 'https://picsum.photos/seed/evtrecital/800/600',
    precio: 3000,
    estado: 'programado',
  },
  {
    id: 'evt-003',
    titulo: 'Avistaje de aves en El Palmar',
    descripcion: 'Salida guiada para observar aves del parque. Llevar binoculares y agua.',
    lugarId: 'lug-008',
    direccionLibre: null,
    coordenadas: null,
    inicio: fecha(1, '07:30'),
    fin: fecha(1, '10:30'),
    imagenUrl: 'https://picsum.photos/seed/evtaves/800/600',
    precio: 5000,
    estado: 'programado',
  },
  {
    // SUSPENDIDO por lluvia.
    id: 'evt-004',
    titulo: 'Peña folclórica',
    descripcion: 'Noche de folclore con artistas locales. Suspendida por pronóstico de lluvia.',
    lugarId: 'lug-009',
    direccionLibre: null,
    coordenadas: null,
    inicio: fecha(1, '21:00'),
    fin: fecha(1, '23:59'),
    imagenUrl: 'https://picsum.photos/seed/evtpena/800/600',
    precio: 2000,
    estado: 'suspendido',
  },
  {
    // Gratis, sin imagen, dirección suelta.
    id: 'evt-005',
    titulo: 'Feria gastronómica en la plaza',
    descripcion: 'Puestos de comida regional en la plaza principal.',
    lugarId: null,
    direccionLibre: 'Plaza San Martín, Colón',
    coordenadas: { latitud: -32.2225, longitud: -58.1438 },
    inicio: fecha(2, '19:00'),
    fin: fecha(2, '23:00'),
    imagenUrl: null,
    precio: 0,
    estado: 'programado',
  },
  {
    // CANCELADO.
    id: 'evt-006',
    titulo: 'Visita guiada al museo',
    descripcion: 'Recorrido guiado por las salas del museo. Cancelado por obras.',
    lugarId: 'lug-005',
    direccionLibre: null,
    coordenadas: null,
    inicio: fecha(3, '11:00'),
    fin: fecha(3, '12:00'),
    imagenUrl: 'https://picsum.photos/seed/evtmuseo/800/600',
    precio: 0,
    estado: 'cancelado',
  },
  {
    // Termina después de medianoche (al día siguiente).
    id: 'evt-007',
    titulo: 'Noche de cerveza artesanal',
    descripcion: 'Degustación de cervezas locales con música en vivo.',
    lugarId: 'lug-011',
    direccionLibre: null,
    coordenadas: null,
    inicio: fecha(4, '21:00'),
    fin: fecha(5, '02:00'),
    imagenUrl: 'https://picsum.photos/seed/evtcerveza/800/600',
    precio: null,
    estado: 'programado',
  },
  {
    id: 'evt-008',
    titulo: 'Taller de cerámica',
    descripcion: 'Taller abierto para aprender técnicas básicas con artesanos de la feria.',
    lugarId: 'lug-012',
    direccionLibre: null,
    coordenadas: null,
    inicio: fecha(5, '17:30'),
    fin: fecha(5, '19:30'),
    imagenUrl: 'https://picsum.photos/seed/evtceramica/800/600',
    precio: 2500,
    estado: 'programado',
  },
  {
    // Dirección suelta, sin imagen.
    id: 'evt-009',
    titulo: 'Bicicleteada por la costanera',
    descripcion: 'Paseo en bicicleta para toda la familia. Salida desde el muelle.',
    lugarId: null,
    direccionLibre: 'Costanera, salida desde el muelle',
    coordenadas: { latitud: -32.2198, longitud: -58.1328 },
    inicio: fecha(6, '09:00'),
    fin: fecha(6, '11:00'),
    imagenUrl: null,
    precio: 1000,
    estado: 'programado',
  },
  {
    // Ya terminó (ayer). No debería aparecer en la agenda de hoy en adelante.
    id: 'evt-010',
    titulo: 'Charla sobre la historia de Colón',
    descripcion: 'Charla abierta con historiadores locales.',
    lugarId: 'lug-005',
    direccionLibre: null,
    coordenadas: null,
    inicio: fecha(-1, '18:00'),
    fin: fecha(-1, '19:30'),
    imagenUrl: 'https://picsum.photos/seed/evtcharla/800/600',
    precio: 0,
    estado: 'finalizado',
  },
  {
    // Ejemplo del PRD (página 10), copiado tal cual. Fecha fija.
    id: 'evt-017',
    titulo: 'Peña en el anfiteatro',
    descripcion: 'Noche de folclore con artistas de la región.',
    lugarId: 'lug-009',
    direccionLibre: null,
    coordenadas: null,
    inicio: '2026-11-14T21:00:00-03:00',
    fin: '2026-11-15T02:00:00-03:00',
    imagenUrl: 'https://api.colon.tur.ar/img/pena.jpg',
    precio: 0,
    estado: 'programado',
  },
];