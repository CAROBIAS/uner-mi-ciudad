import type { Usuario } from '@/tipos';

// Cuentas de prueba hats que se habilite la api
// Solo lo usan los servicios, nunca las pantallas
export type CuentaPrueba = {
  email: string;
  contrasena: string;
  token: string;
  usuario: Usuario;
};

export const cuentasPrueba: CuentaPrueba[] = [
  {
    email: 'turista@colon.gob.ar',
    contrasena: 'Colon2026',
    token: 'token-prueba-turista',
    usuario: {
      id: 'usr-001',
      nombre: 'Ana Turista',
      email: 'turista@colon.gob.ar',
      avatarUrl: null,
      creadoEn: '2026-10-01T09:00:00-03:00',
      preferencias: {
        categoriasFavoritas: [],
        avisarProximidad: true,
        radioAvisoMetros: 250,
        tema: 'sistema',
      },
    },
  },
  {
    email: 'guia@colon.gob.ar',
    contrasena: 'Guia2026',
    token: 'token-prueba-guia',
    usuario: {
      id: 'usr-002',
      nombre: 'Bruno Guía',
      email: 'guia@colon.gob.ar',
      avatarUrl: null,
      creadoEn: '2026-10-01T09:00:00-03:00',
      preferencias: {
        categoriasFavoritas: ['cat-museos'],
        avisarProximidad: false,
        radioAvisoMetros: 500,
        tema: 'oscuro',
      },
    },
  },
];