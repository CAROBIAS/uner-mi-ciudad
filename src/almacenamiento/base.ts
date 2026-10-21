import * as SQLite from 'expo-sqlite';

// BASE DE DATOS DEL CELULAR (Integrante 2)
// Se abre sola la primera vez que una función la necesita, y crea las tablas si no existen.
// Número de versión (tarea 2.4): si más adelante cambia una tabla, se sube VERSION_ACTUAL
// y se agrega un bloque "if (version < 2) { ... }" sin borrar los datos existentes.

const NOMBRE_BASE = 'mi-ciudad.db';
const VERSION_ACTUAL = 1;

let basePromesa: Promise<SQLite.SQLiteDatabase> | null = null;

export function obtenerBase(): Promise<SQLite.SQLiteDatabase> {
  if (!basePromesa) {
    basePromesa = abrirYPreparar().catch((error) => {
      basePromesa = null; // permite reintentar la próxima vez
      throw error;
    });
  }
  return basePromesa;
}

async function abrirYPreparar(): Promise<SQLite.SQLiteDatabase> {
  const base = await SQLite.openDatabaseAsync(NOMBRE_BASE);

  const fila = await base.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = fila?.user_version ?? 0;

  if (version < 1) {
    await base.execAsync(`
      CREATE TABLE IF NOT EXISTS lugares_copia (
        id TEXT PRIMARY KEY NOT NULL,
        datos TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS categorias_copia (
        id TEXT PRIMARY KEY NOT NULL,
        datos TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS favoritos (
        id TEXT PRIMARY KEY NOT NULL,
        usuario_id TEXT NOT NULL,
        lugar_id TEXT NOT NULL,
        creado_en TEXT NOT NULL,
        UNIQUE (usuario_id, lugar_id)
      );
      CREATE TABLE IF NOT EXISTS visitas (
        id TEXT PRIMARY KEY NOT NULL,
        usuario_id TEXT NOT NULL,
        lugar_id TEXT NOT NULL,
        fecha_hora TEXT NOT NULL,
        origen TEXT NOT NULL,
        foto_uri TEXT,
        nota TEXT,
        sincronizada INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS eventos_guardados (
        usuario_id TEXT NOT NULL,
        evento_id TEXT NOT NULL,
        recordatorio_id TEXT,
        estado TEXT NOT NULL,
        guardado_en TEXT NOT NULL,
        PRIMARY KEY (usuario_id, evento_id)
      );
      CREATE TABLE IF NOT EXISTS avisos_cercania (
        lugar_id TEXT NOT NULL,
        fecha TEXT NOT NULL,
        PRIMARY KEY (lugar_id, fecha)
      );
    `);
  }

  if (version < VERSION_ACTUAL) {
    await base.execAsync(`PRAGMA user_version = ${VERSION_ACTUAL}`);
  }

  return base;
}
