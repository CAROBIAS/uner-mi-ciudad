import type { Categoria } from '@/tipos';

// Datos de prueba. Ninguna pantalla importa este archivo directamente:
// se accede a través de src/servicios (regla del PRD).
export const categoriasMock: Categoria[] = [
  { id: 'cat-playas', nombre: 'Playas', icono: 'sunny-outline', color: '#E0A100', orden: 1 },
  { id: 'cat-termas', nombre: 'Termas', icono: 'water-outline', color: '#1E88A8', orden: 2 },
  { id: 'cat-museos', nombre: 'Museos y patrimonio', icono: 'business-outline', color: '#8E5A4A', orden: 3 },
  { id: 'cat-gastronomia', nombre: 'Gastronomía', icono: 'restaurant-outline', color: '#C2410C', orden: 4 },
  { id: 'cat-artesanias', nombre: 'Artesanías', icono: 'color-palette-outline', color: '#9333EA', orden: 5 },
  { id: 'cat-naturaleza', nombre: 'Naturaleza', icono: 'leaf-outline', color: '#2E7D32', orden: 6 },
  { id: 'cat-alojamiento', nombre: 'Alojamiento', icono: 'bed-outline', color: '#3949AB', orden: 7 },
];