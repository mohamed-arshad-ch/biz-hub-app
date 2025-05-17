import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}