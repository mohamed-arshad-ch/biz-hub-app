import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCurrencyStore, CURRENCIES } from '@/store/currency';
import Colors from '@/constants/colors';

export default function CurrencySettingsScreen() {
  const router = useRouter();
  const { currency, setCurrency, initializeCurrency } = useCurrencyStore();

  useEffect(() => {
    initializeCurrency();
  }, []);

  const handleCurrencySelect = async (selectedCurrency: typeof CURRENCIES[0]) => {
    try {
      await setCurrency(selectedCurrency);
      Alert.alert('Success', 'Currency settings updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update currency settings');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Currency Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Select Currency</Text>
        <Text style={styles.sectionDescription}>
          Choose your preferred currency for all transactions and reports
        </Text>

        <View style={styles.currencyList}>
          {CURRENCIES.map((item) => (
            <TouchableOpacity
              key={item.code}
              style={[
                styles.currencyItem,
                currency.code === item.code && styles.selectedCurrency
              ]}
              onPress={() => handleCurrencySelect(item)}
            >
              <View style={styles.currencyInfo}>
                <Text style={styles.currencySymbol}>{item.symbol}</Text>
                <View style={styles.currencyDetails}>
                  <Text style={styles.currencyName}>{item.name}</Text>
                  <Text style={styles.currencyCode}>{item.code}</Text>
                </View>
              </View>
              {currency.code === item.code && (
                <View style={styles.checkmark} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  currencyList: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedCurrency: {
    backgroundColor: '#f0f7ff',
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 12,
  },
  currencyDetails: {
    flex: 1,
  },
  currencyName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  currencyCode: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
}); 