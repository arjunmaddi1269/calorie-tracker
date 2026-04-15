/**
 * Register Screen
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { STORAGE_KEYS } from '../constants/config';

export const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setUser = useAuthStore((state) => state.setUser);

  const handleRegister = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tokenResponse = await authApi.register({
        email,
        password,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      });

      // Store tokens
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenResponse.access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenResponse.refresh_token);

      // Get user data
      const user = await authApi.getCurrentUser();
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      setUser(user);
      // Navigation to onboarding will be handled by the navigation container
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your nutrition tracking journey today</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Input
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="John"
              />
            </View>
            <View style={styles.halfWidth}>
              <Input
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Doe"
              />
            </View>
          </View>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Sign Up"
            onPress={handleRegister}
            loading={loading}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Text
              style={styles.link}
              onPress={() => navigation.navigate('Login')}
            >
              Sign in
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  button: {
    marginTop: 8,
  },
  error: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  link: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
});
