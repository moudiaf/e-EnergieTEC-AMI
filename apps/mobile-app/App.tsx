import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';

export default function App() {
  const [credit, setCredit] = useState(142.5);
  const [lastToken, setLastToken] = useState('1423-5643-9087-1123-5432');

  const handleSimulatePurchase = () => {
    setCredit(prev => prev + 50.0);
    setLastToken('8842-1234-5555-9876-0000');
    alert('Achat via Mobile Money réussi. Nouveau jeton STS généré !');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0b" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Bonjour, Abdoul</Text>
          <Text style={styles.subtitle}>Compteur: 041-234-571</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Crédit d'Énergie Restant</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balance}>{credit.toFixed(1)}</Text>
            <Text style={styles.unit}>kWh</Text>
          </View>
          <Text style={styles.status}>🟢 Statut: Actif (Tarif Normal)</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSimulatePurchase}>
            <Text style={styles.primaryButtonText}>Acheter du Crédit</Text>
          </TouchableOpacity>
        </View>

        {/* Last Transaction */}
        <View style={styles.secondaryCard}>
          <Text style={styles.cardTitle}>Dernier Jeton STS (Vending)</Text>
          <Text style={styles.tokenText}>{lastToken}</Text>
          <Text style={styles.tokenHint}>Saisissez ce code sur votre compteur</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0b',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  greeting: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#FF6B35',
    fontSize: 14,
    marginTop: 5,
    fontWeight: '600',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#151518',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  secondaryCard: {
    backgroundColor: 'rgba(255,107,53,0.05)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
    marginTop: 20,
  },
  cardTitle: {
    color: '#888',
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
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
  },
  unit: {
    color: '#888',
    fontSize: 20,
    marginLeft: 8,
    fontWeight: '600',
  },
  status: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionContainer: {
    marginVertical: 10,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tokenText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 15,
  },
  tokenHint: {
    color: '#FF6B35',
    fontSize: 12,
    marginTop: 10,
  }
});
