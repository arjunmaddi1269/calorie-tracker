/**
 * Dashboard Screen - Daily nutrition overview
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { foodApi } from '../api/food';
import { userApi } from '../api/user';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const { width } = Dimensions.get('window');

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DailyLog {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_count: number;
}

export const DashboardScreen = ({ navigation }: any) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Fetch user profile for goals
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile,
  });

  // Fetch daily summary
  const {
    data: dailyLog,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['dailyLog', dateStr],
    queryFn: () => foodApi.getDailySummary(dateStr),
  });

  const goals: NutritionGoals = {
    calories: profile?.calorie_goal || 2000,
    protein: profile?.protein_goal || 150,
    carbs: profile?.carb_goal || 200,
    fat: profile?.fat_goal || 65,
  };

  const consumed: DailyLog = dailyLog || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    meal_count: 0,
  };

  const caloriesRemaining = goals.calories - consumed.calories;
  const caloriesProgress = (consumed.calories / goals.calories) * 100;

  const MacroBar = ({
    label,
    consumed,
    goal,
    color,
  }: {
    label: string;
    consumed: number;
    goal: number;
    color: string;
  }) => {
    const progress = Math.min((consumed / goal) * 100, 100);

    return (
      <View style={styles.macroBar}>
        <View style={styles.macroHeader}>
          <Text style={styles.macroLabel}>{label}</Text>
          <Text style={styles.macroValue}>
            {Math.round(consumed)}g / {goal}g
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progress}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {profile?.first_name || 'there'}!</Text>
        <Text style={styles.date}>{format(selectedDate, 'EEEE, MMMM d')}</Text>
      </View>

      {/* Calorie Summary Card */}
      <Card style={styles.calorieCard}>
        <View style={styles.calorieContent}>
          <View style={styles.calorieLeft}>
            <Text style={styles.calorieLabel}>Calories Remaining</Text>
            <Text
              style={[
                styles.calorieValue,
                caloriesRemaining < 0 && styles.calorieValueOver,
              ]}
            >
              {Math.abs(caloriesRemaining)}
            </Text>
            <Text style={styles.calorieSubtext}>
              {caloriesRemaining < 0 ? 'over goal' : 'left'}
            </Text>
          </View>

          <View style={styles.calorieDivider} />

          <View style={styles.calorieRight}>
            <View style={styles.calorieStat}>
              <Text style={styles.calorieStatValue}>{Math.round(consumed.calories)}</Text>
              <Text style={styles.calorieStatLabel}>Eaten</Text>
            </View>
            <View style={styles.calorieStat}>
              <Text style={styles.calorieStatValue}>{goals.calories}</Text>
              <Text style={styles.calorieStatLabel}>Goal</Text>
            </View>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.calorieProgressContainer}>
          <View
            style={[
              styles.calorieProgressFill,
              {
                width: `${Math.min(caloriesProgress, 100)}%`,
                backgroundColor:
                  caloriesProgress > 100
                    ? '#ef4444'
                    : caloriesProgress > 80
                    ? '#f59e0b'
                    : '#16a34a',
              },
            ]}
          />
        </View>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Button
          title="Log Food"
          onPress={() => navigation.navigate('LogFood')}
          icon="camera"
          variant="primary"
        />
      </Card>

      {/* Macros Breakdown */}
      <Card style={styles.macrosCard}>
        <Text style={styles.sectionTitle}>Macros Breakdown</Text>

        <MacroBar
          label="Protein"
          consumed={consumed.protein}
          goal={goals.protein}
          color="#3b82f6"
        />
        <MacroBar
          label="Carbs"
          consumed={consumed.carbs}
          goal={goals.carbs}
          color="#f59e0b"
        />
        <MacroBar
          label="Fat"
          consumed={consumed.fat}
          goal={goals.fat}
          color="#8b5cf6"
        />
      </Card>

      {/* Today's Meals */}
      <Card style={styles.mealsCard}>
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        {consumed.meal_count === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No meals logged yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap "Log Food" to get started
            </Text>
          </View>
        ) : (
          <View style={styles.mealSummary}>
            <Text style={styles.mealCount}>
              {consumed.meal_count} {consumed.meal_count === 1 ? 'meal' : 'meals'} logged
            </Text>
            <Button
              title="View All"
              onPress={() => navigation.navigate('History')}
              variant="outline"
              size="small"
            />
          </View>
        )}
      </Card>
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
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#6b7280',
  },
  calorieCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  calorieContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  calorieLeft: {
    flex: 1,
    alignItems: 'center',
  },
  calorieLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  calorieValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  calorieValueOver: {
    color: '#ef4444',
  },
  calorieSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  calorieDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
  },
  calorieRight: {
    flex: 1,
    justifyContent: 'center',
  },
  calorieStat: {
    marginBottom: 16,
  },
  calorieStatValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
  },
  calorieStatLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  calorieProgressContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  calorieProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  macrosCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  macroBar: {
    marginBottom: 16,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  macroValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  mealsCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  mealSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealCount: {
    fontSize: 16,
    color: '#1f2937',
  },
});
