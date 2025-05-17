import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;
  initializeCurrency: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: CURRENCIES[0], // Default to USD
  setCurrency: async (currency: Currency) => {
    try {
      await AsyncStorage.setItem('selectedCurrency', JSON.stringify(currency));
      set({ currency });
    } catch (error) {
      console.error('Error saving currency:', error);
    }
  },
  initializeCurrency: async () => {
    try {
      const savedCurrency = await AsyncStorage.getItem('selectedCurrency');
      if (savedCurrency) {
        set({ currency: JSON.parse(savedCurrency) });
      }
    } catch (error) {
      console.error('Error loading currency:', error);
    }
  },
})); 