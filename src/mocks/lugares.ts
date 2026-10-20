import type { Lugar } from '@/tipos';

// Datos de prueba. Ninguna pantalla importa este archivo directamente:
// se accede a través de src/servicios (regla del PRD).
//
// CASOS RAROS INCLUIDOS A PROPÓSITO (para probar las pantallas):
// - Sin audioguía: casi todos (ej. lug-001)
// - Sin teléfono: lug-002, lug-006
// - Sin fotos: lug-006
// - Descripción larguísima: lug-007
// - Dado de baja (activo: false, NO debe aparecer): lug-013
// - Cerrado los lunes: lug-005
// - Dos horarios el mismo día: lug-010
// - Cierra después de medianoche: lug-011
// - Gratis (precio 0): lug-005, lug-007
// - Sin precio (null): lug-002, lug-006, lug-009
// - Con QR: lug-001, lug-004, lug-005, lug-006, lug-007. Los demás, sin QR.
//
// Coordenadas aproximadas. Imágenes de picsum.photos y audios de muestra (SoundHelix):
// la duración real del audio no coincide con duracionSegundos.

const SIN_LUNES = [0, 2, 3, 4, 5, 6] as const;

export const lugaresMock: Lugar[] = [
  {
    id: 'lug-001',
    nombre: 'Termas de Colón',
    categoriaId: 'cat-termas',
    descripcionCorta: 'Piletas termales cubiertas y al aire libre.',
    descripcion:
      'Complejo termal con piletas de agua caliente cubiertas y descubiertas, a pocas cuadras del centro.',
    coordenadas: { latitud: -32.2106, longitud: -58.1371 },
    direccion: 'Sourigues y Lavalle, Colón',
    imagenes: ['https://picsum.photos/seed/termas1/800/600', 'https://picsum.photos/seed/termas2/800/600'],
    horarios: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia: dia as 0 | 1 | 2 | 3 | 4 | 5 | 6, abre: '09:00', cierra: '22:00' })),
    telefono: '345-4423000',
    sitioWeb: null,
    precioEntrada: 9000,
    audioguia: null,
    codigoQr: 'COLON:lug-001',
    accesible: true,
    activo: true,
    actualizadoEn: '2026-09-15T10:00:00-03:00',
  },
  {
    id: 'lug-002',
    nombre: 'Playa Norte',
    categoriaId: 'cat-playas',
    descripcionCorta: 'Playa de arena sobre el río Uruguay.',
    descripcion: 'Amplia playa de arena con sombra natural y bajada al río.',
    coordenadas: { latitud: -32.2118, longitud: -58.1302 },
    direccion: 'Costanera norte, Colón',
    imagenes: ['https://picsum.photos/seed/playanorte/800/600'],
    horarios: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia: dia as 0 | 1 | 2 | 3 | 4 | 5 | 6, abre: '08:00', cierra: '20:00' })),
    telefono: null,
    sitioWeb: null,
    precioEntrada: null,
    audioguia: null,
    codigoQr: null,
    accesible: false,
    activo: true,
    actualizadoEn: '2026-09-10T09:00:00-03:00',
  },
  {
    id: 'lug-003',
    nombre: 'Playa Paso Vela',
    categoriaId: 'cat-playas',
    descripcionCorta: 'Playa tranquila al sur de la ciudad.',
    descripcion: 'Playa amplia y tranquila, ideal para ir en familia.',
    coordenadas: { latitud: -32.2335, longitud: -58.1398 },
    direccion: 'Costanera sur, Colón',
    imagenes: ['https://picsum.photos/seed/pasovela/800/600'],
    horarios: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia: dia as 0 | 1 | 2 | 3 | 4 | 5 | 6, abre: '08:00', cierra: '20:00' })),
    telefono: '345-4421500',
    sitioWeb: null,
    precioEntrada: 2000,
    audioguia: null,
    codigoQr: null,
    accesible: true,
    activo: true,
    actualizadoEn: '2026-09-10T09:00:00-03:00',
  },
  {
    // Ejemplo del PRD (página 8), copiado tal cual salvo la imagen.
    id: 'lug-004',
    nombre: 'Molino Forclaz',
    categoriaId: 'cat-museos',
    descripcionCorta: 'Molino de viento de 1888 levantado por colonos suizos.',
    descripcion: 'Construido en 1888 por Juan Bautista Forclaz ...',
    coordenadas: { latitud: -32.1904, longitud: -58.1932 },
    direccion: 'Colonia San José, Ruta Provincial 26',
    imagenes: ['https://picsum.photos/seed/molino1/800/600'],
    horarios: [
      { dia: 2, abre: '09:00', cierra: '19:00' },
      { dia: 6, abre: '10:00', cierra: '20:00' },
    ],
    telefono: '345-4421234',
    sitioWeb: null,
    precioEntrada: 1500,
    audioguia: {
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duracionSegundos: 252,
      idioma: 'es',
    },
    codigoQr: 'COLON:lug-004',
    accesible: false,
    activo: true,
    actualizadoEn: '2026-08-01T10:30:00-03:00',
  },
  {
    // Cerrado los lunes. Gratis.
    id: 'lug-005',
    nombre: 'Museo Casa de la Cultura',
    categoriaId: 'cat-museos',
    descripcionCorta: 'Historia de Colón y sus colonos.',
    descripcion: 'Museo con objetos, fotografías y documentos del archivo histórico de la ciudad.',
    coordenadas: { latitud: -32.2229, longitud: -58.1427 },
    direccion: '12 de Abril y Belgrano, Colón',
    imagenes: ['https://picsum.photos/seed/casacultura/800/600'],
    horarios: SIN_LUNES.map((dia) => ({ dia, abre: '10:00', cierra: '18:00' })),
    telefono: '345-4421800',
    sitioWeb: null,
    precioEntrada: 0,
    audioguia: {
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      duracionSegundos: 240,
      idioma: 'es',
    },
    codigoQr: 'COLON:lug-005',
    accesible: true,
    activo: true,
    actualizadoEn: '2026-09-01T12:00:00-03:00',
  },
  {
    // Sin teléfono, sin fotos, sin precio.
    id: 'lug-006',
    nombre: 'Puerto viejo',
    categoriaId: 'cat-museos',
    descripcionCorta: 'El antiguo puerto de la ciudad.',
    descripcion: 'Restos del puerto histórico por donde llegaron los primeros colonos.',
    coordenadas: { latitud: -32.2251, longitud: -58.1365 },
    direccion: 'Costanera y Alejo Peyret, Colón',
    imagenes: [],
    horarios: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia: dia as 0 | 1 | 2 | 3 | 4 | 5 | 6, abre: '07:00', cierra: '21:00' })),
    telefono: null,
    sitioWeb: null,
    precioEntrada: null,
    audioguia: {
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      duracionSegundos: 195,
      idioma: 'es',
    },
    codigoQr: 'COLON:lug-006',
    accesible: true,
    activo: true,
    actualizadoEn: '2026-08-20T08:00:00-03:00',
  },
  {
    // Descripción larguísima. Gratis.
    id: 'lug-007',
    nombre: 'Iglesia Inmaculada Concepción',
    categoriaId: 'cat-museos',
    descripcionCorta:
      'Templo principal de la ciudad, frente a la plaza, con una historia que se remonta a los primeros años de la colonia y a la llegada de familias europeas.',
    descripcion:
      'La iglesia es uno de los edificios más antiguos de Colón y forma parte de la historia de la ciudad desde sus primeros años. ' +
      'Su construcción acompañó el crecimiento del pueblo y la llegada de familias suizas, francesas, italianas y alemanas que se instalaron en la región. ' +
      'En su interior se conservan imágenes, vitrales y objetos religiosos donados por las familias fundadoras, muchos de ellos traídos desde Europa en barco. ' +
      'A lo largo del siglo XX el edificio tuvo varias reformas, pero conservó la fachada original y el campanario, que todavía se escucha desde la costanera. ' +
      'Frente a la iglesia se encuentra la plaza principal, punto de encuentro de vecinos y turistas, donde se realizan ferias, actos y celebraciones durante todo el año. ' +
      'Las visitas guiadas recorren la nave central, el altar, la sacristía y el archivo parroquial, donde se guardan registros de bautismos y casamientos de los primeros colonos. ' +
      'Se recomienda respetar los horarios de misa y mantener silencio durante la visita. ' +
      'Este texto es intencionalmente largo para comprobar que la ficha del lugar no se rompe con descripciones extensas, que el desplazamiento funciona y que la letra agrandada del teléfono no corta el contenido.',
    coordenadas: { latitud: -32.2223, longitud: -58.1441 },
    direccion: 'Plaza San Martín, Colón',
    imagenes: [
      'https://picsum.photos/seed/iglesia1/800/600',
      'https://picsum.photos/seed/iglesia2/800/600',
      'https://picsum.photos/seed/iglesia3/800/600',
    ],
    horarios: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia: dia as 0 | 1 | 2 | 3 | 4 | 5 | 6, abre: '08:00', cierra: '20:00' })),
    telefono: '345-4421100',
    sitioWeb: null,
    precioEntrada: 0,
    audioguia: {
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      duracionSegundos: 300,
      idioma: 'es',
    },
    codigoQr: 'COLON:lug-007',
    accesible: true,
    activo: true,
    actualizadoEn: '2026-09-05T11:00:00-03:00',
  },
  {
    id: 'lug-008',
    nombre: 'Parque Nacional El Palmar',
    categoriaId: 'cat-naturaleza',
    descripcionCorta: 'Palmeras yatay, senderos y avistaje de aves.',
    descripcion: 'Área protegida con palmares, senderos, miradores y playas sobre el río. Casi sin señal de celular.',
    coordenadas: { latitud: -31.8667, longitud: -58.2167 },
    direccion: 'Ruta Nacional 14, km 199',
    imagenes: ['https://picsum.photos/seed/palmar1/800/600', 'https://picsum.photos/seed/palmar2/800/600'],
    horarios: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia: dia as 0 | 1 | 2 | 3 | 4 | 5 | 6, abre: '07:00', cierra: '19:00' })),
    telefono: '3447-493049',
    sitioWeb: 'https://www.argentina.gob.ar/parquesnacionales/elpalmar',
    precioEntrada: 12000,
    audioguia: null,
    codigoQr: null,
    accesible: false,
    activo: true,
    actualizadoEn: '2026-09-20T09:00:00-03:00',
  },
  {
    // Lo usa el evento de ejemplo del PRD. Sin precio.
    id: 'lug-009',
    nombre: 'Anfiteatro de la costanera',
    categoriaId: 'cat-museos',
    descripcionCorta: 'Escenario al aire libre frente al río.',
    descripcion: 'Anfiteatro donde se hacen peñas, recitales y actos durante el año.',
    coordenadas: { latitud: -32.2189, longitud: -58.1335 },
    direccion: 'Costanera Gobernador Quirós, Colón',
    imagenes: ['https://picsum.photos/seed/anfiteatro/800/600'],
    horarios: [],
    telefono: null,
    sitioWeb: null,
    precioEntrada: null,
    audioguia: null,
    codigoQr: null,
    accesible: true,
    activo: true,
    actualizadoEn: '2026-07-30T10:00:00-03:00',
  },
  {
    // Dos horarios el mismo día (mediodía y noche).
    id: 'lug-010',
    nombre: 'Parrilla La Costanera (ficticio)',
    categoriaId: 'cat-gastronomia',
    descripcionCorta: 'Carnes a la parrilla y pescados de río.',
    descripcion: 'Restaurante familiar con parrilla y pescados de río. Abre al mediodía y a la noche.',
    coordenadas: { latitud: -32.2201, longitud: -58.1350 },
    direccion: 'Costanera y 12 de Abril, Colón',
    imagenes: ['https://picsum.photos/seed/parrilla/800/600'],
    horarios: [0, 1, 2, 3, 4, 5, 6].flatMap((dia) => [
      { dia: dia as 0 | 1 | 2 | 3 | 4 | 5 | 6, abre: '12:00', cierra: '15:00' },
      { dia: dia as 0 | 1 | 2 | 3 | 4 | 5 | 6, abre: '20:00', cierra: '23:30' },
    ]),
    telefono: '345-4425555',
    sitioWeb: null,
    precioEntrada: null,
    audioguia: null,
    codigoQr: null,
    accesible: true,
    activo: true,
    actualizadoEn: '2026-09-12T15:00:00-03:00',
  },
  {
    // Cierra después de medianoche (el cierre cuenta para el día siguiente).
    id: 'lug-011',
    nombre: 'Cervecería del Puerto (ficticio)',
    categoriaId: 'cat-gastronomia',
    descripcionCorta: 'Cerveza artesanal y música en vivo.',
    descripcion: 'Bar con cerveza artesanal local, comida rápida y música los fines de semana.',
    coordenadas: { latitud: -32.2240, longitud: -58.1380 },
    direccion: 'Alejo Peyret 100, Colón',
    imagenes: ['https://picsum.photos/seed/cerveceria/800/600'],
    horarios: [3, 4, 5, 6].map((dia) => ({ dia: dia as 0 | 1 | 2 | 3 | 4 | 5 | 6, abre: '19:00', cierra: '02:00' })),
    telefono: '345-4426666',
    sitioWeb: null,
    precioEntrada: null,
    audioguia: null,
    codigoQr: null,
    accesible: false,
    activo: true,
    actualizadoEn: '2026-09-18T20:00:00-03:00',
  },
  {
    id: 'lug-012',
    nombre: 'Feria de artesanos',
    categoriaId: 'cat-artesanias',
    descripcionCorta: 'Artesanías de la región los fines de semana.',
    descripcion: 'Puestos de artesanos locales con cerámica, tejidos, mates y trabajos en madera.',
    coordenadas: { latitud: -32.2215, longitud: -58.1390 },
    direccion: 'Parque Quirós, Colón',
    imagenes: ['https://picsum.photos/seed/feria/800/600'],
    horarios: [
      { dia: 0, abre: '17:00', cierra: '23:00' },
      { dia: 6, abre: '17:00', cierra: '23:00' },
    ],
    telefono: '345-4427777',
    sitioWeb: null,
    precioEntrada: 0,
    audioguia: null,
    codigoQr: null,
    accesible: true,
    activo: true,
    actualizadoEn: '2026-09-08T10:00:00-03:00',
  },
  {
    // DADO DE BAJA: activo false. No tiene que aparecer en ninguna pantalla.
    id: 'lug-013',
    nombre: 'Hostería del Río (ficticio)',
    categoriaId: 'cat-alojamiento',
    descripcionCorta: 'Hostería cerrada definitivamente.',
    descripcion: 'Este lugar fue dado de baja y no debería mostrarse.',
    coordenadas: { latitud: -32.2260, longitud: -58.1410 },
    direccion: 'San Martín 500, Colón',
    imagenes: ['https://picsum.photos/seed/hosteria/800/600'],
    horarios: [],
    telefono: '345-4428888',
    sitioWeb: null,
    precioEntrada: null,
    audioguia: null,
    codigoQr: null,
    accesible: false,
    activo: false,
    actualizadoEn: '2026-06-01T10:00:00-03:00',
  },
];