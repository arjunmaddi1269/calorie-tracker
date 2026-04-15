/**
 * Main App Navigation with Bottom Tabs
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LogFoodScreen } from '../screens/LogFoodScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#1f2937',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
          headerTitle: 'Calorie Tracker',
        }}
      />
      <Tab.Screen
        name="LogFood"
        component={LogFoodScreen}
        options={{
          tabBarLabel: 'Log Food',
          tabBarIcon: ({ color, size }) => (
            <Icon name="camera" color={color} size={size} />
          ),
          headerTitle: 'Log Food',
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => (
            <Icon name="history" color={color} size={size} />
          ),
          headerTitle: 'Food History',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
          headerTitle: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{
          headerShown: true,
          headerTitle: 'Complete Your Profile',
          headerBackVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};
