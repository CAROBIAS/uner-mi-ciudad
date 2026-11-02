// src/screens/EventDetailScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { CustomButton } from '../components/CustomButton';

export const EventDetailScreen = ({ 
  event, 
  theme, 
  userHasAccount = true, // 7.1 Requisito de cuenta
  onNavigateToCatalog,
  onOpenMap,
  onScheduleNotification,
  onCancelNotification
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [notificationId, setNotificationId] = useState(null);

  if (!event) return null;

  // 6.1 Manejo de hora de fin o "sin hora de fin"
  const timeText = event.endTime 
    ? `${event.startTime} - ${event.endTime}`
    : `${event.startTime} (sin hora de fin)`;

  // 7.1 - 7.3 Guardar/Quitar evento y programar/cancelar notificación
  const handleToggleSave = async () => {
    if (!userHasAccount) return;

    if (isSaved) {
      // 7.3 Al quitar, cancelar el aviso
      if (notificationId) {
        await onCancelNotification(notificationId);
        setNotificationId(null);
      }
      setIsSaved(false);
    } else {
      setIsSaved(true);
      // 7.2 Programar aviso 30 min antes si no empezó, canceló ni terminó
      if (!event.isFinished && !event.isCancelled && onScheduleNotification) {
        const id = await onScheduleNotification(
          `Recordatorio: ${event.title}`,
          `El evento empieza en 30 minutos`,
          event.startTime
        );
        setNotificationId(id);
      }
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 6.1 Imagen del evento */}
      {event.imageUrl && (
        <Image source={{ uri: event.imageUrl }} style={styles.image} resizeMode="cover" />
      )}

      <View style={styles.content}>
        {/* 6.1 Título */}
        <Text style={[styles.title, { color: theme.textPrimary }]}>{event.title}</Text>

        {/* 6.4 Etiqueta si está suspendido o cancelado */}
        {(event.isSuspended || event.isCancelled) && (
          <View style={[styles.badge, { backgroundColor: theme.error }]}>
            <Text style={styles.badgeText}>
              {event.isCancelled ? 'CANCELADO' : 'SUSPENDIDO'}
            </Text>
          </View>
        )}

        {/* 6.3 Precio (0 o gratis) */}
        <Text style={[styles.price, { color: theme.primary }]}>
          {event.price === 0 || event.isFree ? 'Gratis' : `$${event.price}`}
        </Text>

        {/* 6.1 Horario */}
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          🕒 {timeText}
        </Text>

        {/* 6.2 Dónde es */}
        <View style={styles.locationContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Ubicación:</Text>
          {event.catalogPlaceId ? (
            // 6.2.1 Enlace a la ficha del lugar del catálogo
            <TouchableOpacity onPress={() => onNavigateToCatalog(event.catalogPlaceId)}>
              <Text style={[styles.linkText, { color: theme.primary }]}>
                📍 {event.locationName} (Ver ficha del lugar)
              </Text>
            </TouchableOpacity>
          ) : (
            // 6.2.2 Dirección suelta
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              📍 {event.address}
            </Text>
          )}

          {/* 6.2.3 Botón "Cómo llegar" (Integrante 5) */}
          <CustomButton
            title="Cómo llegar"
            onPress={onOpenMap}
            variant="secondary"
            theme={theme}
          />
        </View>

        {/* 6.1 Descripción */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Descripción:</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {event.description}
        </Text>

        {/* 7.1 Botón Guardar / Quitar (Solo con cuenta) */}
        {userHasAccount && (
          <View style={styles.saveButtonContainer}>
            <CustomButton
              title={isSaved ? "Quitar de guardados" : "Guardar evento"}
              onPress={handleToggleSave}
              variant={isSaved ? "secondary" : "primary"}
              theme={theme}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 220,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  infoText: {
    fontSize: 16,
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 6,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  linkText: {
    fontSize: 16,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  locationContainer: {
    marginVertical: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginVertical: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButtonContainer: {
    marginTop: 24,
  },
});
