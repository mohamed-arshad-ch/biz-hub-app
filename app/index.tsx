import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  
  // After splash screen, redirect based on authentication status
  return <Redirect href={isAuthenticated ? '/(tabs)' : '/login'} />;
}