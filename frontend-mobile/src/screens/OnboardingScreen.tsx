/**
 * Onboarding Screen - Multi-step profile setup
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/user';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

type OnboardingStep = 'basic' | 'physical' | 'goals' | 'activity';

export const OnboardingScreen = ({ navigation }: any) => {
  const [step, setStep] = useState<OnboardingStep>('basic');
  const queryClient = useQueryClient();

  // Form state
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [heightCm, setHeightCm] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('moderate');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      navigation.replace('Tabs');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save profile');
    },
  });

  const steps: OnboardingStep[] = ['basic', 'physical', 'goals', 'activity'];
  const currentStepIndex = steps.indexOf(step);
  const progress = (currentStepIndex + 1) / steps.length;

  const handleNext = () => {
    if (step === 'basic') {
      if (!age) {
        Alert.alert('Required', 'Please enter your age');
        return;
      }
      setStep('physical');
    } else if (step === 'physical') {
      if (!heightCm || !currentWeight) {
        Alert.alert('Required', 'Please enter your height and weight');
        return;
      }
      setStep('goals');
    } else if (step === 'goals') {
      if (!targetWeight) {
        Alert.alert('Required', 'Please enter your target weight');
        return;
      }
      setStep('activity');
    } else if (step === 'activity') {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step === 'physical') setStep('basic');
    else if (step === 'goals') setStep('physical');
    else if (step === 'activity') setStep('goals');
  };

  const handleComplete = () => {
    const profileData = {
      age: parseInt(age),
      gender,
      height_cm: parseFloat(heightCm),
      current_weight: parseFloat(currentWeight),
      target_weight: parseFloat(targetWeight),
      activity_level: activityLevel,
      goal,
    };

    updateProfileMutation.mutate(profileData);
  };

  const renderStep = () => {
    switch (step) {
      case 'basic':
        return (
          <>
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Text style={styles.stepDescription}>
              Tell us a bit about yourself
            </Text>

            <Input
              label="Age"
              value={age}
              onChangeText={setAge}
              placeholder="25"
              keyboardType="number-pad"
            />

            <Card style={styles.optionsCard}>
              <Text style={styles.optionLabel}>Gender</Text>
              <View style={styles.optionButtons}>
                {['male', 'female', 'other'].map((g) => (
                  <Button
                    key={g}
                    title={g.charAt(0).toUpperCase() + g.slice(1)}
                    onPress={() => setGender(g as any)}
                    variant={gender === g ? 'primary' : 'outline'}
                    size="small"
                    style={styles.optionButton}
                  />
                ))}
              </View>
            </Card>
          </>
        );

      case 'physical':
        return (
          <>
            <Text style={styles.stepTitle}>Physical Stats</Text>
            <Text style={styles.stepDescription}>
              We'll use this to calculate your goals
            </Text>

            <Input
              label="Height (cm)"
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="170"
              keyboardType="decimal-pad"
            />

            <Input
              label="Current Weight (kg)"
              value={currentWeight}
              onChangeText={setCurrentWeight}
              placeholder="70"
              keyboardType="decimal-pad"
            />
          </>
        );

      case 'goals':
        return (
          <>
            <Text style={styles.stepTitle}>Your Goals</Text>
            <Text style={styles.stepDescription}>
              What do you want to achieve?
            </Text>

            <Card style={styles.optionsCard}>
              <Text style={styles.optionLabel}>Goal</Text>
              <View style={styles.optionButtons}>
                {[
                  { key: 'lose', label: 'Lose Weight' },
                  { key: 'maintain', label: 'Maintain' },
                  { key: 'gain', label: 'Gain Weight' },
                ].map((g) => (
                  <Button
                    key={g.key}
                    title={g.label}
                    onPress={() => setGoal(g.key as any)}
                    variant={goal === g.key ? 'primary' : 'outline'}
                    size="small"
                    style={styles.optionButton}
                  />
                ))}
              </View>
            </Card>

            <Input
              label="Target Weight (kg)"
              value={targetWeight}
              onChangeText={setTargetWeight}
              placeholder="65"
              keyboardType="decimal-pad"
            />
          </>
        );

      case 'activity':
        return (
          <>
            <Text style={styles.stepTitle}>Activity Level</Text>
            <Text style={styles.stepDescription}>
              How active are you in a typical week?
            </Text>

            <Card style={styles.optionsCard}>
              {[
                { key: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
                { key: 'light', label: 'Light', desc: '1-2 days/week' },
                { key: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
                { key: 'active', label: 'Active', desc: '6-7 days/week' },
                { key: 'very_active', label: 'Very Active', desc: 'Physical job + exercise' },
              ].map((a) => (
                <Button
                  key={a.key}
                  title={`${a.label}\n${a.desc}`}
                  onPress={() => setActivityLevel(a.key as any)}
                  variant={activityLevel === a.key ? 'primary' : 'outline'}
                  size="small"
                  style={styles.activityButton}
                />
              ))}
            </Card>
          </>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} color="#16a34a" style={styles.progressBar} />
          <Text style={styles.progressText}>
            Step {currentStepIndex + 1} of {steps.length}
          </Text>
        </View>

        <View style={styles.content}>
          {renderStep()}
        </View>

        <View style={styles.actions}>
          {currentStepIndex > 0 && (
            <Button
              title="Back"
              onPress={handleBack}
              variant="outline"
              style={styles.backButton}
            />
          )}
          <Button
            title={step === 'activity' ? 'Complete' : 'Next'}
            onPress={handleNext}
            loading={updateProfileMutation.isPending}
            style={styles.nextButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  optionsCard: {
    padding: 16,
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 12,
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: '30%',
  },
  activityButton: {
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
