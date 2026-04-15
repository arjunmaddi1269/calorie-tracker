/**
 * Log Food Screen - Camera and AI analysis
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { foodApi } from '../api/food';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string;
}

export const LogFoodScreen = ({ navigation }: any) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedFood, setAnalyzedFood] = useState<FoodItem | null>(null);
  const [mealType, setMealType] = useState<string>('lunch');

  const queryClient = useQueryClient();

  const logFoodMutation = useMutation({
    mutationFn: (data: any) => foodApi.logFood(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLog'] });
      Alert.alert('Success', 'Food logged successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setImageUri(null);
            setAnalyzedFood(null);
            navigation.navigate('Dashboard');
          },
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to log food');
    },
  });

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos'
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const analyzeImage = async (uri: string) => {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'food.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await foodApi.analyzeFoodImage(formData);
      setAnalyzedFood(response);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to analyze image');
      setImageUri(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogFood = () => {
    if (!analyzedFood) return;

    logFoodMutation.mutate({
      name: analyzedFood.name,
      meal_type: mealType,
      serving_size: analyzedFood.serving_size,
      calories: analyzedFood.calories,
      protein: analyzedFood.protein,
      carbs: analyzedFood.carbs,
      fat: analyzedFood.fat,
      photo_url: imageUri,
      logged_at: new Date().toISOString(),
    });
  };

  if (analyzing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.analyzingText}>Analyzing food...</Text>
      </View>
    );
  }

  if (!imageUri) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Log Your Meal</Text>
            <Text style={styles.emptyStateText}>
              Take a photo or upload an image to automatically identify food and track nutrition
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Take Photo"
              onPress={takePhoto}
              icon="camera"
              style={styles.button}
            />
            <Button
              title="Choose from Gallery"
              onPress={pickImage}
              icon="image"
              variant="outline"
              style={styles.button}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Image Preview */}
        <Card style={styles.imageCard}>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </Card>

        {/* Analysis Results */}
        {analyzedFood && (
          <>
            <Card style={styles.resultsCard}>
              <Text style={styles.foodName}>{analyzedFood.name}</Text>
              <Text style={styles.servingSize}>{analyzedFood.serving_size}</Text>

              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{Math.round(analyzedFood.calories)}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{Math.round(analyzedFood.protein)}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{Math.round(analyzedFood.carbs)}g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{Math.round(analyzedFood.fat)}g</Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
              </View>
            </Card>

            {/* Meal Type Selection */}
            <Card style={styles.mealTypeCard}>
              <Text style={styles.sectionTitle}>Meal Type</Text>
              <View style={styles.mealTypeButtons}>
                {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                  <Button
                    key={type}
                    title={type.charAt(0).toUpperCase() + type.slice(1)}
                    onPress={() => setMealType(type)}
                    variant={mealType === type ? 'primary' : 'outline'}
                    size="small"
                    style={styles.mealTypeButton}
                  />
                ))}
              </View>
            </Card>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                title="Log Food"
                onPress={handleLogFood}
                loading={logFoodMutation.isPending}
                style={styles.button}
              />
              <Button
                title="Retake Photo"
                onPress={() => {
                  setImageUri(null);
                  setAnalyzedFood(null);
                }}
                variant="outline"
                style={styles.button}
              />
            </View>
          </>
        )}
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
    backgroundColor: '#f9fafb',
  },
  analyzingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    marginBottom: 12,
  },
  imageCard: {
    padding: 0,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  resultsCard: {
    padding: 20,
    marginBottom: 16,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  servingSize: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  mealTypeCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    minWidth: '45%',
  },
  actionButtons: {
    gap: 12,
  },
});
