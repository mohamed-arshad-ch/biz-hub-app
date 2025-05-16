import { Redirect } from 'expo-router';
import { useState, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use SQLite context directly
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });

  useEffect(() => {
    // Check if we have any users in the database
    const checkUsers = async () => {
      try {
        const users = await db.select().from(schema.users).all();
        setIsAuthenticated(users.length > 0);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking users:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkUsers();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 20, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }
  
  // After splash screen, redirect based on authentication status
  return isAuthenticated ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}