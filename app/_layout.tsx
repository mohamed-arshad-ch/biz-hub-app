import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ErrorBoundary } from "./error-boundary";
import CustomSplashScreen from "@/components/SplashScreen";
import { useAuthStore } from "@/stores/auth-store";
import { initializeCategories } from "@/utils/categoryStorageUtils";
import { initializeAccountGroups } from "@/utils/accountGroupStorageUtils";
import { initializeCurrencies } from "@/utils/currencyStorageUtils";
import { initializeUser } from '@/utils/userStorageUtils';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
    // Using only FontAwesome and system default fonts
  });
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated } = useAuthStore();

  // Initialize app data
  useEffect(() => {
    async function prepare() {
      try {
        // Initialize AsyncStorage data
        await Promise.all([
          initializeCategories(),
          initializeAccountGroups(),
          initializeCurrencies(),
          initializeUser()
        ]);
        
        // Other setup tasks can be added here
      } catch (e) {
        console.warn("Error initializing app data:", e);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Hide the native splash screen
      SplashScreen.hideAsync();
      
      // Show our custom splash screen for 2.5 seconds
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  if (!loaded || showSplash) {
    // Return our custom splash screen while loading or during the timed display
    return loaded ? <CustomSplashScreen /> : null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <RootLayoutNav />
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <Stack
    screenOptions={{
      headerBackTitle: "Back",
    }}
    >
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
}