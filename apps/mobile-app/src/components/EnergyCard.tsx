import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/theme';

interface EnergyCardProps {
  credit: number;
}

export const EnergyCard: React.FC<EnergyCardProps> = ({ credit }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Crédit d'Énergie Restant</Text>
      <View style={styles.balanceRow}>
        <Text style={styles.balance}>{credit.toFixed(1)}</Text>
        <Text style={styles.unit}>kWh</Text>
      </View>
      <Text style={styles.status}>🟢 Statut: Actif (Tarif Normal)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  cardTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
    marginBottom: 10,
  },
  balance: {
    color: COLORS.textPrimary,
    fontSize: 48,
    fontWeight: '900',
  },
  unit: {
    color: COLORS.textSecondary,
    fontSize: 20,
    marginLeft: 8,
    fontWeight: '600',
  },
  status: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: 'bold',
  }
});
