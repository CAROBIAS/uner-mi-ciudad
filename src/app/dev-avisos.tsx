import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { cancelarAviso, enviarAvisoAhora, pedirPermisoAvisos, programarAviso } from '@/avisos/avisos';
import { BotonFiltro } from '@/components/boton-filtro';
import { BotonGrande } from '@/components/boton-grande';
import { MensajeCargando, MensajeError, MensajeVacio } from '@/components/mensajes-estado';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// Pantalla TEMPORAL para probar los avisos (tareas 4.1 a 4.3 y 4.5) y ver los
// componentes comunes (tareas 3.1 a 3.3). Borrar antes de la entrega final.
export default function DevAvisosScreen() {
  const [resultado, setResultado] = useState('Todavía no se probó nada.');
  const [idProgramado, setIdProgramado] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string | null>(null);

  async function probarPermiso() {
    const ok = await pedirPermisoAvisos();
    setResultado(ok ? 'Permiso concedido.' : 'Sin permiso (la app sigue funcionando).');
  }

  async function probarAhora() {
    const id = await enviarAvisoAhora('Prueba inmediata', 'Si ves esto, enviarAvisoAhora funciona.');
    setResultado(id ? `Aviso enviado (id: ${id}).` : 'No se pudo enviar (¿sin permiso?).');
  }

  async function probarEnUnMinuto() {
    const enUnMinuto = new Date(Date.now() + 60 * 1000);
    const id = await programarAviso('Prueba programada', 'Este aviso se programó hace 1 minuto.', enUnMinuto);
    setIdProgramado(id);
    setResultado(id ? `Programado para dentro de 1 minuto (id: ${id}).` : 'No se pudo programar.');
  }

  async function probarCancelar() {
    if (!idProgramado) {
      setResultado('No hay ningún aviso programado para cancelar.');
      return;
    }
    await cancelarAviso(idProgramado);
    setIdProgramado(null);
    setResultado('Aviso programado cancelado: no debería llegar.');
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <ThemedText type="smallBold">Avisos</ThemedText>
        <BotonGrande titulo="1. Pedir permiso" onPress={() => void probarPermiso()} />
        <BotonGrande titulo="2. Enviar aviso ahora" onPress={() => void probarAhora()} />
        <BotonGrande titulo="3. Programar aviso en 1 minuto" onPress={() => void probarEnUnMinuto()} />
        <BotonGrande titulo="4. Cancelar aviso programado" onPress={() => void probarCancelar()} variante="secundario" />
        <ThemedText themeColor="textSecondary">{resultado}</ThemedText>

        <ThemedText type="smallBold">Botón grande</ThemedText>
        <BotonGrande titulo="Principal" onPress={() => setResultado('Tocaste Principal.')} />
        <BotonGrande titulo="Secundario" onPress={() => setResultado('Tocaste Secundario.')} variante="secundario" />
        <BotonGrande titulo="Deshabilitado" onPress={() => setResultado('Esto no debería pasar.')} deshabilitado />

        <ThemedText type="smallBold">Botón de filtro</ThemedText>
        <View style={styles.chips}>
          <BotonFiltro titulo="Todas" seleccionado={filtro === null} onPress={() => setFiltro(null)} />
          <BotonFiltro
            titulo="Playas"
            icono="sunny-outline"
            color="#E0A100"
            seleccionado={filtro === 'playas'}
            onPress={() => setFiltro('playas')}
          />
          <BotonFiltro
            titulo="Termas"
            icono="water-outline"
            color="#1E88A8"
            seleccionado={filtro === 'termas'}
            onPress={() => setFiltro('termas')}
          />
        </View>

        <ThemedText type="smallBold">Mensajes de estado</ThemedText>
        <MensajeCargando mensaje="Cargando eventos..." />
        <MensajeVacio mensaje="No hay eventos este día." />
        <MensajeError mensaje="No se pudieron cargar los eventos." onReintentar={() => setResultado('Tocaste Reintentar.')} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contenido: { padding: Spacing.four, gap: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
