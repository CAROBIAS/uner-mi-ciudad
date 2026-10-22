import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import {
  descargarLugar,
  eliminarDescarga,
  guardarFotoVisita,
  listarDescargas,
  obtenerDescarga,
} from '@/almacenamiento/archivos';
import { registrarAviso, yaSeAvisoHoy } from '@/almacenamiento/avisos-cercania';
import {
  actualizarEstadoEventoGuardado,
  guardarEvento,
  listarEventosGuardados,
  obtenerEventoGuardado,
  quitarEventoGuardado,
} from '@/almacenamiento/eventos-guardados';
import {
  agregarFavorito,
  esFavorito,
  listarFavoritos,
  quitarFavorito,
} from '@/almacenamiento/favoritos';
import {
  borrarUsuarioGuardado,
  guardarPreferencias,
  guardarUsuario,
  obtenerPreferencias,
  obtenerUsuarioGuardado,
} from '@/almacenamiento/preferencias';
import { hayInternet } from '@/almacenamiento/red';
import {
  crearVisita,
  listarVisitas,
  listarVisitasPendientes,
  marcarVisitaSubida,
} from '@/almacenamiento/visitas';
import { File, Paths } from 'expo-file-system';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { obtenerLugar } from '@/servicios/lugares';

// Pantalla TEMPORAL para probar el almacenamiento. Borrar antes de la entrega.
// Cada prueba usa un usuario o lugar nuevo para que se pueda repetir sin acumular datos.

function idPrueba(prefijo: string): string {
  return `${prefijo}-prueba-${Date.now()}`;
}

async function probarFavoritos(): Promise<string[]> {
  const u = idPrueba('usr');
  const l: string[] = ['— FAVORITOS —'];
  await agregarFavorito(u, 'lug-004');
  await agregarFavorito(u, 'lug-004'); // repetido a propósito
  await agregarFavorito(u, 'lug-005');
  l.push(`Cantidad tras agregar 3 (uno repetido): ${(await listarFavoritos(u)).length} (esperado 2)`);
  l.push(`¿lug-004 es favorito?: ${await esFavorito(u, 'lug-004')} (esperado true)`);
  await quitarFavorito(u, 'lug-004');
  l.push(`¿lug-004 después de quitarlo?: ${await esFavorito(u, 'lug-004')} (esperado false)`);
  l.push(`Favoritos de otro usuario: ${(await listarFavoritos('usr-otro')).length} (esperado 0)`);
  return l;
}

async function probarVisitas(): Promise<string[]> {
  const u = idPrueba('usr');
  const l: string[] = ['— VISITAS —'];
  const primera = await crearVisita({ usuarioId: u, lugarId: 'lug-004', origen: 'qr', fotoUri: null, nota: null });
  await crearVisita({ usuarioId: u, lugarId: 'lug-005', origen: 'manual', fotoUri: null, nota: 'Muy lindo' });
  l.push(`Visitas creadas: ${(await listarVisitas(u)).length} (esperado 2)`);
  l.push(`La primera de la lista: ${(await listarVisitas(u))[0].lugarId} (esperado lug-005, la más nueva)`);
  l.push(`Pendientes de subir: ${(await listarVisitasPendientes(u)).length} (esperado 2)`);
  await marcarVisitaSubida(primera.id);
  l.push(`Pendientes tras subir una: ${(await listarVisitasPendientes(u)).length} (esperado 1)`);
  return l;
}

async function probarPreferencias(): Promise<string[]> {
  const l: string[] = ['— PREFERENCIAS Y USUARIO —'];
  const iniciales = await obtenerPreferencias();
  l.push(
    `Iniciales: aviso ${iniciales.avisarProximidad}, ${iniciales.radioAvisoMetros} m, ${iniciales.tema} (esperado true, 250 m, sistema)`,
  );
  await guardarPreferencias({ ...iniciales, radioAvisoMetros: 500, tema: 'oscuro' });
  const cambiadas = await obtenerPreferencias();
  l.push(`Tras guardar: ${cambiadas.radioAvisoMetros} m, ${cambiadas.tema} (esperado 500 m, oscuro)`);
  await guardarPreferencias(iniciales); // dejar como estaba

  await guardarUsuario({
    id: 'usr-001',
    nombre: 'Ana Turista',
    email: 'turista@colon.gob.ar',
    avatarUrl: null,
    creadoEn: '2026-10-01T09:00:00-03:00',
    preferencias: iniciales,
  });
  l.push(`Usuario guardado: ${(await obtenerUsuarioGuardado())?.nombre} (esperado Ana Turista)`);
  await borrarUsuarioGuardado();
  l.push(`Usuario tras borrar: ${String(await obtenerUsuarioGuardado())} (esperado null)`);
  return l;
}

async function probarEventosGuardados(): Promise<string[]> {
  const u = idPrueba('usr');
  const l: string[] = ['— EVENTOS GUARDADOS —'];
  await guardarEvento(u, 'evt-002', 'rec-1', 'programado');
  l.push(`¿evt-002 guardado?: ${(await obtenerEventoGuardado(u, 'evt-002')) !== null} (esperado true)`);
  await actualizarEstadoEventoGuardado(u, 'evt-002', 'cancelado');
  l.push(`Estado tras actualizar: ${(await obtenerEventoGuardado(u, 'evt-002'))?.estado} (esperado cancelado)`);
  l.push(`Cantidad guardados: ${(await listarEventosGuardados(u)).length} (esperado 1)`);
  await quitarEventoGuardado(u, 'evt-002');
  l.push(`Cantidad tras quitar: ${(await listarEventosGuardados(u)).length} (esperado 0)`);
  return l;
}

async function probarAvisos(): Promise<string[]> {
  const lugar = idPrueba('lug');
  const l: string[] = ['— AVISOS DE CERCANÍA —'];
  l.push(`¿Ya se avisó hoy? (antes): ${await yaSeAvisoHoy(lugar)} (esperado false)`);
  await registrarAviso(lugar);
  l.push(`¿Ya se avisó hoy? (después): ${await yaSeAvisoHoy(lugar)} (esperado true)`);
  return l;
}

async function probarArchivos(): Promise<string[]> {
  const l: string[] = ['— ARCHIVOS —'];

  // 1. Foto: se crea un archivo temporal y se guarda como foto de visita.
  const temporal = new File(Paths.cache, 'foto-prueba.jpg');
  temporal.create({ overwrite: true });
  await temporal.write('foto de prueba');
  const ruta = await guardarFotoVisita(temporal.uri);
  l.push(`Foto copiada a lugar permanente: ${new File(ruta).exists && ruta !== temporal.uri} (esperado true)`);

  // 2. Descarga que QUEDA guardada (para probar en modo avión): lug-004.
  if (!(await obtenerDescarga('lug-004'))) {
    await descargarLugar(await obtenerLugar('lug-004'));
  }
  const molino = await obtenerDescarga('lug-004');
  const audioExiste = molino?.audioUri ? new File(molino.audioUri).exists : false;
  const megas = ((molino?.bytes ?? 0) / 1024 / 1024).toFixed(1);
  l.push(
    `lug-004 guardado: audio ${audioExiste ? 'sí' : 'no'}, ${molino?.imagenes.length ?? 0} foto(s), ${megas} MB (esperado: audio sí, 1 foto, más de 0 MB)`,
  );

  // 3. Descargar y eliminar: lug-009 (una sola foto). Sin internet no se puede descargar.
  try {
    await descargarLugar(await obtenerLugar('lug-009'));
    l.push(
      `¿lug-009 en la lista de descargas?: ${(await listarDescargas()).some((d) => d.lugarId === 'lug-009')} (esperado true)`,
    );
    await eliminarDescarga('lug-009');
    l.push(`¿lug-009 después de eliminarlo?: ${(await obtenerDescarga('lug-009')) !== null} (esperado false)`);
  } catch {
    l.push('lug-009: no se pudo descargar (es lo esperado SOLO si no hay internet)');
  }
  return l;
}

async function probarPersistencia(): Promise<string[]> {
  // Usuario y lugares fijos: cada vez que se entra se agrega un favorito nuevo.
  const u = 'usr-prueba-persistencia';
  await agregarFavorito(u, `lug-persistencia-${Date.now()}`);
  const cantidad = (await listarFavoritos(u)).length;
  return [
    '— SOBREVIVE AL CERRAR LA APP —',
    `Contador: ${cantidad} (sube de a 1 cada vez que entrás, también después de cerrar la app)`,
  ];
}

async function probarRed(): Promise<string[]> {
  return ['— RED —', `¿Hay internet?: ${await hayInternet()} (provisorio: siempre true)`];
}

const PRUEBAS = [
  probarFavoritos,
  probarVisitas,
  probarPreferencias,
  probarEventosGuardados,
  probarAvisos,
  probarArchivos,
  probarRed,
  probarPersistencia,
];

async function probarTodo(): Promise<string[]> {
  const lineas: string[] = [];
  for (const prueba of PRUEBAS) {
    try {
      lineas.push(...(await prueba()));
    } catch (error) {
      lineas.push(`❌ Error en ${prueba.name}: ${String(error)}`);
    }
  }
  return lineas;
}

export default function DevAlmacenamientoScreen() {
  const [resultados, setResultados] = useState<string[]>(['Probando...']);

  useEffect(() => {
    probarTodo().then(setResultados);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.lista}>
        {resultados.map((linea, indice) => (
          <ThemedText key={`${indice}-${linea}`}>{linea}</ThemedText>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  lista: { padding: 24, gap: 10 },
});