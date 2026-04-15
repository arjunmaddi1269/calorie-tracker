/**
 * Profile Screen - User settings and profile
 */
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { userApi } from '../api/user';
import { useAuthStore } from '../store/authStore';
import { STORAGE_KEYS } from '../constants/config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const ProfileScreen = ({ navigation }: any) => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile,
  });

  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.ACCESS_TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.USER,
          ]);
          logout();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const MenuItem = ({
    icon,
    label,
    value,
    onPress,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Icon name={icon} size={24} color="#6b7280" />
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {value && <Text style={styles.menuItemValue}>{value}</Text>}
        <Icon name="chevron-right" size={24} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.first_name?.[0] || profile?.email[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>
          {profile?.first_name && profile?.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : 'User'}
        </Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      {/* Goals Summary */}
      <Card style={styles.goalsCard}>
        <Text style={styles.sectionTitle}>Daily Goals</Text>
        <View style={styles.goalsGrid}>
          <View style={styles.goalItem}>
            <Text style={styles.goalValue}>{profile?.calorie_goal || '—'}</Text>
            <Text style={styles.goalLabel}>Calories</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalValue}>{profile?.protein_goal || '—'}g</Text>
            <Text style={styles.goalLabel}>Protein</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalValue}>{profile?.carb_goal || '—'}g</Text>
            <Text style={styles.goalLabel}>Carbs</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalValue}>{profile?.fat_goal || '—'}g</Text>
            <Text style={styles.goalLabel}>Fat</Text>
          </View>
        </View>
      </Card>

      {/* Menu Items */}
      <Card style={styles.menuCard}>
        <MenuItem
          icon="account-edit"
          label="Edit Profile"
          onPress={() => Alert.alert('Coming Soon', 'Edit profile feature coming soon')}
        />
        <MenuItem
          icon="target"
          label="Update Goals"
          onPress={() => Alert.alert('Coming Soon', 'Update goals feature coming soon')}
        />
        <MenuItem
          icon="scale-bathroom"
          label="Weight"
          value={profile?.current_weight ? `${profile.current_weight} kg` : undefined}
          onPress={() => Alert.alert('Coming Soon', 'Weight tracking coming soon')}
        />
      </Card>

      <Card style={styles.menuCard}>
        <MenuItem
          icon="bell-outline"
          label="Notifications"
          onPress={() => Alert.alert('Coming Soon', 'Notifications settings coming soon')}
        />
        <MenuItem
          icon="help-circle-outline"
          label="Help & Support"
          onPress={() => Alert.alert('Coming Soon', 'Help & Support coming soon')}
        />
        <MenuItem
          icon="information-outline"
          label="About"
          value="v1.0.0"
          onPress={() => Alert.alert('Calorie Tracker', 'Version 1.0.0')}
        />
      </Card>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          icon="logout"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
  },
  goalsCard: {
    margin: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  goalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalItem: {
    alignItems: 'center',
  },
  goalValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 4,
  },
  goalLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  menuCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutContainer: {
    padding: 16,
    paddingBottom: 32,
  },
});
