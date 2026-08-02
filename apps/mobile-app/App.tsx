import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS } from './src/constants/theme';
import { CONFIG } from './src/constants/config';
import { EnergyCard } from './src/components/EnergyCard';
import { TokenCard } from './src/components/TokenCard';
import { useMeter } from './src/hooks/useMeter';

export default function App() {
  const { credit, lastToken, loading, purchasing, error, refresh, simulatePurchase } = useMeter(CONFIG.DEFAULT_METER_ID);

  if (loading && credit === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Connexion au réseau NIGELEC...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Bonjour, Abdoul</Text>
              <Text style={styles.subtitle}>Compteur: {CONFIG.DEFAULT_METER_ID}</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={refresh} disabled={purchasing}>
              <Text style={styles.refreshText}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refresh}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Balance Card */}
        <EnergyCard credit={credit} />

        {/* Quick Actions */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.primaryButton, purchasing && styles.disabledButton]} 
            onPress={simulatePurchase}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Acheter du Crédit</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Last Transaction */}
        <TokenCard lastToken={lastToken} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 15,
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.primary,
    fontSize: 14,
    marginTop: 5,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  refreshButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  refreshText: {
    fontSize: 16,
  },
  errorBanner: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  retryButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionContainer: {
    marginVertical: 10,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
