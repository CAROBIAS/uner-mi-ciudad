// src/screens/AgendaScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { LoadingState, EmptyState, ErrorState } from '../components/StateMessages';

export const AgendaScreen = ({ theme, events = [], isLoading = false, isError = false, onRetry }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // 5.2 Genera "Hoy" y los 6 días siguientes dinámicamente
  const getNextSevenDays = () => {
    const days = [];
    const today = new Date();
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      let label = '';
      if (i === 0) label = 'Hoy';
      else if (i === 1) label = 'Mañana';
      else label = `${dayNames[currentDate.getDay()]} ${currentDate.getDate()}`;

      days.push({ id: i, label, date: currentDate });
    }
    return days;
  };

  const daysList = getNextSevenDays();

  // 5.4 Oculta eventos finalizados y ordena por hora (5.3)
  const filteredEvents = events
    .filter(event => !event.isFinished)
    .sort((a, b) => (a.time > b.time ? 1 : -1));

  // 5.5 Manejo de estados: Cargando y Error
  if (isLoading) return <LoadingState theme={theme} message="Cargando eventos..." />;
  if (isError) return <ErrorState theme={theme} message="Hubo un problema al cargar los eventos" onRetry={onRetry} />;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 5.1 Fila de días en la parte superior */}
      <View style={styles.daysBar}>
        <FlatList
          horizontal
          data={daysList}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.dayChip,
                {
                  backgroundColor: selectedDayIndex === index ? theme.primary : theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setSelectedDayIndex(index)}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: selectedDayIndex === index ? '#FFFFFF' : theme.textPrimary },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 5.1 & 5.3 Lista de eventos del día */}
      {filteredEvents.length === 0 ? (
        // 5.5 Mensaje cuando no hay eventos este día
        <EmptyState theme={theme} message="No hay eventos este día" />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={[styles.eventCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.eventHeader}>
                <Text style={[styles.eventTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.eventPrice, { color: theme.primary }]}>
                  {item.price === 0 || item.isFree ? 'Gratis' : `$${item.price}`}
                </Text>
              </View>

              <Text style={[styles.eventLocation, { color: theme.textSecondary }]}>
                {item.location || item.address}
              </Text>

              {/* 5.3 Etiqueta si está suspendido o cancelado */}
              {(item.isSuspended || item.isCancelled) && (
                <View style={[styles.badge, { backgroundColor: theme.error }]}>
                  <Text style={styles.badgeText}>
                    {item.isCancelled ? 'CANCELADO' : 'SUSPENDIDO'}
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  daysBar: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  dayChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  dayText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  eventCard: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  eventPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  eventLocation: {
    fontSize: 14,
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
