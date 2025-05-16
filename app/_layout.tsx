import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, Suspense } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ErrorBoundary } from "./error-boundary";
import CustomSplashScreen from "@/components/SplashScreen";
import { SQLiteProvider } from 'expo-sqlite';
import { DATABASE_NAME } from '@/db';
import { setupDatabase } from '@/db/setup';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    ...FontAwesome.font,
    // Using only FontAwesome and system default fonts
  });
  const [showSplash, setShowSplash] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Set up database
  useEffect(() => {
    const initDb = async () => {
      try {
        const success = await setupDatabase();
        setDbReady(success);
        if (!success) {
          setDbError('Failed to set up database');
        }
      } catch (error) {
        console.error('Database initialization error:', error);
        setDbError('An error occurred setting up the database');
        setDbReady(false);
      }
    };

    initDb();
  }, []);

  useEffect(() => {
    if (fontError) {
      console.error(fontError);
      throw fontError;
    }
  }, [fontError]);

  useEffect(() => {
    if (loaded && dbReady) {
      // Hide the native splash screen
      SplashScreen.hideAsync();
      
      // Show our custom splash screen for 2.5 seconds
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [loaded, dbReady]);

  if (!loaded || !dbReady || showSplash) {
    // Show loading or custom splash screen
    if (dbError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: 'red', textAlign: 'center', marginBottom: 20 }}>
            {dbError}
          </Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
            Please restart the app. If the problem persists, contact support.
          </Text>
        </View>
      );
    }
    
    // Return our custom splash screen while loading or during the timed display
    return loaded ? <CustomSplashScreen /> : null;
  }

  return (
    <Suspense fallback={<ActivityIndicator size="large" color="#4CAF50" />}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        options={{ enableChangeListener: true }}
        useSuspense
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ErrorBoundary>
            <RootLayoutNav />
          </ErrorBoundary>
        </GestureHandlerRootView>
      </SQLiteProvider>
    </Suspense>
  );
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="company-info" />
    </Stack>
  );
}