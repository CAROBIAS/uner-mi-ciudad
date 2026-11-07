// src/components/StateMessages.js
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { CustomButton } from './CustomButton';

export const LoadingState = ({ theme, message = "Cargando..." }) => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color={theme.primary} />
    <Text style={[styles.text, { color: theme.textSecondary }]}>{message}</Text>
  </View>
);

export const EmptyState = ({ theme, message = "No hay nada por aquí" }) => (
  <View style={styles.centerContainer}>
    <Text style={[styles.text, { color: theme.textSecondary }]}>{message}</Text>
  </View>
);

export const ErrorState = ({ theme, message = "Hubo un error", onRetry }) => (
  <View style={styles.centerContainer}>
    <Text style={[styles.text, { color: theme.error }]}>{message}</Text>
    {onRetry && (
      <CustomButton
        title="Reintentar"
        onPress={onRetry}
        variant="secondary"
        theme={theme}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  centerContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
  },
});
