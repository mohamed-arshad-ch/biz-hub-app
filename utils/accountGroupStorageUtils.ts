import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface AccountGroup {
  id: string;
  name: string;
  description: string;
}

// Storage key
const ACCOUNT_GROUPS_KEY = 'accountGroups';

// Default account groups
const defaultAccountGroups: AccountGroup[] = [
  { id: '1', name: 'Assets', description: 'Cash, bank accounts, and other assets' },
  { id: '2', name: 'Liabilities', description: 'Loans, credit cards, and other debts' },
  { id: '3', name: 'Income', description: 'Salary, business income, and other revenue sources' },
  { id: '4', name: 'Expenses', description: 'Bills, purchases, and other expenditures' },
  { id: '5', name: 'Equity', description: 'Ownership interest in the business' },
];

// Initialize account groups in AsyncStorage if they don't exist
export const initializeAccountGroups = async (): Promise<void> => {
  try {
    const accountGroups = await AsyncStorage.getItem(ACCOUNT_GROUPS_KEY);
    
    if (!accountGroups) {
      await AsyncStorage.setItem(ACCOUNT_GROUPS_KEY, JSON.stringify(defaultAccountGroups));
    }
  } catch (error) {
    console.error('Error initializing account groups:', error);
  }
};

// Get all account groups
export const getAccountGroups = async (): Promise<AccountGroup[]> => {
  try {
    const accountGroupsJson = await AsyncStorage.getItem(ACCOUNT_GROUPS_KEY);
    if (!accountGroupsJson) {
      await AsyncStorage.setItem(ACCOUNT_GROUPS_KEY, JSON.stringify(defaultAccountGroups));
      return defaultAccountGroups;
    }
    return JSON.parse(accountGroupsJson);
  } catch (error) {
    console.error('Error getting account groups:', error);
    return defaultAccountGroups;
  }
};

// Add an account group
export const addAccountGroup = async (group: Omit<AccountGroup, 'id'>): Promise<AccountGroup> => {
  try {
    const groups = await getAccountGroups();
    const newGroup: AccountGroup = {
      ...group,
      id: Date.now().toString(),
    };
    
    const updatedGroups = [...groups, newGroup];
    await AsyncStorage.setItem(ACCOUNT_GROUPS_KEY, JSON.stringify(updatedGroups));
    
    return newGroup;
  } catch (error) {
    console.error('Error adding account group:', error);
    throw error;
  }
};

// Update an account group
export const updateAccountGroup = async (id: string, updatedData: Partial<AccountGroup>): Promise<AccountGroup | null> => {
  try {
    const groups = await getAccountGroups();
    const groupIndex = groups.findIndex(g => g.id === id);
    
    if (groupIndex === -1) {
      return null;
    }
    
    const updatedGroup = {
      ...groups[groupIndex],
      ...updatedData
    };
    
    groups[groupIndex] = updatedGroup;
    await AsyncStorage.setItem(ACCOUNT_GROUPS_KEY, JSON.stringify(groups));
    
    return updatedGroup;
  } catch (error) {
    console.error('Error updating account group:', error);
    throw error;
  }
};

// Delete an account group
export const deleteAccountGroup = async (id: string): Promise<boolean> => {
  try {
    const groups = await getAccountGroups();
    const updatedGroups = groups.filter(g => g.id !== id);
    
    if (updatedGroups.length === groups.length) {
      // No group was removed
      return false;
    }
    
    await AsyncStorage.setItem(ACCOUNT_GROUPS_KEY, JSON.stringify(updatedGroups));
    return true;
  } catch (error) {
    console.error('Error deleting account group:', error);
    throw error;
  }
}; 