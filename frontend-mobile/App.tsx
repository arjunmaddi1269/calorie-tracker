/**
 * Main App Entry Point
 */
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './src/store/authStore';
import { STORAGE_KEYS } from './src/constants/config';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { MainNavigator } from './src/navigation/MainNavigator';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { user, setUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check for stored user data on app load
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

        if (storedUser && accessToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  if (isLoading) {
    return null; // Could show splash screen here
  }

  return (
    <PaperProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </PaperProvider>
  );
}
