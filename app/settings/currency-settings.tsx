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
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Check,
  DollarSign,
} from 'lucide-react-native';

import Colors from '@/constants/colors';

// Define Currency type
interface Currency {
  code: string;
  name: string;
  symbol: string;
}

// Mock currencies data
const mockCurrencies: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' }
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function CurrencySettingsScreen() {
  const router = useRouter();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrencyCode] = useState<string>('USD');
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  
  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = () => {
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setCurrencies(mockCurrencies);
      
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
      
      setIsLoading(false);
    }, 500);
  };

  const handleCurrencySelect = (currencyCode: string) => {
    if (currencyCode === selectedCurrency) return;
    
    // Simulate API delay
    setIsLoading(true);
    setTimeout(() => {
      setSelectedCurrencyCode(currencyCode);
      alert(`Currency successfully changed to ${currencyCode}`);
      setIsLoading(false);
    }, 300);
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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Currency Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading currencies...</Text>
        </View>
      ) : (
        <>
          <View style={styles.subHeader}>
            <DollarSign size={24} color={Colors.primary} />
            <Text style={styles.subHeaderTitle}>Select Currency</Text>
          </View>
          
          <Text style={styles.subHeaderDescription}>
            Choose your preferred currency for invoices and financial tracking.
          </Text>
          
          <FlatList
            data={currencies}
            renderItem={renderCurrencyItem}
            keyExtractor={(item) => item.code}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.background.tertiary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginHorizontal: 20,
  },
  subHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    marginLeft: 12,
  },
  subHeaderDescription: {
    fontSize: 15,
    color: Colors.text.secondary,
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
    backgroundColor: Colors.background.default,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: "rgba(0,0,0,0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
    color: Colors.text.primary,
    marginBottom: 3,
  },
  currencyCode: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  selectedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  headerButton: {
    padding: 8,
  },
}); 