import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing user data in AsyncStorage
const USER_KEY = 'user_data';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

// Default user
const defaultUser: User = {
  id: '1',
  name: 'User',
  email: 'user@example.com',
  phone: '',
  notificationsEnabled: true,
  emailNotifications: true,
  pushNotifications: true,
  language: 'en',
  theme: 'system'
};

/**
 * Initialize user data in AsyncStorage if it doesn't exist
 */
export async function initializeUser(): Promise<void> {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    if (!userData) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(defaultUser));
    }
  } catch (error) {
    console.error('Error initializing user data:', error);
    throw error;
  }
}

/**
 * Get user data from AsyncStorage
 */
export async function getUser(): Promise<User> {
  try {
    await initializeUser();
    const userData = await AsyncStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : defaultUser;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

/**
 * Update user data in AsyncStorage
 * @param userData Updated user data
 */
export async function updateUser(userData: Partial<User>): Promise<User> {
  try {
    const currentUser = await getUser();
    const updatedUser = {
      ...currentUser,
      ...userData
    };
    
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Update user password
 * This is a mock function as in a real app this would involve proper auth
 * @param currentPassword Current password for verification
 * @param newPassword New password to set
 */
export async function updatePassword(
  currentPassword: string, 
  newPassword: string
): Promise<boolean> {
  // This is just a mock implementation
  // In a real app, this would verify the current password against stored credentials
  // and then securely hash and store the new password
  
  // Simulate password verification
  if (currentPassword === 'password') {
    // Password successfully updated
    return true;
  } else {
    // Current password is incorrect
    return false;
  }
} 