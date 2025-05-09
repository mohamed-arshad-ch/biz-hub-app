import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Animated,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Check,
  DollarSign,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { 
  Currency, 
  getCurrencies, 
  getSelectedCurrency, 
  setSelectedCurrency,
} from '@/utils/currencyStorageUtils';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function CurrencySettingsScreen() {
  const router = useRouter();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrencyCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  
  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    setIsLoading(true);
    try {
      const currenciesData = await getCurrencies();
      const selected = await getSelectedCurrency();
      
      setCurrencies(currenciesData);
      setSelectedCurrencyCode(selected);
      
      // Start animations when data is loaded
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error loading currencies:', error);
      alert('Failed to load currency data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrencySelect = async (currencyCode: string) => {
    if (currencyCode === selectedCurrency) return;
    
    try {
      setIsLoading(true);
      await setSelectedCurrency(currencyCode);
      setSelectedCurrencyCode(currencyCode);
      alert(`Currency successfully changed to ${currencyCode}`);
    } catch (error) {
      console.error('Error setting currency:', error);
      alert('Failed to set currency');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrencyItem = ({ item, index }: { item: Currency, index: number }) => {
    const isSelected = item.code === selectedCurrency;
    const itemAnimStyle = {
      opacity: fadeAnim,
      transform: [{ 
        translateY: Animated.multiply(
          slideAnim, 
          new Animated.Value((index * 0.2) + 1)
        ) 
      }],
    };
    
    return (
      <AnimatedTouchable
        style={[
          styles.currencyItem,
          isSelected && styles.selectedCurrencyItem,
          itemAnimStyle
        ]}
        onPress={() => handleCurrencySelect(item.code)}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <View style={styles.currencyInfo}>
          <View style={styles.currencySymbolContainer}>
            <Text style={styles.currencySymbol}>{item.symbol}</Text>
          </View>
          <View>
            <Text style={styles.currencyName}>{item.name}</Text>
            <Text style={styles.currencyCode}>{item.code}</Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Check size={20} color="#fff" />
          </View>
        )}
      </AnimatedTouchable>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: "Currency Settings",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft size={20} color="#333" />
            </TouchableOpacity>
          ),
        }} 
      />
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <DollarSign size={24} color={Colors.primary} />
        <Text style={styles.headerTitle}>Select Currency</Text>
      </View>
      
      <Text style={styles.headerDescription}>
        Choose your preferred currency for invoices and financial tracking.
      </Text>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading currencies...</Text>
        </View>
      ) : (
        <FlatList
          data={currencies}
          renderItem={renderCurrencyItem}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerButton: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginLeft: 12,
  },
  headerDescription: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
    marginBottom: 24,
    marginHorizontal: 20,
    lineHeight: 22,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCurrencyItem: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbolContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  currencyCode: {
    fontSize: 14,
    color: '#777',
  },
  selectedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
}); 