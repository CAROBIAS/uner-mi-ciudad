// AVISOS DE CERCANÍA YA ENVIADOS (Integrante 2)
// Sirve para no avisar dos veces el mismo día del mismo lugar.
// PIEZA PROVISORIA: guarda en memoria (se borra al cerrar la app).
// Después se reemplaza por SQLite SIN cambiar los nombres de las funciones.

type AvisoEnviado = {
  lugarId: string;
  fecha: string; // "AAAA-MM-DD" (día en Argentina)
};

let avisos: AvisoEnviado[] = [];

// Fecha de hoy en Argentina, sin importar la zona horaria del celular.
function fechaDeHoy(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function yaSeAvisoHoy(lugarId: string): Promise<boolean> {
  const hoy = fechaDeHoy();
  return avisos.some((a) => a.lugarId === lugarId && a.fecha === hoy);
}

export async function registrarAviso(lugarId: string): Promise<void> {
  avisos = [...avisos, { lugarId, fecha: fechaDeHoy() }];
}
