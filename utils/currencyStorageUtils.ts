import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

// Storage keys
const CURRENCIES_KEY = 'currencies';
const SELECTED_CURRENCY_KEY = 'selectedCurrency';

// Default currencies
export const defaultCurrencies: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
];

// Initialize currencies in AsyncStorage if they don't exist
export const initializeCurrencies = async (): Promise<void> => {
  try {
    const currencies = await AsyncStorage.getItem(CURRENCIES_KEY);
    const selectedCurrency = await AsyncStorage.getItem(SELECTED_CURRENCY_KEY);
    
    if (!currencies) {
      await AsyncStorage.setItem(CURRENCIES_KEY, JSON.stringify(defaultCurrencies));
    }
    
    if (!selectedCurrency) {
      await AsyncStorage.setItem(SELECTED_CURRENCY_KEY, 'USD');
    }
  } catch (error) {
    console.error('Error initializing currencies:', error);
  }
};

// Get all currencies
export const getCurrencies = async (): Promise<Currency[]> => {
  try {
    const currenciesJson = await AsyncStorage.getItem(CURRENCIES_KEY);
    if (!currenciesJson) {
      await AsyncStorage.setItem(CURRENCIES_KEY, JSON.stringify(defaultCurrencies));
      return defaultCurrencies;
    }
    return JSON.parse(currenciesJson);
  } catch (error) {
    console.error('Error getting currencies:', error);
    return defaultCurrencies;
  }
};

// Add a currency
export const addCurrency = async (currency: Currency): Promise<Currency> => {
  try {
    const currencies = await getCurrencies();
    
    // Check if currency code already exists
    if (currencies.some(c => c.code === currency.code)) {
      throw new Error('Currency code already exists');
    }
    
    const updatedCurrencies = [...currencies, currency];
    await AsyncStorage.setItem(CURRENCIES_KEY, JSON.stringify(updatedCurrencies));
    
    return currency;
  } catch (error) {
    console.error('Error adding currency:', error);
    throw error;
  }
};

// Update a currency
export const updateCurrency = async (code: string, updatedData: Partial<Currency>): Promise<Currency | null> => {
  try {
    const currencies = await getCurrencies();
    const currencyIndex = currencies.findIndex(c => c.code === code);
    
    if (currencyIndex === -1) {
      return null;
    }
    
    const updatedCurrency = {
      ...currencies[currencyIndex],
      ...updatedData,
      code: code // Ensure code can't be changed
    };
    
    currencies[currencyIndex] = updatedCurrency;
    await AsyncStorage.setItem(CURRENCIES_KEY, JSON.stringify(currencies));
    
    return updatedCurrency;
  } catch (error) {
    console.error('Error updating currency:', error);
    throw error;
  }
};

// Delete a currency
export const deleteCurrency = async (code: string): Promise<boolean> => {
  try {
    const currencies = await getCurrencies();
    
    // Don't allow deleting the selected currency
    const selectedCurrency = await getSelectedCurrency();
    if (code === selectedCurrency) {
      throw new Error('Cannot delete the selected currency');
    }
    
    const updatedCurrencies = currencies.filter(c => c.code !== code);
    
    if (updatedCurrencies.length === currencies.length) {
      // No currency was removed
      return false;
    }
    
    await AsyncStorage.setItem(CURRENCIES_KEY, JSON.stringify(updatedCurrencies));
    return true;
  } catch (error) {
    console.error('Error deleting currency:', error);
    throw error;
  }
};

// Get the selected currency code
export const getSelectedCurrency = async (): Promise<string> => {
  try {
    const code = await AsyncStorage.getItem(SELECTED_CURRENCY_KEY);
    return code || 'USD';
  } catch (error) {
    console.error('Error getting selected currency:', error);
    return 'USD';
  }
};

// Set the selected currency code
export const setSelectedCurrency = async (code: string): Promise<void> => {
  try {
    const currencies = await getCurrencies();
    
    // Verify the currency exists
    if (!currencies.some(c => c.code === code)) {
      throw new Error('Invalid currency code');
    }
    
    await AsyncStorage.setItem(SELECTED_CURRENCY_KEY, code);
  } catch (error) {
    console.error('Error setting selected currency:', error);
    throw error;
  }
};

// Get the selected currency object
export const getSelectedCurrencyObject = async (): Promise<Currency> => {
  try {
    const code = await getSelectedCurrency();
    const currencies = await getCurrencies();
    const currency = currencies.find(c => c.code === code);
    
    if (!currency) {
      return defaultCurrencies[0]; // Fallback to USD
    }
    
    return currency;
  } catch (error) {
    console.error('Error getting selected currency object:', error);
    return defaultCurrencies[0]; // Fallback to USD
  }
}; 