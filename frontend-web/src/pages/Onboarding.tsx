/**
 * Onboarding page - Set up user profile and goals
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProfile } from '../hooks/useProfile';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

const onboardingSchema = z.object({
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  sex: z.enum(['male', 'female', 'other']),
  height_cm: z.number().min(50).max(300),
  current_weight_kg: z.number().min(20).max(500),
  target_weight_kg: z.number().min(20).max(500),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal_type: z.enum(['lose_weight', 'maintain', 'gain_muscle']),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export const Onboarding = () => {
  const { completeOnboarding, isOnboarding } = useProfile();
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
  });

  const goalType = watch('goal_type');
  const activityLevel = watch('activity_level');

  const onSubmit = (data: OnboardingFormData) => {
    completeOnboarding(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Let's Set Up Your Profile
          </h1>
          <p className="text-lg text-gray-600">
            We'll calculate your personalized calorie and macro targets
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Step {step} of 4</h2>
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`w-3 h-3 rounded-full ${
                      s <= step ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

                  <Input
                    label="Date of Birth"
                    type="date"
                    error={errors.date_of_birth?.message}
                    {...register('date_of_birth')}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sex
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['male', 'female', 'other'].map((sex) => (
                        <label
                          key={sex}
                          className="relative flex items-center justify-center cursor-pointer"
                        >
                          <input
                            type="radio"
                            value={sex}
                            className="sr-only peer"
                            {...register('sex')}
                          />
                          <div className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 peer-checked:border-primary-600 peer-checked:bg-primary-50 transition-colors text-center">
                            {sex.charAt(0).toUpperCase() + sex.slice(1)}
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.sex && (
                      <p className="mt-1 text-sm text-red-600">{errors.sex.message}</p>
                    )}
                  </div>

                  <Button type="button" onClick={() => setStep(2)} className="w-full">
                    Continue
                  </Button>
                </div>
              )}

              {/* Step 2: Measurements */}
              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Your Measurements</h3>

                  <Input
                    label="Height (cm)"
                    type="number"
                    placeholder="170"
                    error={errors.height_cm?.message}
                    {...register('height_cm', { valueAsNumber: true })}
                  />

                  <Input
                    label="Current Weight (kg)"
                    type="number"
                    placeholder="70"
                    error={errors.current_weight_kg?.message}
                    {...register('current_weight_kg', { valueAsNumber: true })}
                  />

                  <Input
                    label="Target Weight (kg)"
                    type="number"
                    placeholder="65"
                    error={errors.target_weight_kg?.message}
                    {...register('target_weight_kg', { valueAsNumber: true })}
                  />

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button type="button" onClick={() => setStep(3)} className="flex-1">
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Activity Level */}
              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Activity Level</h3>

                  <div className="space-y-3">
                    {[
                      { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
                      { value: 'light', label: 'Light', desc: 'Exercise 1-3 times/week' },
                      { value: 'moderate', label: 'Moderate', desc: 'Exercise 4-5 times/week' },
                      { value: 'active', label: 'Active', desc: 'Daily exercise or intense 3-4 times/week' },
                      { value: 'very_active', label: 'Very Active', desc: 'Intense exercise 6-7 times/week' },
                    ].map((level) => (
                      <label
                        key={level.value}
                        className="relative flex items-start cursor-pointer"
                      >
                        <input
                          type="radio"
                          value={level.value}
                          className="sr-only peer"
                          {...register('activity_level')}
                        />
                        <div className="w-full p-4 rounded-lg border-2 border-gray-300 peer-checked:border-primary-600 peer-checked:bg-primary-50 transition-colors">
                          <div className="font-medium text-gray-900">{level.label}</div>
                          <div className="text-sm text-gray-600">{level.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {errors.activity_level && (
                    <p className="text-sm text-red-600">{errors.activity_level.message}</p>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      onClick={() => setStep(2)}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button type="button" onClick={() => setStep(4)} className="flex-1">
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Goal */}
              {step === 4 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Your Goal</h3>

                  <div className="space-y-3">
                    {[
                      { value: 'lose_weight', label: 'Lose Weight', desc: '500 calorie deficit' },
                      { value: 'maintain', label: 'Maintain Weight', desc: 'Maintain current weight' },
                      { value: 'gain_muscle', label: 'Gain Muscle', desc: '300 calorie surplus' },
                    ].map((goal) => (
                      <label
                        key={goal.value}
                        className="relative flex items-start cursor-pointer"
                      >
                        <input
                          type="radio"
                          value={goal.value}
                          className="sr-only peer"
                          {...register('goal_type')}
                        />
                        <div className="w-full p-4 rounded-lg border-2 border-gray-300 peer-checked:border-primary-600 peer-checked:bg-primary-50 transition-colors">
                          <div className="font-medium text-gray-900">{goal.label}</div>
                          <div className="text-sm text-gray-600">{goal.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {errors.goal_type && (
                    <p className="text-sm text-red-600">{errors.goal_type.message}</p>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      onClick={() => setStep(3)}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" isLoading={isOnboarding}>
                      Complete Setup
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
