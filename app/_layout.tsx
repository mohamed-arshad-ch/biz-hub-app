import React from 'react';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, Suspense } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ErrorBoundary } from "./error-boundary";
import { SQLiteProvider } from 'expo-sqlite';
import { DATABASE_NAME } from '@/db';
import { setupDatabase, setupDefaultData } from '@/db/setup';

import { initializeAuth, useAuthStore } from '../store/auth';
import { useCurrencyStore } from '../store/currency';

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
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const initializeCurrency = useCurrencyStore(state => state.initializeCurrency);

  // Set up database and initialize auth
  useEffect(() => {
    const initApp = async () => {
      try {
        const success = await setupDatabase();
        await setupDefaultData(1)
        setDbReady(success);
        if (!success) {
          setDbError('Failed to set up database');
          return;
        }

        // Initialize auth state
        await initializeAuth();
        setAuthInitialized(true);

        // Initialize currency
        await initializeCurrency();
      } catch (error) {
        console.error('Initialization error:', error);
        setDbError('An error occurred during initialization');
        setDbReady(false);
      }
    };

    initApp();
  }, []);

  useEffect(() => {
    if (fontError) {
      console.error(fontError);
      throw fontError;
    }
  }, [fontError]);

  useEffect(() => {
    if (loaded && dbReady && authInitialized) {
      // Hide the native splash screen
      SplashScreen.hideAsync();
    }
  }, [loaded, dbReady, authInitialized]);

  if (!loaded || !dbReady || !authInitialized) {
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
    return null;
  }

  return (
    <Suspense fallback={<ActivityIndicator size="large" color="#4CAF50" />}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        options={{ enableChangeListener: true }}
        useSuspense
      >
        <ErrorBoundary>
          <RootLayoutNav />
        </ErrorBoundary>
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