/**
 * History Screen - View past food logs
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { foodApi } from '../api/food';
import { Card } from '../components/ui/Card';

export const HistoryScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const {
    data: foodLogs,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['foodLogs', dateStr],
    queryFn: () => foodApi.getFoodLogs({ date: dateStr }),
  });

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
        <Text style={styles.date}>{format(selectedDate, 'EEEE, MMMM d')}</Text>
      </View>

      {!foodLogs || foodLogs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No meals logged for this day</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {foodLogs.map((log: any) => (
            <Card key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View>
                  <Text style={styles.foodName}>{log.name}</Text>
                  <Text style={styles.mealType}>
                    {log.meal_type.charAt(0).toUpperCase() + log.meal_type.slice(1)} •{' '}
                    {format(new Date(log.logged_at), 'h:mm a')}
                  </Text>
                </View>
                {log.photo_url && (
                  <Image source={{ uri: log.photo_url }} style={styles.thumbnail} />
                )}
              </View>

              <View style={styles.nutritionRow}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {Math.round(log.calories)}
                  </Text>
                  <Text style={styles.nutritionLabel}>cal</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {Math.round(log.protein)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {Math.round(log.carbs)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {Math.round(log.fat)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>fat</Text>
                </View>
              </View>

              {log.serving_size && (
                <Text style={styles.servingSize}>Serving: {log.serving_size}</Text>
              )}
            </Card>
          ))}
        </View>
      )}
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
    paddingBottom: 16,
  },
  date: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
  },
  logCard: {
    padding: 16,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  foodName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  mealType: {
    fontSize: 14,
    color: '#6b7280',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  servingSize: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
});
