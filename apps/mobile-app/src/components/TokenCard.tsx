import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/theme';

interface TokenCardProps {
  lastToken: string;
}

export const TokenCard: React.FC<TokenCardProps> = ({ lastToken }) => {
  return (
    <View style={styles.secondaryCard}>
      <Text style={styles.cardTitle}>Dernier Jeton STS (Vending)</Text>
      <Text style={styles.tokenText}>{lastToken}</Text>
      <Text style={styles.tokenHint}>Saisissez ce code sur votre compteur</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  secondaryCard: {
    backgroundColor: COLORS.cardAccent,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    marginTop: 20,
  },
  cardTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  tokenText: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 15,
  },
  tokenHint: {
    color: COLORS.primary,
    fontSize: 12,
    marginTop: 10,
  }
});
