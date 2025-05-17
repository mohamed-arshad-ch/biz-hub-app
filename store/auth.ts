import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { setupDefaultData } from '@/db/setup';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (user: User, token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  login: async (user, token) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  },
  logout: async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  },
  register: async (user, token) => {
    try {
      // Store auth data
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });

      // Set up default data for new user
      await setupDefaultData(user.id);
    } catch (error) {
      console.error('Error in registration:', error);
      throw error;
    }
  },
}));

// Initialize auth state from storage
export const initializeAuth = async () => {
  try {
    const [userStr, token] = await Promise.all([
      AsyncStorage.getItem('user'),
      AsyncStorage.getItem('token'),
    ]);

    if (userStr && token) {
      const user = JSON.parse(userStr);
      useAuthStore.setState({ user, token, isAuthenticated: true });
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
  }
}; 