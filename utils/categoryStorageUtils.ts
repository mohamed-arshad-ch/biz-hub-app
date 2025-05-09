import AsyncStorage from '@react-native-async-storage/async-storage';
import { IncomeCategory, ExpenseCategory } from '@/types/category';

// Storage keys
const INCOME_CATEGORIES_KEY = 'incomeCategories';
const EXPENSE_CATEGORIES_KEY = 'expenseCategories';

// Default income categories
const defaultIncomeCategories: IncomeCategory[] = [
  { id: '1', name: 'Salary', description: 'Regular employment income', color: '#4caf50' },
  { id: '2', name: 'Business', description: 'Income from business operations', color: '#2196f3' },
  { id: '3', name: 'Investments', description: 'Dividends, interest, capital gains', color: '#9c27b0' },
  { id: '4', name: 'Rental', description: 'Income from rental properties', color: '#ff9800' },
  { id: '5', name: 'Freelance', description: 'Income from freelance work', color: '#00bcd4' },
  { id: '6', name: 'Other', description: 'Other income sources', color: '#607d8b' },
];

// Default expense categories
const defaultExpenseCategories: ExpenseCategory[] = [
  { id: '1', name: 'Food & Dining', description: 'Restaurants, groceries, etc.', color: '#e74c3c' },
  { id: '2', name: 'Transportation', description: 'Fuel, public transit, ride sharing', color: '#3498db' },
  { id: '3', name: 'Housing', description: 'Rent, mortgage, maintenance', color: '#9b59b6' },
  { id: '4', name: 'Utilities', description: 'Electricity, water, internet, phone', color: '#f39c12' },
  { id: '5', name: 'Entertainment', description: 'Movies, games, subscriptions', color: '#1abc9c' },
  { id: '6', name: 'Shopping', description: 'Clothing, electronics, etc.', color: '#e67e22' },
  { id: '7', name: 'Healthcare', description: 'Doctor visits, medicines, insurance', color: '#16a085' },
  { id: '8', name: 'Education', description: 'Tuition, books, courses', color: '#2980b9' },
  { id: '9', name: 'Personal', description: 'Personal care, gym, etc.', color: '#8e44ad' },
  { id: '10', name: 'Travel', description: 'Airfare, hotels, vacations', color: '#d35400' },
  { id: '11', name: 'Business', description: 'Business expenses', color: '#2c3e50' },
  { id: '12', name: 'Other', description: 'Miscellaneous expenses', color: '#7f8c8d' },
];

// Initialize categories in AsyncStorage if they don't exist
export const initializeCategories = async (): Promise<void> => {
  try {
    const incomeCategories = await AsyncStorage.getItem(INCOME_CATEGORIES_KEY);
    const expenseCategories = await AsyncStorage.getItem(EXPENSE_CATEGORIES_KEY);
    
    if (!incomeCategories) {
      await AsyncStorage.setItem(INCOME_CATEGORIES_KEY, JSON.stringify(defaultIncomeCategories));
    }
    
    if (!expenseCategories) {
      await AsyncStorage.setItem(EXPENSE_CATEGORIES_KEY, JSON.stringify(defaultExpenseCategories));
    }
  } catch (error) {
    console.error('Error initializing categories:', error);
  }
};

// Income Category Functions
export const getIncomeCategories = async (): Promise<IncomeCategory[]> => {
  try {
    const categoriesJson = await AsyncStorage.getItem(INCOME_CATEGORIES_KEY);
    if (!categoriesJson) {
      await AsyncStorage.setItem(INCOME_CATEGORIES_KEY, JSON.stringify(defaultIncomeCategories));
      return defaultIncomeCategories;
    }
    return JSON.parse(categoriesJson);
  } catch (error) {
    console.error('Error getting income categories:', error);
    return defaultIncomeCategories;
  }
};

export const addIncomeCategory = async (category: Omit<IncomeCategory, 'id'>): Promise<IncomeCategory> => {
  try {
    const categories = await getIncomeCategories();
    const newCategory: IncomeCategory = {
      ...category,
      id: Date.now().toString(),
    };
    
    const updatedCategories = [...categories, newCategory];
    await AsyncStorage.setItem(INCOME_CATEGORIES_KEY, JSON.stringify(updatedCategories));
    
    return newCategory;
  } catch (error) {
    console.error('Error adding income category:', error);
    throw error;
  }
};

export const updateIncomeCategory = async (id: string, updatedData: Partial<IncomeCategory>): Promise<IncomeCategory | null> => {
  try {
    const categories = await getIncomeCategories();
    const categoryIndex = categories.findIndex(c => c.id === id);
    
    if (categoryIndex === -1) {
      return null;
    }
    
    const updatedCategory = {
      ...categories[categoryIndex],
      ...updatedData
    };
    
    categories[categoryIndex] = updatedCategory;
    await AsyncStorage.setItem(INCOME_CATEGORIES_KEY, JSON.stringify(categories));
    
    return updatedCategory;
  } catch (error) {
    console.error('Error updating income category:', error);
    throw error;
  }
};

export const deleteIncomeCategory = async (id: string): Promise<boolean> => {
  try {
    const categories = await getIncomeCategories();
    const updatedCategories = categories.filter(c => c.id !== id);
    
    if (updatedCategories.length === categories.length) {
      // No category was removed
      return false;
    }
    
    await AsyncStorage.setItem(INCOME_CATEGORIES_KEY, JSON.stringify(updatedCategories));
    return true;
  } catch (error) {
    console.error('Error deleting income category:', error);
    throw error;
  }
};

// Expense Category Functions
export const getExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  try {
    const categoriesJson = await AsyncStorage.getItem(EXPENSE_CATEGORIES_KEY);
    if (!categoriesJson) {
      await AsyncStorage.setItem(EXPENSE_CATEGORIES_KEY, JSON.stringify(defaultExpenseCategories));
      return defaultExpenseCategories;
    }
    return JSON.parse(categoriesJson);
  } catch (error) {
    console.error('Error getting expense categories:', error);
    return defaultExpenseCategories;
  }
};

export const addExpenseCategory = async (category: Omit<ExpenseCategory, 'id'>): Promise<ExpenseCategory> => {
  try {
    const categories = await getExpenseCategories();
    const newCategory: ExpenseCategory = {
      ...category,
      id: Date.now().toString(),
    };
    
    const updatedCategories = [...categories, newCategory];
    await AsyncStorage.setItem(EXPENSE_CATEGORIES_KEY, JSON.stringify(updatedCategories));
    
    return newCategory;
  } catch (error) {
    console.error('Error adding expense category:', error);
    throw error;
  }
};

export const updateExpenseCategory = async (id: string, updatedData: Partial<ExpenseCategory>): Promise<ExpenseCategory | null> => {
  try {
    const categories = await getExpenseCategories();
    const categoryIndex = categories.findIndex(c => c.id === id);
    
    if (categoryIndex === -1) {
      return null;
    }
    
    const updatedCategory = {
      ...categories[categoryIndex],
      ...updatedData
    };
    
    categories[categoryIndex] = updatedCategory;
    await AsyncStorage.setItem(EXPENSE_CATEGORIES_KEY, JSON.stringify(categories));
    
    return updatedCategory;
  } catch (error) {
    console.error('Error updating expense category:', error);
    throw error;
  }
};

export const deleteExpenseCategory = async (id: string): Promise<boolean> => {
  try {
    const categories = await getExpenseCategories();
    const updatedCategories = categories.filter(c => c.id !== id);
    
    if (updatedCategories.length === categories.length) {
      // No category was removed
      return false;
    }
    
    await AsyncStorage.setItem(EXPENSE_CATEGORIES_KEY, JSON.stringify(updatedCategories));
    return true;
  } catch (error) {
    console.error('Error deleting expense category:', error);
    throw error;
  }
}; 